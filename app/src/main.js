// Neon Coast Cover Studio — the editor.
// Wires the controls to the cover renderer: photo uploads, layout and grade
// pickers, caption editing, per-panel crop by dragging, undo/redo, and PNG
// export in the three post sizes. A `?shot=` query sets up a fixed scene
// for a screenshot instead (./shots.js).
import { drawCover, GRADES, LAYOUTS, POST_SIZES, layoutPanels, renderCoverCanvas } from './cover.js';
import { CoverHistory, cloneState, defaultState, ensurePanels } from './state.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

let state = defaultState();
let history = new CoverHistory(state);
let photoImages = new Map();
let photoCounter = 0;
let selectedPanel = 0;
let wheelPushAt = 0;

function setStatus(message) {
  statusEl.textContent = message;
}

// Loads an image from a URL, resolving to the image once it can be drawn.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // The cover still draws with fallback fonts if a font file is missing.
  }
}

function commit() {
  history.push(state);
  renderAll();
}

function applyState(next) {
  state = cloneState(next);
  ensurePanels(state);
  if (selectedPanel >= state.panels.length) selectedPanel = 0;
  renderAll();
}

function renderPreview() {
  const size = POST_SIZES[state.size];
  const longSide = 960;
  const scale = longSide / Math.max(size.width, size.height);
  preview.width = Math.round(size.width * scale);
  preview.height = Math.round(size.height * scale);
  const ctx = preview.getContext('2d');
  drawCover(ctx, preview.width, preview.height, state, photoImages);
  drawSelectionOutline(ctx);
}

function drawSelectionOutline(ctx) {
  if (selectedPanel < 0 || selectedPanel >= state.panels.length) return;
  const panels = layoutPanels(state.layout, preview.width, preview.height);
  const panel = panels[selectedPanel];
  if (!panel) return;
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  if (panel.rot) ctx.rotate(panel.rot);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  ctx.restore();
}

function renderPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  state.photos.forEach((photo) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb';
    thumb.title = `${photo.name} — click to remove`;
    const img = photoImages.get(photo.id);
    if (img) {
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = photo.name;
      thumb.appendChild(el);
    }
    thumb.addEventListener('click', () => removePhoto(photo.id));
    strip.appendChild(thumb);
  });
  const count = $('photoCount');
  count.textContent = `${state.photos.length} / 4 photos`;
}

function renderPanelControls() {
  const select = $('panelPhoto');
  select.innerHTML = '';
  state.photos.forEach((photo) => {
    const option = document.createElement('option');
    option.value = photo.id;
    option.textContent = photo.name;
    select.appendChild(option);
  });
  const crop = state.panels[selectedPanel];
  if (crop) {
    select.value = crop.photoId ?? '';
    $('zoomRange').value = String(Math.round((crop.zoom ?? 1) * 100));
    $('zoomValue').textContent = `${Math.round((crop.zoom ?? 1) * 100)}%`;
  }
  const used = crop && photoImages.get(crop.photoId);
  const usedName = used ? state.photos.find((p) => p.id === crop.photoId)?.name : 'none';
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${state.panels.length} — ${usedName}`;
}

function renderAll() {
  renderPreview();
  renderPhotoStrip();
  renderPanelControls();
  $('undoBtn').disabled = !history.canUndo;
  $('redoBtn').disabled = !history.canRedo;
  syncPickers();
}

function syncPickers() {
  document.querySelectorAll('#layoutButtons button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeSwatches button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeButtons button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  if ($('title').value !== state.title) $('title').value = state.title;
  if ($('subtitle').value !== state.subtitle) $('subtitle').value = state.subtitle;
  if ($('badge').value !== state.badge) $('badge').value = state.badge;
  $('showBadge').checked = state.showBadge;
  $('halftone').checked = state.halftone;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
}

async function addPhotoImage(id, name, img) {
  photoImages.set(id, img);
  state.photos.push({ id, name, w: img.naturalWidth, h: img.naturalHeight });
  ensurePanels(state);
  renderAll();
}

async function loadSamplePhoto(name) {
  const id = `sample-${name}`;
  if (photoImages.has(id)) return;
  const img = await loadImage(`samples/${name}.jpg`);
  await addPhotoImage(id, name === 'pier' ? 'Pier at dusk' : 'Boulevard', img);
}

async function loadSamples() {
  try {
    await loadSamplePhoto('pier');
    await loadSamplePhoto('boulevard');
    setStatus('Sample photos loaded — drag a panel to reframe it.');
  } catch {
    setStatus('Could not load the sample photos.');
  }
}

function removePhoto(id) {
  photoImages.delete(id);
  state.photos = state.photos.filter((p) => p.id !== id);
  ensurePanels(state);
  commit();
  setStatus('Photo removed.');
}

function selectPanel(index) {
  selectedPanel = index;
  renderAll();
}

// Which panel (if any) a point on the preview canvas falls in, accounting
// for the tilted snapshots' rotation.
function hitTestPanel(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * preview.width;
  const y = ((clientY - rect.top) / rect.height) * preview.height;
  const panels = layoutPanels(state.layout, preview.width, preview.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const cos = Math.cos(-p.rot);
    const sin = Math.sin(-p.rot);
    const lx = cos * (x - cx) - sin * (y - cy);
    const ly = sin * (x - cx) + cos * (y - cy);
    if (Math.abs(lx) <= p.w / 2 && Math.abs(ly) <= p.h / 2) return i;
  }
  return -1;
}

function setupDragging() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener('pointerdown', (e) => {
    const hit = hitTestPanel(e.clientX, e.clientY);
    if (hit === -1) {
      selectPanel(-1);
      return;
    }
    selectPanel(hit);
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging || selectedPanel < 0) return;
    const rect = preview.getBoundingClientRect();
    const crop = state.panels[selectedPanel];
    if (!crop) return;
    const panels = layoutPanels(state.layout, preview.width, preview.height);
    const panel = panels[selectedPanel];
    // How far the photo can slide before its edge meets the panel's edge.
    const img = photoImages.get(crop.photoId);
    let maxOx = 0.45;
    let maxOy = 0.45;
    if (img) {
      const scale = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight) * (crop.zoom ?? 1);
      maxOx = Math.max(0, (img.naturalWidth * scale - panel.w) / (2 * panel.w));
      maxOy = Math.max(0, (img.naturalHeight * scale - panel.h) / (2 * panel.h));
    }
    crop.ox = Math.max(-maxOx, Math.min(maxOx, crop.ox + ((e.clientX - lastX) / rect.width) * (preview.width / panel.w)));
    crop.oy = Math.max(-maxOy, Math.min(maxOy, crop.oy + ((e.clientY - lastY) / rect.height) * (preview.height / panel.h)));
    lastX = e.clientX;
    lastY = e.clientY;
    renderPreview();
    renderPanelControls();
  });
  preview.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = false;
      history.push(state);
      renderAll();
    }
  });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (selectedPanel < 0) return;
    const crop = state.panels[selectedPanel];
    if (!crop) return;
    const now = Date.now();
    if (now - wheelPushAt > 500) {
      history.push(state);
      wheelPushAt = now;
    }
    crop.zoom = Math.max(1, Math.min(3, crop.zoom * (1 - e.deltaY * 0.001)));
    renderPreview();
    renderPanelControls();
  }, { passive: false });
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

async function exportSize(sizeKey) {
  await ensureFonts();
  const size = POST_SIZES[sizeKey];
  const canvas = renderCoverCanvas(sizeKey, state, photoImages);
  const filename = `neon-coast-cover-${sizeKey}-${size.width}x${size.height}.png`;
  await downloadCanvas(canvas, filename);
  setStatus(`Saved ${filename}`);
  return filename;
}

async function exportAllSizes() {
  for (const key of Object.keys(POST_SIZES)) {
    await exportSize(key);
    await new Promise((r) => setTimeout(r, 300));
  }
  setStatus('Saved all three sizes — square, portrait and wide.');
}

function buildPickers() {
  const layoutBox = $('layoutButtons');
  Object.entries(LAYOUTS).forEach(([id, layout]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = id;
    b.textContent = layout.label;
    b.addEventListener('click', () => {
      state.layout = id;
      ensurePanels(state);
      selectedPanel = 0;
      commit();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('gradeSwatches');
  Object.entries(GRADES).forEach(([id, grade]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.grade = id;
    b.title = grade.label;
    b.style.background = `linear-gradient(135deg, ${grade.accent}, ${grade.shadow})`;
    const label = document.createElement('span');
    label.textContent = grade.label;
    b.appendChild(label);
    b.addEventListener('click', () => {
      state.grade = id;
      commit();
    });
    gradeBox.appendChild(b);
  });
  const sizeBox = $('sizeButtons');
  Object.entries(POST_SIZES).forEach(([id, size]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = id;
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.size = id;
      commit();
    });
    sizeBox.appendChild(b);
  });
}

function setupControls() {
  $('photoFile').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      if (state.photos.length >= 4) {
        setStatus('Four photos at most — remove one to add another.');
        break;
      }
      photoCounter += 1;
      const id = `photo-${photoCounter}`;
      try {
        const img = await loadImage(URL.createObjectURL(file));
        await addPhotoImage(id, file.name.replace(/\.[^.]+$/, ''), img);
      } catch {
        setStatus(`Could not read ${file.name}.`);
      }
    }
    e.target.value = '';
    history.push(state);
    renderAll();
  });
  $('loadSamples').addEventListener('click', loadSamples);
  $('title').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('title').addEventListener('change', () => history.push(state));
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  $('subtitle').addEventListener('change', () => history.push(state));
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; renderPreview(); });
  $('badge').addEventListener('change', () => history.push(state));
  [['showBadge', 'showBadge'], ['halftone', 'halftone'], ['grain', 'grain'], ['vignette', 'vignette']].forEach(([id, key]) => {
    $(id).addEventListener('change', (e) => {
      state[key] = e.target.checked;
      commit();
    });
  });
  $('undoBtn').addEventListener('click', () => {
    const prev = history.undo();
    if (prev) applyState(prev);
  });
  $('redoBtn').addEventListener('click', () => {
    const next = history.redo();
    if (next) applyState(next);
  });
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
    e.preventDefault();
    const next = e.shiftKey ? history.redo() : history.undo();
    if (next) applyState(next);
  });
  $('panelPhoto').addEventListener('change', (e) => {
    const crop = state.panels[selectedPanel];
    if (crop) {
      crop.photoId = e.target.value;
      commit();
    }
  });
  $('zoomRange').addEventListener('input', (e) => {
    const crop = state.panels[selectedPanel];
    if (!crop) return;
    crop.zoom = Number(e.target.value) / 100;
    renderPreview();
    renderPanelControls();
  });
  $('zoomRange').addEventListener('change', () => history.push(state));
  $('resetCropBtn').addEventListener('click', () => {
    const crop = state.panels[selectedPanel];
    if (crop) {
      crop.ox = 0;
      crop.oy = 0;
      crop.zoom = 1;
      commit();
    }
  });
  $('fillAllBtn').addEventListener('click', () => {
    const crop = state.panels[selectedPanel];
    if (!crop) return;
    state.panels.forEach((p) => { p.photoId = crop.photoId; });
    commit();
    setStatus('One photo now fills every panel.');
  });
  $('exportSquare').addEventListener('click', () => exportSize('square'));
  $('exportPortrait').addEventListener('click', () => exportSize('portrait'));
  $('exportWide').addEventListener('click', () => exportSize('wide'));
  $('exportAll').addEventListener('click', exportAllSizes);
}

// The shot scenes (./shots.js) drive the same editor through this API.
const studioApi = {
  ensureFonts,
  async loadSamples() {
    await loadSamples();
  },
  async renderShot(config) {
    state = defaultState();
    Object.assign(state, config);
    state.photos = [];
    photoImages = new Map();
    await loadSamples();
    ensurePanels(state);
    selectedPanel = -1;
    const size = POST_SIZES[state.size];
    preview.width = size.width;
    preview.height = size.height;
    const ctx = preview.getContext('2d');
    drawCover(ctx, size.width, size.height, state, photoImages);
  },
  async setupEditorShot(config) {
    Object.assign(state, config);
    await loadSamples();
    ensurePanels(state);
    selectedPanel = 0;
    renderAll();
  },
};

buildPickers();
setupControls();
setupDragging();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  document.body.classList.add('shot-mode');
  runShot(shot, new URLSearchParams(location.search), studioApi);
} else {
  ensurePanels(state);
  renderAll();
  ensureFonts().then(() => {
    renderPreview();
    loadSamples();
  });
}
