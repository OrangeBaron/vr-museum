export const RoomManager = {
    loadRoom: function(roomName, destination, rotation) {
        console.log(`Caricamento stanza: ${roomName}`);
        
        // 1. Gestione Loading Screen
        const loader = document.getElementById('loading-screen');
        if(loader) loader.classList.remove('fade-out');

        const startPos = destination || { x: 0, y: 0.01, z: 0 };
        const startRot = rotation || 0;

        const container = document.getElementById('room-container');
        const rig = document.getElementById('rig');
        const navMeshComponent = rig.components['limit-to-navmesh'];

        // Pausa il controllo navmesh mentre carichiamo
        if (navMeshComponent) {
            navMeshComponent.pause(); 
        }

        // Pulisce la stanza precedente
        container.innerHTML = '';

        fetch(`rooms/${roomName}.html`)
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;

                // 2. Posizionamento Player
                rig.object3D.position.set(startPos.x, startPos.y, startPos.z);
                rig.setAttribute('rotation', {x: 0, y: startRot, z: 0});

                // 3. Reset Camera
                const camera = rig.querySelector('[camera]');
                if (camera && camera.components['look-controls']) {
                    camera.components['look-controls'].yawObject.rotation.y = 0;
                    camera.components['look-controls'].pitchObject.rotation.x = 0;
                }

                // 4. Aggiorna NavMesh safe position
                if (navMeshComponent) {
                    navMeshComponent.lastPosition.set(startPos.x, startPos.y, startPos.z);
                }

                // Attendi un attimo che il DOM si stabilizzi
                setTimeout(() => {
                    // Riattiva il NavMesh
                    if (navMeshComponent) {
                        navMeshComponent.lastPosition.copy(rig.object3D.position);
                        navMeshComponent.play(); 
                        console.log("Navmesh riattivato.");
                    }

                    // Aggiorna gli oggetti interagibili per il player (nuova funzione aggiunta in player.js)
                    const handLogics = document.querySelectorAll('[hand-logic]');
                    handLogics.forEach(el => {
                       if(el.components['hand-logic'].refreshCollidables) {
                           el.components['hand-logic'].refreshCollidables();
                       }
                    });

                    // Nascondi il loader
                    if (loader) loader.classList.add('fade-out');

                }, 500); // Mezzo secondo di sicurezza
            })
            .catch(err => {
                console.error(err);
                if(loader) loader.classList.add('fade-out'); // Nascondi comunque in caso di errore
            });
    }
};

window.RoomManager = RoomManager;
