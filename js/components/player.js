// --- Componente: Hand Logic (Mani VR) ---
AFRAME.registerComponent('hand-logic', {
  init: function () {
      this.meshFixed = false;
      this.lastInteraction = 0; 
      this.collidables = []; 
      
      // OTTIMIZZAZIONE: Aggiorna la lista "cache" degli oggetti collidibili ogni 2 secondi.
      // Questo evita di fare querySelectorAll() 90 volte al secondo nel loop di render.
      this.updateInterval = setInterval(() => {
          this.refreshCollidables();
      }, 2000);
  },

  // Funzione per forzare l'aggiornamento immediato (chiamata dal RoomManager al cambio stanza)
  refreshCollidables: function() {
      // Seleziona solo gli elementi visibili e attivi che hanno la classe .collidable
      this.collidables = Array.from(document.querySelectorAll('.collidable')).filter(el => el.object3D && el.object3D.visible);
  },

  remove: function() {
      if (this.updateInterval) clearInterval(this.updateInterval);
  },

  tick: function () {
      // Fix rotazione mani lowPoly di A-Frame (spesso sono ruotate male di default)
      if (!this.meshFixed) {
          var mesh = this.el.getObject3D('mesh');
          if (mesh) {
              mesh.rotation.x = -0.9; // Aggiusta l'angolazione del polso
              this.meshFixed = true;
          }
      }

      // Se non ci sono oggetti interattivi nella stanza, non calcolare nulla
      if (this.collidables.length === 0) return;

      var handPos = new THREE.Vector3();
      this.el.object3D.getWorldPosition(handPos);

      // Loop ottimizzato su array cachato
      for (var i = 0; i < this.collidables.length; i++) {
          var target = this.collidables[i];
          
          // Controllo di sicurezza se l'oggetto esiste ancora nella scena
          if (!target.object3D) continue;

          var targetPos = new THREE.Vector3();
          target.object3D.getWorldPosition(targetPos);
          
          // Distanza Euclidea
          var distance = handPos.distanceTo(targetPos);

          // SOGLIA DI INTERAZIONE: Aumentata a 0.25 (25cm) per facilitare la presa in VR
          if (distance < 0.25) {
              var now = Date.now();
              // Debounce: evita di attivare l'evento 100 volte al secondo mentre la mano è dentro l'oggetto
              if (now - this.lastInteraction > 1000) {
                  
                  // Cerca di interagire col componente interactive-object
                  if (target.components['interactive-object']) {
                      target.components['interactive-object'].interact();
                  }
                  
                  this.lastInteraction = now;
                  
                  // Haptic feedback (Vibrazione controller)
                  var handControls = this.el.components['hand-controls'];
                  // Uso dell'optional chaining (?.) per sicurezza se il gamepad non è presente
                  var actuator = handControls?.controller?.gamepad?.hapticActuators?.[0];
                  
                  if(actuator) {
                      // Vibrazione: intensità 0.6 (più morbida), durata 50ms
                      actuator.pulse(0.6, 50);
                  }
              }
          }
      }
  }
});