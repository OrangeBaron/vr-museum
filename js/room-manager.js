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

        // Pausa il controllo navmesh mentre carichiamo per evitare cadute
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

                // Funzione da eseguire quando la stanza è PRONTA
                const onRoomReady = () => {
                    console.log("Stanza pronta. Riattivazione sistemi.");

                    // Riattiva il NavMesh
                    if (navMeshComponent) {
                        // FORZIAMO la lastPosition alla destinazione di spawn.
                        // Questo è cruciale: ignora qualsiasi "drift" fisico avvenuto durante il caricamento.
                        navMeshComponent.lastPosition.set(startPos.x, startPos.y, startPos.z);
                        navMeshComponent.play(); 
                        console.log("Navmesh riattivato.");
                    }

                    // Aggiorna gli oggetti interagibili per il player
                    const handLogics = document.querySelectorAll('[hand-logic]');
                    handLogics.forEach(el => {
                       if(el.components['hand-logic'].refreshCollidables) {
                           el.components['hand-logic'].refreshCollidables();
                       }
                    });

                    // Nascondi il loader solo ora che tutto è visibile e solido
                    if (loader) loader.classList.add('fade-out');
                };

                // 4. Rilevamento caricamento Modello 3D
                // Cerchiamo se c'è un modello GLTF nella stanza appena iniettata
                const newModel = container.querySelector('[gltf-model]');

                if (newModel) {
                    // Se c'è un modello, aspettiamo che sia caricato completamente
                    newModel.addEventListener('model-loaded', onRoomReady);
                    
                    // Fallback di sicurezza: se per qualche motivo l'evento non parte entro 10 secondi, sblocca comunque
                    setTimeout(() => {
                        if (!loader.classList.contains('fade-out')) {
                            console.warn("Timeout caricamento modello scaduto, forzo apertura.");
                            onRoomReady();
                        }
                    }, 10000);
                } else {
                    // Se la stanza non ha modelli 3D (es. è solo UI o skybox), è subito pronta
                    onRoomReady();
                }
            })
            .catch(err => {
                console.error("Errore caricamento stanza:", err);
                if(loader) loader.classList.add('fade-out'); // Nascondi comunque in caso di errore critico
                
                // Riattiva navmesh per non lasciare il player bloccato, anche se c'è errore
                if (navMeshComponent) navMeshComponent.play();
            });
    }
};

window.RoomManager = RoomManager; //