
(() => {
  const state = { recipient: "", occasion: "", occasionTags: [], budget: "", giftType: "" };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const fmt = n => new Intl.NumberFormat("ko-KR").format(n);
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));

  const budgetBands = {
    "under-20": { min: 0, max: 19999, label: "2만원 미만", order: 0 },
    "20s": { min: 20000, max: 29999, label: "2만원대", order: 1 },
    "30s": { min: 30000, max: 39999, label: "3만원대", order: 2 },
    "40s": { min: 40000, max: 49999, label: "4만원대", order: 3 },
    "50plus": { min: 50000, max: 999999, label: "5만원 이상", order: 4 }
  };

  function rangeBand(product) {
    if (product.priceMin == null) return null;
    const midpoint = product.priceMax == null ? product.priceMin : (product.priceMin + product.priceMax) / 2;
    if (midpoint < 20000) return 0;
    if (midpoint < 30000) return 1;
    if (midpoint < 40000) return 2;
    if (midpoint < 50000) return 3;
    return 4;
  }

  function scoreBudget(product, budgetId) {
    if (!budgetId) return { score: 0, note: "" };
    const band = budgetBands[budgetId];
    if (product.priceMin == null || product.priceMax == null) return { score: 4, note: "가격은 상품 페이지에서 확인해 주세요" };
    const overlaps = product.priceMin <= band.max && product.priceMax >= band.min;
    if (overlaps) return { score: 15, note: "예산 범위에 들어와요" };
    const pb = rangeBand(product);
    const dist = Math.abs(pb - band.order);
    if (dist === 1) return { score: 8, note: pb > band.order ? "예산보다 한 단계 높아요" : "예산보다 한 단계 낮아요" };
    return { score: 2, note: pb > band.order ? "예산보다 높은 편이에요" : "예산보다 낮은 편이에요" };
  }

  function has(list, value) {
    return !value || (Array.isArray(list) && list.includes(value));
  }

  function scoreProduct(product) {
    const recipientMatch = has(product.recipients, state.recipient);
    const occasionMatch = !state.occasionTags.length || state.occasionTags.some(tag => product.occasions?.includes(tag));
    const typeMatch = has(product.giftTypes, state.giftType);

    let score = 0;
    const reasons = [];
    const misses = [];

    if (state.occasion) {
      if (occasionMatch) { score += 35; reasons.push(`고른 상황과 잘 맞아요`); }
      else misses.push(`고른 상황의 전용 추천은 아니에요`);
    }
    if (state.recipient) {
      if (recipientMatch) { score += 25; reasons.push(`${state.recipient}에게 추천하는 구성`); }
      else misses.push(`${state.recipient} 대상 태그가 없어요`);
    }
    const budget = scoreBudget(product, state.budget);
    score += budget.score;
    if (budget.note) (budget.score >= 8 ? reasons : misses).push(budget.note);

    if (state.giftType) {
      if (typeMatch) { score += 10; reasons.push("원하는 선물 형태와 맞아요"); }
      else misses.push("원하는 선물 형태와는 조금 달라요");
    }

    // 판매는 참고점수만 사용
    score += Math.min(5, Number(product.sales?.score || 0));

    // 전략점수는 대상/상황 중 선택된 조건이 틀리면 과하게 올리지 않음.
    const selectedCore = [state.recipient, state.occasion].filter(Boolean).length;
    const coreMatch = (!state.recipient || recipientMatch) && (!state.occasion || occasionMatch);
    let strategy = Number(product.strategyBase || 0);
    if (state.occasionTags.length) {
      strategy += Math.max(0, ...state.occasionTags.map(tag => Number(product.occasionBoosts?.[tag] || 0)));
    }
    if (selectedCore && !coreMatch) strategy = 0;
    score += Math.min(10, strategy);

    // 정확히 원하는 선물형태가 아니면 전략상품이라도 1위 독주 방지
    if (state.giftType && !typeMatch) score -= 4;

    return { product, score: Math.max(0, score), reasons, misses, budget };
  }

  function priceText(p) {
    if (p.priceMin == null) return "가격 확인";
    if (p.priceMin === p.priceMax) return `${fmt(p.priceMin)}원`;
    return `${fmt(p.priceMin)}~${fmt(p.priceMax)}원`;
  }

  function selectAlternatives(scored, top) {
    const selected = [];
    const topType = top.product.giftTypes?.[0] || "";
    for (const item of scored) {
      if (item.product.id === top.product.id) continue;
      if (selected.length === 0) {
        // 첫 대안은 가능하면 다른 선물형태
        if ((item.product.giftTypes?.[0] || "") !== topType) { selected.push(item); continue; }
      } else {
        const used = new Set([top, ...selected].flatMap(x => x.product.giftTypes || []));
        if (!(item.product.giftTypes || []).every(t => used.has(t))) { selected.push(item); }
      }
      if (selected.length >= 2) break;
    }
    if (selected.length < 2) {
      for (const item of scored) {
        if (item.product.id === top.product.id || selected.some(x => x.product.id === item.product.id)) continue;
        selected.push(item);
        if (selected.length >= 2) break;
      }
    }
    return selected.slice(0,2);
  }

  function labelForAlternative(item, top) {
    const p = item.product;
    if (p.giftTypes?.includes("인테리어형") && !top.product.giftTypes?.includes("인테리어형")) return "오래 두고 보는 선물이라면";
    if (p.giftTypes?.includes("휴대전달형") && !top.product.giftTypes?.includes("휴대전달형")) return "직접 건네는 꽃을 원한다면";
    if (p.giftTypes?.includes("현금동봉형")) return "현금도 함께 전하고 싶다면";
    if (p.id === "superior-rose") return "조금 더 특별한 꽃다발이라면";
    if (p.id === "sunflower-frame") return "집들이·개업에 오래 남는 선물이라면";
    return "이런 선택도 잘 맞아요";
  }

  function imgMarkup(p, cls = "") {
    if (!p.image1) return `<div class="gf-image gf-image--empty ${cls}" aria-hidden="true"><span>TECHA</span></div>`;
    return `<img class="gf-image ${cls}" src="${escapeHtml(p.image1)}" alt="${escapeHtml(p.name)}" loading="lazy">`;
  }

  function heroCard(item) {
    const p = item.product;
    const badges = (p.badges || []).map(x => `<span class="gf-badge">${escapeHtml(x)}</span>`).join("");
    const reason = item.reasons[0] || p.situation || "선택한 조건을 종합해 추천했어요.";
    const note = item.budget.note ? `<p class="gf-budget-note">${escapeHtml(item.budget.note)}</p>` : "";
    const cta = p.shopUrl
      ? `<a class="gf-buy" href="${escapeHtml(p.shopUrl)}" target="_blank" rel="noopener noreferrer" data-gf-product="${escapeHtml(p.id)}">상품 보러가기 →</a>`
      : `<span class="gf-buy gf-buy--disabled">링크 준비중</span>`;
    return `
      <article class="gf-hero-card">
        <div class="gf-hero-media">${imgMarkup(p)}</div>
        <div class="gf-hero-body">
          <div class="gf-badges">${badges}</div>
          <p class="gf-eyebrow">테차가 가장 추천해요</p>
          <h2>${escapeHtml(p.name)}</h2>
          <p class="gf-price">${escapeHtml(priceText(p))}</p>
          <p class="gf-lead">${escapeHtml(p.situation || reason)}</p>
          <div class="gf-why">
            <strong>추천하는 이유</strong>
            <p>${escapeHtml(p.reason || reason)}</p>
          </div>
          ${note}
          ${cta}
        </div>
      </article>`;
  }

  function altCard(item, top) {
    const p = item.product;
    return `
      <article class="gf-alt-card">
        <div class="gf-alt-media">${imgMarkup(p)}</div>
        <div class="gf-alt-body">
          <p class="gf-alt-label">${escapeHtml(labelForAlternative(item, top))}</p>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="gf-price">${escapeHtml(priceText(p))}</p>
          <p>${escapeHtml(p.reason || p.situation || "")}</p>
          ${p.shopUrl ? `<a href="${escapeHtml(p.shopUrl)}" target="_blank" rel="noopener noreferrer" data-gf-product="${escapeHtml(p.id)}">상품 보러가기 →</a>` : ""}
        </div>
      </article>`;
  }

  function renderResults(data) {
    const root = $("#gf-results");
    const scored = data.products.map(scoreProduct).sort((a,b) => b.score - a.score);
    const top = scored[0];
    const alternatives = selectAlternatives(scored.slice(1), top);
    root.innerHTML = `
      <div class="gf-result-intro">
        <p class="gf-eyebrow">TECHA GIFT CURATION</p>
        <h2>이 상황이라면,<br>이 선물부터 보세요</h2>
        <p>판매량만 줄 세우지 않고, 고르신 조건과 테차가 실제로 추천하는 상황을 함께 봤어요.</p>
      </div>
      ${heroCard(top)}
      <div class="gf-alt-section">
        <div class="gf-alt-heading"><h2>이런 선물도 잘 맞아요</h2><p>느낌을 조금 바꿔 고르고 싶을 때</p></div>
        <div class="gf-alt-grid">${alternatives.map(x => altCard(x, top)).join("")}</div>
      </div>
      <button type="button" class="gf-reset" id="gf-reset">조건 다시 고르기</button>
    `;
    root.hidden = false;
    root.scrollIntoView({ behavior: "smooth", block: "start" });
    $("#gf-reset")?.addEventListener("click", () => {
      state.recipient = state.occasion = state.budget = state.giftType = "";
      state.occasionTags = [];
      $$(".gf-chip.is-selected").forEach(el => el.classList.remove("is-selected"));
      root.hidden = true;
      $("#gf-app")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  }

  function chipGroup(root, items, key, options = {}) {
    const group = $(root);
    group.innerHTML = items.map(item => {
      const value = typeof item === "string" ? item : item.id;
      const label = typeof item === "string" ? item : item.label;
      const desc = typeof item === "string" ? "" : item.desc;
      const extra = options.featuredOnly && item.featured === false ? " gf-chip--extra" : "";
      const tags = typeof item === "string" ? [item] : (item.tags || [value]);
      return `<button type="button" class="gf-chip${extra}" data-value="${escapeHtml(value)}" data-tags="${escapeHtml(JSON.stringify(tags))}" aria-pressed="false"><span>${escapeHtml(label)}</span>${desc ? `<small>${escapeHtml(desc)}</small>` : ""}</button>`;
    }).join("");
    group.addEventListener("click", e => {
      const btn = e.target.closest(".gf-chip");
      if (!btn) return;
      const was = btn.classList.contains("is-selected");
      $$(".gf-chip", group).forEach(x => { x.classList.remove("is-selected"); x.setAttribute("aria-pressed","false"); });
      state[key] = was ? "" : btn.dataset.value;
      if (key === "occasion") {
        state.occasionTags = was ? [] : JSON.parse(btn.dataset.tags || "[]");
      }
      if (!was) { btn.classList.add("is-selected"); btn.setAttribute("aria-pressed","true"); }
    });
  }

  async function init() {
    const app = $("#gf-app");
    if (!app) return;
    try {
      const [productRes, uiRes] = await Promise.all([
        fetch("/assets/data/gift-finder-products.json"),
        fetch("/assets/data/gift-finder-ui.json")
      ]);
      const productData = await productRes.json();
      const ui = await uiRes.json();

      chipGroup("#gf-recipient", ui.recipients, "recipient");
      chipGroup("#gf-occasion", ui.occasions, "occasion", { featuredOnly: true });
      chipGroup("#gf-budget", ui.budgets, "budget");
      chipGroup("#gf-type", ui.giftTypes, "giftType");
      $("#gf-occasion-more")?.addEventListener("click", e => {
        const expanded = e.currentTarget.getAttribute("aria-expanded") === "true";
        $("#gf-occasion").classList.toggle("show-extra", !expanded);
        e.currentTarget.setAttribute("aria-expanded", String(!expanded));
        e.currentTarget.textContent = expanded ? "다른 상황 보기 +" : "접기 −";
      });

      $("#gf-submit").addEventListener("click", () => renderResults(productData));

      document.addEventListener("click", e => {
        const link = e.target.closest("[data-gf-product]");
        if (!link) return;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "gift_finder_product_click",
          gift_product_id: link.dataset.gfProduct || ""
        });
      });
    } catch (err) {
      console.error("Gift Finder init failed:", err);
      app.insertAdjacentHTML("beforeend", `<p class="gf-error">추천 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>`);
    }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
