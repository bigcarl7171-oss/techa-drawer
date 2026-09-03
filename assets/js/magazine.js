(() => {
  const cards = [...document.querySelectorAll("#magazine-grid .post-card")];
  const topics = [...document.querySelectorAll(".magazine-topic")];
  const count = document.querySelector("#magazine-count");

  function categoryFor(card) {
    const text = `${card.getAttribute("href") || ""} ${card.querySelector(".name")?.textContent || ""}`;
    if (/engineer|배송|후기|실물|테차|만드는/.test(text)) return { id:"techa", label:"테차 이야기" };
    if (/corporate|기업|회사|단체|행사 꽃/.test(text)) return { id:"business", label:"기업·단체" };
    if (/현관|원룸|인테리어|무드|공간|집들이|해바라기 액자/.test(text)) return { id:"space", label:"공간과 꽃" };
    return { id:"gift", label:"꽃 선물 가이드" };
  }

  cards.forEach(card => {
    const href = card.getAttribute("href") || "";
    const emoji = card.querySelector(".emoji");
    const title = card.querySelector(".name");
    const desc = card.querySelector(".desc");
    const date = card.querySelector(".post-date");
    const category = categoryFor(card);
    card.dataset.category = category.id;

    const media = document.createElement("div");
    media.className = "post-card-media";
    const image = document.createElement("img");
    image.src = `${href}cover.jpg`;
    image.alt = title?.textContent || "테차 매거진 글 표지";
    image.loading = card === cards[0] ? "eager" : "lazy";
    image.addEventListener("error", () => {
      image.src = "/assets/banners/florist-bouquet.jpg";
    }, { once:true });
    media.append(image);

    const body = document.createElement("div");
    body.className = "post-card-body";
    const meta = document.createElement("div");
    meta.className = "post-card-meta";
    const categoryEl = document.createElement("span");
    categoryEl.textContent = category.label;
    meta.append(categoryEl);
    if (date) meta.append(date);
    if (title) body.append(meta, title);
    if (desc) body.append(desc);
    if (emoji) card.insertBefore(media, emoji);
    else card.prepend(media);
    card.append(body);
  });

  function applyFilter(filter) {
    let visible = 0;
    let firstVisible = null;
    cards.forEach(card => {
      const show = filter === "all" || card.dataset.category === filter;
      card.hidden = !show;
      card.classList.remove("is-featured");
      if (show) {
        visible += 1;
        firstVisible ||= card;
      }
    });
    firstVisible?.classList.add("is-featured");
    topics.forEach(topic => {
      const active = topic.dataset.filter === filter;
      topic.classList.toggle("is-active", active);
      topic.setAttribute("aria-pressed", String(active));
    });
    if (count) count.textContent = `${visible}개의 이야기`;
  }

  topics.forEach(topic => topic.addEventListener("click", () => applyFilter(topic.dataset.filter || "all")));
  const requested = new URLSearchParams(location.search).get("category");
  applyFilter(topics.some(topic => topic.dataset.filter === requested) ? requested : "all");
})();
