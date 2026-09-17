// Sistema de Inteligencia Artificial para Bots de Slither.io

import { Snake, SKINS } from './snake.js';

export const BOT_NAMES = [
    'NeonPhantom', 'CyberViper', 'ApeX_99', 'ShadowDrifter', 'KobraKai',
    'PlasmaWorm', 'GigaSlither', 'CosmoSnake', 'GlitchBite', 'Hyperion',
    'OmegaVenom', 'Vortex', 'Starlight', 'ZeroGravity', 'BlazeTail'
];

export class Bot extends Snake {
    constructor(id, name, x, y, skin) {
        super(id, name, x, y, skin, true);
        
        // Atributos de personalidad de IA
        this.aggression = Math.random(); // 0 a 1 (pacífico recolector -> cazador agresivo)
        this.decisionTimer = Math.random() * 20;
        this.decisionInterval = 10 + Math.floor(Math.random() * 15);
        this.boostChance = 0.015 + this.aggression * 0.03;
        this.avoidanceAngle = null;
        this.avoidanceTimer = 0;
    }

    think(worldRadius, snakes, foodManager) {
        if (!this.isAlive) return;

        this.decisionTimer++;

        // 1. Evitar la barrera del mundo (Prioridad máxima)
        const distFromCenter = Math.hypot(this.x, this.y);
        const borderDangerMargin = worldRadius - 350;

        if (distFromCenter > borderDangerMargin) {
            // Girar hacia el centro (0, 0)
            const angleToCenter = Math.atan2(-this.y, -this.x);
            this.targetAngle = angleToCenter;
            this.isBoosting = false;
            return;
        }

        // 2. Detección de peligro de colisión con otros cuerpos
        const lookAheadDist = this.radius * 4.5 + (this.isBoosting ? 40 : 15);
        const lookX = this.x + Math.cos(this.angle) * lookAheadDist;
        const lookY = this.y + Math.sin(this.angle) * lookAheadDist;

        let obstacleDetected = false;
        let escapeAngle = this.angle + Math.PI / 2;

        for (const other of snakes) {
            if (!other.isAlive || other.id === this.id) continue;

            const segments = other.getSegments();
            // Comprobar colisión proyectada con segmentos del otro
            for (let i = 0; i < segments.length; i += 2) {
                const seg = segments[i];
                const dx = seg.x - lookX;
                const dy = seg.y - lookY;
                const distSq = dx * dx + dy * dy;
                const safeDist = this.radius + other.radius + 15;

                if (distSq < safeDist * safeDist) {
                    obstacleDetected = true;
                    // Girar bruscamente en ángulo opuesto al obstáculo
                    const obstacleAngle = Math.atan2(seg.y - this.y, seg.x - this.x);
                    escapeAngle = obstacleAngle + Math.PI * (Math.random() > 0.5 ? 0.65 : -0.65);
                    break;
                }
            }
            if (obstacleDetected) break;
        }

        if (obstacleDetected) {
            this.targetAngle = escapeAngle;
            // Turbo evasivo de emergencia si tiene suficiente masa
            if (this.mass > 35 && Math.random() < 0.6) {
                this.isBoosting = true;
            }
            return;
        }

        // 3. Toma de decisiones periódica si no hay peligro inminente
        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;

            // Decidir si acelera
            if (this.mass > 40 && Math.random() < this.boostChance) {
                this.isBoosting = true;
            } else if (Math.random() < 0.25) {
                this.isBoosting = false;
            }

            // A) Buscar comida brillante usando el Grid Espacial O(1)
            let bestFood = null;
            let bestScore = -Infinity;
            const searchRadius = 380;
            const foods = foodManager.getNearbyFoods(this.x, this.y, searchRadius);

            for (let i = 0; i < foods.length; i++) {
                const f = foods[i];
                const dx = f.x - this.x;
                const dy = f.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < searchRadius) {
                    // Dar más peso a orbes de mayor valor (muerte/boost)
                    const score = (f.value * 25) / (dist + 10);
                    if (score > bestScore) {
                        bestScore = score;
                        bestFood = f;
                    }
                }
            }

            if (bestFood) {
                this.targetAngle = Math.atan2(bestFood.y - this.y, bestFood.x - this.x);
                if (bestFood.isDeath && this.mass > 40) {
                    this.isBoosting = true; // Carrera por comida valiosa
                }
            } else {
                // B) Deambular naturalmente con ligeros giros
                this.targetAngle += (Math.random() - 0.5) * 0.8;
            }
        }
    }
}
