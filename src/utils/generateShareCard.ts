import type { Alumnus } from '../data/alumni';
import alcomSrc from '../assets/alcom-logo.png';
import alumniSrc from '../assets/xlri-alumni-logo.png';

const W = 1080;
const H = 1350;
const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"DM Sans", Inter, system-ui, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, w = 0.18) {
  const k = r * w;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + k, cy - k);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + k, cy + k);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - k, cy + k);
  ctx.lineTo(cx - r, cy);
  ctx.lineTo(cx - k, cy - k);
  ctx.closePath();
  ctx.fill();
}

/** Draw text with manual letter-spacing (works on every browser), centred on x. */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = 'center';
  return total;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: string, family: string, start: number, maxW: number) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 2;
  } while (size > 20);
  return size;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateShareCard(alumnus: Alumnus, base: string): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`500 96px ${SERIF}`),
    document.fonts.load(`italic 400 40px ${SERIF}`),
    document.fonts.load(`500 28px ${SANS}`),
    document.fonts.load(`600 28px ${SANS}`),
  ]).catch(() => undefined);

  const [alumniLogo, alcomLogo, portrait] = await Promise.all([
    loadImage(alumniSrc),
    loadImage(alcomSrc),
    alumnus.portrait ? loadImage(`${base}${alumnus.portrait}`) : Promise.resolve(null),
  ]);

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0B1D35');
  bg.addColorStop(0.5, '#071426');
  bg.addColorStop(1, '#0B1D35');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(7,20,38,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(140, 160, 700, 'rgba(40,87,131,0.35)');
  glow(980, 1250, 700, 'rgba(22,58,99,0.5)');
  glow(540, 480, 420, 'rgba(216,185,120,0.16)');

  // Stars (seeded so every card looks consistent)
  let seed = 77;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 230; i++) {
    const x = r() * W;
    const y = r() * H;
    const s = r() < 0.9 ? 0.6 + r() * 1.2 : 1.8 + r() * 1.4;
    ctx.globalAlpha = 0.25 + r() * 0.6;
    ctx.fillStyle = i % 10 === 0 ? '#F0DCA5' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Corner constellations
  const lines: [number, number][][] = [
    [[60, 260], [140, 220], [205, 290], [150, 360]],
    [[880, 300], [960, 250], [1020, 330]],
    [[60, 980], [125, 1030], [92, 1090]],
    [[955, 930], [1015, 985], [975, 1045]],
  ];
  ctx.strokeStyle = 'rgba(216,185,120,0.35)';
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#F0DCA5';
  for (const pts of lines) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    pts.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Inner frame
  ctx.strokeStyle = 'rgba(216,185,120,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 32, 32, W - 64, H - 64, 28);
  ctx.stroke();

  // Logos
  if (alumniLogo) {
    const h = 64;
    const w = (alumniLogo.width / alumniLogo.height) * h;
    ctx.fillStyle = 'rgba(246,243,234,0.96)';
    roundRect(ctx, 72, 70, w + 32, h + 20, 16);
    ctx.fill();
    ctx.drawImage(alumniLogo, 88, 80, w, h);
  }
  if (alcomLogo) {
    ctx.fillStyle = 'rgba(246,243,234,0.96)';
    ctx.beginPath();
    ctx.arc(W - 114, 112, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(alcomLogo, W - 156, 70, 84, 84);
  }

  // Eyebrow
  ctx.fillStyle = '#D8B978';
  ctx.font = `500 24px ${SANS}`;
  spaced(ctx, 'MY XLRI LEGACY MATCH', W / 2, 262, 7);

  // Portrait medallion
  const pcx = W / 2;
  const pcy = 470;
  const pr = 150;
  ctx.strokeStyle = 'rgba(216,185,120,0.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 9]);
  ctx.beginPath();
  ctx.arc(pcx, pcy, pr + 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#F0DCA5';
  star(ctx, pcx, pcy - pr - 26, 11);

  ctx.save();
  ctx.beginPath();
  ctx.arc(pcx, pcy, pr, 0, Math.PI * 2);
  ctx.clip();
  const pg = ctx.createRadialGradient(pcx - 50, pcy - 60, 10, pcx, pcy, pr);
  pg.addColorStop(0, '#285783');
  pg.addColorStop(0.6, '#102B4E');
  pg.addColorStop(1, '#0B1D35');
  ctx.fillStyle = pg;
  ctx.fillRect(pcx - pr, pcy - pr, pr * 2, pr * 2);
  if (portrait) {
    // cover-fit, biased to the top so faces are not cut off
    const s = Math.max((pr * 2) / portrait.width, (pr * 2) / portrait.height);
    const w = portrait.width * s;
    const h = portrait.height * s;
    ctx.drawImage(portrait, pcx - w / 2, pcy - pr - Math.max(0, (h - pr * 2) * 0.15), w, h);
  } else {
    ctx.fillStyle = '#F0DCA5';
    ctx.font = `500 120px ${SERIF}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(alumnus.initials, pcx, pcy + 6);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
  ctx.strokeStyle = '#D8B978';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(pcx, pcy, pr, 0, Math.PI * 2);
  ctx.stroke();

  // Name
  ctx.fillStyle = '#F6F3EA';
  fitFont(ctx, alumnus.name, '500', SERIF, 104, W - 200);
  ctx.fillText(alumnus.name, W / 2, 742);

  // Archetype
  ctx.fillStyle = '#D8B978';
  const archSize = fitFont(ctx, alumnus.archetype.toUpperCase(), '600', SANS, 28, W - 320);
  ctx.font = `600 ${archSize}px ${SANS}`;
  spaced(ctx, alumnus.archetype.toUpperCase(), W / 2, 800, 4);

  // Hairline
  const hl = ctx.createLinearGradient(W / 2 - 160, 0, W / 2 + 160, 0);
  hl.addColorStop(0, 'rgba(216,185,120,0)');
  hl.addColorStop(0.5, 'rgba(216,185,120,0.8)');
  hl.addColorStop(1, 'rgba(216,185,120,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(W / 2 - 160, 838, 320, 1.5);

  // Traits (first five) as centered wrapped pills
  ctx.font = `500 25px ${SANS}`;
  const traits = alumnus.traits.slice(0, 5);
  const padX = 24;
  const pillH = 54;
  const gap = 14;
  const maxRowW = W - 180;
  const rows: string[][] = [[]];
  let rowW = 0;
  for (const t of traits) {
    const w = ctx.measureText(t).width + padX * 2;
    if (rowW + w > maxRowW && rows[rows.length - 1].length) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push(t);
    rowW += w + gap;
  }
  let y = 878;
  for (const row of rows) {
    const widths = row.map((t) => ctx.measureText(t).width + padX * 2);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
    let x = W / 2 - total / 2;
    row.forEach((t, i) => {
      ctx.fillStyle = 'rgba(16,43,78,0.85)';
      roundRect(ctx, x, y, widths[i], pillH, pillH / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(216,185,120,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#F0DCA5';
      ctx.textAlign = 'center';
      ctx.fillText(t, x + widths[i] / 2, y + 36);
      x += widths[i] + gap;
    });
    y += pillH + 14;
  }

  // Campaign line + hashtags
  ctx.fillStyle = '#D8B978';
  ctx.font = `500 44px ${SERIF}`;
  spaced(ctx, 'ONE XLRI. INFINITE LEGACIES.', W / 2, 1182, 5);
  ctx.fillStyle = '#AEBBCC';
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText('#XLRIHomecoming   #XLRIAlumni   #MyXLRIStory', W / 2, 1236);
  ctx.fillStyle = '#64758B';
  ctx.font = `500 19px ${SANS}`;
  spaced(ctx, 'HOMECOMING 2026  ·  XLRI JAMSHEDPUR', W / 2, 1278, 4);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
