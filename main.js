// ===== IMPORTS =====
import { World } from "./world.js";
import { Player } from "./player.js";
import { InventoryUI } from "./inventory.js";


// ===== CONSTANTS =====
export const TILE_SIZE = 32;


// ===== CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();


// ===== GLOBAL INPUT =====
export const Keys = {};

window.addEventListener("keydown", e => {
    Keys[e.key.toLowerCase()] = true;

    // inventory toggle
    if (e.key.toLowerCase() === "e") {
        inventory.toggle();
    }
});

window.addEventListener("keyup", e => {
    Keys[e.key.toLowerCase()] = false;
});


// ===== ASSET LOADER =====
export const Assets = {};

async function loadAssets() {
    const names = [
        "grass",
        "dirt",
        "empty",
        "log",
        "leaf",
        "sapling",
        "stick",
        "planks"
    ];

    for (const name of names) {
        const img = new Image();
        img.src = `./assets/${name}.png`;
        await img.decode();
        Assets[name] = img;
    }
}


// ===== GAME OBJECTS =====
let world;
let player;
let inventory;


// ===== CAMERA =====
const camera = {
    x: 0,
    y: 0
};


// ===== HOTBAR SCROLL =====
window.addEventListener("wheel", e => {
    if (inventory) {
        if (e.deltaY > 0) inventory.nextHotbar();
        else inventory.prevHotbar();
    }
});


// ===== GAME LOOP =====
let lastTime = 0;

function loop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

function update(dt) {
    if (!inventory.isOpen) {
        player.update(dt, world);
    }

    world.update(dt);
    inventory.update(dt);

    // camera follows player
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    world.draw(ctx, camera);
    player.draw(ctx, camera);
}


// ===== INIT =====
async function init() {
    await loadAssets();

    world = new World();
    inventory = new InventoryUI();
    player = new Player(inventory);

    requestAnimationFrame(loop);
}

init();
