export const RoomManager = {
    // 1. Aggiungi dest e rot come argomenti con valori di default
    loadRoom: function(roomName, destination, rotation) {
        console.log(`Caricamento stanza: ${roomName}`);
        
        const startPos = destination || { x: 0, y: 0.01, z: 0 };
        const startRot = rotation || 0;

        const container = document.getElementById('room-container');
        const rig = document.getElementById('rig');
        const navMeshComponent = rig.components['limit-to-navmesh'];

        if (navMeshComponent) {
            navMeshComponent.pause(); 
        }

        container.innerHTML = '';

        fetch(`rooms/${roomName}.html`)
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;

                // 2. USA I PARAMETRI PASSATI
                rig.object3D.position.set(startPos.x, startPos.y, startPos.z);
                rig.setAttribute('rotation', {x: 0, y: startRot, z: 0});

                // 3. RESETTA LA TELECAMERA
                const camera = rig.querySelector('[camera]');
                if (camera && camera.components['look-controls']) {
                    camera.components['look-controls'].yawObject.rotation.y = 0;
                    camera.components['look-controls'].pitchObject.rotation.x = 0;
                }

                // 4. AGGIORNA IL NAVMESH CON LA POSIZIONE CORRETTA
                if (navMeshComponent) {
                    navMeshComponent.lastPosition.set(startPos.x, startPos.y, startPos.z);
                }

                setTimeout(() => {
                    if (navMeshComponent) {
                        // Reset finale di sicurezza sulla posizione effettiva
                        navMeshComponent.lastPosition.copy(rig.object3D.position);
                        navMeshComponent.play(); 
                        console.log("Navmesh riattivato.");
                    }
                }, 200);
            })
            .catch(err => console.error(err));
    }
};

window.RoomManager = RoomManager;