import { TILE_SIZE, Keys } from "./main.js";

export class Player {

    constructor(inventory) {
        this.inventory = inventory;

        // wereld positie (pixels)
        this.x = 0;
        this.y = 0;

        this.speed = 200;

        // mining state
        this.mining = false;
        this.targetTile = null;

        this.mouse = { x: 0, y: 0 };

        // ===== MOUSE =====
        window.addEventListener("mousemove", e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener("mousedown", e => {
            if (inventory.isOpen) return;

            if (e.button === 0) this.mining = true;      // links
            if (e.button === 2) this.placeRequest = true; // rechts
        });

        window.addEventListener("mouseup", e => {
            if (e.button === 0) this.mining = false;
        });

        window.addEventListener("contextmenu", e => e.preventDefault());
    }


    // =====================================================
    // UPDATE
    // =====================================================

    update(dt, world) {

        this.move(dt);

        const tile = this.getMouseTile(world);

        // ===== MINING =====
        if (this.mining) {

            const drop = world.mine(tile.tx, tile.ty, dt);

            if (drop) {
                this.inventory.addItem(drop, 1);
            }

        } else {
            world.stopMining(tile.tx, tile.ty);
        }

        // ===== PLACE BLOCK =====
        if (this.placeRequest) {

            const item = this.inventory.getSelectedItem();

            if (item && item !== "empty") {

                world.setTile(tile.tx, tile.ty, item);
                this.inventory.removeSelected(1);
            }

            this.placeRequest = false;
        }
    }


    // =====================================================
    // MOVEMENT
    // =====================================================

    move(dt) {

        let dx = 0;
        let dy = 0;

        if (Keys["w"] || Keys["arrowup"]) dy -= 1;
        if (Keys["s"] || Keys["arrowdown"]) dy += 1;
        if (Keys["a"] || Keys["arrowleft"]) dx -= 1;
        if (Keys["d"] || Keys["arrowright"]) dx += 1;

        const len = Math.hypot(dx, dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
    }


    // =====================================================
    // TILE TARGETING
    // =====================================================

    getMouseTile(world) {

        const canvas = document.getElementById("game");

        const camX = this.x - canvas.width / 2;
        const camY = this.y - canvas.height / 2;

        const wx = this.mouse.x + camX;
        const wy = this.mouse.y + camY;

        const tx = Math.floor(wx / TILE_SIZE);
        const ty = Math.floor(wy / TILE_SIZE);

        return { tx, ty };
    }


    // =====================================================
    // DRAW
    // =====================================================

    draw(ctx, camera) {

        // speler
        ctx.fillStyle = "red";
        ctx.fillRect(
            this.x - camera.x - TILE_SIZE / 2,
            this.y - camera.y - TILE_SIZE / 2,
            TILE_SIZE,
            TILE_SIZE
        );

        // highlight tile onder muis
        const tile = this.getMouseTile();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            tile.tx * TILE_SIZE - camera.x,
            tile.ty * TILE_SIZE - camera.y,
            TILE_SIZE,
            TILE_SIZE
        );
    }
}
