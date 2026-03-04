import { Assets } from "./main.js";

const INV_SIZE = 27;
const HOTBAR_SIZE = 9;
const STACK_MAX = 64;

export class InventoryUI {

    constructor() {

        // =============================
        // STATE
        // =============================
        this.isOpen = false;
        this.selected = 0;

        this.inventory = new Array(INV_SIZE).fill(null);
        this.hotbar = new Array(HOTBAR_SIZE).fill(null);
        this.craft = new Array(9).fill(null);

        this.dragItem = null;
        this.recipes = [];

        // =============================
        // DOM
        // =============================
        this.hotbarEl = document.getElementById("hotbar");
        this.windowEl = document.getElementById("inventoryWindow");
        this.gridEl = document.getElementById("inventoryGrid");
        this.craftGridEl = document.getElementById("craftGrid");
        this.resultEl = document.getElementById("craftResult");

        this.createSlots();
        this.loadRecipes();
        this.refresh();
    }

    // =====================================================
    // UI CREATION
    // =====================================================
    createSlots() {

        // HOTBAR
        for (let i = 0; i < HOTBAR_SIZE; i++) {
            this.hotbarEl.appendChild(this.makeSlot("hotbar", i));
        }

        // INVENTORY GRID
        for (let i = 0; i < INV_SIZE; i++) {
            this.gridEl.appendChild(this.makeSlot("inv", i));
        }

        // CRAFT GRID
        for (let i = 0; i < 9; i++) {
            this.craftGridEl.appendChild(this.makeSlot("craft", i));
        }

        // CRAFT RESULT CLICK
        this.resultEl.addEventListener("mousedown", () => {
            const result = this.getCraftResult();
            if (!result) return;

            this.addItem(result.item, result.count);
            this.consumeCraft();
            this.refresh();
        });
    }

    makeSlot(type, index) {
        const div = document.createElement("div");
        div.className = "slot";
        div.dataset.type = type;
        div.dataset.index = index;

        div.addEventListener("mousedown", e => this.onMouseDown(e, div));
        return div;
    }

    // =====================================================
    // TOGGLE INVENTORY
    // =====================================================
    toggle() {
        this.isOpen = !this.isOpen;
        this.windowEl.style.display = this.isOpen ? "flex" : "none";
    }

    // =====================================================
    // HOTBAR SELECT
    // =====================================================
    nextHotbar() {
        this.selected = (this.selected + 1) % HOTBAR_SIZE;
        this.refresh();
    }

    prevHotbar() {
        this.selected = (this.selected - 1 + HOTBAR_SIZE) % HOTBAR_SIZE;
        this.refresh();
    }

    getSelectedItem() {
        const s = this.hotbar[this.selected];
        return s ? s.item : null;
    }

    removeSelected(count) {
        const s = this.hotbar[this.selected];
        if (!s) return;
        s.count -= count;
        if (s.count <= 0) this.hotbar[this.selected] = null;
        this.refresh();
    }

    // =====================================================
    // ADD ITEM
    // =====================================================
    addItem(item, count = 1) {

        const allSlots = [...this.hotbar, ...this.inventory];

        // stack first
        for (const slot of allSlots) {
            if (slot && slot.item === item && slot.count < STACK_MAX) {
                const space = STACK_MAX - slot.count;
                const add = Math.min(space, count);
                slot.count += add;
                count -= add;
                if (count <= 0) { this.refresh(); return true; }
            }
        }

        // empty slot
        for (let i = 0; i < this.hotbar.length; i++) {
            if (!this.hotbar[i]) {
                this.hotbar[i] = { item, count };
                this.refresh();
                return true;
            }
        }
        for (let i = 0; i < this.inventory.length; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = { item, count };
                this.refresh();
                return true;
            }
        }

        return false;
    }

    // =====================================================
    // DRAG & DROP
    // =====================================================
    onMouseDown(e, div) {

        const type = div.dataset.type;
        const index = +div.dataset.index;
        const arr = this.getArray(type);

        const slot = arr[index];

        // PICKUP
        if (!this.dragItem && slot) {
            this.dragItem = slot;
            arr[index] = null;
        }
        // PLACE / SWAP
        else if (this.dragItem) {
            if (!slot) {
                arr[index] = this.dragItem;
                this.dragItem = null;
            } else {
                [arr[index], this.dragItem] = [this.dragItem, slot];
            }
        }

        this.refresh();
    }

    getArray(type) {
        if (type === "hotbar") return this.hotbar;
        if (type === "inv") return this.inventory;
        if (type === "craft") return this.craft;
    }

    // =====================================================
    // CRAFTING
    // =====================================================
    async loadRecipes() {
        try {
            const text = await fetch("./recipes.txt").then(r => r.text());
            this.recipes = text
                .split("\n")
                .map(l => l.trim())
                .filter(Boolean)
                .map(line => {
                    const [pattern, result] = line.split("=");
                    const [item, count] = result.split(",");
                    return {
                        pattern: pattern.split(","),
                        item,
                        count: +count
                    };
                });
        } catch {
            // geen recipes.txt is ok
        }
    }

    getCraftResult() {
        const grid = this.craft.map(s => s ? s.item : "empty").join(",");
        for (const r of this.recipes) {
            if (r.pattern.join(",") === grid) return r;
        }
        return null;
    }

    consumeCraft() {
        for (let i = 0; i < 9; i++) {
            if (!this.craft[i]) continue;
            this.craft[i].count--;
            if (this.craft[i].count <= 0) this.craft[i] = null;
        }
    }

    // =====================================================
    // UPDATE / DRAW
    // =====================================================
    update() {
        this.drawCraftResult();
    }

    refresh() {
        this.drawSlots(this.hotbarEl, this.hotbar);
        this.drawSlots(this.gridEl, this.inventory);
        this.drawSlots(this.craftGridEl, this.craft);

        [...this.hotbarEl.children].forEach((c, i) =>
            c.classList.toggle("selected", i === this.selected)
        );
    }

    drawSlots(container, arr) {
        [...container.children].forEach((div, i) => {
            div.innerHTML = "";

            const slot = arr[i];
            if (!slot) return;

            const img = document.createElement("img");
            img.src = Assets[slot.item]?.src;
            div.appendChild(img);

            if (slot.count > 1) {
                const t = document.createElement("span");
                t.textContent = slot.count;
                t.style.position = "absolute";
                t.style.fontSize = "12px";
                t.style.color = "white";
                t.style.right = "2px";
                t.style.bottom = "0";
                div.appendChild(t);
            }
        });
    }

    drawCraftResult() {
        const result = this.getCraftResult();
        this.resultEl.innerHTML = "";
        if (!result) return;

        const img = document.createElement("img");
        img.src = Assets[result.item]?.src;
        this.resultEl.appendChild(img);
    }
}
