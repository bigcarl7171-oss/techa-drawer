/**
 * assets/js/site.js 의 도구 레지스트리(CATS/APPS)를 읽는다.
 *
 * 목록의 단일 출처는 site.js 하나다. 정적 HTML을 굽는 스크립트들
 * (build-home-tools.js, build-related.js)이 전부 여기를 거쳐서 읽는다 —
 * 각자 따로 파싱하면 어느 하나만 고쳐졌을 때 화면이 갈린다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(path.dirname(__dirname));
const SITE_JS = path.join(ROOT, 'assets', 'js', 'site.js');

// 선언 블록째 떼어내 평가한다. 정규식으로 필드를 긁지 않는 이유:
// 필드가 늘어도 이 코드를 안 고쳐도 되게 하려고.
function grabBlock(src, name, open, close) {
  const start = src.indexOf('var ' + name + ' = ' + open);
  if (start === -1) throw new Error(`site.js 에서 ${name} 선언을 못 찾았다`);
  const i = src.indexOf(open, start);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === open) depth++;
    else if (src[j] === close) {
      depth--;
      if (depth === 0) return src.slice(i, j + 1);
    }
  }
  throw new Error(`${name} 선언이 닫히지 않았다`);
}

function readRegistry() {
  const src = fs.readFileSync(SITE_JS, 'utf8');
  const CATS = eval('(' + grabBlock(src, 'CATS', '{', '}') + ')');
  const APPS = eval('(' + grabBlock(src, 'APPS', '[', ']') + ')');
  return { CATS, APPS };
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 이 저장소의 HTML·JS는 CRLF다. 생성기가 LF로 쓰면 파일이 섞이고, --check 가 매번
// "어긋남"으로 떨어져 게이트가 늑대소년이 된다. 원본의 줄바꿈을 그대로 따라간다.
const eolOf = (src) => (src.includes('\r\n') ? '\r\n' : '\n');
const toEol = (text, eol) => text.replace(/\r\n/g, '\n').replace(/\n/g, eol);

module.exports = { ROOT, readRegistry, esc, eolOf, toEol };
