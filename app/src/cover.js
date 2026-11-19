// Neon Coast Cover Studio — the cover renderer.
// Draws a multi-panel GTA-style poster cover onto any 2D canvas at any size:
// panels from a layout, a colour grade, Anton title lettering with a neon
// script subtitle, a halftone title block, a badge ribbon, grain + vignette.
// Pure canvas 2D, no libraries, no network.

// Post sizes the studio exports.
export const POST_SIZES = {
  square: { label: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide 1920 x 1080', width: 1920, height: 1080 },
};

// Panel layouts. Each panel is a fraction of the canvas; `rot` tilts a snapshot.
export const LAYOUTS = {
  'hero-three': {
    label: 'Hero + three',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6, rot: 0 },
      { x: 0, y: 0.612, w: 0.3253, h: 0.388, rot: 0 },
      { x: 0.3373, y: 0.612, w: 0.3253, h: 0.388, rot: 0 },
      { x: 0.6747, y: 0.612, w: 0.3253, h: 0.388, rot: 0 },
    ],
  },
  'grid4': {
    label: 'Four-panel grid',
    panels: [
      { x: 0, y: 0, w: 0.494, h: 0.494, rot: 0 },
      { x: 0.506, y: 0, w: 0.494, h: 0.494, rot: 0 },
      { x: 0, y: 0.506, w: 0.494, h: 0.494, rot: 0 },
      { x: 0.506, y: 0.506, w: 0.494, h: 0.494, rot: 0 },
    ],
  },
  'grid9': {
    label: 'Nine-panel grid',
    panels: [
      { x: 0, y: 0, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0.3367, y: 0, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0.6733, y: 0, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0, y: 0.3367, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0.3367, y: 0.3367, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0.6733, y: 0.3367, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0, y: 0.6733, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0.3367, y: 0.6733, w: 0.3267, h: 0.3267, rot: 0 },
      { x: 0.6733, y: 0.6733, w: 0.3267, h: 0.3267, rot: 0 },
    ],
  },
  'tilted': {
    label: 'Tilted snapshots',
    background: true,
    panels: [
      { x: 0.06, y: 0.05, w: 0.42, h: 0.42, rot: -0.09 },
      { x: 0.52, y: 0.03, w: 0.42, h: 0.42, rot: 0.06 },
      { x: 0.28, y: 0.5, w: 0.44, h: 0.42, rot: -0.03 },
    ],
  },
  'fullbleed': {
    label: 'Full-bleed hero',
    panels: [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }],
  },
};

// Colour grades: a wash gradient, an overlay tint, the lettering accents and
// the photo filter applied while each panel is drawn.
export const GRADES = {
  'vice-sunset': {
    label: 'Vice Sunset', washTop: 'rgba(255,94,98,0)', washBottom: 'rgba(255,60,120,0.30)',
    overlay: '#ff5e62', overlayAlpha: 0.10, accent: '#ff2e88', shadow: '#22d3ee',
    band: '#160a24', filter: 'saturate(1.25) contrast(1.06)',
  },
  'neon-night': {
    label: 'Neon Night', washTop: 'rgba(80,60,255,0.05)', washBottom: 'rgba(0,229,255,0.22)',
    overlay: '#4d5bff', overlayAlpha: 0.12, accent: '#00e5ff', shadow: '#ff2e88',
    band: '#070b1e', filter: 'saturate(1.3) contrast(1.1) brightness(0.95)',
  },
  'pastel-dawn': {
    label: 'Pastel Dawn', washTop: 'rgba(255,183,213,0.05)', washBottom: 'rgba(255,122,184,0.25)',
    overlay: '#ffb7d5', overlayAlpha: 0.10, accent: '#ff7ab8', shadow: '#7c5cff',
    band: '#2a1530', filter: 'saturate(1.1) brightness(1.05)',
  },
  'teal-noir': {
    label: 'Teal Noir', washTop: 'rgba(45,212,191,0.04)', washBottom: 'rgba(4,60,70,0.35)',
    overlay: '#0f766e', overlayAlpha: 0.12, accent: '#2dd4bf', shadow: '#f59e0b',
    band: '#04141a', filter: 'saturate(1.15) contrast(1.12) brightness(0.92)',
  },
  'golden-hour': {
    label: 'Golden Hour', washTop: 'rgba(255,183,3,0)', washBottom: 'rgba(255,140,0,0.30)',
    overlay: '#ffb703', overlayAlpha: 0.10, accent: '#ffb703', shadow: '#ff5e62',
    band: '#1d1005', filter: 'saturate(1.3) contrast(1.05) brightness(1.02)',
  },
};

// How tall the title band is, as a fraction of the canvas height.
export function titleBandHeight(layoutId, height) {
  if (layoutId === 'fullbleed') return height * 0.3;
  return height * 0.22;
}

// Panel rectangles in pixels for a layout at a canvas size. The panels live
// above the title band, except full-bleed, whose single panel is the canvas.
export function layoutPanels(layoutId, width, height) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS['hero-three'];
  const band = titleBandHeight(layoutId, height);
  const regionH = layoutId === 'fullbleed' ? height : height - band;
  return layout.panels.map((p) => ({
    x: p.x * width,
    y: p.y * regionH,
    w: p.w * width,
    h: p.h * regionH,
    rot: p.rot,
  }));
}

// Cover-fit draw of one photo into a panel rect, with a crop offset (ox, oy
// in fractions of the panel) and a zoom factor.
export function drawPhotoInto(ctx, photo, px, py, pw, ph, crop) {
  const zoom = crop?.zoom ?? 1;
  const ox = crop?.ox ?? 0;
  const oy = crop?.oy ?? 0;
  const scale = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight) * zoom;
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  const dx = px + (pw - dw) / 2 + ox * pw;
  const dy = py + (ph - dh) / 2 + oy * ph;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

// A small tile of random grain, reused as a repeating pattern.
let grainTile = null;
export function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 28;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return grainTile;
}

function drawHalftoneDots(ctx, x, y, w, h, color, alpha) {
  const spacing = Math.max(9, w / 110);
  const rows = Math.floor(h / spacing);
  const cols = Math.floor(w / spacing);
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const cy = y + r * spacing;
      const frac = (cy - y) / Math.max(1, h);
      const radius = spacing * (0.14 + 0.3 * frac);
      ctx.beginPath();
      ctx.arc(x + c * spacing + (r % 2 ? spacing / 2 : 0), cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, filled, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(angle) * rad;
    const py = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, r * 0.18);
    ctx.stroke();
  }
  ctx.restore();
}

// The heat meter: five stars under the subtitle, four lit.
function drawHeatMeter(ctx, cx, cy, size, color) {
  const gap = size * 2.4;
  const total = gap * 4;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, cx - total / 2 + i * gap, cy, size, i < 4, color);
  }
}

// A corner ribbon with the badge text, top right.
function drawBadgeRibbon(ctx, width, text, accent) {
  if (!text.trim()) return;
  const size = Math.max(12, width * 0.012);
  ctx.save();
  ctx.letterSpacing = '0px';
  ctx.font = `${size}px Anton, sans-serif`;
  const textW = ctx.measureText(text.toUpperCase()).width;
  const ribbonW = textW + size * 2.4;
  const ribbonH = size * 2.1;
  // Centre the ribbon on the corner, rotated 45 degrees, set one ribbon-height
  // in from the corner so the whole badge text stays on the canvas.
  ctx.translate(width, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = accent;
  ctx.fillRect(-ribbonW / 2, ribbonH, ribbonW, ribbonH);
  ctx.fillStyle = '#14081f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, ribbonH + ribbonH / 2 + size * 0.06);
  ctx.restore();
}

// The title block: halftone band, Anton title with outline + neon offset
// shadow, Pacifico subtitle, heat meter. Drawn over the bottom band.
function drawTitleBlock(ctx, width, height, state, grade) {
  const bandH = titleBandHeight(state.layout, height);
  const bandY = height - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, height);
  band.addColorStop(0, grade.band);
  band.addColorStop(1, '#000000');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, width, bandH);
  if (state.halftone) {
    drawHalftoneDots(ctx, 0, bandY, width, bandH * 0.55, grade.accent, 0.3);
  }
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, height * 0.004);
  ctx.beginPath();
  ctx.moveTo(width * 0.06, bandY + 1);
  ctx.lineTo(width * 0.94, bandY + 1);
  ctx.stroke();

  const title = (state.title || '').trim().toUpperCase();
  const cx = width / 2;
  let titleSize = bandH * 0.42;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (title) {
    ctx.letterSpacing = `${titleSize * 0.05}px`;
    ctx.font = `${titleSize}px Anton, sans-serif`;
    while (ctx.measureText(title).width > width * 0.9 && titleSize > 12) {
      titleSize -= 2;
      ctx.letterSpacing = `${titleSize * 0.05}px`;
      ctx.font = `${titleSize}px Anton, sans-serif`;
    }
    const titleY = bandY + bandH * 0.42;
    const off = Math.max(2, titleSize * 0.045);
    ctx.fillStyle = grade.shadow;
    ctx.fillText(title, cx + off, titleY + off);
    ctx.lineWidth = Math.max(2, titleSize * 0.07);
    ctx.strokeStyle = '#0d0518';
    ctx.strokeText(title, cx, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, titleY);
  }

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const subSize = Math.max(12, bandH * 0.17);
    ctx.save();
    ctx.letterSpacing = '0px';
    ctx.translate(cx, bandY + bandH * 0.74);
    ctx.rotate(-0.02);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
    drawHeatMeter(ctx, cx, bandY + bandH * 0.9, Math.max(5, bandH * 0.045), grade.accent);
  }
}

// Draws the whole cover for a state onto ctx at width x height.
// `photos` maps a photo id to a loaded HTMLImageElement.
export function drawCover(ctx, width, height, state, photos) {
  const grade = GRADES[state.grade] ?? GRADES['vice-sunset'];
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['hero-three'];
  ctx.save();
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, width, height);

  const panels = layoutPanels(state.layout, width, height);
  const photoAt = (i) => {
    const crop = state.panels[i];
    if (!crop) return null;
    const img = photos.get(crop.photoId);
    return img ? { img, crop } : null;
  };

  // Tilted layout: one photo washes the whole canvas behind the snapshots.
  if (layout.background) {
    const bg = photoAt(0);
    if (bg) {
      ctx.save();
      ctx.filter = 'brightness(0.5) saturate(1.15)';
      drawPhotoInto(ctx, bg.img, 0, 0, width, height, { zoom: 1.1, ox: 0, oy: 0 });
      ctx.restore();
    }
  }

  panels.forEach((panel, i) => {
    const slot = photoAt(i);
    if (!slot) return;
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (panel.rot) ctx.rotate(panel.rot);
    ctx.translate(-cx, -cy);
    if (panel.rot) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = width * 0.02;
      ctx.shadowOffsetY = width * 0.008;
    }
    const border = panel.rot ? Math.max(6, width * 0.008) : 0;
    ctx.beginPath();
    ctx.rect(panel.x - border, panel.y - border, panel.w + border * 2, panel.h + border * 2);
    if (panel.rot) {
      ctx.fillStyle = '#f8f4ec';
      ctx.fill();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
    ctx.filter = grade.filter;
    drawPhotoInto(ctx, slot.img, panel.x, panel.y, panel.w, panel.h, slot.crop);
    ctx.restore();
    ctx.restore();
  });

  // The grade wash: a sunset/neon gradient plus a soft overlay tint.
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = grade.overlayAlpha;
  ctx.fillStyle = grade.overlay;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Full-bleed needs a scrim so the title stays readable over the photo.
  if (state.layout === 'fullbleed') {
    const bandH = titleBandHeight(state.layout, height);
    const scrim = ctx.createLinearGradient(0, height - bandH * 1.6, 0, height);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, height - bandH * 1.6, width, bandH * 1.6);
  }

  drawTitleBlock(ctx, width, height, state, grade);
  if (state.showBadge) drawBadgeRibbon(ctx, width, state.badge, grade.accent);

  if (state.vignette) {
    const vig = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.42,
      width / 2, height / 2, Math.max(width, height) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }
  if (state.grain) {
    const pattern = ctx.createPattern(getGrainTile(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  ctx.restore();
}

// Renders a cover to a fresh canvas at one of the post sizes.
export function renderCoverCanvas(sizeKey, state, photos) {
  const size = POST_SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  drawCover(canvas.getContext('2d'), size.width, size.height, state, photos);
  return canvas;
}
