// admin-web.js

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Référence aux poubelles et camions partagés depuis common.js
    let bins = window.sharedData.bins;
    let trucks = window.sharedData.trucks;

    // Afficher la vue d’ensemble
    function renderOverview() {
      const stats = generateStats(bins);
      document.getElementById('total-bins').textContent = stats.totalBins;
      document.getElementById('full-bins').textContent = stats.fullBins;
      document.getElementById('fuel-saved').textContent = stats.fuelSaved;
      document.getElementById('recycling-rate').textContent = stats.recyclingRate;
    }

    // Afficher les poubelles
    function renderBins() {
      const container = document.getElementById('bins-container');
      container.innerHTML = '';
      bins.forEach((bin, index) => {
        const binCard = document.createElement('div');
        binCard.className = 'col-md-4 col-sm-6';
        binCard.innerHTML = `
          <div id="bin-${index}" class="card card-custom status-${bin.status}">
            <div class="card-header">Poubelle #${bin.id}</div>
            <div class="card-body">
              <p>Location: ${bin.location}</p>
              <p>Remplissage: <span class="fill-level">${bin.fillLevel}%</span></p>
              <p>Température: ${bin.temperature}°C</p>
              ${bin.hasGas ? '<p class="text-danger">Odeur suspecte</p>' : ''}
              <button class="btn btn-sm btn-success" data-index="${index}">Collecter</button>
            </div>
          </div>
        `;
        container.appendChild(binCard);
      });

      // Ajouter les événements aux boutons après le rendu
      document.querySelectorAll('.btn-success').forEach(button => {
        button.addEventListener('click', () => {
          const index = button.getAttribute('data-index');
          simulateCollection(index);
        });
      });
    }

    // Simuler une collecte
    window.simulateCollection = function(index) {
      const bin = bins[index];
      bin.fillLevel = 0;
      bin.status = 'low';
      bins[index] = bin;
      window.sharedData.bins[index] = bin; // Synchronisation
      renderBins();
      renderOverview();
      renderAlerts();
      showNotification(`Poubelle #${bin.id} collectée !`, 'success');
    };

    // Afficher les alertes
    function renderAlerts() {
      const alertsList = document.getElementById('alerts-list');
      alertsList.innerHTML = '';
      bins.forEach(bin => {
        if (bin.fillLevel > 80) {
          const alertItem = document.createElement('li');
          alertItem.className = 'list-group-item alert-danger';
          alertItem.textContent = `Poubelle #${bin.id} (${bin.location}) pleine à ${bin.fillLevel}%`;
          alertsList.appendChild(alertItem);
        } else if (bin.hasGas) {
          const alertItem = document.createElement('li');
          alertItem.className = 'list-group-item alert-warning';
          alertItem.textContent = `Odeur suspecte détectée à ${bin.location}`;
          alertsList.appendChild(alertItem);
        }
      });
    }

    // Afficher les camions en route
    function renderTrucks() {
      const trucksContainer = document.getElementById('trucks-container');
      trucksContainer.innerHTML = '';
      trucks.forEach((truck, index) => {
        const truckCard = document.createElement('div');
        truckCard.className = 'col-md-4 col-sm-6';
        truckCard.innerHTML = `
          <div class="card card-custom">
            <div class="card-header">Camion #${truck.id}</div>
            <div class="card-body">
              <p>Statut: ${truck.active ? 'En route' : 'Inactif'}</p>
              <p>Poubelles assignées: ${truck.binsAssigned.length}</p>
              <p>Progression: ${truck.progress}%</p>
              <button class="btn btn-sm btn-primary" data-truck="${index}">${truck.active ? 'Arrêter' : 'Démarrer'}</button>
            </div>
          </div>
        `;
        trucksContainer.appendChild(truckCard);
      });

      // Ajouter les événements aux boutons
      document.querySelectorAll('.btn-primary').forEach(button => {
        button.addEventListener('click', () => {
          const truckIndex = button.getAttribute('data-truck');
          toggleTruck(truckIndex);
        });
      });
    }

    // Activer/Désactiver un camion
    function toggleTruck(index) {
      const truck = trucks[index];
      truck.active = !truck.active;
      if (truck.active) {
        truck.binsAssigned = bins.filter(b => b.fillLevel > 50).slice(0, 3); // Assign 3 poubelles pleines
        truck.progress = 0;
      } else {
        truck.binsAssigned = [];
        truck.progress = 0;
      }
      renderTrucks();
      showNotification(`Camion #${truck.id} ${truck.active ? 'démarré' : 'arrêté'}`, 'info');
    }

    // Exporter un rapport
    document.getElementById('export-report').addEventListener('click', () => {
      const stats = generateStats(bins);
      const activeTrucks = trucks.filter(t => t.active).length;
      const report = `
        Rapport ÉcoVille - ${new Date().toLocaleString()}
        Total Poubelles: ${stats.totalBins}
        Poubelles pleines: ${stats.fullBins}
        Carburant économisé: ${stats.fuelSaved}%
        Taux de recyclage: ${stats.recyclingRate}%
        Camions en route: ${activeTrucks}
      `;
      document.getElementById('report-output').innerHTML = `<pre class="p-3 bg-light">${report}</pre>`;
      showNotification('Rapport généré avec succès', 'success');
    });

    // Ajouter une nouvelle poubelle
    document.getElementById('add-bin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const location = document.getElementById('bin-location').value.trim();
      if (!location) {
        showNotification('Veuillez entrer une localisation', 'warning');
        return;
      }
      const newBin = generateTrashBinData();
      newBin.location = location;
      bins.push(newBin);
      window.sharedData.bins = bins; // Synchronisation
      renderBins();
      renderOverview();
      renderAlerts();
      showNotification(`Poubelle ajoutée à ${location}`, 'success');
      e.target.reset();
    });

    // Initialisation
    renderOverview();
    renderBins();
    renderAlerts();
    renderTrucks();

    // Simulation en temps réel
    setInterval(() => {
      bins = bins.map((bin, index) => {
        const newData = generateTrashBinData(bin.id);
        newData.location = bin.location;
        updateBinStatus(index, newData);
        return newData;
      });
      window.sharedData.bins = bins; // Synchronisation
      trucks.forEach(truck => {
        if (truck.active && truck.progress < 100) {
          truck.progress += 10; // Progression simulée
          if (truck.progress >= 100) {
            truck.active = false;
            truck.binsAssigned.forEach(b => {
              const binIndex = bins.findIndex(bin => bin.id === b.id);
              if (binIndex !== -1) {
                bins[binIndex].fillLevel = 0;
                bins[binIndex].status = 'low';
              }
            });
            truck.binsAssigned = [];
          }
        }
      });
      renderOverview();
      renderAlerts();
      renderTrucks();
    }, 10000); // Mise à jour toutes les 10s

  } catch (error) {
    handleError(`Erreur dans admin-web : ${error.message}`);
  }
});
