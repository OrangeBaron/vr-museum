// --- Componente: Info Panel Logic (Comportamento) ---
AFRAME.registerComponent('info-panel-logic', {
    init: function () {
        this.camera = document.querySelector('[camera]');
        this.textGroup = this.el.querySelector('.info-text-group');
        this.sphere = this.el.querySelector('.info-sphere');

        this.cameraWorldPos = new THREE.Vector3();
        this.infoWorldPos = new THREE.Vector3();

        if (this.textGroup) this.textGroup.object3D.scale.set(0, 0, 0);
        if (this.sphere) this.sphere.object3D.scale.set(1, 1, 1);
    },

    tick: function () {
        if (!this.camera || !this.textGroup || !this.sphere) return;

        this.camera.object3D.getWorldPosition(this.cameraWorldPos);
        
        this.textGroup.object3D.lookAt(this.cameraWorldPos);

        this.el.object3D.getWorldPosition(this.infoWorldPos);

        var dist = this.infoWorldPos.distanceTo(this.cameraWorldPos);
        var triggerDistance = 1.5;

        // Logica di comparsa/scomparsa
        var targetScaleText = (dist < triggerDistance) ? 1 : 0;
        var targetScaleSphere = (dist < triggerDistance) ? 0 : 1;
        
        var speed = 0.1;

        this.textGroup.object3D.scale.lerp(new THREE.Vector3(targetScaleText, targetScaleText, targetScaleText), speed);
        this.sphere.object3D.scale.lerp(new THREE.Vector3(targetScaleSphere, targetScaleSphere, targetScaleSphere), speed);
    }
});

// --- Componente: Info Spot (Generatore DOM) ---
AFRAME.registerComponent('info-spot', {
    schema: {
        text: {type: 'string', default: 'Descrizione mancante'},
        sphereColor: {type: 'color', default: '#007bff'}
    },

    init: function() {
        var el = this.el;
        var data = this.data;

        // 1. Creiamo la Sfera (Trigger)
        var sphere = document.createElement('a-sphere');
        sphere.setAttribute('radius', '0.15');
        sphere.setAttribute('color', data.sphereColor);
        sphere.setAttribute('class', 'collidable info-sphere');
        sphere.setAttribute('interactive-object', '');
        
        // Animazione della sfera
        sphere.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            loop: true,
            dur: 4000,
            easing: 'linear'
        });

        // Testo "i" sulla sfera
        var iTextFront = document.createElement('a-text');
        iTextFront.setAttribute('value', 'i');
        iTextFront.setAttribute('align', 'center');
        iTextFront.setAttribute('position', '0 0 0.151');
        iTextFront.setAttribute('width', '4');
        
        var iTextBack = document.createElement('a-text');
        iTextBack.setAttribute('value', 'i');
        iTextBack.setAttribute('align', 'center');
        iTextBack.setAttribute('position', '0 0 -0.151');
        iTextBack.setAttribute('rotation', '0 180 0');
        iTextBack.setAttribute('width', '4');

        sphere.appendChild(iTextFront);
        sphere.appendChild(iTextBack);

        // 2. Creiamo il Gruppo Testo (Pannello)
        var textGroup = document.createElement('a-entity');
        textGroup.setAttribute('class', 'info-text-group');
        textGroup.setAttribute('scale', '0 0 0');

        var bgPlane = document.createElement('a-plane');
        bgPlane.setAttribute('color', 'black');
        bgPlane.setAttribute('opacity', '0.8');
        bgPlane.setAttribute('width', '1.5');
        bgPlane.setAttribute('height', '0.8'); 

        var descText = document.createElement('a-text');
        descText.setAttribute('value', data.text);
        descText.setAttribute('align', 'center');
        descText.setAttribute('width', '1.3');
        descText.setAttribute('position', '0 0 0.01');
        descText.setAttribute('wrap-count', '30');

        textGroup.appendChild(bgPlane);
        textGroup.appendChild(descText);

        el.appendChild(sphere);
        el.appendChild(textGroup);

        el.setAttribute('info-panel-logic', '');
    }
});