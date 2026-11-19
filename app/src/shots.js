// Fixed scenes for screenshots: ?shot=cover shows a full-frame exported wide
// cover, ?shot=portrait a portrait cover, ?shot=square a square cover, and
// ?shot=editor the editor with a sample photo loaded. Each scene uses the
// sample photos and a fixed caption, and sets window.__shotReady once the
// fonts are in and the cover is painted.
const SHOT_SCENES = {
  cover: {
    size: 'wide', layout: 'hero-three', grade: 'vice-sunset',
    title: 'NEON COAST', subtitle: 'a vice city story', badge: 'VICE CITY • 2026',
  },
  portrait: {
    size: 'portrait', layout: 'grid4', grade: 'neon-night',
    title: 'NEON COAST', subtitle: 'after dark in vice city', badge: 'VICE CITY • 2026',
  },
  square: {
    size: 'square', layout: 'grid9', grade: 'pastel-dawn',
    title: 'PIER PRESSURE', subtitle: 'nine frames of vice city', badge: 'VICE CITY • 2026',
  },
  editor: {
    size: 'wide', layout: 'hero-three', grade: 'vice-sunset',
    title: 'BOULEVARD QUEEN', subtitle: 'queen of the coast', badge: 'VICE CITY • 2026',
  },
};

export async function runShot(shot, query, api) {
  const scene = SHOT_SCENES[shot];
  if (!scene) {
    window.__shotReady = true;
    return;
  }
  const config = { ...scene };
  const caption = query.get('caption');
  if (caption) config.title = caption;
  await api.ensureFonts();
  if (shot === 'editor') {
    document.body.classList.add('shot-editor');
    await api.setupEditorShot(config);
  } else {
    document.body.classList.add('shot-cover');
    await api.renderShot(config);
  }
  await api.ensureFonts();
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
