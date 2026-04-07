/**
 * ÉcoBénin — Admin Dashboard v2.0
 * Uses: EcoBenin.EventBus, EcoBenin.store, EcoBenin.BinService
 */

document.addEventListener('DOMContentLoaded', () => {
  const { store, BinService, EventBus } = window.EcoBenin;
  const { qs, qsa, on, create } = window.EcoBenin.DOM;

  /* ── Navigation ──────────────────────────────────────────── */
  const sections = qsa('.page-section');
  const sideLinks = qsa('.sidebar-link[data-section]');
  const pageTitleEl = qs('#page-title');

  const TITLES = {
    'overview': 'Vue d\'ensemble',
    'bin-map': 'État des Poubelles',
    'trucks': 'Camions en Route',
    'alerts': 'Alertes Sécurité',
    'reports': 'Rapports',
    'planning': 'Ajouter une Poubelle',
  };

  function navigate(sectionId) {
    sections.forEach(s => s.classList.toggle('active', s.id === sectionId));
    sideLinks.forEach(a => a.classList.toggle('active', a.dataset.section === sectionId));
    if (pageTitleEl) pageTitleEl.textContent = TITLES[sectionId] || sectionId;
  }

  sideLinks.forEach(link => {
    on(link, 'click', () => navigate(link.dataset.section));
  });

  /* ── Render Helpers ──────────────────────────────────────── */
  function fillBar(level) {
    const cls = level > 80 ? 'full' : level > 50 ? 'warn' : '';
    return `
      <div class="progress">
        <div class="progress-bar ${cls}" style="width:${level}%"></div>
      </div>`;
  }

  function statusBadge(status) {
    const labels = { low: 'Disponible', half: 'À moitié', full: 'Pleine' };
    return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
  }

  function timeNow() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  /* ── Overview ────────────────────────────────────────────── */
  function renderOverview() {
    const { bins } = store.getState();
    const stats = BinService.getStats(bins);

    qs('#total-bins').textContent = stats.total;
    qs('#full-bins').textContent = stats.full;
    qs('#fuel-saved').textContent = `${stats.fuelSaved}%`;
    qs('#recycling-rate').textContent = `${stats.recyclingRate}%`;

    // Mini alerts in overview
    const overviewAlerts = qs('#overview-alerts');
    const criticals = bins.filter(b => b.fillLevel > 80 || b.hasGas);
    overviewAlerts.innerHTML = criticals.length
      ? criticals.slice(0, 3).map(b => `
          <div class="alert-item ${b.fillLevel > 80 ? 'danger' : 'warning'}" style="margin-bottom:6px;">
            <span class="alert-icon"><i class="fas fa-${b.fillLevel > 80 ? 'trash' : 'wind'}"></i></span>
            <span class="alert-text" style="font-size:var(--text-xs)">
              ${b.fillLevel > 80 ? `Poubelle ${b.location} pleine à ${b.fillLevel}%` : `Odeur détectée : ${b.location}`}
            </span>
          </div>`)
        .join('')
      : '<div class="no-alerts"><i class="fas fa-circle-check"></i><p>Aucune alerte</p></div>';

    // Alert count badge
    const badge = qs('#alert-count-badge');
    if (badge) badge.textContent = criticals.length;

    // Last updated
    const lu = qs('#last-updated');
    if (lu) lu.textContent = `Dernière mise à jour: ${timeNow()}`;
  }

  /* ── Bins ────────────────────────────────────────────────── */
  function renderBins() {
    const { bins } = store.getState();
    const container = qs('#bins-container');
    if (!container) return;

    container.innerHTML = bins.map((bin, index) => `
      <div id="bin-${index}" class="bin-card status-${bin.status}">
        <div class="bin-card-header">
          <span class="bin-id mono">#${String(bin.id).padStart(3, '0')}</span>
          ${statusBadge(bin.status)}
        </div>
        <div class="bin-location">${bin.location}</div>
        <div class="bin-fill-bar">
          <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--clr-text-3);margin-bottom:4px;">
            <span>Remplissage</span><span class="fill-level">${bin.fillLevel}%</span>
          </div>
          ${fillBar(bin.fillLevel)}
        </div>
        <div class="bin-meta">
          <span><i class="fas fa-thermometer-half me-1"></i>${bin.temperature}°C</span>
          <button class="btn btn-sm btn-success" data-index="${index}">
            <i class="fas fa-check"></i> Collecter
          </button>
        </div>
        ${bin.hasGas ? '<div class="gas-warning"><i class="fas fa-wind"></i> Odeur suspecte détectée</div>' : ''}
      </div>
    `).join('');

    qsa('[data-index]', container).forEach(btn => {
      on(btn, 'click', () => {
        const idx = parseInt(btn.dataset.index);
        const state = store.getState();
        const bin = state.bins[idx];
        const updated = BinService.collect(bin);
        const bins = [...state.bins];
        bins[idx] = updated;
        store.setState({ bins });
        renderBins(); renderOverview(); renderAlerts();
        showNotification(`Poubelle #${bin.id} collectée !`, 'success');
      });
    });
  }

  /* ── Trucks ──────────────────────────────────────────────── */
  function renderTrucks() {
    const { trucks, bins } = store.getState();
    const container = qs('#trucks-container');
    if (!container) return;

    container.innerHTML = trucks.map((truck, index) => `
      <div class="truck-card">
        <div class="truck-header">
          <div>
            <div class="truck-id">Camion #${truck.id}</div>
            <div class="truck-driver"><i class="fas fa-user me-1"></i>${truck.driver}</div>
          </div>
          ${truck.active
            ? `<span class="status-badge status-half"><i class="fas fa-circle" style="font-size:7px"></i> En route</span>`
            : `<span class="status-badge status-low">Inactif</span>`}
        </div>
        ${truck.active ? `
          <div class="truck-progress">
            <div class="truck-progress-label"><span>Progression</span><span>${truck.progress}%</span></div>
            ${fillBar(truck.progress)}
          </div>
        ` : ''}
        <div style="font-size:var(--text-xs);color:var(--clr-text-3);margin-bottom:12px;">
          ${truck.binsAssigned.length} poubelle(s) assignée(s)
        </div>
        <button class="btn ${truck.active ? 'btn-danger' : 'btn-primary'} btn-sm w-100" data-truck="${index}">
          <i class="fas fa-${truck.active ? 'stop' : 'play'}"></i>
          ${truck.active ? 'Arrêter' : 'Démarrer la tournée'}
        </button>
      </div>
    `).join('');

    qsa('[data-truck]', container).forEach(btn => {
      on(btn, 'click', () => {
        const idx = parseInt(btn.dataset.truck);
        const state = store.getState();
        const trucks = [...state.trucks];
        const truck = { ...trucks[idx] };
        truck.active = !truck.active;
        if (truck.active) {
          truck.binsAssigned = state.bins.filter(b => b.fillLevel > 50).slice(0, 3);
          truck.progress = 0;
        } else {
          truck.binsAssigned = []; truck.progress = 0;
        }
        trucks[idx] = truck;
        store.setState({ trucks });
        renderTrucks();
        showNotification(`Camion #${truck.id} ${truck.active ? 'démarré' : 'arrêté'}`, 'info');
      });
    });

    // Overview mini trucks panel
    const mini = qs('#overview-trucks-mini');
    if (mini) {
      const active = trucks.filter(t => t.active);
      mini.innerHTML = active.length
        ? active.map(t => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--clr-border);">
              <span style="font-size:var(--text-sm);font-weight:600">Camion #${t.id}</span>
              <span style="font-size:var(--text-xs);color:var(--clr-accent);font-family:var(--font-mono)">${t.progress}%</span>
            </div>`).join('')
        : '<p style="color:var(--clr-text-3);font-size:var(--text-sm)">Aucun camion actif</p>';
    }
  }

  /* ── Alerts ──────────────────────────────────────────────── */
  function renderAlerts() {
    const { bins } = store.getState();
    const list = qs('#alerts-list');
    if (!list) return;

    const alerts = bins.reduce((acc, bin) => {
      if (bin.fillLevel > 80) acc.push({ type: 'danger', icon: 'trash', msg: `Poubelle #${bin.id} (${bin.location}) pleine à ${bin.fillLevel}%` });
      if (bin.hasGas) acc.push({ type: 'warning', icon: 'wind', msg: `Odeur suspecte détectée à ${bin.location}` });
      return acc;
    }, []);

    list.innerHTML = alerts.length
      ? alerts.map(a => `
          <div class="alert-item ${a.type}">
            <span class="alert-icon"><i class="fas fa-${a.icon}"></i></span>
            <span class="alert-text">${a.msg}</span>
            <span class="alert-time">${timeNow()}</span>
          </div>`)
        .join('')
      : `<div class="no-alerts"><i class="fas fa-circle-check"></i><p>Aucune alerte active</p></div>`;
  }

  /* ── Export Report ───────────────────────────────────────── */
  on(qs('#export-report'), 'click', () => {
    const { bins, trucks } = store.getState();
    const stats = BinService.getStats(bins);
    const activeTrucks = trucks.filter(t => t.active).length;

    const out = qs('#report-output');
    out.className = 'report-output';
    out.innerHTML = `<span class="rk">// Rapport ÉcoBénin — </span><span class="rv">${new Date().toLocaleString('fr-FR')}</span>

<span class="rk">POUBELLES</span>
  total          <span class="rv">${stats.total}</span>
  pleines        <span class="rv">${stats.full}</span>
  à_moitié       <span class="rv">${stats.half}</span>
  remplissage_moy <span class="rv">${stats.avgFill}%</span>

<span class="rk">PERFORMANCES</span>
  carburant_écon  <span class="rv">${stats.fuelSaved}%</span>
  taux_recyclage  <span class="rv">${stats.recyclingRate}%</span>

<span class="rk">CAMIONS</span>
  actifs         <span class="rv">${activeTrucks} / ${trucks.length}</span>`;

    showNotification('Rapport généré avec succès', 'success');
  });

  /* ── Add Bin ─────────────────────────────────────────────── */
  on(qs('#add-bin-form'), 'submit', (e) => {
    e.preventDefault();
    const location = qs('#bin-location').value.trim();
    const fill = parseInt(qs('#bin-fill')?.value) || 0;
    if (!location) { showNotification('Localisation requise', 'warning'); return; }

    const newBin = BinService.create(null, { location, fillLevel: fill });
    const state = store.getState();
    store.setState({ bins: [...state.bins, newBin] });
    renderBins(); renderOverview(); renderAlerts();
    showNotification(`Poubelle ajoutée : ${location}`, 'success');
    e.target.reset();
    navigate('bin-map');
  });

  /* ── Real-time Simulation ────────────────────────────────── */
  const INTERVAL_MS = 10000;

  setInterval(() => {
    const { bins, trucks } = store.getState();

    const updatedBins = bins.map(bin => {
      const newBin = BinService.create(bin.id, { location: bin.location });
      return newBin;
    });

    const updatedTrucks = trucks.map(truck => {
      if (!truck.active) return truck;
      const progress = Math.min(truck.progress + 10, 100);
      if (progress >= 100) {
        return { ...truck, active: false, progress: 0, binsAssigned: [] };
      }
      return { ...truck, progress };
    });

    store.setState({ bins: updatedBins, trucks: updatedTrucks });
    renderOverview(); renderAlerts(); renderTrucks();

    // Update bin cards if visible
    if (qs('#bin-map.active')) renderBins();
  }, INTERVAL_MS);

  /* ── Init ────────────────────────────────────────────────── */
  renderOverview();
  renderBins();
  renderAlerts();
  renderTrucks();
});