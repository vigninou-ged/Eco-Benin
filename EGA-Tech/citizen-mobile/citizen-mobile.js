/**
 * ÉcoBénin — Citizen Mobile v2.0
 * Uses: EcoBenin.AuthService, EcoBenin.Router, EcoBenin.DOM
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  const { AuthService, DOM, EventBus } = window.EcoBenin;

  /* ── Guard: redirect if not logged in ── */
  if (currentPage === 'citizen-mobile-content.html' && !AuthService.isLoggedIn()) {
    window.location.href = 'citizen-mobile-login.html';
    return;
  }

  /* ═══════════════════════════════════════════════
     AUTH PAGES (login + signup)
  ═══════════════════════════════════════════════ */
  if (currentPage === 'citizen-mobile-login.html' || currentPage === 'citizen-mobile-signup.html') {

    const loginForm = DOM.qs('#login-form');
    if (loginForm) {
      DOM.on(loginForm, 'submit', (e) => {
        e.preventDefault();
        const credential = DOM.qs('#login-credential').value.trim();
        const password   = DOM.qs('#login-password').value.trim();
        if (!credential || !password) {
          showNotification('Veuillez remplir tous les champs', 'warning'); return;
        }
        AuthService.login(credential, password);
        showNotification('Connexion réussie !', 'success');
        setTimeout(() => window.location.href = 'citizen-mobile-content.html', 600);
      });

      DOM.on(DOM.qs('#google-login'), 'click', () => {
        AuthService.login('google@user.com', 'oauth');
        showNotification('Connexion Google simulée', 'success');
        setTimeout(() => window.location.href = 'citizen-mobile-content.html', 600);
      });
    }

    const signupForm = DOM.qs('#signup-form');
    if (signupForm) {
      DOM.on(signupForm, 'submit', (e) => {
        e.preventDefault();
        const fields = ['signup-firstname','signup-lastname','signup-email','signup-phone','signup-password','signup-confirm-password'];
        const values = fields.map(id => DOM.qs(`#${id}`)?.value.trim());
        if (values.some(v => !v)) { showNotification('Veuillez remplir tous les champs', 'warning'); return; }
        if (values[4] !== values[5]) { showNotification('Les mots de passe ne correspondent pas', 'danger'); return; }
        AuthService.login(values[2], values[4]);
        showNotification('Inscription réussie !', 'success');
        setTimeout(() => window.location.href = 'citizen-mobile-content.html', 600);
      });

      DOM.on(DOM.qs('#google-signup'), 'click', () => {
        AuthService.login('google@user.com', 'oauth');
        showNotification('Inscription Google simulée', 'success');
        setTimeout(() => window.location.href = 'citizen-mobile-content.html', 600);
      });
    }
    return; // don't run content page logic
  }

  /* ═══════════════════════════════════════════════
     CONTENT PAGE
  ═══════════════════════════════════════════════ */
  if (currentPage !== 'citizen-mobile-content.html') return;

  /* State */
  let userPoints = 0;
  let scansCount = 0;
  let history = JSON.parse(localStorage.getItem('eco_history') || '[]');

  /* ── Router ── */
  const sections = DOM.qsa('.content-section');
  const navTabs  = DOM.qsa('[data-nav]');

  function navigate(id) {
    if (!id) return;
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    navTabs.forEach(t => t.classList.toggle('active', t.dataset.nav === id));
    window.scrollTo(0, 0);
  }

  navTabs.forEach(tab => {
    DOM.on(tab, 'click', (e) => {
      e.preventDefault();
      if (tab.id === 'logout') return;
      navigate(tab.dataset.nav);
    });
  });

  /* ── Points ── */
  function addPoints(pts, action) {
    userPoints += pts;
    history.unshift({ date: new Date().toLocaleString('fr-FR'), action, points: pts });
    localStorage.setItem('eco_history', JSON.stringify(history.slice(0, 50)));
    syncPoints();
    renderHistory();
  }

  function syncPoints() {
    DOM.qsa('#eco-points, #total-points, #total-points-2').forEach(el => el && (el.textContent = userPoints));
    const sc = DOM.qs('#scans-count');
    if (sc) sc.textContent = scansCount;
  }

  /* ── Bins ── */
  function renderBins() {
    const bins = window.sharedData.bins.slice(0, 4);
    const container = DOM.qs('#bins-container');
    if (!container) return;
    container.innerHTML = bins.map(bin => `
      <div class="bin-item status-${bin.status}">
        <div class="bin-info">
          <div class="bin-item-name">${bin.location}</div>
          <div class="bin-item-meta">Remplissage : <span class="fill-level">${bin.fillLevel}%</span></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span class="status-badge status-${bin.status}">${bin.fillLevel > 80 ? 'Pleine' : bin.fillLevel > 50 ? '50%+' : 'Dispo'}</span>
          <button class="btn btn-sm btn-outline route-btn" style="font-size:10px;padding:3px 8px;">
            <i class="fas fa-location-arrow"></i> GPS
          </button>
        </div>
      </div>
    `).join('');

    DOM.qsa('.route-btn', container).forEach(btn => {
      DOM.on(btn, 'click', () => showNotification('Navigation GPS simulée', 'info'));
    });
  }

  /* ── QR Scan ── */
  function triggerScan() {
    scansCount++;
    const pts = 10;
    addPoints(pts, 'Scan QR code');
    const res = DOM.qs('#scan-result');
    if (res) {
      res.textContent = `✓ +${pts} points gagnés !`;
      setTimeout(() => res.textContent = '', 2500);
    }
    showNotification(`+${pts} points ! Bravo !`, 'success');
  }

  DOM.on(DOM.qs('#scan-btn'), 'click', triggerScan);
  DOM.on(DOM.qs('#nav-scan-btn'), 'click', triggerScan);

  /* ── History ── */
  function renderHistory() {
    const list = DOM.qs('#history-list');
    if (!list) return;
    if (!history.length) {
      list.innerHTML = `<div style="text-align:center;padding:40px 16px;color:var(--clr-text-3);">
        <i class="fas fa-leaf" style="font-size:32px;color:var(--clr-border);margin-bottom:8px;display:block;"></i>
        Aucune action pour l'instant
      </div>`;
      return;
    }
    list.innerHTML = history.map(entry => `
      <div class="history-item">
        <div class="history-icon"><i class="fas fa-recycle"></i></div>
        <div class="history-text">
          <div class="history-action">${entry.action}</div>
          <div class="history-date">${entry.date}</div>
        </div>
        <div class="history-pts">+${entry.points} pts</div>
      </div>
    `).join('');
  }

  /* ── Suggestions ── */
  DOM.on(DOM.qs('#suggestion-form'), 'submit', (e) => {
    e.preventDefault();
    const res = DOM.qs('#suggestion-result');
    if (res) res.textContent = '✓ Suggestion envoyée, merci !';
    setTimeout(() => res && (res.textContent = ''), 2500);
    e.target.reset();
  });

  /* ── Account ── */
  DOM.on(DOM.qs('#account-form'), 'submit', (e) => {
    e.preventDefault();
    showNotification('Profil mis à jour', 'success');
  });

  /* ── Support ── */
  DOM.on(DOM.qs('#support-form'), 'submit', (e) => {
    e.preventDefault();
    const res = DOM.qs('#support-result');
    if (res) res.textContent = '✓ Message envoyé au support';
    setTimeout(() => res && (res.textContent = ''), 2500);
    e.target.reset();
  });

  /* ── Notification bell ── */
  DOM.on(DOM.qs('.notification-icon'), 'click', () => {
    showNotification('Aucune nouvelle notification', 'info');
  });

  /* ── Logout ── */
  DOM.on(DOM.qs('#logout'), 'click', (e) => {
    e.preventDefault();
    window.EcoBenin.AuthService.logout();
    showNotification('Déconnexion réussie', 'success');
    setTimeout(() => window.location.href = 'citizen-mobile-login.html', 600);
  });

  /* ── Profile item nav ── */
  DOM.qsa('.profile-item[data-nav]').forEach(item => {
    DOM.on(item, 'click', () => navigate(item.dataset.nav));
  });

  /* ── Init ── */
  renderBins();
  renderHistory();
  syncPoints();
});