// --- Componente: Teleport Waypoint ---
AFRAME.registerComponent('teleport-waypoint', {
  schema: {
    destination: {type: 'vec3', default: {x: 0, y: 1.6, z: 0}}, 
    rotation: {type: 'number', default: 0},
    targetRoom: {type: 'string', default: ''}
  },

  init: function () {
    var el = this.el;
    var data = this.data;
    var rig = document.querySelector('#rig');

    this.action = function() {
      // Se c'è una stanza target, caricala passando anche destinazione e rotazione
      if (data.targetRoom && data.targetRoom !== "") {
        console.log("Cambio stanza:", data.targetRoom);
        if (window.RoomManager) {
          window.RoomManager.loadRoom(data.targetRoom, data.destination, data.rotation);
        }
      } else {
        // Teletrasporto normale nella stessa stanza
        rig.setAttribute('position', data.destination);
        var currentRot = rig.getAttribute('rotation');
        rig.setAttribute('rotation', {x: currentRot.x, y: data.rotation, z: currentRot.z});
      }
    };

    el.addEventListener('click', this.action);

    // Supporto Hand-Tracking
    if (!el.components['interactive-object']) {
      el.setAttribute('interactive-object', '');
    }
    el.components['interactive-object'].interact = this.action;
  }
});

// --- Componente: Waypoint Spot (Generatore Grafico) ---
AFRAME.registerComponent('waypoint-spot', {
    schema: {
        destination: {type: 'vec3', default: {x: 0, y: 1.6, z: 0}}, 
        rotation: {type: 'number', default: 0}, 
        label: {type: 'string', default: 'VAI QUI'}, 
        color: {type: 'color', default: 'green'},
        targetRoom: {type: 'string', default: ''}
    },

    init: function() {
        var el = this.el;
        var data = this.data;

        var cone = document.createElement('a-cone');
        cone.setAttribute('radius-bottom', '0');
        cone.setAttribute('radius-top', '0.25');
        cone.setAttribute('height', '0.8');
        cone.setAttribute('color', data.color);
        cone.setAttribute('class', 'collidable'); 
        
        cone.setAttribute('teleport-waypoint', {
            destination: data.destination,
            rotation: data.rotation,
            targetRoom: data.targetRoom
        });

        var label = document.createElement('a-text');
        label.setAttribute('value', data.label);
        label.setAttribute('align', 'center');
        label.setAttribute('position', '0 0.6 0');
        label.setAttribute('scale', '0.5 0.5 0.5');
        label.setAttribute('side', 'double');
        label.setAttribute('billboard', '');

        cone.appendChild(label);
        el.appendChild(cone);
    }
});

// --- Componente: Limit to Navmesh ---
AFRAME.registerComponent('limit-to-navmesh', {
  schema: {
    ground: {type: 'string', default: '.nav-floor'}
  },

  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0); 
    this.raycaster.far = 2.0; 
    
    this.lastPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    
    // Impostiamo la posizione iniziale
    this.el.object3D.getWorldPosition(this.lastPosition);
  },

  tick: function () {
    var el = this.el;
    
    el.object3D.getWorldPosition(this.currentPosition);

    this.raycaster.ray.origin.copy(this.currentPosition);
    this.raycaster.ray.origin.y += 0.5;

    // Cerca i pavimenti
    var grounds = document.querySelectorAll(this.data.ground);
    var objects = [];
    grounds.forEach(function(g) {
      if (g.object3D) objects.push(g.object3D);
    });

    // Se la stanza non è ancora caricata (nessun pavimento), non fare nulla
    if (objects.length === 0) return;

    var intersections = this.raycaster.intersectObjects(objects, true);

    if (intersections.length > 0) {
      // Sono sul pavimento -> Salva posizione sicura
      this.lastPosition.copy(this.currentPosition);
    } else {
      // Sono fuori -> Torna all'ultima posizione sicura
      el.object3D.position.x = this.lastPosition.x;
      el.object3D.position.z = this.lastPosition.z;
    }
  }
});