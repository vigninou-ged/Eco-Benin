/**
 * ÉcoBénin — Common Module v2.0
 * Architecture: Module pattern + EventBus + SharedStore
 * --------------------------------------------------------
 * Provides: EventBus, Store, BinService, NotificationService,
 *           StatsService — all accessible via window.EcoBenin
 */

(function (global) {
  'use strict';

  /* ── EventBus ──────────────────────────────────────────── */
  const EventBus = {
    _listeners: {},
    on(event, fn) {
      (this._listeners[event] ||= []).push(fn);
      return () => this.off(event, fn); // returns unsubscribe fn
    },
    off(event, fn) {
      this._listeners[event] = (this._listeners[event] || []).filter(f => f !== fn);
    },
    emit(event, payload) {
      (this._listeners[event] || []).forEach(fn => fn(payload));
    },
  };

  /* ── Reactive Store ────────────────────────────────────── */
  function createStore(initialState) {
    let state = structuredClone(initialState);
    return {
      getState: () => structuredClone(state),
      setState(patch) {
        const prev = structuredClone(state);
        state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
        EventBus.emit('store:change', { prev, next: state });
      },
      watch(key, fn) {
        return EventBus.on('store:change', ({ prev, next }) => {
          if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) fn(next[key], prev[key]);
        });
      },
    };
  }

  /* ── Bin Model ─────────────────────────────────────────── */
  const BIN_STATUSES = { LOW: 'low', HALF: 'half', FULL: 'full' };

  function createBin(id, overrides = {}) {
    const fill = overrides.fillLevel ?? Math.floor(Math.random() * 100);
    return {
      id: id ?? `bin-${Math.random().toString(36).slice(2, 7)}`,
      fillLevel: fill,
      status: fill > 80 ? BIN_STATUSES.FULL : fill > 50 ? BIN_STATUSES.HALF : BIN_STATUSES.LOW,
      temperature: parseFloat((20 + Math.random() * 20).toFixed(1)),
      hasGas: Math.random() > 0.95,
      location: `Rue ${Math.floor(Math.random() * 100) + 1}`,
      lastUpdated: Date.now(),
      ...overrides,
    };
  }

  const BinService = {
    create: (id, overrides) => createBin(id, overrides),
    createMany: (count) => Array.from({ length: count }, (_, i) => createBin(i)),
    collect(bin) {
      const updated = { ...bin, fillLevel: 0, status: BIN_STATUSES.LOW, lastUpdated: Date.now() };
      EventBus.emit('bin:collected', updated);
      return updated;
    },
    getStats(bins) {
      const total = bins.length;
      const full  = bins.filter(b => b.fillLevel > 80).length;
      const half  = bins.filter(b => b.fillLevel > 50 && b.fillLevel <= 80).length;
      const avgFill = total ? Math.round(bins.reduce((s, b) => s + b.fillLevel, 0) / total) : 0;
      return {
        total, full, half,
        available: total - full,
        avgFill,
        fuelSaved: Math.floor(Math.random() * 40),
        recyclingRate: Math.floor(Math.random() * 100),
      };
    },
  };

  /* ── Notification Service ──────────────────────────────── */
  const NotificationService = {
    _queue: [],
    _active: false,

    show(message, type = 'success', duration = 3500) {
      this._queue.push({ message, type, duration });
      if (!this._active) this._flush();
    },

    _flush() {
      if (!this._queue.length) { this._active = false; return; }
      this._active = true;
      const { message, type, duration } = this._queue.shift();

      const icons = { success: '✓', warning: '⚠', danger: '✕', info: 'i' };
      const el = document.createElement('div');
      el.className = `alert-custom alert-${type}`;
      el.innerHTML = `<span class="notif-icon">${icons[type] || '•'}</span> ${message}`;
      document.body.appendChild(el);

      setTimeout(() => {
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        setTimeout(() => { el.remove(); this._flush(); }, 300);
      }, duration);
    },
  };

  /* ── Shared App Store ──────────────────────────────────── */
  const store = createStore({
    bins: BinService.createMany(10),
    trucks: [
      { id: 1, active: false, binsAssigned: [], progress: 0, driver: 'Akossiwa' },
      { id: 2, active: false, binsAssigned: [], progress: 0, driver: 'Bénicio' },
    ],
    user: JSON.parse(localStorage.getItem('eco_user') || 'null'),
    session: {
      isLoggedIn: localStorage.getItem('eco_session') === 'true',
    },
  });

  /* Persist session changes */
  store.watch('session', (session) => {
    localStorage.setItem('eco_session', session.isLoggedIn);
  });

  /* ── Auth Service ──────────────────────────────────────── */
  const AuthService = {
    login(credential, password) {
      if (!credential || !password) throw new Error('Champs requis manquants');
      store.setState(s => ({ session: { ...s.session, isLoggedIn: true } }));
      EventBus.emit('auth:login');
    },
    logout() {
      store.setState(s => ({ session: { ...s.session, isLoggedIn: false } }));
      localStorage.removeItem('eco_session');
      localStorage.removeItem('eco_history');
      EventBus.emit('auth:logout');
    },
    isLoggedIn: () => store.getState().session.isLoggedIn,
  };

  /* ── DOM Helpers ───────────────────────────────────────── */
  const DOM = {
    qs: (sel, ctx = document) => ctx.querySelector(sel),
    qsa: (sel, ctx = document) => [...ctx.querySelectorAll(sel)],
    on(el, evt, fn) { el?.addEventListener(evt, fn); return () => el?.removeEventListener(evt, fn); },
    create(tag, props = {}, ...children) {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([k, v]) => {
        if (k === 'className') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v);
      });
      children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
      return el;
    },
  };

  /* ── Router (hash-based SPA) ───────────────────────────── */
  const Router = {
    navigate(sectionId) {
      const sections = DOM.qsa('.content-section');
      const navLinks = DOM.qsa('[data-nav]');
      if (!sections.length) return;
      sections.forEach(s => {
        s.classList.toggle('active', s.id === sectionId);
      });
      navLinks.forEach(a => {
        a.classList.toggle('active', a.dataset.nav === sectionId);
      });
      EventBus.emit('route:change', { to: sectionId });
    },
    init() {
      DOM.qsa('[data-nav]').forEach(link => {
        DOM.on(link, 'click', (e) => {
          e.preventDefault();
          this.navigate(link.dataset.nav);
        });
      });
    },
  };

  /* ── Error Handler ─────────────────────────────────────── */
  function handleError(message, critical = false) {
    console.error(`[ÉcoBénin Error] ${message}`);
    NotificationService.show(message, 'danger');
    if (critical) EventBus.emit('app:error', { message });
  }

  /* ── Legacy compatibility shims ─────────────────────────── */
  function showNotification(message, type) { NotificationService.show(message, type); }
  function generateTrashBinData(id) { return BinService.create(id); }
  function generateTrashBins(count) { return BinService.createMany(count); }
  function generateStats(bins) { return BinService.getStats(bins); }
  function updateBinStatus(binId, binData) {
    const binElement = document.getElementById(`bin-${binId}`);
    if (!binElement) return;
    const fillEl = binElement.querySelector('.fill-level');
    if (fillEl) fillEl.textContent = `${binData.fillLevel}%`;
    binElement.classList.remove('status-full', 'status-half', 'status-low');
    binElement.classList.add(`status-${binData.status}`);
  }
  function simulateCollection(binId) {
    const state = store.getState();
    const bin = state.bins[binId];
    if (!bin) return;
    const updated = BinService.collect(bin);
    store.setState(s => {
      const bins = [...s.bins];
      bins[binId] = updated;
      return { bins };
    });
    NotificationService.show(`Poubelle #${bin.id} collectée !`, 'success');
  }

  /* ── Global sharedData for backward compat ────────────── */
  const sharedDataProxy = {
    get bins() { return store.getState().bins; },
    set bins(v) { store.setState({ bins: v }); },
    get trucks() { return store.getState().trucks; },
  };

  /* ── Public API ────────────────────────────────────────── */
  global.EcoBenin = { EventBus, store, BinService, AuthService, NotificationService, DOM, Router };
  global.sharedData = sharedDataProxy;

  /* Legacy globals (kept for compatibility with existing files) */
  global.showNotification = showNotification;
  global.handleError = handleError;
  global.generateTrashBinData = generateTrashBinData;
  global.generateTrashBins = generateTrashBins;
  global.generateStats = generateStats;
  global.updateBinStatus = updateBinStatus;
  global.simulateCollection = simulateCollection;

  document.addEventListener('DOMContentLoaded', () => {
    console.info('%c[ÉcoBénin v2.0] Common module loaded', 'color:#4ad664;font-weight:bold');
  });

})(window);