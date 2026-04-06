/**
 * ÉcoBénin — Citizen Web v2.0
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
    const { DOM } = window.EcoBenin;

    /* ── Logo hover animation ── */
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.addEventListener('mouseover', () => {
        logo.style.transform = 'rotate(2deg) scale(1.01)';
        setTimeout(() => logo.style.transform = '', 300);
      });
    }

    /* ── Slideshow ── */
    const slides = document.querySelectorAll('.slide');
    if (slides.length) {
      let cur = 0;
      setInterval(() => {
        slides[cur].classList.remove('visible');
        cur = (cur + 1) % slides.length;
        slides[cur].classList.add('visible');
      }, 3500);
    }

    /* ── Cycle animation ── */
    const cycleSteps = document.querySelectorAll('.cycle-step');
    if (cycleSteps.length) {
      let ci = 0;
      setInterval(() => {
        cycleSteps.forEach(s => s.classList.remove('active'));
        cycleSteps[ci].classList.add('active');
        ci = (ci + 1) % cycleSteps.length;
      }, 1800);
    }

    /* ── Suggestion form ── */
    const form = document.getElementById('suggestion-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = document.getElementById('suggestion-text').value.trim();
        if (!val) { showNotification('Veuillez entrer une suggestion', 'warning'); return; }
        showNotification('Merci pour votre suggestion !', 'success');
        e.target.reset();
      });
    }

    /* ── Download buttons ── */
    document.querySelectorAll('#dl-android, #dl-ios').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Lien de téléchargement disponible prochainement', 'info');
      });
    });

  } catch (err) {
    handleError(`citizen-web: ${err.message}`);
  }
});