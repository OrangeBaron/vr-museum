// Importazione dei componenti (i side-effects registrano i componenti in AFRAME)
import './components/interaction.js';
import './components/info-system.js';
import './components/navigation.js';
import './components/player.js';

// Importazione del gestore stanze
import { RoomManager } from './room-manager.js';

document.addEventListener('DOMContentLoaded', function() {
  console.log("App inizializzata. Avvio sistema VR...");
  
  if (!RoomManager) {
    console.error("ERRORE CRITICO: RoomManager non caricato correttamente.");
    return;
  }

  // --- FEATURE AGGIUNTA: Deep Linking ---
  // Permette di caricare una stanza specifica via URL (utile per debug/test)
  // Esempio: index.html?room=hospital
  const urlParams = new URLSearchParams(window.location.search);
  const startRoom = urlParams.get('room') || 'church'; // Default: 'church'

  // Avvia il caricamento della prima stanza
  RoomManager.loadRoom(startRoom);
});