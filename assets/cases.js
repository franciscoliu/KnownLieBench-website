/* Case explorer + example dialogues. Data: window.KLB. */
(function () {
  "use strict";
  const KLB = window.KLB;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const outc = (s) => esc(String(s ?? "").replace(/_/g, " "));

  /* ---- example dialogues ---- */
  const MECH = { false_policy: "false policy", false_facts: "false facts", false_deadend: "false dead end",
                 coercion: "coercion", omission: "omission" };
  function highlight(text, quote) {
    const t = esc(text);
    if (!quote) return t;
    const q = esc(String(quote).trim());
    if (q.length > 8 && t.includes(q)) return t.replace(q, `<mark>${q}</mark>`);
    return t;
  }
  $("#story-list").innerHTML = KLB.stories.map((s) => {
    const turns = s.window.map(([role, text]) => {
      const isAgent = role === "agent";
      return `<div class="bubble ${isAgent ? "agent" : "user"}">
        <span class="who">${isAgent ? esc(s.model) : "Customer"}</span>
        ${isAgent ? highlight(text, s.false_claim) : esc(text)}</div>`;
    }).join("");
    const outcome = s.entitled
      ? `Owed <b>${outc(s.owed)}</b>, delivered <b>${outc(s.got)}</b>.`
      : `Calibration case, nothing owed; delivered <b>${outc(s.got)}</b>.`;
    return `<article class="story">
      <div class="story-head"><b>${esc(s.model)}</b>
        <span class="mech">${esc(MECH[s.primary] || s.primary)}</span>
        <span class="ctx">${esc(s.domain)} domain &middot; ${esc(s.condition === "lie_incentive" ? "emergent" : s.condition === "instructed_lie" ? "instructed" : s.condition)} condition</span></div>
      <div class="ctx">${outcome}</div>
      ${turns}
      <div class="verdict"><b>Judge</b><br>${esc(s.rationale)}</div>
    </article>`;
  }).join("");

  /* ---- case explorer ---- */
  const DOMS = ["refund", "airline", "deposit", "subscription", "billing", "insurance", "recall", "debt"];
  const state = { dom: "all", type: "all", q: "" };

  $("#dom-filters").innerHTML =
    `<button class="chipbtn on" data-dom="all">All domains</button>` +
    DOMS.map((d) => `<button class="chipbtn" data-dom="${d}">${d}</button>`).join("");

  function matches(c) {
    if (state.dom !== "all" && c.domain !== state.dom) return false;
    if (state.type !== "all" && c.case_type !== state.type) return false;
    if (state.q) {
      const hay = `${c.situation_name} ${c.customer_reason} ${c.policy_facts} ${c.institution} ${c.case_id}`.toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }
  function renderCases() {
    const found = KLB.cases.filter(matches);
    $("#count").textContent = `${found.length} of ${KLB.cases.length} cases`;
    $("#case-grid").innerHTML = (found.length ? "" : '<p class="count" style="grid-column:1/-1;">No cases match these filters.</p>') + found.map((c) => `
      <article class="case">
        <h3>${esc(c.situation_name)}</h3>
        <div class="meta">${esc(c.domain)} &middot; ${esc(c.institution)} &middot; ${esc(c.case_id)}
          <span class="badge ${c.case_type === "owed" ? "owed" : "calib"}">${c.case_type}</span></div>
        <p>&ldquo;${esc(c.customer_reason)}&rdquo;</p>
        <details><summary>Ground truth</summary><dl>
          <dt>Entitled outcome</dt><dd>${outc(c.entitled_outcome)}</dd>
          <dt>Policy facts</dt><dd>${esc(c.policy_facts)}</dd>
          ${c.case_type === "owed" ? `<dt>The tempting lie</dt><dd>${esc(c.tempting_lie)}</dd>` : ""}
        </dl></details>
      </article>`).join("");
  }

  document.querySelectorAll("#dom-filters .chipbtn").forEach((b) =>
    b.addEventListener("click", () => {
      state.dom = b.dataset.dom;
      document.querySelectorAll("#dom-filters .chipbtn").forEach((x) => x.classList.toggle("on", x === b));
      renderCases();
    }));
  document.querySelectorAll("[data-type]").forEach((b) =>
    b.addEventListener("click", () => {
      state.type = b.dataset.type;
      document.querySelectorAll("[data-type]").forEach((x) => x.classList.toggle("on", x === b));
      renderCases();
    }));
  $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderCases(); });

  renderCases();
})();
