// Sistema de Comida y Orbes de Energía con Grid Espacial de Alto Rendimiento

export const FOOD_COLORS = [
    '#00ffcc', // Cyan neón
    '#ff007f', // Rosa intenso
    '#39ff14', // Verde eléctrico
    '#ffe600', // Amarillo neón
    '#bf00ff', // Púrpura cósmico
    '#ff5e00', // Naranja fuego
    '#00d4ff', // Azul plasma
    '#ffffff'  // Blanco estelar
];

export class Food {
    constructor(x, y, value = 1, isBoost = false, isDeath = false) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.isBoost = isBoost;
        this.isDeath = isDeath;

        // Tamaño visual según el valor de masa
        if (isDeath) {
            this.baseRadius = Math.min(5 + value * 0.4, 9);
        } else if (isBoost) {
            this.baseRadius = 3.2;
        } else {
            this.baseRadius = 2.4 + Math.random() * 2.2;
        }

        this.color = FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.04 + Math.random() * 0.03;
        
        // Movimiento flotante sutil (orbes de muerte quedan 100% estáticos en la silueta)
        if (isDeath) {
            this.vx = 0;
            this.vy = 0;
        } else {
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
        }

        // Magnetismo hacia la cabeza de una serpiente
        this.magnetTarget = null;
        this.magnetSpeed = 0;
        this.gridKey = null;
    }

    update() {
        if (this.magnetTarget) {
            const dx = this.magnetTarget.x - this.x;
            const dy = this.magnetTarget.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 1) {
                this.magnetSpeed += 1.4;
                this.x += (dx / dist) * Math.min(this.magnetSpeed, dist);
                this.y += (dy / dist) * Math.min(this.magnetSpeed, dist);
            }
        } else if (!this.isDeath) {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.99;
            this.vy *= 0.99;
        }

        this.pulsePhase += this.pulseSpeed;
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
        const r = this.baseRadius * pulse;

        // Renderizado ultra-rápido sin shadowBlur costoso
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Núcleo brillante para orbes de muerte y turbo
        if (this.isDeath || this.isBoost) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
    }
}

export class FoodManager {
    constructor(worldRadius, targetCount = 1800) {
        this.worldRadius = worldRadius;
        this.targetCount = targetCount;
        this.foods = [];
        
        // Grid espacial (Spatial Hash) para búsquedas instantáneas O(1)
        this.cellSize = 180;
        this.grid = new Map();
    }

    getCellKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx}_${cy}`;
    }

    addFoodToGrid(food) {
        const key = this.getCellKey(food.x, food.y);
        food.gridKey = key;
        let cell = this.grid.get(key);
        if (!cell) {
            cell = [];
            this.grid.set(key, cell);
        }
        cell.push(food);
    }

    removeFoodFromGrid(food) {
        if (!food.gridKey) return;
        const cell = this.grid.get(food.gridKey);
        if (cell) {
            const idx = cell.indexOf(food);
            if (idx !== -1) {
                cell.splice(idx, 1);
            }
        }
    }

    getNearbyFoods(x, y, radius) {
        const minCellX = Math.floor((x - radius) / this.cellSize);
        const maxCellX = Math.floor((x + radius) / this.cellSize);
        const minCellY = Math.floor((y - radius) / this.cellSize);
        const maxCellY = Math.floor((y + radius) / this.cellSize);

        const result = [];
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}_${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        result.push(cell[i]);
                    }
                }
            }
        }
        return result;
    }

    init() {
        this.foods = [];
        this.grid.clear();
        for (let i = 0; i < this.targetCount; i++) {
            this.spawnNaturalFood();
        }
    }

    spawnNaturalFood() {
        const r = Math.sqrt(Math.random()) * (this.worldRadius - 60);
        const theta = Math.random() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        const value = Math.random() > 0.9 ? 2 : 1;
        const food = new Food(x, y, value, false, false);
        this.foods.push(food);
        this.addFoodToGrid(food);
    }

    spawnBoostFood(x, y, color) {
        const food = new Food(x, y, 1, true, false);
        if (color) food.color = color;
        this.foods.push(food);
        this.addFoodToGrid(food);
    }

    spawnDeathFood(segmentsOrX, yOrMass, massOrColor, skinColor) {
        let segments = [];
        let mass = 10;
        let glowColor = null;

        if (Array.isArray(segmentsOrX)) {
            segments = segmentsOrX;
            mass = yOrMass || 10;
            glowColor = massOrColor || null;
        } else {
            segments = [{ x: segmentsOrX, y: yOrMass }];
            mass = massOrColor || 10;
            glowColor = skinColor || null;
        }

        const effectiveMass = Math.max(10, mass);
        const totalSegs = segments.length;
        if (totalSegs === 0) return;

        // Distribución EXACTA de orbes a lo largo de la silueta del cuerpo (SIN dispersión)
        const orbValue = Math.max(1, Math.min(3, Math.round(effectiveMass / totalSegs)));

        for (let i = 0; i < totalSegs; i++) {
            const seg = segments[i];
            // Orbe colocado EXACTAMENTE en la posición del segmento sin desvío
            const food = new Food(seg.x, seg.y, orbValue, false, true);
            if (glowColor) {
                food.color = glowColor;
            }
            food.vx = 0;
            food.vy = 0;

            this.foods.push(food);
            this.addFoodToGrid(food);
        }
    }

    removeFood(food) {
        this.removeFoodFromGrid(food);
        const idx = this.foods.indexOf(food);
        if (idx !== -1) {
            this.foods.splice(idx, 1);
        }
    }

    update() {
        // Mantener población ambiental constante
        while (this.foods.length < this.targetCount) {
            this.spawnNaturalFood();
        }

        // Actualizar movimientos de comida y re-indexar en el grid si cambiaron de celda
        for (let i = 0; i < this.foods.length; i++) {
            const f = this.foods[i];
            f.update();

            // Si se movió debido a magnetismo o deriva, actualizar celda
            const newKey = this.getCellKey(f.x, f.y);
            if (f.gridKey !== newKey) {
                this.removeFoodFromGrid(f);
                f.gridKey = newKey;
                let cell = this.grid.get(newKey);
                if (!cell) {
                    cell = [];
                    this.grid.set(newKey, cell);
                }
                cell.push(f);
            }
        }
    }

    draw(ctx, camera) {
        // Viewport culling de alto rendimiento: consultar solo celdas visibles
        const margin = 40;
        const minX = camera.x - camera.width / (2 * camera.zoom) - margin;
        const maxX = camera.x + camera.width / (2 * camera.zoom) + margin;
        const minY = camera.y - camera.height / (2 * camera.zoom) - margin;
        const maxY = camera.y + camera.height / (2 * camera.zoom) + margin;

        const minCellX = Math.floor(minX / this.cellSize);
        const maxCellX = Math.floor(maxX / this.cellSize);
        const minCellY = Math.floor(minY / this.cellSize);
        const maxCellY = Math.floor(maxY / this.cellSize);

        ctx.save();
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx}_${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        const f = cell[i];
                        if (f.x >= minX && f.x <= maxX && f.y >= minY && f.y <= maxY) {
                            f.draw(ctx);
                        }
                    }
                }
            }
        }
        ctx.restore();
    }
}
