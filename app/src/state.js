// Neon Coast Cover Studio — the cover state.
// The state is plain JSON (photo ids only; the images live in the editor's
// photo store), so undo/redo is just a stack of snapshots.

import { LAYOUTS, POST_SIZES, titleBandHeight } from './cover.js';

// One crop per panel: which photo fills it, and how it is framed.
export function defaultCrop(photoId) {
  return { photoId, ox: 0, oy: 0, zoom: 1 };
}

// A fresh crop for a tall photo in a much wider panel would land on the
// photo's middle — usually a torso. Bias it up so the visible slice starts
// about 15% down the photo, where the faces are, instead of the middle.
function smartDefaultOy(state, panelIndex, photoId) {
  const photo = state.photos.find((p) => p.id === photoId);
  if (!photo || !photo.w || !photo.h) return 0;
  const size = POST_SIZES[state.size] ?? POST_SIZES.wide;
  const bandH = titleBandHeight(state.layout, size.height);
  const regionH = state.layout === 'fullbleed' ? size.height : size.height - bandH;
  const panel = (LAYOUTS[state.layout] ?? LAYOUTS['hero-three']).panels[panelIndex];
  if (!panel) return 0;
  const panelAspect = (panel.w * size.width) / (panel.h * regionH);
  const photoAspect = photo.w / photo.h;
  const ratio = panelAspect / photoAspect;
  if (ratio <= 1.6) return 0;
  return ratio * 0.35 - 0.5;
}

export function panelCount(layoutId) {
  return (LAYOUTS[layoutId] ?? LAYOUTS['hero-three']).panels.length;
}

// A fresh cover: hero-and-three, Vice Sunset grade, the two sample photos
// cycling through the panels, title block on.
export function defaultState() {
  return {
    layout: 'hero-three',
    grade: 'vice-sunset',
    size: 'wide',
    title: 'NEON COAST',
    subtitle: 'a vice city story',
    badge: 'VICE CITY • 2026',
    showBadge: true,
    halftone: true,
    grain: true,
    vignette: true,
    photos: [],
    panels: [],
  };
}

// Makes sure state.panels has one crop per panel of the current layout,
// keeping old crops where they still fit and cycling the loaded photos.
// When the cover still shows a single photo everywhere and a second photo
// arrives, the panels re-cycle across both (keeping each panel's framing).
export function ensurePanels(state) {
  const count = panelCount(state.layout);
  const ids = state.photos.map((p) => p.id);
  const assigned = new Set(state.panels.map((p) => p?.photoId).filter(Boolean));
  const recycle = assigned.size <= 1 && ids.length > 1;
  const next = [];
  for (let i = 0; i < count; i++) {
    const old = state.panels[i];
    if (!recycle && old && ids.includes(old.photoId)) {
      next.push(old);
      continue;
    }
    const photoId = ids.length ? ids[i % ids.length] : null;
    const crop = defaultCrop(photoId);
    crop.oy = smartDefaultOy(state, i, photoId);
    if (old) {
      crop.ox = old.ox;
      crop.zoom = old.zoom;
      if (!recycle) crop.oy = old.oy;
    }
    next.push(crop);
  }
  state.panels = next;
  return state;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

// Undo/redo over JSON snapshots of the state.
export class CoverHistory {
  constructor(state) {
    this.past = [];
    this.future = [];
    this.present = cloneState(state);
  }

  push(state) {
    this.past.push(this.present);
    if (this.past.length > 60) this.past.shift();
    this.future = [];
    this.present = cloneState(state);
  }

  undo() {
    if (!this.past.length) return null;
    this.future.push(this.present);
    this.present = this.past.pop();
    return cloneState(this.present);
  }

  redo() {
    if (!this.future.length) return null;
    this.past.push(this.present);
    this.present = this.future.pop();
    return cloneState(this.present);
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}
