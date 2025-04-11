// admin-web.js

document.addEventListener('DOMContentLoaded', () => {
    try {
      // Générer 10 poubelles simulées
      let bins = generateTrashBins(10);
  
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
                <button class="btn btn-sm btn-success" onclick="simulateCollection('${index}')">Collecter</button>
              </div>
            </div>
          `;
          container.appendChild(binCard);
        });
      }
  
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
  
      // Exporter un rapport
      document.getElementById('export-report').addEventListener('click', () => {
        const stats = generateStats(bins);
        const report = `
          Rapport ÉcoVille - ${new Date().toLocaleString()}
          Total Poubelles: ${stats.totalBins}
          Poubelles pleines: ${stats.fullBins}
          Carburant économisé: ${stats.fuelSaved}%
          Taux de recyclage: ${stats.recyclingRate}%
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
  
      // Simulation en temps réel
      setInterval(() => {
        bins = bins.map((bin, index) => {
          const newData = generateTrashBinData(bin.id);
          newData.location = bin.location; // Conserver la localisation
          updateBinStatus(index, newData);
          return newData;
        });
        renderOverview();
        renderAlerts();
      }, 10000); // Mise à jour toutes les 10s
  
    } catch (error) {
      handleError(`Erreur lors de l’initialisation admin : ${error.message}`);
    }
  });