
(() => {
  const state = {
    recipient: "", occasion: "", occasionTags: [], budget: "", giftType: "",
    labels: { recipient: "", occasion: "", budget: "", giftType: "" }
  };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const fmt = n => new Intl.NumberFormat("ko-KR").format(n);
  const completedSteps = new Set();
  let catalog = [];
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));

  function trackEvent(name, params = {}) {
    if (window.TECHA && typeof window.TECHA.track === "function") {
      window.TECHA.track(name, params);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event:name, ...params });
  }

  const budgetBands = {
    "under-20": { min: 0, max: 19999, label: "2만원 미만", order: 0 },
    "20s": { min: 20000, max: 29999, label: "2만원대", order: 1 },
    "30s": { min: 30000, max: 39999, label: "3만원대", order: 2 },
    "40s": { min: 40000, max: 49999, label: "4만원대", order: 3 },
    "50plus": { min: 50000, max: 999999, label: "5만원 이상", order: 4 }
  };

  const recipientRules = {
    부모님생신: ["부모님", "조부모님"],
    어버이날: ["부모님", "조부모님"],
    칠순팔순: ["부모님", "조부모님"],
    스승의날: ["선생님"],
    발표회: ["아이", "유치원", "초등학생"],
    아이용: ["아이", "유치원", "초등학생"]
  };

  function allowedForRecipient(choiceId) {
    if (!state.recipient || !recipientRules[choiceId]) return true;
    return recipientRules[choiceId].includes(state.recipient);
  }

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

  function matchesOccasion(product) {
    return !state.occasionTags.length || state.occasionTags.some(tag => product.occasions?.includes(tag));
  }

  function matchesBudget(product) {
    if (!state.budget) return true;
    const band = budgetBands[state.budget];
    return product.priceMin != null && product.priceMax != null
      && product.priceMin <= band.max && product.priceMax >= band.min;
  }

  function isEligible(product) {
    return has(product.recipients, state.recipient)
      && matchesOccasion(product)
      && matchesBudget(product)
      && has(product.giftTypes, state.giftType);
  }

  function productsForStep(step) {
    return catalog.filter(product => {
      if (step > 0 && !has(product.recipients, state.recipient)) return false;
      if (step > 1 && !matchesOccasion(product)) return false;
      if (step > 2 && !matchesBudget(product)) return false;
      return true;
    });
  }

  function refreshChoiceAvailability() {
    const rules = [
      { root:"#gf-occasion", step:1, match:(product, chip) => {
        if (!allowedForRecipient(chip.dataset.value)) return false;
        const tags = JSON.parse(chip.dataset.tags || "[]");
        return tags.some(tag => product.occasions?.includes(tag));
      }},
      { root:"#gf-budget", step:2, match:(product, chip) => {
        const band = budgetBands[chip.dataset.value];
        return product.priceMin != null && product.priceMax != null
          && product.priceMin <= band.max && product.priceMax >= band.min;
      }},
      { root:"#gf-type", step:3, match:(product, chip) => {
        if (!allowedForRecipient(chip.dataset.value)) return false;
        return product.giftTypes?.includes(chip.dataset.value);
      }}
    ];
    rules.forEach(rule => {
      const candidates = productsForStep(rule.step);
      $$(`${rule.root} .gf-chip`).forEach(chip => {
        const available = candidates.some(product => rule.match(product, chip));
        chip.hidden = !available;
        chip.disabled = !available;
      });
    });
  }

  const downstreamKeys = {
    recipient: ["occasion", "budget", "giftType"],
    occasion: ["budget", "giftType"],
    budget: ["giftType"],
    giftType: []
  };

  function clearDownstream(key) {
    downstreamKeys[key].forEach(nextKey => {
      state[nextKey] = "";
      state.labels[nextKey] = "";
      if (nextKey === "occasion") state.occasionTags = [];
      const rootId = { occasion:"#gf-occasion", budget:"#gf-budget", giftType:"#gf-type" }[nextKey];
      $$(`${rootId} .gf-chip`).forEach(chip => {
        chip.classList.remove("is-selected");
        chip.setAttribute("aria-pressed", "false");
      });
      const stepIndex = { occasion:1, budget:2, giftType:3 }[nextKey];
      completedSteps.delete(stepIndex);
      const step = $(`.gf-step[data-step="${stepIndex}"]`);
      step?.classList.remove("is-complete");
      if (step) {
        $(".gf-step-edit", step).hidden = true;
        $(".gf-step-summary", step).textContent = "";
      }
    });
  }

  function scoreProduct(product) {
    const recipientMatch = has(product.recipients, state.recipient);
    const occasionMatch = matchesOccasion(product);
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

  function heroGallery(p) {
    if (!p.image1) return imgMarkup(p);
    const images = [p.image1, p.image2].filter(Boolean);
    const thumbs = images.length > 1 ? `<div class="gf-thumbs" aria-label="상품 사진 선택">${images.map((src, i) => `
      <button type="button" class="gf-thumb" data-image-src="${escapeHtml(src)}" aria-label="${escapeHtml(p.name)} 사진 ${i + 1}" aria-pressed="${i === 0}">
        <img src="${escapeHtml(src)}" alt="" loading="lazy">
      </button>`).join("")}</div>` : "";
    return `<img class="gf-image gf-hero-main-image" src="${escapeHtml(p.image1)}" alt="${escapeHtml(p.name)}">${thumbs}`;
  }

  function heroCard(item) {
    const p = item.product;
    const badges = (p.badges || []).map(x => `<span class="gf-badge">${escapeHtml(x)}</span>`).join("");
    const reason = item.reasons[0] || p.situation || "선택한 조건을 종합해 추천했어요.";
    const note = item.budget.note && item.budget.score < 8 ? `<p class="gf-budget-note">${escapeHtml(item.budget.note)}</p>` : "";
    const cta = p.shopUrl
      ? `<a class="gf-buy" href="${escapeHtml(p.shopUrl)}" target="_blank" rel="noopener noreferrer" data-gf-product="${escapeHtml(p.id)}" data-gf-rank="primary">상품 보러가기 →</a>`
      : `<span class="gf-buy gf-buy--disabled">링크 준비중</span>`;
    const matches = item.reasons.slice(0, 3);
    return `
      <article class="gf-hero-card">
        <div class="gf-hero-media">${heroGallery(p)}</div>
        <div class="gf-hero-body">
          <div class="gf-badges">${badges}</div>
          <p class="gf-eyebrow">테차가 가장 추천해요</p>
          <h2>${escapeHtml(p.name)}</h2>
          <p class="gf-price">${escapeHtml(priceText(p))}</p>
          <p class="gf-lead">${escapeHtml(p.situation || reason)}</p>
          ${matches.length ? `<div class="gf-match"><strong>선택한 조건과 맞는 점</strong><ul>${matches.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>` : ""}
          <div class="gf-why">
            <strong>이 상품의 좋은 점</strong>
            <p>${escapeHtml(p.reason || reason)}</p>
          </div>
          ${note}
          ${cta}
          <p class="gf-delivery-note"><strong>행사일이 가까우신가요?</strong> 상품 페이지에서 예상 출고일을 먼저 확인해 주세요. 시들지 않는 꽃이라 3~4일 여유 있게 준비하셔도 좋아요.</p>
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
          ${p.shopUrl ? `<a class="gf-alt-buy" href="${escapeHtml(p.shopUrl)}" target="_blank" rel="noopener noreferrer" data-gf-product="${escapeHtml(p.id)}" data-gf-rank="alternative">상품 보러가기 →</a>` : ""}
        </div>
      </article>`;
  }

  function renderResults(data) {
    const root = $("#gf-results");
    const scored = data.products.filter(isEligible).map(scoreProduct).sort((a,b) => b.score - a.score);
    if (!scored.length) {
      root.innerHTML = `<div class="gf-result-intro"><p class="gf-eyebrow">TECHA GIFT CURATION</p><h2>조건에 맞는 상품을 찾지 못했어요</h2><p>예산이나 선물 형태를 선택하지 않고 다시 살펴봐 주세요.</p></div><button type="button" class="gf-reset" id="gf-reset">조건 다시 고르기</button>`;
      root.hidden = false;
      $("#gf-reset")?.addEventListener("click", () => window.location.reload());
      return;
    }
    const top = scored[0];
    const alternatives = selectAlternatives(scored.slice(1), top);
    const selections = Object.values(state.labels).filter(Boolean);
    root.innerHTML = `
      <div class="gf-result-intro">
        <p class="gf-eyebrow">TECHA GIFT CURATION</p>
        <h2>이 상황이라면,<br>이 선물부터 보세요</h2>
        <p>고르신 조건과 테차가 실제로 추천하는 상황을 함께 살펴봤어요.</p>
        <div class="gf-selection" aria-label="선택한 조건">${selections.map(x => `<span>${escapeHtml(x)}</span>`).join("")}</div>
      </div>
      ${heroCard(top)}
      <div class="gf-alt-section">
        <div class="gf-alt-heading"><h2>이런 선물도 잘 맞아요</h2><p>느낌을 조금 바꿔 고르고 싶을 때</p></div>
        <div class="gf-alt-grid">${alternatives.map(x => altCard(x, top)).join("")}</div>
      </div>
      <button type="button" class="gf-reset" id="gf-reset">조건 다시 고르기</button>
    `;
    root.hidden = false;
    trackEvent("gift_finder_complete");
    $$(".gf-thumb", root).forEach(btn => btn.addEventListener("click", () => {
      const media = btn.closest(".gf-hero-media");
      const main = $(".gf-hero-main-image", media);
      if (!main) return;
      main.src = btn.dataset.imageSrc || main.src;
      $$(".gf-thumb", media).forEach(x => x.setAttribute("aria-pressed", String(x === btn)));
    }));
    root.scrollIntoView({ behavior: "smooth", block: "start" });
    $("#gf-reset")?.addEventListener("click", () => {
      state.recipient = state.occasion = state.budget = state.giftType = "";
      state.occasionTags = [];
      Object.keys(state.labels).forEach(key => { state.labels[key] = ""; });
      completedSteps.clear();
      $$(".gf-chip.is-selected").forEach(el => {
        el.classList.remove("is-selected");
        el.setAttribute("aria-pressed", "false");
      });
      $$(".gf-step").forEach((step, i) => {
        step.classList.toggle("is-active", i === 0);
        step.classList.remove("is-complete");
        $(".gf-step-edit", step).hidden = true;
        $(".gf-step-summary", step).textContent = "";
      });
      $("#gf-app").classList.remove("is-ready");
      updateProgress(0);
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
      if (!btn || btn.disabled) return;
      const was = btn.classList.contains("is-selected");
      clearDownstream(key);
      $$(".gf-chip", group).forEach(x => { x.classList.remove("is-selected"); x.setAttribute("aria-pressed","false"); });
      state[key] = was ? "" : btn.dataset.value;
      state.labels[key] = was ? "" : (btn.querySelector("span")?.textContent || btn.dataset.value);
      if (key === "occasion") {
        state.occasionTags = was ? [] : JSON.parse(btn.dataset.tags || "[]");
      }
      refreshChoiceAvailability();
      if (!was) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed","true");
        window.setTimeout(() => completeStep(Number(group.closest(".gf-step")?.dataset.step || 0), state.labels[key]), 160);
      }
    });
  }

  const stepLabels = ["받는 분 선택", "선물 상황 선택", "예산 선택", "선물 느낌 선택"];

  function updateProgress(index) {
    const current = Math.min(3, Math.max(0, index));
    $("#gf-progress-text").textContent = `${current + 1} / 4`;
    $("#gf-progress-label").textContent = stepLabels[current];
    $("#gf-progress-bar").style.width = `${(current + 1) * 25}%`;
  }

  function activateStep(index) {
    $$(".gf-step").forEach(step => step.classList.toggle("is-active", Number(step.dataset.step) === index));
    $("#gf-app").classList.toggle("is-ready", index === 3);
    updateProgress(index);
    const active = $(`.gf-step[data-step="${index}"]`);
    active?.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }

  function completeStep(index, label) {
    const step = $(`.gf-step[data-step="${index}"]`);
    if (!step) return;
    step.classList.add("is-complete");
    $(".gf-step-summary", step).textContent = label || "선택 안 함";
    $(".gf-step-edit", step).hidden = false;
    if (!completedSteps.has(index)) {
      if (completedSteps.size === 0) trackEvent("gift_finder_start");
      completedSteps.add(index);
      trackEvent("gift_finder_step_complete", { step_number:index + 1 });
    }
    activateStep(Math.min(3, index + 1));
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
      catalog = productData.products;

      chipGroup("#gf-recipient", ui.recipients, "recipient");
      chipGroup("#gf-occasion", ui.occasions, "occasion", { featuredOnly: true });
      chipGroup("#gf-budget", ui.budgets, "budget");
      chipGroup("#gf-type", ui.giftTypes, "giftType");
      refreshChoiceAvailability();
      updateProgress(0);

      $$('[data-edit-step]').forEach(btn => btn.addEventListener("click", () => activateStep(Number(btn.dataset.editStep))));
      $$('[data-skip-key]').forEach(btn => btn.addEventListener("click", () => {
        const key = btn.dataset.skipKey;
        state[key] = "";
        state.labels[key] = "";
        completeStep(Number(btn.closest(".gf-step").dataset.step), "선택 안 함");
      }));
      $("#gf-occasion-more")?.addEventListener("click", e => {
        const expanded = e.currentTarget.getAttribute("aria-expanded") === "true";
        $("#gf-occasion").classList.toggle("show-extra", !expanded);
        e.currentTarget.setAttribute("aria-expanded", String(!expanded));
        e.currentTarget.textContent = expanded ? "다른 상황 보기 +" : "접기 −";
      });

      $("#gf-type-skip").addEventListener("click", () => {
        state.giftType = "";
        state.labels.giftType = "";
        $$("#gf-type .gf-chip").forEach(x => {
          x.classList.remove("is-selected");
          x.setAttribute("aria-pressed", "false");
        });
        completeStep(3, "선택 안 함");
      });

      $("#gf-submit").addEventListener("click", e => {
        const help = $("#gf-form-help");
        if (!state.occasion) {
          help.textContent = "어떤 날인지 한 가지만 선택해 주세요.";
          help.classList.add("gf-form-error");
          activateStep(1);
          return;
        }
        help.classList.remove("gf-form-error");
        const button = e.currentTarget;
        button.disabled = true;
        button.textContent = "조건을 살펴보는 중…";
        window.setTimeout(() => {
          renderResults(productData);
          button.disabled = false;
          button.textContent = "테차의 추천 받기 →";
        }, 450);
      });

      document.addEventListener("click", e => {
        const link = e.target.closest("[data-gf-product]");
        if (!link) return;
        trackEvent("gift_finder_product_click", {
          gift_product_id: link.dataset.gfProduct || "",
          result_position: link.dataset.gfRank || ""
        });
      });
    } catch (err) {
      console.error("Gift Finder init failed:", err);
      app.insertAdjacentHTML("beforeend", `<p class="gf-error">추천 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>`);
    }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
