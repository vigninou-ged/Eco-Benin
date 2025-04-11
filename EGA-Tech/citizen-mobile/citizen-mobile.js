// citizen-mobile.js

document.addEventListener('DOMContentLoaded', () => {
  try {
    let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentPage = window.location.pathname.split('/').pop();

    console.log(`[START] Page: ${currentPage}, isLoggedIn: ${isLoggedIn}`);

    if (currentPage === 'citizen-mobile-content.html' && !isLoggedIn) {
      console.log('Non connecté, redirection vers login');
      window.location.href = 'citizen-mobile-login.html';
      return;
    }

    // Gestion de la connexion (inchangée)
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
        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true;
        console.log('Connexion réussie, isLoggedIn mis à true :', localStorage.getItem('isLoggedIn'));
        showNotification('Connexion réussie !', 'success');
        window.location.href = 'citizen-mobile-content.html';
      });
      document.getElementById('google-login')?.addEventListener('click', () => {
        localStorage.setItem('isLoggedIn', 'true');
        isLoggedIn = true;
        console.log('Connexion Google réussie, isLoggedIn mis à true :', localStorage.getItem('isLoggedIn'));
        showNotification('Connexion avec Google simulée', 'success');
        window.location.href = 'citizen-mobile-content.html';
      });
    }

    // Gestion de l’inscription (inchangée)
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

    // Gestion du contenu
    if (currentPage === 'citizen-mobile-content.html') {
      let userPoints = 0;
      let history = JSON.parse(localStorage.getItem('history')) || [];
      const sections = document.querySelectorAll('.content-section');
      const navLinks = document.querySelectorAll('a[href^="#"]'); // Tous les liens avec #id

      // Fonction pour changer de section
      function switchSection(targetId) {
        if (targetId && document.getElementById(targetId)) {
          sections.forEach(section => section.classList.remove('active'));
          document.getElementById(targetId).classList.add('active');
          navLinks.forEach(link => {
            const linkId = link.getAttribute('href').substring(1);
            link.classList.toggle('active', linkId === targetId && link.closest('.nav-bottom'));
          });
        }
      }

      // Gestion de tous les liens avec #id
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          if (targetId !== 'logout') { // Exclure logout pour sa propre logique
            switchSection(targetId);
          }
        });
      });

      // Mise à jour des points
      function updatePoints(points, action) {
        userPoints += points;
        document.getElementById('eco-points').textContent = userPoints;
        document.getElementById('total-points').textContent = userPoints;
        history.push({ date: new Date().toLocaleString(), action, points });
        localStorage.setItem('history', JSON.stringify(history));
        updateHistory();
      }

      // Poubelles proches
      const bins = [
        { location: "Rue 1", fillLevel: 80, status: "full" },
        { location: "Rue 2", fillLevel: 50, status: "half" },
        { location: "Rue 3", fillLevel: 20, status: "low" },
        { location: "Rue 4", fillLevel: 10, status: "low" }
      ];
      const binsContainer = document.getElementById('bins-container');
      bins.forEach(bin => {
        binsContainer.innerHTML += `
          <div class="list-group-item status-${bin.status} d-flex justify-content-between align-items-center">
            <div>
              <strong>${bin.location}</strong> - <span class="fill-level">${bin.fillLevel}%</span>
            </div>
            <button class="btn btn-sm btn-outline-light route-btn">Itinéraire</button>
          </div>
        `;
      });

      // Scanner QR
      function scanQR() {
        document.getElementById('scan-result').textContent = 'Code QR scanné ! +10 points';
        updatePoints(10, 'Scan QR');
        setTimeout(() => document.getElementById('scan-result').textContent = '', 2000);
      }
      document.getElementById('scan-btn').addEventListener('click', scanQR);
      document.querySelector('.scan-btn').addEventListener('click', (e) => {
        e.preventDefault();
        scanQR();
      });

      // Historique
      function updateHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = history.length ? '' : '<p class="text-muted small text-center">Aucun historique pour l’instant.</p>';
        history.forEach(entry => {
          historyList.innerHTML += `
            <div class="list-group-item">
              <div class="d-flex justify-content-between">
                <span class="small">${entry.action}</span>
                <span class="small text-success">+${entry.points} pts</span>
              </div>
              <small class="text-muted">${entry.date}</small>
            </div>
          `;
        });
      }
      updateHistory();

      // Suggestions
      document.getElementById('suggestion-form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('suggestion-result').textContent = 'Suggestion envoyée ! Merci.';
        setTimeout(() => document.getElementById('suggestion-result').textContent = '', 2000);
      });

      // Mon compte
      document.getElementById('account-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification('Compte mis à jour avec succès', 'success');
      });

      // Support client
      document.getElementById('support-form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('support-result').textContent = 'Message envoyé au support !';
        setTimeout(() => document.getElementById('support-result').textContent = '', 2000);
      });

      // Notification
      document.querySelector('.notification-icon')?.addEventListener('click', () => {
        showNotification('Aucune nouvelle notification', 'info');
      });

      // Déconnexion
      document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('history');
        isLoggedIn = false;
        showNotification('Déconnexion réussie', 'success');
        window.location.href = 'citizen-mobile-login.html';
      });
    }

  } catch (error) {
    handleError(`Erreur dans citizen-mobile : ${error.message}`);
  }
});
