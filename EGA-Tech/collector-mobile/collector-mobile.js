/**
 * ÉcoBénin — Collector Mobile v2.0
 */

document.addEventListener('DOMContentLoaded', () => {
  const { store, BinService, DOM } = window.EcoBenin;

  let collectorData = { binsCollected: 0, timeSpent: 0, savings: 0 };

  let bins = window.sharedData.bins.map((bin, i) => ({
    ...bin,
    distance: parseFloat((0.3 + Math.random() * 5).toFixed(1)),
    collected: false,
    order: i,
  })).sort((a, b) => a.fillLevel < b.fillLevel ? 1 : -1); // Sort by fill level desc

  /* ── Clock ── */
  function updateTime() {
    const el = DOM.qs('#current-time');
    if (el) el.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /* ── Dashboard metrics ── */
  function renderDashboard() {
    const pending = bins.filter(b => !b.collected);
    const dist = pending.reduce((s, b) => s + b.distance, 0).toFixed(1);
    const fuel = (dist * 0.2).toFixed(1);

    DOM.qs('#bins-to-collect').textContent = pending.length;
    DOM.qs('#total-distance').textContent = dist;
    DOM.qs('#fuel-estimate').textContent = fuel;

    const countLabel = DOM.qs('#bins-count-label');
    if (countLabel) countLabel.textContent = `${pending.length} restantes`;
  }

  /* ── Bins List ── */
  function renderBins() {
    const list = DOM.qs('#bins-list');
    if (!list) return;

    const pending = bins.filter(b => !b.collected);

    if (!pending.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:32px;color:var(--clr-text-3);">
          <i class="fas fa-circle-check" style="font-size:36px;color:var(--clr-primary);margin-bottom:8px;display:block;"></i>
          <div style="font-family:var(--font-display);font-weight:700;">Tournée terminée !</div>
          <div style="font-size:var(--text-xs);margin-top:4px;">Toutes les poubelles ont été collectées.</div>
        </div>`;
      return;
    }

    list.innerHTML = pending.map((bin, i) => `
      <div class="collector-bin-item status-${bin.status}" id="cbin-${bin.id}">
        <div class="cbi-num">${i + 1}</div>
        <div class="cbi-info">
          <div class="cbi-location">${bin.location}</div>
          <div class="cbi-meta">
            <span>${bin.distance} km</span>
            <span style="margin-left:8px;color:${bin.status === 'full' ? 'var(--clr-danger)' : bin.status === 'half' ? 'var(--clr-accent)' : 'var(--clr-primary)'}">
              <span class="fill-level cbi-fill">${bin.fillLevel}%</span>
            </span>
          </div>
        </div>
        <button class="btn-collect" data-bin-id="${bin.id}">
          <i class="fas fa-check me-1"></i>Collecter
        </button>
      </div>
    `).join('');

    DOM.qsa('.btn-collect', list).forEach(btn => {
      DOM.on(btn, 'click', () => {
        const binId = btn.dataset.binId;
        collectBin(binId);
      });
    });
  }

  /* ── Collect ── */
  function collectBin(binId) {
    const idx = bins.findIndex(b => String(b.id) === String(binId));
    if (idx === -1 || bins[idx].collected) return;

    bins[idx].collected = true;
    collectorData.binsCollected++;
    collectorData.savings = Math.min(collectorData.savings + Math.random() * 8, 40);

    // Sync with shared store
    const state = store.getState();
    const sharedBins = [...state.bins];
    const sharedIdx = sharedBins.findIndex(b => String(b.id) === String(binId));
    if (sharedIdx !== -1) {
      sharedBins[sharedIdx] = BinService.collect(sharedBins[sharedIdx]);
      store.setState({ bins: sharedBins });
    }

    renderDashboard();
    renderBins();
    renderStats();
    showNotification(`Poubelle ${bins[idx].location} collectée !`, 'success');
  }

  /* ── Stats ── */
  function renderStats() {
    const ts = DOM.qs('#time-spent');
    const bc = DOM.qs('#bins-collected');
    const sv = DOM.qs('#savings');
    if (ts) ts.textContent = collectorData.timeSpent;
    if (bc) bc.textContent = collectorData.binsCollected;
    if (sv) sv.textContent = `${collectorData.savings.toFixed(0)}%`;
  }

  /* ── Real-time sync every 10s ── */
  setInterval(() => {
    const state = store.getState();
    bins = bins.map((bin) => {
      if (bin.collected) return bin;
      const shared = state.bins.find(b => String(b.id) === String(bin.id));
      if (shared) return { ...shared, distance: bin.distance, collected: false, order: bin.order };
      return bin;
    });
    renderBins();
    renderDashboard();
  }, 10000);

  /* Time counter */
  setInterval(() => {
    collectorData.timeSpent++;
    updateTime();
    renderStats();
  }, 60000);

  /* ── Init ── */
  updateTime();
  setInterval(updateTime, 1000);
  renderDashboard();
  renderBins();
  renderStats();
});