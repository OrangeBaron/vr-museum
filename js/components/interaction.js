// --- Componente: Interactive Object ---
AFRAME.registerComponent('interactive-object', {
  init: function () {
    var el = this.el;
    this.interact = function() {
      console.log("Oggetto interagito: ", el.id || "anonimo");
    };
    el.addEventListener('click', this.interact);
  }
});

// --- Componente: Billboard (Guarda sempre la camera) ---
AFRAME.registerComponent('billboard', {
  init: function() {
    this.targetPos = new THREE.Vector3();
  },

  tick: function () {
    var camera = this.el.sceneEl.camera;
    if (!camera) return;

    camera.getWorldPosition(this.targetPos);
    this.el.object3D.lookAt(this.targetPos);
  }
});