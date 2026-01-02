// --- Componente: Teleport Waypoint ---
// Gestisce il teletrasporto (sia locale che cambio stanza)
AFRAME.registerComponent('teleport-waypoint', {
  schema: {
    destination: {type: 'vec3', default: {x: 0, y: 1.6, z: 0}}, 
    rotation: {type: 'number', default: 0},
    targetRoom: {type: 'string', default: ''} // Se vuoto, è un teleport locale
  },

  init: function () {
    var el = this.el;
    var data = this.data;
    var rig = document.querySelector('#rig');

    this.action = function() {
      // Caso 1: Cambio Stanza
      if (data.targetRoom && data.targetRoom !== "") {
        console.log("Navigazione -> Cambio stanza:", data.targetRoom);
        if (window.RoomManager) {
          window.RoomManager.loadRoom(data.targetRoom, data.destination, data.rotation);
        } else {
            console.error("RoomManager non trovato!");
        }
      } 
      // Caso 2: Teletrasporto Locale (nella stessa stanza)
      else {
        console.log("Navigazione -> Teleport locale");
        
        // Sposta il rig
        rig.setAttribute('position', data.destination);
        
        // Mantiene l'inclinazione corrente (X/Z) ma ruota la vista (Y)
        var currentRot = rig.getAttribute('rotation');
        rig.setAttribute('rotation', {x: currentRot.x, y: data.rotation, z: currentRot.z});
        
        // Aggiorna la sicurezza del NavMesh per evitare che ci riporti indietro
        if(rig.components['limit-to-navmesh']) {
            rig.components['limit-to-navmesh'].lastPosition.copy(data.destination);
        }
      }
    };

    // Attiva l'azione al click (mouse/gaze)
    el.addEventListener('click', this.action);

    // Integrazione con il sistema di mani VR (interactive-object)
    if (!el.components['interactive-object']) {
      el.setAttribute('interactive-object', '');
    }
    // Sovrascrive la funzione interact generica con la nostra azione di navigazione
    el.components['interactive-object'].interact = this.action;
  }
});

// --- Componente: Waypoint Spot (Generatore Grafico) ---
// Crea visivamente il cono verde e l'etichetta per i punti di navigazione
AFRAME.registerComponent('waypoint-spot', {
    schema: {
        destination: {type: 'vec3', default: {x: 0, y: 1.6, z: 0}}, 
        rotation: {type: 'number', default: 0}, 
        label: {type: 'string', default: 'VAI QUI'}, 
        color: {type: 'color', default: '#28a745'}, // Verde standard più gradevole
        targetRoom: {type: 'string', default: ''}
    },

    init: function() {
        var el = this.el;
        var data = this.data;

        // Cono base (il "pulsante" a terra)
        var cone = document.createElement('a-cone');
        cone.setAttribute('radius-bottom', '0.05'); // Leggermente più largo alla base
        cone.setAttribute('radius-top', '0.25');
        cone.setAttribute('height', '0.5'); // Più basso per non ingombrare la visuale
        cone.setAttribute('color', data.color);
        cone.setAttribute('class', 'collidable'); // Importante per il raycaster e le mani
        cone.setAttribute('opacity', '0.8');
        
        // Assegna la logica di teletrasporto al cono
        cone.setAttribute('teleport-waypoint', {
            destination: data.destination,
            rotation: data.rotation,
            targetRoom: data.targetRoom
        });

        // Etichetta flottante
        var label = document.createElement('a-text');
        label.setAttribute('value', data.label);
        label.setAttribute('align', 'center');
        label.setAttribute('position', '0 0.8 0');
        label.setAttribute('scale', '0.8 0.8 0.8');
        label.setAttribute('side', 'double');
        label.setAttribute('color', '#FFF');
        
        // Fa in modo che l'etichetta guardi sempre il giocatore (Billboard)
        // Nota: Assicurati di avere il componente 'billboard' definito in interaction.js
        label.setAttribute('billboard', '');

        el.appendChild(cone);
        el.appendChild(label);
    }
});

// --- Componente: Limit to Navmesh ---
// Impedisce al giocatore di camminare fuori dalle aree designate (.nav-floor)
AFRAME.registerComponent('limit-to-navmesh', {
  schema: {
    ground: {type: 'string', default: '.nav-floor'}
  },

  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0); // Raggio verso il basso
    this.raycaster.far = 2.0; // Lunghezza raggio
    
    this.lastPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    
    // Salva la posizione iniziale come prima posizione sicura
    this.el.object3D.getWorldPosition(this.lastPosition);
  },

  tick: function () {
    var el = this.el;
    
    // Safety check: se il gioco è in pausa o stiamo caricando, non fare nulla
    if (this.el.isPlaying === false) return;

    el.object3D.getWorldPosition(this.currentPosition);

    // Imposta l'origine del raggio leggermente sopra i piedi del giocatore
    this.raycaster.ray.origin.copy(this.currentPosition);
    this.raycaster.ray.origin.y += 0.5;

    // Trova tutti gli oggetti pavimento
    var grounds = document.querySelectorAll(this.data.ground);
    var objects = [];
    grounds.forEach(function(g) {
      if (g.object3D && g.object3D.visible) objects.push(g.object3D);
    });

    // Se non ci sono pavimenti (es. glitch caricamento), fermati per evitare reset al punto 0
    if (objects.length === 0) return;

    // Controlla intersezioni
    var intersections = this.raycaster.intersectObjects(objects, true);

    if (intersections.length > 0) {
      // CASO 1: Siamo sul pavimento -> Posizione valida
      // Aggiorniamo l'ultima posizione sicura
      this.lastPosition.copy(this.currentPosition);
    } else {
      // CASO 2: Siamo fuori dal pavimento (nel vuoto)
      // Dobbiamo riportare il giocatore indietro all'ultima posizione sicura.
      
      // Controllo anti-glitch:
      // Se la distanza è piccola (< 1.5m), è probabile che il giocatore abbia camminato fuori. Lo resettiamo.
      // Se la distanza è enorme (> 1.5m), forse è stato teletrasportato via script in un punto senza navmesh momentaneo. 
      // In quel caso NON resettiamo per non bloccarlo.
      
      if (this.currentPosition.distanceTo(this.lastPosition) < 1.5) {
          el.object3D.position.x = this.lastPosition.x;
          el.object3D.position.z = this.lastPosition.z;
          // Non tocchiamo la Y per evitare saltelli strani
      } else {
          // Accettiamo la nuova posizione come "nuova verità" (es. dopo un teleport forzato)
          this.lastPosition.copy(this.currentPosition);
      }
    }
  }
});