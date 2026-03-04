import { TILE_SIZE, Assets } from "./main.js";

const CHUNK_SIZE = 16;
const MINE_TIME = 5;           // seconden
const SAPLING_GROW_TIME = 600; // 10 minuten


export class World {

    constructor() {
        this.chunks = new Map();

        // mining progress: "x,y" -> tijd
        this.mining = new Map();
    }

    // =====================================================
    // CHUNKS
    // =====================================================

    chunkKey(cx, cy) {
        return `${cx},${cy}`;
    }

    getChunk(cx, cy) {
        const key = this.chunkKey(cx, cy);

        if (!this.chunks.has(key)) {
            this.chunks.set(key, this.generateChunk(cx, cy));
        }

        return this.chunks.get(key);
    }

    generateChunk(cx, cy) {
        const tiles = [];

        for (let y = 0; y < CHUNK_SIZE; y++) {
            const row = [];

            for (let x = 0; x < CHUNK_SIZE; x++) {

                // simpele pseudo random
                const r = Math.random();

                if (r < 0.85) row.push("grass");
                else row.push("dirt");
            }

            tiles.push(row);
        }

        // bomen genereren
        for (let i = 0; i < 2; i++) {
            const tx = Math.floor(Math.random() * CHUNK_SIZE);
            const ty = Math.floor(Math.random() * CHUNK_SIZE);

            this.placeTreeLocal(tiles, tx, ty);
        }

        return tiles;
    }

    // =====================================================
    // TILE ACCESS
    // =====================================================

    getTile(tx, ty) {
        const cx = Math.floor(tx / CHUNK_SIZE);
        const cy = Math.floor(ty / CHUNK_SIZE);

        const chunk = this.getChunk(cx, cy);

        const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        return chunk[ly][lx];
    }

    setTile(tx, ty, type) {
        const cx = Math.floor(tx / CHUNK_SIZE);
        const cy = Math.floor(ty / CHUNK_SIZE);

        const chunk = this.getChunk(cx, cy);

        const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        chunk[ly][lx] = type;

        // sapling timer start
        if (type === "sapling") {
            chunk[ly][lx] = {
                type: "sapling",
                grow: SAPLING_GROW_TIME
            };
        }
    }


    // =====================================================
    // TREES
    // =====================================================

    placeTreeLocal(chunk, x, y) {
        if (!chunk[y] || chunk[y][x] !== "grass") return;

        chunk[y][x] = "log";

        const dirs = [
            [-1,-1],[0,-1],[1,-1],
            [-1,0],[1,0],
            [-1,1],[0,1],[1,1]
        ];

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (chunk[ny] && chunk[ny][nx]) {
                chunk[ny][nx] = "leaf";
            }
        }
    }

    growTree(tx, ty) {
        this.setTile(tx, ty, "log");

        const dirs = [
            [-1,-1],[0,-1],[1,-1],
            [-1,0],[1,0],
            [-1,1],[0,1],[1,1]
        ];

        for (const [dx, dy] of dirs) {
            this.setTile(tx + dx, ty + dy, "leaf");
        }
    }


    // =====================================================
    // MINING
    // =====================================================

    mine(tx, ty, dt) {
        const key = `${tx},${ty}`;

        const t = (this.mining.get(key) || 0) + dt;

        if (t >= MINE_TIME) {
            this.mining.delete(key);

            const tile = this.getTile(tx, ty);
            this.setTile(tx, ty, "empty");

            return tile; // drop item
        }

        this.mining.set(key, t);
        return null;
    }

    stopMining(tx, ty) {
        this.mining.delete(`${tx},${ty}`);
    }


    // =====================================================
    // UPDATE
    // =====================================================

    update(dt) {

        // sapling growth
        for (const chunk of this.chunks.values()) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {

                    const t = chunk[y][x];

                    if (typeof t === "object" && t.type === "sapling") {
                        t.grow -= dt;

                        if (t.grow <= 0) {
                            chunk[y][x] = "grass";
                            this.growTree(x, y);
                        }
                    }
                }
            }
        }
    }


    // =====================================================
    // DRAW
    // =====================================================

    draw(ctx, camera) {

        const startX = Math.floor(camera.x / TILE_SIZE) - 1;
        const startY = Math.floor(camera.y / TILE_SIZE) - 1;

        const endX = startX + Math.ceil(ctx.canvas.width / TILE_SIZE) + 2;
        const endY = startY + Math.ceil(ctx.canvas.height / TILE_SIZE) + 2;

        for (let ty = startY; ty <= endY; ty++) {
            for (let tx = startX; tx <= endX; tx++) {

                let tile = this.getTile(tx, ty);

                if (typeof tile === "object") tile = tile.type;

                const img = Assets[tile];
                if (!img) continue;

                ctx.drawImage(
                    img,
                    tx * TILE_SIZE - camera.x,
                    ty * TILE_SIZE - camera.y,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
    }
}
