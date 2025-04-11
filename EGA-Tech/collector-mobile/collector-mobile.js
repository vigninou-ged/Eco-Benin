// collector-mobile.js

document.addEventListener('DOMContentLoaded', () => {
    try {
      // Données du collecteur
      const collectorData = {
        binsCollected: 0,
        timeSpent: 0, // En minutes
        savings: 0, // Pourcentage
      };
  
      // Générer 5 poubelles à collecter
      let bins = generateTrashBins(5).map(bin => ({
        ...bin,
        distance: (Math.random() * 5).toFixed(1), // Distance en km
        collected: false,
      }));
  
      // Mettre à jour l’heure actuelle
      function updateTime() {
        document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
      }
  
      // Afficher le tableau de bord
      function renderDashboard() {
        const binsToCollect = bins.filter(bin => !bin.collected).length;
        const totalDistance = bins.reduce((sum, bin) => sum + (bin.collected ? 0 : parseFloat(bin.distance)), 0).toFixed(1);
        const fuelEstimate = (totalDistance * 0.2).toFixed(1); // Estimation fictive : 0.2L/km
        document.getElementById('bins-to-collect').textContent = binsToCollect;
        document.getElementById('total-distance').textContent = totalDistance;
        document.getElementById('fuel-estimate').textContent = fuelEstimate;
      }
  
      // Afficher la liste des poubelles
      function renderBins() {
        const list = document.getElementById('bins-list');
        list.innerHTML = '';
        bins.filter(bin => !bin.collected).forEach((bin, index) => {
          const item = document.createElement('li');
          item.className = `list-group-item status-${bin.status}`;
          item.innerHTML = `
            <div>
              <strong>${bin.location}</strong><br>
              ${bin.distance} km - <span class="fill-level">${bin.fillLevel}%</span>
            </div>
            <button class="btn btn-success btn-collect" onclick="collectBin('${index}')">Collecter</button>
          `;
          list.appendChild(item);
        });
      }
  
      // Simuler une collecte
      window.collectBin = function(index) {
        const bin = bins[index];
        if (bin.collected) {
          showNotification(`Poubelle #${bin.id} déjà collectée`, 'warning');
          return;
        }
        bin.collected = true;
        bin.fillLevel = 0;
        bin.status = 'low';
        collectorData.binsCollected += 1;
        collectorData.savings = Math.min(collectorData.savings + Math.random() * 10, 40); // Max 40%
        updateBinStatus(index, bin);
        renderDashboard();
        renderBins();
        renderStats();
        showNotification(`Poubelle #${bin.id} collectée !`, 'success');
      };
  
      // Afficher les statistiques
      function renderStats() {
        document.getElementById('time-spent').textContent = collectorData.timeSpent;
        document.getElementById('bins-collected').textContent = collectorData.binsCollected;
        document.getElementById('savings').textContent = collectorData.savings.toFixed(1);
      }
  
      // Initialisation
      updateTime();
      renderDashboard();
      renderBins();
      renderStats();
  
      // Simulation en temps réel
      setInterval(() => {
        bins = bins.map((bin, index) => {
          if (!bin.collected) {
            const newData = generateTrashBinData(bin.id);
            newData.location = bin.location;
            newData.distance = bin.distance;
            updateBinStatus(index, newData);
            return { ...newData, collected: false };
          }
          return bin;
        });
        renderBins();
        renderDashboard();
      }, 10000); // Mise à jour toutes les 10s
  
      setInterval(() => {
        collectorData.timeSpent += 1;
        updateTime();
        renderStats();
      }, 60000); // Temps simulé : +1 min toutes les 60s
  
    } catch (error) {
      handleError(`Erreur lors de l’initialisation collecteur : ${error.message}`);
    }
  });