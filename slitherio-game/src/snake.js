// Clase Snake con cinemática de segmentos, skins, turbo y detección de colisiones

export const SKINS = [
    {
        id: 'neon-cyber',
        name: 'Cyber Neon',
        colors: ['#00f2fe', '#4facfe', '#00f2fe', '#00c6ff'],
        glow: '#00f2fe',
        eyeColor: '#ffffff',
        pupilColor: '#001a33'
    },
    {
        id: 'cosmic-void',
        name: 'Cosmic Void',
        colors: ['#b92b27', '#1565c0', '#7b1fa2', '#e040fb'],
        glow: '#b92b27',
        eyeColor: '#ffffff',
        pupilColor: '#2b0938'
    },
    {
        id: 'inferno-fire',
        name: 'Inferno Fire',
        colors: ['#ff4b1f', '#ff9068', '#ff3d00', '#ffea00'],
        glow: '#ff3d00',
        eyeColor: '#ffffff',
        pupilColor: '#3d0c02'
    },
    {
        id: 'emerald-viper',
        name: 'Emerald Viper',
        colors: ['#00b09b', '#96c93d', '#00e676', '#1de9b6'],
        glow: '#00e676',
        eyeColor: '#ffffff',
        pupilColor: '#003314'
    },
    {
        id: 'rainbow-pulse',
        name: 'Rainbow Pulse',
        colors: ['#ff0055', '#ff9900', '#ffee00', '#00ff66', '#00ffff', '#9900ff'],
        glow: '#ff00ff',
        eyeColor: '#ffffff',
        pupilColor: '#000000'
    },
    {
        id: 'gold-dragon',
        name: 'Gold Dragon',
        colors: ['#f7971e', '#ffd200', '#f7971e', '#ffb300'],
        glow: '#ffd200',
        eyeColor: '#ffffff',
        pupilColor: '#3e2402'
    }
];

export class Snake {
    constructor(id, name, x, y, skin = SKINS[0], isBot = false) {
        this.id = id;
        this.name = name || 'Gusano';
        this.isBot = isBot;
        this.skin = skin;

        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;

        this.mass = 10;
        this.score = 10;
        this.kills = 0;
        this.isAlive = true;
        this.isBoosting = false;

        // Velocidad constante y controlada
        this.baseSpeed = 3.8;
        this.boostSpeed = 7.6;
        this.currentSpeed = this.baseSpeed;

        // Cinemática de segmentos: espaciado denso para cuerpo continuo de serpiente
        this.segmentSpacing = 3.2;
        this.pts = []; // [{x, y, angle}]
        const initialCount = 14;
        for (let i = 0; i < initialCount * this.segmentSpacing; i++) {
            this.pts.push({
                x: this.x - Math.cos(this.angle) * i,
                y: this.y - Math.sin(this.angle) * i,
                angle: this.angle
            });
        }

        this.boostCounter = 0;
        this.headBob = 0;
    }

    get radius() {
        return Math.min(10 + Math.pow(this.mass, 0.32) * 1.0, 26);
    }

    get length() {
        // Crecimiento lento y moderado basado en puntuación
        return Math.floor(14 + Math.pow(this.mass, 0.46) * 1.6);
    }

    turnTowards(targetAngle, turnRate) {
        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // El rango/radio de giro aumenta progresivamente con el tamaño de la serpiente
        // Las velocidades base y turbo se mantienen fijas, pero el arco de curvatura se amplía
        const sizeFactor = (this.radius - 10) * 0.0024;
        const maxTurn = turnRate || Math.max(0.040, 0.088 - sizeFactor);

        if (Math.abs(diff) < maxTurn) {
            this.angle = targetAngle;
        } else {
            this.angle += Math.sign(diff) * maxTurn;
        }
    }

    update(foodManager, sound) {
        if (!this.isAlive) return;

        // Velocidad estrictamente normal, a menos que se active turbo con masa suficiente
        if (this.isBoosting && this.mass > 12) {
            this.currentSpeed = this.boostSpeed;
            this.boostCounter++;
            if (this.boostCounter % 6 === 0) {
                this.mass = Math.max(10, this.mass - 1);
                if (this.pts.length > 5) {
                    const tail = this.pts[this.pts.length - 1];
                    foodManager.spawnBoostFood(tail.x, tail.y, this.skin.glow);
                }
            }
        } else {
            this.currentSpeed = this.baseSpeed;
            if (this.mass <= 12) {
                this.isBoosting = false;
            }
        }

        // Giro hacia el ángulo objetivo
        this.turnTowards(this.targetAngle);

        // Movimiento de la cabeza
        this.x += Math.cos(this.angle) * this.currentSpeed;
        this.y += Math.sin(this.angle) * this.currentSpeed;
        this.headBob += 0.1;

        // Registrar posición en el historial
        this.pts.unshift({ x: this.x, y: this.y, angle: this.angle });

        // Ajustar historial según el tamaño de la serpiente
        const requiredPts = Math.floor(this.length * this.segmentSpacing);
        if (this.pts.length > requiredPts) {
            this.pts.length = requiredPts;
        }

        // Puntuación actualizada (idéntica a Slither.io original)
        this.score = Math.max(10, Math.floor(this.mass));
    }

    // Obtener los segmentos renderizables espaciados
    getSegments() {
        const segments = [];
        const segDistance = this.segmentSpacing;
        const totalSegments = this.length;

        for (let i = 0; i < totalSegments; i++) {
            const ptIndex = Math.min(Math.floor(i * segDistance), this.pts.length - 1);
            if (ptIndex >= 0 && this.pts[ptIndex]) {
                segments.push({
                    x: this.pts[ptIndex].x,
                    y: this.pts[ptIndex].y,
                    angle: this.pts[ptIndex].angle,
                    index: i
                });
            }
        }
        return segments;
    }

    // Comprobar si come orbes cercanos usando el Grid Espacial O(1)
    checkFood(foodManager, sound, isPlayer = false) {
        if (!this.isAlive) return;

        const headR = this.radius;
        const magnetR = headR * 3.5;
        const nearbyFoods = foodManager.getNearbyFoods(this.x, this.y, magnetR);

        for (let i = 0; i < nearbyFoods.length; i++) {
            const f = nearbyFoods[i];
            const dx = f.x - this.x;
            const dy = f.y - this.y;
            const distSq = dx * dx + dy * dy;

            // Detección de magnetismo
            if (distSq < magnetR * magnetR) {
                f.magnetTarget = { x: this.x, y: this.y };
            }

            // Detección de ingestión
            if (distSq < (headR + f.baseRadius) * (headR + f.baseRadius)) {
                this.mass += f.value;
                if (isPlayer && sound) {
                    sound.playEatSound(f.value);
                }
                foodManager.removeFood(f);
            }
        }
    }

    die(foodManager, sound) {
        if (!this.isAlive) return;
        this.isAlive = false;
        if (sound) {
            sound.playDeathSound();
        }
        // Spawnear la comida de la puntuación a lo largo de toda la silueta exacta del cuerpo
        foodManager.spawnDeathFood(this.getSegments(), this.mass, this.skin.glow);
    }

    draw(ctx, camera) {
        if (!this.isAlive || this.pts.length < 2) return;

        const segments = this.getSegments();
        if (segments.length === 0) return;

        const r = this.radius;
        const skinColors = this.skin.colors;

        ctx.save();

        // 1. Dibujar cuerpo continuo y tubular (sin puntos ni anillos de borde individuales)
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];
            const factor = Math.max(0.4, 1 - (i / segments.length) * 0.45);
            const segRadius = r * factor;

            const colorIndex = i % skinColors.length;
            const segColor = skinColors[colorIndex];

            ctx.beginPath();
            ctx.arc(seg.x, seg.y, segRadius, 0, Math.PI * 2);
            ctx.fillStyle = segColor;
            ctx.fill();
        }

        // 2. Línea dorsal / espina central para dar acabado orgánico de piel de serpiente
        ctx.beginPath();
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i];
            if (i === segments.length - 1) {
                ctx.moveTo(seg.x, seg.y);
            } else {
                ctx.lineTo(seg.x, seg.y);
            }
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = Math.max(2, r * 0.3);
        ctx.stroke();

        // 2. Dibujar Ojos y Cabeza
        const head = segments[0];
        const eyeOffset = r * 0.55;
        const eyeDistanceForward = r * 0.25;
        const eyeRadius = r * 0.32;
        const pupilRadius = eyeRadius * 0.55;

        // Posiciones relativas de ambos ojos
        const leftEyeX = head.x + Math.cos(this.angle + Math.PI / 2.2) * eyeOffset + Math.cos(this.angle) * eyeDistanceForward;
        const leftEyeY = head.y + Math.sin(this.angle + Math.PI / 2.2) * eyeOffset + Math.sin(this.angle) * eyeDistanceForward;

        const rightEyeX = head.x + Math.cos(this.angle - Math.PI / 2.2) * eyeOffset + Math.cos(this.angle) * eyeDistanceForward;
        const rightEyeY = head.y + Math.sin(this.angle - Math.PI / 2.2) * eyeOffset + Math.sin(this.angle) * eyeDistanceForward;

        // Esclerótica (blanco de los ojos)
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.skin.eyeColor || '#ffffff';

        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas orientadas hacia la dirección del movimiento
        const pupilLookDist = eyeRadius * 0.42;
        const pupilOffsetX = Math.cos(this.angle) * pupilLookDist;
        const pupilOffsetY = Math.sin(this.angle) * pupilLookDist;

        ctx.fillStyle = this.skin.pupilColor || '#000000';

        ctx.beginPath();
        ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        // Brillo especular en pupilas
        ctx.fillStyle = '#ffffff';
        const specularDist = pupilRadius * 0.35;
        ctx.beginPath();
        ctx.arc(leftEyeX + pupilOffsetX - specularDist, leftEyeY + pupilOffsetY - specularDist, pupilRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightEyeX + pupilOffsetX - specularDist, rightEyeY + pupilOffsetY - specularDist, pupilRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 3. Nombre sobre la cabeza
        ctx.font = `bold ${Math.max(12, Math.floor(r * 0.9))}px 'Inter', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#000000';
        ctx.fillText(this.name, head.x, head.y - r * 1.5);

        ctx.restore();
    }
}
