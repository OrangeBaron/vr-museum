// --- Componente: Info Panel Logic (Comportamento) ---
AFRAME.registerComponent('info-panel-logic', {
    init: function () {
        this.camera = document.querySelector('[camera]');
        this.textGroup = this.el.querySelector('.info-text-group');
        this.sphere = this.el.querySelector('.info-sphere');

        this.cameraWorldPos = new THREE.Vector3();
        this.infoWorldPos = new THREE.Vector3();

        // Stato interno per gestire l'isteresi
        this.isPanelVisible = false;

        // Setup iniziale scale
        if (this.textGroup) this.textGroup.object3D.scale.set(0, 0, 0);
        if (this.sphere) this.sphere.object3D.scale.set(1, 1, 1);
    },

    tick: function (time, timeDelta) {
        if (!this.camera || !this.textGroup || !this.sphere) return;

        // Aggiorna posizioni mondo
        this.camera.object3D.getWorldPosition(this.cameraWorldPos);
        this.el.object3D.getWorldPosition(this.infoWorldPos);

        // Calcola distanza (ignorando l'altezza per un'attivazione più naturale, opzionale)
        var dist = this.infoWorldPos.distanceTo(this.cameraWorldPos);
        
        // --- LOGICA ISTERESI (Anti-Flicker) ---
        // Attiva a 1.5m, Disattiva solo se ci si allontana a più di 2.0m
        if (!this.isPanelVisible && dist < 1.5) {
            this.isPanelVisible = true;
        } else if (this.isPanelVisible && dist > 2.0) {
            this.isPanelVisible = false;
        }

        // Definisci i target di scala in base allo stato
        var targetScaleText = this.isPanelVisible ? 1 : 0;
        var targetScaleSphere = this.isPanelVisible ? 0 : 1;
        
        // Velocità di animazione (Lerp factor)
        // Usiamo timeDelta per renderlo indipendente dal framerate (circa 60fps -> 16ms)
        var lerpFactor = 0.1; // Valore empirico per fluidità

        // Applica l'animazione fluida (Lerp)
        var currentTextScale = this.textGroup.object3D.scale.x;
        var currentSphereScale = this.sphere.object3D.scale.x;

        // Interpola verso il target
        var newTextScale = THREE.MathUtils.lerp(currentTextScale, targetScaleText, lerpFactor);
        var newSphereScale = THREE.MathUtils.lerp(currentSphereScale, targetScaleSphere, lerpFactor);

        this.textGroup.object3D.scale.setScalar(newTextScale);
        this.sphere.object3D.scale.setScalar(newSphereScale);

        // --- OTTIMIZZAZIONE LOOK-AT ---
        // Ruota il testo verso il giocatore SOLO se è visibile (o si sta aprendo)
        // Risparmia calcoli CPU quando i pannelli sono chiusi
        if (newTextScale > 0.01) {
            this.textGroup.object3D.lookAt(this.cameraWorldPos);
        }
    }
});

// --- Componente: Info Spot (Generatore DOM) ---
AFRAME.registerComponent('info-spot', {
    schema: {
        text: {type: 'string', default: 'Descrizione mancante'},
        sphereColor: {type: 'color', default: '#007bff'} // Blu default
    },

    init: function() {
        var el = this.el;
        var data = this.data;

        // 1. Creiamo la Sfera (Trigger)
        var sphere = document.createElement('a-sphere');
        sphere.setAttribute('radius', '0.15');
        sphere.setAttribute('color', data.sphereColor);
        sphere.setAttribute('class', 'collidable info-sphere');
        
        // Colleghiamo l'interactive-object per feedback tattile/click
        sphere.setAttribute('interactive-object', '');
        
        // Animazione della sfera (rotazione continua per attirare l'attenzione)
        sphere.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            loop: true,
            dur: 4000,
            easing: 'linear'
        });

        // Testo "i" sulla sfera (Fronte e Retro)
        this.createIconText(sphere, 0.151, 0);       // Fronte
        this.createIconText(sphere, -0.151, 180);    // Retro

        // 2. Creiamo il Gruppo Testo (Pannello informativo)
        var textGroup = document.createElement('a-entity');
        textGroup.setAttribute('class', 'info-text-group');
        textGroup.setAttribute('scale', '0 0 0'); // Parte nascosto

        // Sfondo nero semitrasparente per leggibilità
        var bgPlane = document.createElement('a-plane');
        bgPlane.setAttribute('color', '#111'); // Grigio molto scuro
        bgPlane.setAttribute('opacity', '0.85');
        bgPlane.setAttribute('width', '1.6');
        bgPlane.setAttribute('height', '0.9'); 
        bgPlane.setAttribute('class', 'collidable'); // Cliccabile per evitare click through

        // Testo descrittivo
        var descText = document.createElement('a-text');
        descText.setAttribute('value', data.text);
        descText.setAttribute('align', 'center');
        descText.setAttribute('width', '1.4'); // Margini interni
        descText.setAttribute('position', '0 0 0.02'); // Leggermente staccato dal piano per evitare Z-fighting
        descText.setAttribute('wrap-count', '32'); // Controlla la dimensione del font
        descText.setAttribute('color', '#FFF');

        textGroup.appendChild(bgPlane);
        textGroup.appendChild(descText);

        el.appendChild(sphere);
        el.appendChild(textGroup);

        // Attiva la logica di controllo
        el.setAttribute('info-panel-logic', '');
    },

    // Helper per creare la "i" sulla sfera
    createIconText: function(parent, zPos, yRot) {
        var txt = document.createElement('a-text');
        txt.setAttribute('value', 'i');
        txt.setAttribute('align', 'center');
        txt.setAttribute('font', 'roboto'); // Font più pulito se disponibile, o standard
        txt.setAttribute('position', `0 0 ${zPos}`);
        txt.setAttribute('rotation', `0 ${yRot} 0`);
        txt.setAttribute('width', '4');
        txt.setAttribute('color', 'white');
        parent.appendChild(txt);
    }
});