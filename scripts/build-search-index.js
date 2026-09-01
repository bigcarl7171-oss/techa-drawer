#!/usr/bin/env node
/*
  전체 사이트(도구 페이지 + 매거진 글) 본문 텍스트를 훑어
  assets/data/search-index.json 을 생성한다.

  홈 검색창이 제목·설명뿐 아니라 각 페이지 본문 속 단어까지 찾도록
  하기 위한 정적 검색 인덱스 빌드 스크립트. 도구/글의 본문(HTML)이나
  ko/*, blog/*, assets/js/site.js의 APPS 배열이 바뀌면
  다시 실행해야 한다: `node scripts/build-search-index.js`
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function readSiteJsData() {
  const src = fs.readFileSync(path.join(ROOT, "assets/js/site.js"), "utf8");
  const appsSrc = src.match(/var APPS = (\[[\s\S]*?\]);/)[1];
  const catsSrc = src.match(/var CATS = (\{[\s\S]*?\});/)[1];
  const APPS = new Function("return " + appsSrc)();
  const CATS = new Function("return " + catsSrc)();
  return { APPS, CATS };
}

function readPublishedPosts() {
  const blogDir = path.join(ROOT, "blog");
  const listHtml = fs.readFileSync(path.join(blogDir, "index.html"), "utf8");
  const emojis = {};
  for (const match of listHtml.matchAll(/<a class="app-card post-card" href="([^"]+)">[\s\S]*?<div class="emoji">([^<]+)<\/div>/g)) {
    emojis[match[1]] = match[2].trim();
  }

  return fs.readdirSync(blogDir, { withFileTypes: true })
    .filter(function (entry) { return entry.isDirectory(); })
    .map(function (entry) {
      const file = path.join(blogDir, entry.name, "index.html");
      if (!fs.existsSync(file)) return null;

      const html = fs.readFileSync(file, "utf8");
      const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      let post = null;
      for (const match of scripts) {
        try {
          const data = JSON.parse(match[1]);
          const nodes = data["@graph"] || [data];
          post = nodes.find(function (node) { return node && node["@type"] === "BlogPosting"; });
          if (post) break;
        } catch (_err) {
          // 다른 구조화 데이터가 잘못돼 있어도 다음 블록을 확인한다.
        }
      }
      if (!post || !post.headline) return null;

      const urlPath = "/blog/" + entry.name + "/";
      return {
        emoji: emojis[urlPath] || "🌿",
        title: post.headline,
        desc: post.description || "",
        path: urlPath,
        date: post.datePublished || "",
        body: extractArticleText(html)
      };
    })
    .filter(Boolean)
    .sort(function (a, b) { return b.date.localeCompare(a.date) || a.path.localeCompare(b.path); });
}

function extractArticleText(html) {
  const m = html.match(/<article[^>]*class="article"[^>]*>([\s\S]*?)<\/article>/);
  if (!m) return "";
  return m[1]
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function pageFilePath(urlPath) {
  // "/ko/lotto/" -> "ko/lotto/index.html"
  return path.join(ROOT, urlPath.replace(/^\//, ""), "index.html");
}

function build() {
  const { APPS, CATS } = readSiteJsData();
  const entries = [];

  APPS.filter(function (a) { return a.status === "live"; }).forEach(function (a) {
    const file = pageFilePath(a.path);
    let body = "";
    if (fs.existsSync(file)) body = extractArticleText(fs.readFileSync(file, "utf8"));
    entries.push({
      emoji: a.emoji, title: a.name, desc: a.desc, path: a.path,
      tag: (CATS[a.cat] && CATS[a.cat].title) || "", body: body
    });
  });

  readPublishedPosts().forEach(function (p) {
    entries.push({ emoji: p.emoji, title: p.title, desc: p.desc, path: p.path, tag: "매거진", body: p.body });
  });

  const outDir = path.join(ROOT, "assets/data");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "search-index.json");
  fs.writeFileSync(outFile, JSON.stringify(entries), "utf8");
  console.log("search-index.json 생성: " + entries.length + "개 항목, " + fs.statSync(outFile).size + " bytes");
}

build();
