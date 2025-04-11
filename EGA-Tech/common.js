// common.js

// Gestion des erreurs globales
function handleError(message) {
  console.error(`Erreur: ${message}`);
  alert(`Une erreur est survenue : ${message}`);
}

// Générateur de données simulées pour poubelles
function generateTrashBinData(id) {
  try {
    const fillLevel = Math.floor(Math.random() * 100); // Niveau de remplissage aléatoire (0-100%)
    const status = fillLevel > 80 ? 'full' : fillLevel > 50 ? 'half' : 'low';
    const temperature = 20 + Math.random() * 20; // Température entre 20 et 40°C
    const hasGas = Math.random() > 0.95; // 5% de chance d’odeur suspecte
    return {
      id: id || `bin-${Math.random().toString(36).substr(2, 5)}`,
      fillLevel,
      status,
      temperature: temperature.toFixed(1),
      hasGas,
      location: `Rue ${Math.floor(Math.random() * 100)}`,
    };
  } catch (error) {
    handleError("Échec de la génération des données de poubelle");
    return null;
  }
}

// Générer une liste de poubelles
function generateTrashBins(count) {
  const bins = [];
  for (let i = 0; i < count; i++) {
    bins.push(generateTrashBinData(i));
  }
  return bins;
}

// Afficher une notification (simulée avec alert Bootstrap)
function showNotification(message, type = 'success') {
  try {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `alert alert-${type} alert-custom`;
    notificationDiv.textContent = message;
    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 3000); // Disparition après 3s
  } catch (error) {
    handleError("Échec de l’affichage de la notification");
  }
}

// Mettre à jour le statut d’une poubelle dans le DOM
function updateBinStatus(binId, binData) {
  try {
    const binElement = document.getElementById(`bin-${binId}`);
    if (!binElement) throw new Error(`Poubelle #${binId} non trouvée dans le DOM`);
    binElement.querySelector('.fill-level').textContent = `${binData.fillLevel}%`;
    binElement.classList.remove('status-full', 'status-half', 'status-low');
    binElement.classList.add(`status-${binData.status}`);
    if (binData.hasGas) {
      showNotification(`Odeur suspecte détectée à ${binData.location}`, 'danger');
    }
  } catch (error) {
    handleError(error.message);
  }
}

// Simuler une collecte
function simulateCollection(binId) {
  try {
    const binData = generateTrashBinData(binId);
    binData.fillLevel = 0; // Après collecte
    binData.status = 'low';
    updateBinStatus(binId, binData);
    showNotification(`Poubelle #${binId} collectée avec succès !`, 'success');
  } catch (error) {
    handleError("Échec de la simulation de collecte");
  }
}

// Générer des statistiques globales
function generateStats(bins) {
  try {
    const totalBins = bins.length;
    const fullBins = bins.filter(bin => bin.fillLevel > 80).length;
    const fuelSaved = Math.floor(Math.random() * 40); // Économie carburant simulée
    return {
      totalBins,
      fullBins,
      fuelSaved,
      recyclingRate: Math.floor(Math.random() * 100), // Taux de recyclage fictif
    };
  } catch (error) {
    handleError("Échec de la génération des statistiques");
    return {};
  }
}

// Stockage partagé des poubelles et camions
window.sharedData = {
  bins: generateTrashBins(10), // 10 poubelles initiales partagées
  trucks: [
    { id: 1, active: false, binsAssigned: [], progress: 0 },
    { id: 2, active: false, binsAssigned: [], progress: 0 }
  ]
};

// Exemple d’initialisation automatique (optionnel)
document.addEventListener('DOMContentLoaded', () => {
  console.log('Common.js chargé avec succès');
});
