// --- Componente: Hand Logic (Mani VR) ---
AFRAME.registerComponent('hand-logic', {
  init: function () {
      this.meshFixed = false;
      this.lastInteraction = 0; 
      this.collidables = []; 
  },

  tick: function () {
      // Fix rotazione mani lowPoly
      if (!this.meshFixed) {
          var mesh = this.el.getObject3D('mesh');
          if (mesh) {
              mesh.rotation.x = -0.9;
              this.meshFixed = true;
          }
      }

      this.collidables = document.querySelectorAll('.collidable');
      var handPos = new THREE.Vector3();
      this.el.object3D.getWorldPosition(handPos);

      for (var i = 0; i < this.collidables.length; i++) {
          var target = this.collidables[i];
          var targetPos = new THREE.Vector3();
          target.object3D.getWorldPosition(targetPos);
          var distance = handPos.distanceTo(targetPos);

          if (distance < 0.15) {
              var now = Date.now();
              if (now - this.lastInteraction > 1000) {
                  // Cerca di interagire col componente interactive-object
                  if (target.components['interactive-object']) {
                      target.components['interactive-object'].interact();
                  }
                  
                  this.lastInteraction = now;
                  
                  // Haptic feedback (vibrazione)
                  var handControls = this.el.components['hand-controls'];
                  if (handControls && handControls.controller && handControls.controller.gamepad && handControls.controller.gamepad.hapticActuators) {
                      handControls.controller.gamepad.hapticActuators[0].pulse(1.0, 100);
                  }
              }
          }
      }
  }
});