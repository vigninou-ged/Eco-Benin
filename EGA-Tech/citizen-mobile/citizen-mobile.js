// citizen-mobile.js

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Récupérer la valeur de isLoggedIn depuis localStorage
    let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentPage = window.location.pathname.split('/').pop();

    // Logs pour déboguer
    console.log(`[START] Page: ${currentPage}, isLoggedIn: ${isLoggedIn}`);

    // Vérification et redirection si non connecté pour content
    if (currentPage === 'citizen-mobile-content.html' && !isLoggedIn) {
      console.log('Non connecté sur content, redirection vers login');
      window.location.href = 'citizen-mobile-login.html';
      return;
    }

    // Gestion de la connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const credential = document.getElementById('login-credential').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!credential || !password) {
          showNotification('Veuillez remplir tous les champs', 'warning');
          return;
        }

        // Mettre à jour isLoggedIn AVANT redirection
        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true; // Synchroniser immédiatement la variable locale
        console.log('Connexion réussie, isLoggedIn mis à true :', localStorage.getItem('isLoggedIn'));
        showNotification('Connexion réussie !', 'success');
        window.location.href = 'citizen-mobile-content.html'; // Redirection immédiate
      });

      document.getElementById('google-login')?.addEventListener('click', () => {
        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true;
        console.log('Connexion Google réussie, isLoggedIn mis à true :', localStorage.getItem('isLoggedIn'));
        showNotification('Connexion avec Google simulée', 'success');
        window.location.href = 'citizen-mobile-content.html';
      });
    }

    // Gestion de l’inscription
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const firstname = document.getElementById('signup-firstname').value.trim();
        const lastname = document.getElementById('signup-lastname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const confirmPassword = document.getElementById('signup-confirm-password').value.trim();

        if (!firstname || !lastname || !email || !phone || !password || !confirmPassword) {
          showNotification('Veuillez remplir tous les champs', 'warning');
          return;
        }

        if (password !== confirmPassword) {
          showNotification('Les mots de passe ne correspondent pas', 'danger');
          return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true;
        console.log('Inscription réussie, isLoggedIn mis à true :', localStorage.getItem('isLoggedIn'));
        showNotification('Inscription réussie !', 'success');
        window.location.href = 'citizen-mobile-content.html';
      });

      document.getElementById('google-signup')?.addEventListener('click', () => {
        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true;
        console.log('Inscription Google réussie, isLoggedIn mis à true :', localStorage.getItem('isLoggedIn'));
        showNotification('Inscription avec Google simulée', 'success');
        window.location.href = 'citizen-mobile-content.html';
      });
    }

    // Gestion du contenu (citizen-mobile-content.html)
    if (currentPage === 'citizen-mobile-content.html') {
      console.log('Connecté sur content, chargement du tableau de bord');
      let userPoints = 0;

      // Navigation entre sections
      const sections = document.querySelectorAll('.content-section');
      const navLinks = document.querySelectorAll('.nav-bottom .nav-link');
      
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          if (targetId && document.getElementById(targetId)) {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      });

      // Mise à jour des points
      function updatePoints(points) {
        userPoints += points;
        document.getElementById('eco-points').textContent = userPoints;
        document.getElementById('total-points').textContent = userPoints;
      }

      // Boutons CTA
      document.querySelectorAll('.cta-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.textContent.includes('Tutoriel')) {
            showNotification('Tutoriel simulé ouvert', 'info');
          } else if (btn.textContent.includes('Déposer')) {
            updatePoints(10);
            showNotification('Objet déposé ! +10 points', 'success');
            document.querySelector('#objects .empty-state').innerHTML = `
              <p class="text-muted">1 objet déposé</p>
              <button class="btn btn-primary btn-custom cta-btn"><i class="fas fa-plus"></i> Déposer un autre</button>
            `;
          } else if (btn.textContent.includes('Recycler')) {
            updatePoints(5);
            showNotification('Recyclage démarré ! +5 points', 'success');
            document.querySelector('#points .empty-state').innerHTML = `
              <p class="text-muted">5 points gagnés</p>
              <button class="btn btn-primary btn-custom cta-btn"><i class="fas fa-recycle"></i> Recycler encore</button>
            `;
          }
        });
      });

      // Notification cliquable
      document.querySelector('.notification-icon')?.addEventListener('click', () => {
        showNotification('Aucune nouvelle notification', 'info');
      });
    }

  } catch (error) {
    handleError(`Erreur dans citizen-mobile : ${error.message}`);
  }
});