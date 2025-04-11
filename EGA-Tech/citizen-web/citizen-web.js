// citizen-web.js

document.addEventListener('DOMContentLoaded', () => {
    try {
      // Animation du logo
      const logo = document.querySelector('.logo');
      logo.addEventListener('mouseover', () => {
        logo.style.transform = 'rotate(360deg)';
        setTimeout(() => logo.style.transform = 'rotate(0deg)', 1000);
      });
  
      // Gestion du formulaire de suggestions
      document.getElementById('suggestion-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const suggestion = document.getElementById('suggestion-text').value.trim();
        if (!suggestion) {
          showNotification('Veuillez entrer une suggestion', 'warning');
          return;
        }
        showNotification('Merci pour votre suggestion !', 'success');
        e.target.reset();
      });
  
      // Simulation d’un cycle dynamique (optionnel)
      const cycleIcons = document.querySelectorAll('#cycle i');
      let currentIndex = 0;
      setInterval(() => {
        cycleIcons.forEach(icon => icon.classList.remove('text-warning'));
        cycleIcons[currentIndex].classList.add('text-warning');
        currentIndex = (currentIndex + 1) % cycleIcons.length;
      }, 2000);
  
      // Liens de téléchargement fictifs
      document.querySelectorAll('#download a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          showNotification('Lien de téléchargement simulé', 'info');
        });
      });
  
    } catch (error) {
      handleError(`Erreur lors de l’initialisation : ${error.message}`);
    }
  });