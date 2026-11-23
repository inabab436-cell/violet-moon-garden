import Phaser from "phaser";
import { courtyardZoom } from "./viewport";

/** Design resolution — the scene is authored at this size and scaled with FIT. */
export const W = 1672;
export const H = 941;

/**
 * Depth convention (y-sorting): every environment object uses its ground-contact Y as depth.
 * Future characters set depth = their feet Y, so they pass in front of / behind pillars & planters.
 * Backdrop layers use negative depths so they always stay behind.
 */
export const LAYERS = { sky: -1000, city: -900, trees: -800, floor: -500, reflections: -490, wall: -400 };

/** Walkable floor polygon (design coordinates). */
export const WALKABLE = [
  0, 345, 140, 335, 215, 300, 560, 262, 690, 250, 975, 250, 1100, 262, 1455, 302, 1540, 330, 1672, 345,
  1672, 941, 0, 941,
];

const C = {
  stone: 0xe9cfe0, stoneShade: 0xc9a9c6, stoneDark: 0xa98aab, stoneLight: 0xf7e6ee,
  banner: 0x6f4fd8, bannerDark: 0x4f35a8, gold: 0xffe9a8, glow: 0xffa040,
  leaf: 0x3f8f3a, leafLight: 0x6fbf4a, leafDark: 0x2a6230, trunk: 0x6b4a3a,
};

export class CourtyardScene extends Phaser.Scene {
  walkable = new Phaser.Geom.Polygon(WALKABLE);
  constructor() { super("Courtyard"); }

  create() {
    this.walkable = new Phaser.Geom.Polygon(WALKABLE);
    this.drawSky();
    this.drawCity();
    this.drawBackTrees();
    this.drawFloor();
    // Walls
    this.wallSegment(205, 580, 108, 262, 0.0);
    this.wallSegment(668, 995, 100, 248, 0);
    this.wallSegment(1085, 1465, 108, 262, 0);
    this.wallSegment(0, 110, 118, 300, 0);
    this.wallSegment(1560, 1672, 118, 300, 0);
    // Planters (front of wall)
    this.planter(228, 555, 222, 290, 0.6);
    this.planter(690, 975, 208, 250, 0);
    this.planter(1102, 1440, 222, 292, -0.6);
    this.planter(-10, 140, 275, 342, 0, true);
    this.planter(1542, 1690, 275, 342, 0, true);
    this.sideTree(40, 230, false);
    this.sideTree(1630, 230, true);
    // Lanterns
    ([[243, 180], [543, 162], [708, 157], [958, 157], [1116, 162], [1425, 182]] as [number, number][]).forEach(([x, y]) => this.lantern(x, y));
    // Pillars
    ([[160, 300], [622, 255], [1042, 255], [1510, 305]] as [number, number][]).forEach(([x, b]) => this.pillar(x, b));
    this.drawFloorReflections();
    this.drawAmbient();

    // Debug: press D to toggle walkable area overlay
    const dbg = this.add.graphics().setDepth(10000).setVisible(false);
    dbg.fillStyle(0x00ff88, 0.18).fillPoints(this.walkable.points, true);
    dbg.lineStyle(3, 0x00ff88, 0.9).strokePoints(this.walkable.points, true);
    this.input.keyboard?.on("keydown-D", () => dbg.setVisible(!dbg.visible));
    this.setupCamera();
    this.game.events.emit("courtyard-ready", this);
  }

  /** Immersive camera: fills the whole screen (no letterbox), slightly zoomed in, drag to look around. */
  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, H);
    const fit = () => {
      const { width, height } = this.scale.gameSize;
      cam.setZoom(courtyardZoom(width, height, W, H));
      cam.centerOn(W / 2, H / 2);
    };
    fit();
    this.scale.on("resize", fit);
    this.events.once("shutdown", () => this.scale.off("resize", fit));
    let last: { x: number; y: number } | null = null;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { last = { x: p.x, y: p.y }; });
    this.input.on("pointerup", () => { last = null; });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!last || !p.isDown) return;
      cam.scrollX -= (p.x - last.x) / cam.zoom;
      cam.scrollY -= (p.y - last.y) / cam.zoom;
      last = { x: p.x, y: p.y };
    });
  }

  isWalkable(x: number, y: number) { return this.walkable.contains(x, y); }

  private drawSky() {
    const g = this.add.graphics().setDepth(LAYERS.sky);
    g.fillGradientStyle(0x2a1f7a, 0x2a1f7a, 0x6a58c8, 0x6a58c8, 1).fillRect(0, 0, W, 320);
    for (let i = 0; i < 70; i++) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 0.9)).fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, 120), Phaser.Math.FloatBetween(0.6, 1.6));
    }
    g.fillStyle(0x8b7ad8, 0.35);
    g.fillEllipse(860, 40, 260, 40).fillEllipse(1200, 70, 200, 30).fillEllipse(400, 60, 220, 34);
  }

  private drawCity() {
    const g = this.add.graphics().setDepth(LAYERS.city);
    const rnd = new Phaser.Math.RandomDataGenerator(["city"]);
    for (let x = -20; x < W; x += rnd.between(70, 130)) {
      const w = rnd.between(80, 150), top = rnd.between(-10, 70);
      const col = rnd.pick([0x5d4ba8, 0x6b58b5, 0x7562bd, 0x5444a0]);
      g.fillStyle(col, 1).fillRect(x, top, w, 260 - top);
      g.fillStyle(0x000000, 0.12).fillRect(x + w - 12, top, 12, 260 - top);
      for (let wy = top + 14; wy < 220; wy += 26) for (let wx = x + 10; wx < x + w - 18; wx += 22) {
        const lit = rnd.frac() < 0.3;
        g.fillStyle(lit ? 0xffd98a : 0x8fa0e8, lit ? 0.95 : 0.45).fillRect(wx, wy, 10, 14);
      }
    }
  }

  private bush(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, n: number, seed: string, flowers = false) {
    const rnd = new Phaser.Math.RandomDataGenerator([seed]);
    for (let i = 0; i < n; i++) {
      const x = cx + rnd.realInRange(-rx, rx), y = cy + rnd.realInRange(-ry, ry * 0.6), r = rnd.realInRange(10, 22);
      g.fillStyle(C.leafDark, 1).fillCircle(x, y + 3, r);
      g.fillStyle(C.leaf, 1).fillCircle(x, y, r * 0.9);
      g.fillStyle(C.leafLight, 0.8).fillCircle(x - r * 0.3, y - r * 0.35, r * 0.45);
      for (let j = 0; j < 4; j++) {
        const lx = x + rnd.realInRange(-r * 0.7, r * 0.7), ly = y + rnd.realInRange(-r * 0.7, r * 0.4);
        g.fillStyle(j % 2 ? C.leafLight : C.leafDark, 0.65).fillEllipse(lx, ly, 8, 3);
      }
    }
    if (flowers) for (let i = 0; i < n * 1.2; i++) {
      g.fillStyle(rnd.pick([0xffe27a, 0xf4a8c8, 0xffffff]), 1).fillCircle(cx + rnd.realInRange(-rx, rx), cy + rnd.realInRange(-ry, ry * 0.5), 2.5);
    }
  }

  private drawBackTrees() {
    const g = this.add.graphics().setDepth(LAYERS.trees);
    ([[380, 85], [760, 70], [1230, 80], [60, 60], [1610, 70]] as [number, number][]).forEach(([x, y], i) =>
      this.bush(g, x, y, 90, 30, 22, "t" + i));
  }

  private drawFloor() {
    const g = this.add.graphics().setDepth(LAYERS.floor);
    const top = 240;
    g.fillGradientStyle(0xc2b0e6, 0xc2b0e6, 0x8a74d0, 0x8a74d0, 1).fillRect(0, top, W, H - top);
    // perspective diagonal tile grid, vanishing toward horizon
    const vpY = -900, cx = W / 2;
    g.lineStyle(1.2, 0x7a63c0, 0.28);
    const toY = (t: number) => top + (H - top) * t * t * 0.4 + (H - top) * 0.6 * t;
    for (let k = -40; k <= 40; k++) {
      for (const dir of [-1, 1]) {
        // diagonal lines expressed as rays from a vanishing point offset to each side
        const bx = cx + k * 110, vx = cx + dir * 3000;
        const t0 = (top - vpY) / (H - vpY);
        g.beginPath();
        g.moveTo(vx + (bx - vx) * t0, top);
        g.lineTo(bx, H);
        g.strokePath();
      }
    }
    g.lineStyle(1, 0xffffff, 0.12);
    for (let i = 1; i < 14; i++) { const y = toY(i / 14); g.lineBetween(0, y, W, y); }
    // gloss sheen
    g.fillStyle(0xffffff, 0.08).fillEllipse(cx, 420, 1500, 220);
    // back curved edge shadow along wall base
    g.fillStyle(0x6a52b0, 0.35);
    g.fillPoints([{ x: 0, y: 345 }, { x: 215, y: 300 }, { x: 690, y: 250 }, { x: 975, y: 250 }, { x: 1455, y: 302 }, { x: W, y: 345 }, { x: W, y: 360 }, { x: 975, y: 262 }, { x: 690, y: 262 }, { x: 0, y: 360 }] as Phaser.Math.Vector2[], true);
  }

  private drawFloorReflections() {
    const g = this.add.graphics().setDepth(LAYERS.reflections).setBlendMode(Phaser.BlendModes.ADD);
    ([[243, 290], [543, 265], [708, 252], [958, 252], [1116, 265], [1425, 292], [160, 305], [622, 258], [1042, 258], [1510, 308]] as [number, number][]).forEach(([x, y], i) => {
      const len = i > 5 ? 420 : 560;
      for (let s = 0; s < 12; s++) {
        const a = 0.09 * (1 - s / 12);
        g.fillStyle(C.gold, a * 0.65).fillEllipse(x, y + (s * len) / 12 + 12, 12 + s * 4, len / 16);
        g.fillStyle(C.glow, a * 0.45).fillEllipse(x, y + (s * len) / 12 + 12, 26 + s * 6, len / 14);
      }
    });
    this.tweens.add({ targets: g, alpha: { from: 0.85, to: 1 }, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  private wallSegment(x1: number, x2: number, top: number, bottom: number, _c: number) {
    const g = this.add.graphics().setDepth(LAYERS.wall);
    g.fillGradientStyle(C.stoneLight, C.stoneLight, C.stoneShade, C.stoneShade, 1).fillRect(x1, top + 14, x2 - x1, bottom - top - 14);
    g.fillStyle(C.stoneLight, 1).fillRect(x1 - 4, top, x2 - x1 + 8, 16);
    g.fillStyle(C.stoneDark, 1).fillRect(x1 - 4, top + 14, x2 - x1 + 8, 4);
    g.fillStyle(C.stoneDark, 0.6).fillRect(x1, bottom - 8, x2 - x1, 8);
    g.lineStyle(1, C.stoneDark, 0.22);
    for (let y = top + 46, row = 0; y < bottom - 8; y += 34, row++) {
      g.lineBetween(x1, y, x2, y);
      for (let x = x1 + (row % 2 ? 35 : 70); x < x2; x += 90) g.lineBetween(x, y - 32, x, y);
    }
  }

  private planter(x1: number, x2: number, top: number, bottom: number, _tilt: number, big = false) {
    const g = this.add.graphics().setDepth(bottom);
    this.bush(g, (x1 + x2) / 2, top - 4, (x2 - x1) / 2 - 10, big ? 40 : 14, big ? 22 : Math.floor((x2 - x1) / 14), "p" + x1, !big);
    g.fillStyle(C.stoneLight, 1).fillRect(x1 - 3, top, x2 - x1 + 6, 10);
    g.fillGradientStyle(C.stone, C.stone, C.stoneShade, C.stoneShade, 1).fillRect(x1, top + 10, x2 - x1, bottom - top - 10);
    g.lineStyle(2, C.stoneDark, 0.6).strokeRect(x1, top + 10, x2 - x1, bottom - top - 10);
    g.lineStyle(1, C.stoneLight, 0.7).lineBetween(x1 + 6, top + 15, x2 - 6, top + 15);
    if (!big) {
      g.lineStyle(1, C.stoneDark, 0.3).strokeRect(x1 + 12, top + 20, x2 - x1 - 24, bottom - top - 29);
    }
  }

  private sideTree(x: number, baseY: number, flip: boolean) {
    const g = this.add.graphics().setDepth(baseY);
    g.fillStyle(C.trunk, 1).fillRect(x - 6, baseY - 120, 12, 120);
    this.bush(g, x + (flip ? 10 : -10), baseY - 160, 70, 90, 45, "st" + x);
  }

  private lantern(x: number, y: number) {
    const glow = this.add.graphics().setDepth(LAYERS.wall + 1).setBlendMode(Phaser.BlendModes.ADD);
    for (let r = 70; r > 0; r -= 10) glow.fillStyle(C.glow, 0.05).fillCircle(x, y, r);
    const g = this.add.graphics().setDepth(LAYERS.wall + 2);
    g.fillStyle(0x7a5a3a, 1).fillRect(x - 13, y - 24, 26, 5).fillRect(x - 11, y + 18, 22, 5).fillRect(x - 2, y - 30, 4, 7);
    g.fillStyle(C.gold, 1).fillRoundedRect(x - 11, y - 19, 22, 37, 3);
    g.fillStyle(0xffffff, 0.7).fillRect(x - 4, y - 14, 8, 26);
    this.tweens.add({ targets: glow, alpha: { from: 0.75, to: 1 }, duration: Phaser.Math.Between(900, 1500), yoyo: true, repeat: -1 });
  }

  private pillar(cx: number, bottom: number) {
    const w = 100, top = 48, g = this.add.graphics().setDepth(bottom);
    g.fillGradientStyle(C.stoneLight, C.stoneShade, C.stoneLight, C.stoneShade, 1).fillRect(cx - w / 2 + 6, top + 26, w - 12, bottom - top - 40);
    g.fillStyle(C.stoneDark, 0.5).fillRect(cx + w / 2 - 18, top + 26, 12, bottom - top - 40);
    g.lineStyle(1, C.stoneDark, 0.18);
    for (let x = cx - 32; x <= cx + 32; x += 16) g.lineBetween(x, top + 30, x, bottom - 20);
    g.fillStyle(C.stoneLight, 1).fillRect(cx - w / 2 - 4, top, w + 8, 14);
    g.fillStyle(C.stone, 1).fillRect(cx - w / 2, top + 14, w, 12);
    g.fillStyle(C.stone, 1).fillRect(cx - w / 2, bottom - 18, w, 18);
    g.fillStyle(C.stoneDark, 0.7).fillRect(cx - w / 2, bottom - 4, w, 4);
    // banner
    const by = top + 44, bw = 50, bh = 130;
    g.fillStyle(0x8a6a4a, 1).fillRect(cx - bw / 2 - 4, by - 4, bw + 8, 5);
    g.fillStyle(C.banner, 1).fillPoints([{ x: cx - bw / 2, y: by }, { x: cx + bw / 2, y: by }, { x: cx + bw / 2, y: by + bh }, { x: cx, y: by + bh - 18 }, { x: cx - bw / 2, y: by + bh }] as Phaser.Math.Vector2[], true);
    g.fillStyle(C.bannerDark, 1).fillRect(cx + bw / 2 - 8, by, 8, bh - 4);
    g.lineStyle(1, C.gold, 0.6).lineBetween(cx - bw / 2 + 4, by + 5, cx - bw / 2 + 4, by + bh - 7);
    g.lineStyle(1, C.stoneLight, 0.12).lineBetween(cx - 12, by + 4, cx - 12, by + bh - 12);
    g.lineStyle(2.5, C.gold, 1);
    const cy = by + 52;
    g.strokePoints([{ x: cx - 13, y: cy + 8 }, { x: cx - 15, y: cy - 8 }, { x: cx - 6, y: cy }, { x: cx, y: cy - 12 }, { x: cx + 6, y: cy }, { x: cx + 15, y: cy - 8 }, { x: cx + 13, y: cy + 8 }] as Phaser.Math.Vector2[], true);
    // top light
    const light = this.add.graphics().setDepth(bottom).setBlendMode(Phaser.BlendModes.ADD);
    for (let r = 30; r > 0; r -= 6) light.fillStyle(C.glow, 0.1).fillCircle(cx, top - 6, r);
    light.fillStyle(0xffffff, 1).fillCircle(cx, top - 6, 4);
  }

  private drawAmbient() {
    const g = this.add.graphics().setDepth(9000);
    g.fillGradientStyle(0x2a1f7a, 0x2a1f7a, 0x2a1f7a, 0x2a1f7a, 0, 0, 0.25, 0.25).fillRect(0, H - 200, W, 200);
  }
}
