import './components/interaction.js';
import './components/info-system.js';
import './components/navigation.js';
import './components/player.js';
import { RoomManager } from './room-manager.js';

document.addEventListener('DOMContentLoaded', function() {
  console.log("App inizializzata.");
  
  if (RoomManager) {
    RoomManager.loadRoom('church');
  } else {
    console.error("ERRORE: RoomManager non trovato.");
  }
});