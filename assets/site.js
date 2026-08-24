/* Leaderboard + domain heatmap for the KnownLieBench homepage. Data: window.KLB. */
(function () {
  "use strict";
  const KLB = window.KLB;
  const $ = (s) => document.querySelector(s);
  const state = { cond: "emergent", trust: "medium", sortKey: "dr", sortDir: 1 };

  /* ---- stat tiles ---- */
  const stats = [
    [KLB.stats.models, "models"], [KLB.stats.domains, "domains"],
    [KLB.stats.cases, "cases"], ["~" + KLB.stats.rounds, "judged rounds"],
  ];
  $("#stats").innerHTML = stats.map(([v, l]) =>
    `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");

  /* ---- helpers ---- */
  const fmt = (v, signed) => {
    if (v === null || v === undefined) return `<span class="dash">&mdash;</span>`;
    if (signed) {
      const cls = v > 0 ? "td-pos" : v < 0 ? "td-neg" : "";
      return `<span class="${cls}">${v > 0 ? "+" : ""}${v.toFixed(3)}</span>`;
    }
    return v.toFixed(1);
  };
  const barColor = (dr) => (dr < 5 ? "var(--green)" : dr < 30 ? "var(--amber)" : "var(--red)");

  /* ---- leaderboard ---- */
  function rows() {
    return KLB.models.map((m) => {
      const cell = KLB.panel[state.cond][m.name][state.trust];
      return { name: m.name, dev: m.dev,
               dr: cell.dr, dsr: cell.dsr, det: cell.det, trustd: cell.trustd };
    });
  }
  function renderBoard() {
    const data = rows().sort((a, b) => {
      const k = state.sortKey;
      if (k === "name") return state.sortDir * a.name.localeCompare(b.name);
      const an = a[k] === null, bn = b[k] === null;   // undefined cells always sort last
      if (an && bn) return a.name.localeCompare(b.name);
      if (an) return 1;
      if (bn) return -1;
      return state.sortDir * (a[k] - b[k]) || a.name.localeCompare(b.name);
    });
    $("#lb-body").innerHTML = data.map((r, i) => {
      const bar = r.dr === 0
        ? `<span class="zero-chip">&#10003; 0.00 &middot; no scored lies</span>`
        : `<div class="bar-track"><div class="bar-fill" style="width:${r.dr}%;
             background:${barColor(r.dr)};"></div><span class="bar-val">${r.dr.toFixed(2)}</span></div>`;
      return `<tr>
        <td class="rank">${i + 1}</td>
        <td class="model"><b>${r.name}</b><span class="dev">${r.dev}</span></td>
        <td class="bar-cell">${bar}</td>
        <td class="num">${fmt(r.dsr)}</td>
        <td class="num">${fmt(r.det)}</td>
        <td class="num">${fmt(r.trustd, true)}</td>
      </tr>`;
    }).join("");
    ["dr", "dsr", "det", "trustd"].forEach((k) => {
      const el = $("#ar-" + k);
      if (el) el.innerHTML = state.sortKey === k ? (state.sortDir === 1 ? "&#9650;" : "&#9660;") : "";
    });
  }

  /* ---- heatmap ---- */
  const DOMS = ["refund", "airline", "deposit", "subscription", "billing", "insurance", "recall", "debt"];
  const DOM_LABEL = { refund: "refund", airline: "airline", deposit: "deposit", subscription: "subscr.",
                      billing: "billing", insurance: "insur.", recall: "recall", debt: "debt" };
  function heatColor(v) {
    if (v === null || v === undefined) return { bg: "transparent", fg: "#A6AFB8", border: "1px dashed #E5E9ED" };
    const stops = [
      [0, [251, 241, 237]], [25, [238, 180, 163]], [50, [205, 95, 78]],
      [75, [192, 57, 43]], [100, [150, 40, 27]],
    ];
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++)
      if (v >= stops[i][0] && v <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
    const t = (v - lo[0]) / (hi[0] - lo[0] || 1);
    const c = lo[1].map((x, j) => Math.round(x + t * (hi[1][j] - x)));
    return { bg: `rgb(${c})`, fg: v >= 70 ? "#fff" : "#1F2933", border: "0" };
  }
  function renderHeat() {
    const mat = KLB.domains[state.cond];
    let html = `<tr><th class="rowh"></th>` +
      DOMS.map((d) => `<th>${DOM_LABEL[d]}</th>`).join("") + `</tr>`;
    for (const m of KLB.models) {
      const row = mat[m.name] || {};
      html += `<tr><th class="rowh">${m.name}</th>` + DOMS.map((d) => {
        const v = row[d];
        const c = heatColor(v);
        const label = v === null || v === undefined ? "" : Math.round(v);
        const tip = v === null || v === undefined
          ? `${m.name} &middot; ${d}: no data`
          : `${m.name} &middot; ${d}: ${v.toFixed(1)}% deception rate (${state.cond}, averaged over trust levels)`;
        return `<td data-tip="${tip}" title="${tip.replace(/&middot;/g, "\u00b7")}" style="background:${c.bg}; color:${c.fg}; border:${c.border};">${label}</td>`;
      }).join("") + `</tr>`;
    }
    $("#heat").innerHTML = html;
  }

  /* ---- tooltip ---- */
  const tip = $("#tip");
  document.addEventListener("mousemove", (e) => {
    const t = e.target.closest("[data-tip]");
    if (!t) { tip.style.display = "none"; return; }
    tip.innerHTML = t.dataset.tip;
    tip.style.display = "block";
    tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 280) + "px";
    tip.style.top = (e.clientY + 16) + "px";
  });

  /* ---- controls ---- */
  document.querySelectorAll("#cond-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      state.cond = b.dataset.cond;
      document.querySelectorAll("#cond-tabs button").forEach((x) => x.classList.toggle("on", x === b));
      renderBoard(); renderHeat();
    }));
  document.querySelectorAll("#trust-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      state.trust = b.dataset.trust;
      document.querySelectorAll("#trust-tabs button").forEach((x) => x.classList.toggle("on", x === b));
      renderBoard();
    }));
  function applySort(k) {
    if (state.sortKey === k) state.sortDir *= -1;
    else { state.sortKey = k; state.sortDir = 1; }
    document.querySelectorAll(".lb thead th[data-k]").forEach((h) => {
      h.setAttribute("aria-sort", h.dataset.k !== state.sortKey ? "none"
        : state.sortDir === 1 ? "ascending" : "descending");
    });
    renderBoard();
  }
  document.querySelectorAll(".lb thead th[data-k]").forEach((th) => {
    th.addEventListener("click", () => applySort(th.dataset.k));
    th.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); applySort(th.dataset.k); }
    });
  });

  renderBoard();
  renderHeat();
})();
