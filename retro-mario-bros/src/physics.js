// ==========================================================================
// PHYSICS ENGINE: Colisiones AABB, Detección por Ejes y Resolución Espacial
// ==========================================================================

const PHYSICS = {
    GRAVITY: 0.28,           // Gravedad continua estilo Mario NES
    FALL_GRAVITY: 0.55,      // Gravedad acelerada al soltar salto para salto corto
    MAX_FALL_SPEED: 7.0,     // Velocidad terminal vertical
    ACCEL: 0.12,             // Aceleración horizontal normal
    RUN_ACCEL: 0.20,         // Aceleración turbo
    MAX_WALK_SPEED: 1.6,     // Velocidad máxima caminando
    MAX_RUN_SPEED: 2.8,      // Velocidad máxima corriendo
    FRICTION: 0.88,          // Rozamiento en suelo
    AIR_DRAG: 0.94,          // Resistencia aérea
    SKID_DECEL: 0.25,        // Desaceleración al derrapar en sentido opuesto
    INITIAL_JUMP_FORCE: -4.5,// Impulso inicial de salto
    JUMP_HOLD_BOOST: -0.22,  // Aceleración continua mientras se mantiene el botón de salto
    MAX_JUMP_FRAMES: 16      // Cuadros máximos que se puede alimentar el salto
};

class PhysicsEngine {
    // Comprobación de solapamiento entre dos cajas AABB
    static checkAABB(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    // Resolución de colisiones con el mapa de baldosas (Tilemap) en dos fases (Eje X y Eje Y)
    static resolveMapCollisions(entity, level) {
        const tileSize = level.tileSize; // 16px

        // ----------------- FASE 1: MOVIMIENTO Y COLISIÓN HORIZONTAL (X) -----------------
        entity.x += entity.vx;
        let leftTile = Math.floor(entity.x / tileSize);
        let rightTile = Math.floor((entity.x + entity.w - 0.05) / tileSize);
        let topTile = Math.floor(entity.y / tileSize);
        let bottomTile = Math.floor((entity.y + entity.h - 0.05) / tileSize);

        for (let r = topTile; r <= bottomTile; r++) {
            for (let c = leftTile; c <= rightTile; c++) {
                if (level.isSolid(c, r)) {
                    if (entity.vx > 0) {
                        // Colisión hacia la derecha
                        entity.x = c * tileSize - entity.w;
                        entity.vx = 0;
                        if (entity.onWallHit) entity.onWallHit('right');
                    } else if (entity.vx < 0) {
                        // Colisión hacia la izquierda
                        entity.x = (c + 1) * tileSize;
                        entity.vx = 0;
                        if (entity.onWallHit) entity.onWallHit('left');
                    }
                }
            }
        }

        // ----------------- FASE 2: MOVIMIENTO Y COLISIÓN VERTICAL (Y) -----------------
        entity.y += entity.vy;
        leftTile = Math.floor(entity.x / tileSize);
        rightTile = Math.floor((entity.x + entity.w - 0.05) / tileSize);
        topTile = Math.floor(entity.y / tileSize);
        bottomTile = Math.floor((entity.y + entity.h - 0.05) / tileSize);

        let wasGrounded = entity.grounded;
        entity.grounded = false;

        for (let r = topTile; r <= bottomTile; r++) {
            for (let c = leftTile; c <= rightTile; c++) {
                if (level.isSolid(c, r)) {
                    if (entity.vy > 0) {
                        // Aterrizaje sobre suelo o plataforma sólida
                        entity.y = r * tileSize - entity.h;
                        entity.vy = 0;
                        entity.grounded = true;
                        if (entity.onGroundHit) entity.onGroundHit();
                    } else if (entity.vy < 0) {
                        // Golpe contra el techo / bloque superior
                        entity.y = (r + 1) * tileSize;
                        entity.vy = 0;
                        if (entity.onCeilingHit) entity.onCeilingHit(c, r);
                    }
                }
            }
        }
    }
}

window.PhysicsEngine = PhysicsEngine;
window.PHYSICS = PHYSICS;
