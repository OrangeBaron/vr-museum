// --- Componente: Interactive Object ---
// Questo componente rende un'entità "cliccabile" sia dal mouse/gaze che dalle mani VR.
// Agisce come un contenitore logico: altri componenti possono sovrascrivere la funzione .interact()
AFRAME.registerComponent('interactive-object', {
  init: function () {
    var el = this.el;

    // 1. Definizione dell'azione di base
    // Questa funzione viene chiamata quando l'utente interagisce.
    // Componenti specifici (es. teleport) sovrascriveranno questa funzione.
    this.interact = function() {
      console.log("Interazione generica rilevata su:", el.id || "oggetto anonimo");
      
      // Feedback visivo di debug (piccolo "bump" della scala)
      var originalScale = el.object3D.scale.clone();
      el.object3D.scale.multiplyScalar(1.1);
      setTimeout(() => {
          if(el.object3D) el.object3D.scale.copy(originalScale);
      }, 100);
    };

    // 2. Listener per Mouse/Gaze Cursor (Desktop/Mobile)
    // Quando il cursore clicca, eseguiamo la funzione interact corrente
    el.addEventListener('click', (evt) => {
        this.interact();
    });

    // 3. Listener per Hover (Opzionale, utile per effetti UI)
    el.addEventListener('mouseenter', () => {
        // Qui potresti aggiungere logica per evidenziare l'oggetto
    });
    
    el.addEventListener('mouseleave', () => {
        // Rimuovi evidenziazione
    });
  }
});

// --- Componente: Billboard ---
// Costringe l'oggetto a guardare sempre verso la camera (utile per testi e UI)
AFRAME.registerComponent('billboard', {
  init: function() {
    this.targetPos = new THREE.Vector3();
    this.camera = null; // Cache per il riferimento alla camera
  },

  tick: function () {
    // Ottimizzazione: Cerca la camera solo se non l'abbiamo già trovata
    if (!this.camera) {
        this.camera = this.el.sceneEl.camera;
        return;
    }

    // Ottieni la posizione aggiornata della camera nel mondo 3D
    this.camera.getWorldPosition(this.targetPos);

    // Ruota l'oggetto per guardare verso la posizione della camera
    this.el.object3D.lookAt(this.targetPos);
  }
});