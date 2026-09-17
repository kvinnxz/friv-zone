/**
 * Cyber Velocity 3D - Procedural 3D Models & Shaders
 * Crea la nave del jugador, obstáculos, ítems coleccionables, pista y ciudad cyberpunk con Three.js.
 */

const Models = {
    // NAVE DEL JUGADOR (AERODESLIZADOR CYBERPUNK)
    createPlayerShip() {
        const ship = new THREE.Group();

        // 1. Chasis central / Fuselaje
        const bodyGeo = new THREE.ConeGeometry(0.8, 3.2, 5);
        bodyGeo.rotateX(Math.PI / 2);
        bodyGeo.scale(1, 0.45, 1);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.2,
            metalness: 0.85,
            flatShading: true
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        ship.add(bodyMesh);

        // 2. Cabina de cristal con emisión de luz de neón
        const cockpitGeo = new THREE.SphereGeometry(0.42, 16, 12);
        cockpitGeo.scale(0.8, 0.5, 1.8);
        const cockpitMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00aacc,
            emissiveIntensity: 0.6,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.85
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.22, 0.2);
        ship.add(cockpit);

        // 3. Alas swept-back laterales
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(1.8, -1.2);
        wingShape.lineTo(1.6, -1.8);
        wingShape.lineTo(0, -1.2);
        wingShape.closePath();

        const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
        wingGeo.rotateX(Math.PI / 2);

        const wingMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.8,
            roughness: 0.3
        });

        // Ala derecha
        const wingRight = new THREE.Mesh(wingGeo, wingMat);
        wingRight.position.set(0.3, 0.05, 0.2);
        ship.add(wingRight);

        // Ala izquierda (espejada)
        const wingLeft = new THREE.Mesh(wingGeo, wingMat);
        wingLeft.scale.set(-1, 1, 1);
        wingLeft.position.set(-0.3, 0.05, 0.2);
        ship.add(wingLeft);

        // Franjas de neón en los bordes alares
        const neonWingMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const wingStripeGeo = new THREE.BoxGeometry(0.08, 0.04, 1.4);
        const stripeR = new THREE.Mesh(wingStripeGeo, neonWingMat);
        stripeR.position.set(1.4, 0.1, -0.9);
        stripeR.rotation.y = 0.5;
        ship.add(stripeR);

        const stripeL = new THREE.Mesh(wingStripeGeo, neonWingMat);
        stripeL.position.set(-1.4, 0.1, -0.9);
        stripeL.rotation.y = -0.5;
        ship.add(stripeL);

        // 4. Cañones bláster frontales
        const cannonGeo = new THREE.CylinderGeometry(0.05, 0.06, 1.2, 8);
        cannonGeo.rotateX(Math.PI / 2);
        const cannonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
        const cannonR = new THREE.Mesh(cannonGeo, cannonMat);
        cannonR.position.set(0.6, 0.05, 0.6);
        ship.add(cannonR);

        const cannonL = new THREE.Mesh(cannonGeo, cannonMat);
        cannonL.position.set(-0.6, 0.05, 0.6);
        ship.add(cannonL);

        // 5. Toberas de propulsión dobles traseras
        const engineGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.6, 12);
        engineGeo.rotateX(Math.PI / 2);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });

        const engineR = new THREE.Mesh(engineGeo, engineMat);
        engineR.position.set(0.4, 0.08, -1.4);
        ship.add(engineR);

        const engineL = new THREE.Mesh(engineGeo, engineMat);
        engineL.position.set(-0.4, 0.08, -1.4);
        ship.add(engineL);

        // Luz de escape de plasma de propulsores
        const thrusterFlameGeo = new THREE.ConeGeometry(0.18, 1.2, 12);
        thrusterFlameGeo.rotateX(-Math.PI / 2);
        const thrusterMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.85
        });

        const flameR = new THREE.Mesh(thrusterFlameGeo, thrusterMat);
        flameR.position.set(0.4, 0.08, -2.1);
        ship.add(flameR);

        const flameL = new THREE.Mesh(thrusterFlameGeo, thrusterMat);
        flameL.position.set(-0.4, 0.08, -2.1);
        ship.add(flameL);

        ship.flames = [flameR, flameL];

        // Luz puntual de hovercraft
        const shipLight = new THREE.PointLight(0x00f3ff, 2, 8);
        shipLight.position.set(0, 0.5, 0);
        ship.add(shipLight);

        // Bounding box para colisiones
        ship.collider = new THREE.Box3();
        return ship;
    },

    // BARRERA LÁSER (OBSTÁCULO DESTRUIBLE/ESQUIVABLE)
    createLaserBarrier(laneX, zPos) {
        const group = new THREE.Group();
        group.position.set(laneX, 0, zPos);
        group.userData = { type: 'barrier', health: 2, maxHealth: 2, scoreValue: 150 };

        // Postes metálicos izquierdo y derecho
        const postGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

        const postL = new THREE.Mesh(postGeo, postMat);
        postL.position.set(-1.8, 1.25, 0);
        group.add(postL);

        const postR = new THREE.Mesh(postGeo, postMat);
        postR.position.set(1.8, 1.25, 0);
        group.add(postR);

        // Haz de energía láser central
        const beamGeo = new THREE.BoxGeometry(3.6, 0.4, 0.1);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 0.85
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 1.2, 0);
        group.add(beam);
        group.beam = beam;

        // Bounding box
        group.collider = new THREE.Box3();
        group.updateCollider = () => {
            group.collider.setFromCenterAndSize(
                new THREE.Vector3(group.position.x, 1.2, group.position.z),
                new THREE.Vector3(3.6, 2.2, 0.6)
            );
        };
        group.updateCollider();

        return group;
    },

    // MINA CYBERPUNK FLOTANTE (GIRA Y PULSA)
    createCyberMine(xPos, zPos) {
        const group = new THREE.Group();
        group.position.set(xPos, 1.2, zPos);
        group.userData = { type: 'mine', health: 1, scoreValue: 100, animOffset: Math.random() * Math.PI * 2 };

        // Núcleo espinoso
        const coreGeo = new THREE.IcosahedronGeometry(0.7, 1);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x3b0764,
            emissive: 0xff007f,
            emissiveIntensity: 0.7,
            roughness: 0.2,
            metalness: 0.8
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        group.core = core;

        // Anillo exterior giratorio
        const ringGeo = new THREE.TorusGeometry(1.1, 0.05, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);
        group.ring = ring;

        group.collider = new THREE.Box3();
        group.updateCollider = () => {
            group.collider.setFromCenterAndSize(group.position, new THREE.Vector3(1.6, 1.6, 1.6));
        };
        group.updateCollider();

        return group;
    },

    // DRONE PATRULLERO ENEMIGO
    createDrone(xPos, zPos) {
        const group = new THREE.Group();
        group.position.set(xPos, 1.5, zPos);
        group.userData = { type: 'drone', health: 3, scoreValue: 300, baseLaneX: xPos, moveTime: Math.random() * 5 };

        // Cuerpo esférico blindado
        const droneBodyGeo = new THREE.SphereGeometry(0.65, 12, 10);
        droneBodyGeo.scale(1.2, 0.6, 1);
        const droneBodyMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
        const body = new THREE.Mesh(droneBodyGeo, droneBodyMat);
        group.add(body);

        // Ojo visor luminoso
        const eyeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16);
        eyeGeo.rotateX(Math.PI / 2);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0, 0.55);
        group.add(eye);

        // Hélices de plasma cuádruples
        const propMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 });
        const propGeo = new THREE.RingGeometry(0.15, 0.35, 12);
        propGeo.rotateX(Math.PI / 2);

        const offsets = [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]];
        offsets.forEach(([ox, oz]) => {
            const p = new THREE.Mesh(propGeo, propMat);
            p.position.set(ox, -0.2, oz);
            group.add(p);
        });

        group.collider = new THREE.Box3();
        group.updateCollider = () => {
            group.collider.setFromCenterAndSize(group.position, new THREE.Vector3(1.8, 1.2, 1.8));
        };
        group.updateCollider();

        return group;
    },

    // CRISTAL DE ENERGÍA (RECOLECTABLE PARA PUNTOS)
    createEnergyCrystal(xPos, zPos) {
        const group = new THREE.Group();
        group.position.set(xPos, 1.1, zPos);
        group.userData = { type: 'crystal', points: 100, isCollectible: true };

        const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
        crystalGeo.scale(0.8, 1.4, 0.8);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00f3ff,
            emissiveIntensity: 0.9,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        group.add(crystal);
        group.crystal = crystal;

        // Halo de luz
        const haloGeo = new THREE.RingGeometry(0.6, 0.75, 16);
        haloGeo.rotateX(Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.y = -0.6;
        group.add(halo);

        group.collider = new THREE.Box3();
        group.updateCollider = () => {
            group.collider.setFromCenterAndSize(group.position, new THREE.Vector3(1.2, 1.8, 1.2));
        };
        group.updateCollider();

        return group;
    },

    // POWER-UP DE ESCUDO
    createShieldPickup(xPos, zPos) {
        const group = new THREE.Group();
        group.position.set(xPos, 1.2, zPos);
        group.userData = { type: 'shield_powerup', shieldVal: 40, isCollectible: true };

        const orbGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const orbMat = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        group.add(orb);
        group.orb = orb;

        // Dos anillos concéntricos
        const ringGeo = new THREE.TorusGeometry(0.7, 0.04, 6, 20);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 4;
        group.add(ring1);
        group.ring1 = ring1;

        group.collider = new THREE.Box3();
        group.updateCollider = () => {
            group.collider.setFromCenterAndSize(group.position, new THREE.Vector3(1.4, 1.4, 1.4));
        };
        group.updateCollider();

        return group;
    },

    // PLATAFORMA DE TURBO PAD (EN EL SUELO)
    createBoostPad(xPos, zPos) {
        const group = new THREE.Group();
        group.position.set(xPos, 0.05, zPos);
        group.userData = { type: 'boost_pad', isBoostPad: true };

        // Placa base
        const plateGeo = new THREE.PlaneGeometry(2.4, 6.0);
        plateGeo.rotateX(-Math.PI / 2);
        const plateMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.4
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        group.add(plate);

        // Flechas holográficas
        for (let i = -2; i <= 2; i += 2) {
            const arrowShape = new THREE.Shape();
            arrowShape.moveTo(0, 0.7);
            arrowShape.lineTo(0.7, 0);
            arrowShape.lineTo(0.35, 0);
            arrowShape.lineTo(0.35, -0.6);
            arrowShape.lineTo(-0.35, -0.6);
            arrowShape.lineTo(-0.35, 0);
            arrowShape.lineTo(-0.7, 0);
            arrowShape.closePath();

            const arrowGeo = new THREE.ShapeGeometry(arrowShape);
            arrowGeo.rotateX(-Math.PI / 2);
            arrowGeo.rotateY(Math.PI); // Apuntando hacia adelante
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.position.set(0, 0.02, i);
            group.add(arrow);
        }

        group.collider = new THREE.Box3();
        group.updateCollider = () => {
            group.collider.setFromCenterAndSize(
                new THREE.Vector3(group.position.x, 0.5, group.position.z),
                new THREE.Vector3(2.4, 1.0, 6.0)
            );
        };
        group.updateCollider();

        return group;
    },

    // SEGMENTO DE PISTA DE AUTOPISTA CYBERPUNK
    createTrackSegment(zPos, length = 120, width = 18) {
        const group = new THREE.Group();
        group.position.z = zPos;

        // Carretera metálica reflectante
        const roadGeo = new THREE.PlaneGeometry(width, length);
        roadGeo.rotateX(-Math.PI / 2);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x050814,
            metalness: 0.85,
            roughness: 0.35
        });
        const road = new THREE.Mesh(roadGeo, roadMat);
        group.add(road);

        // Barandillas laterales con luces de neón cian
        const railGeo = new THREE.BoxGeometry(0.4, 0.6, length);
        const railMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

        const railL = new THREE.Mesh(railGeo, railMat);
        railL.position.set(-width / 2, 0.3, 0);
        group.add(railL);

        const railR = new THREE.Mesh(railGeo, railMat);
        railR.position.set(width / 2, 0.3, 0);
        group.add(railR);

        // Líneas divisoras de carril luminosas (magenta / azul)
        const laneXPositions = [-width / 4, 0, width / 4];
        laneXPositions.forEach(lx => {
            const laneGeo = new THREE.PlaneGeometry(0.15, length);
            laneGeo.rotateX(-Math.PI / 2);
            const laneMat = new THREE.MeshBasicMaterial({
                color: 0x1e1b4b,
                transparent: true,
                opacity: 0.6
            });
            const lane = new THREE.Mesh(laneGeo, laneMat);
            lane.position.set(lx, 0.01, 0);
            group.add(lane);
        });

        // Arco cibernético superior cada segmento
        const arch = this.createCyberArch(width);
        arch.position.set(0, 0, 0);
        group.add(arch);

        return group;
    },

    // ARCO CIBERNÉTICO ILUMINADO
    createCyberArch(trackWidth) {
        const archGroup = new THREE.Group();
        const archW = trackWidth + 2;
        const archH = 9;

        // Columnas laterales
        const pillarGeo = new THREE.BoxGeometry(0.8, archH, 0.8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });

        const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
        pillarL.position.set(-archW / 2, archH / 2, 0);
        archGroup.add(pillarL);

        const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
        pillarR.position.set(archW / 2, archH / 2, 0);
        archGroup.add(pillarR);

        // Viga superior horizontal
        const beamGeo = new THREE.BoxGeometry(archW, 0.8, 0.8);
        const beam = new THREE.Mesh(beamGeo, pillarMat);
        beam.position.set(0, archH, 0);
        archGroup.add(beam);

        // Letrero o neón transversal
        const neonGeo = new THREE.BoxGeometry(archW * 0.9, 0.15, 0.82);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0, archH - 0.4, 0);
        archGroup.add(neon);

        return archGroup;
    },

    // CIUDAD CYBERPUNK (RASCACIELOS DE FONDO)
    createCityScenery() {
        const cityGroup = new THREE.Group();
        const buildingCount = 90;
        const colors = [0x00f3ff, 0xff007f, 0x3b82f6, 0x8b5cf6, 0xffd700];

        for (let i = 0; i < buildingCount; i++) {
            const h = 40 + Math.random() * 140;
            const w = 15 + Math.random() * 25;
            const d = 15 + Math.random() * 25;

            const bGeo = new THREE.BoxGeometry(w, h, d);
            const bMat = new THREE.MeshStandardMaterial({
                color: 0x030712,
                roughness: 0.7,
                metalness: 0.5
            });
            const bMesh = new THREE.Mesh(bGeo, bMat);

            // Posicionar a ambos lados de la pista
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (35 + Math.random() * 120);
            const z = (Math.random() - 0.5) * 800;
            bMesh.position.set(x, h / 2 - 10, z);

            // Ventanas de neón en la cúspide
            const roofLightGeo = new THREE.BoxGeometry(w * 0.95, 2, d * 0.95);
            const randColor = colors[Math.floor(Math.random() * colors.length)];
            const roofLightMat = new THREE.MeshBasicMaterial({ color: randColor });
            const roofLight = new THREE.Mesh(roofLightGeo, roofLightMat);
            roofLight.position.set(0, h / 2 + 1, 0);
            bMesh.add(roofLight);

            cityGroup.add(bMesh);
        }

        return cityGroup;
    }
};

window.Models = Models;
