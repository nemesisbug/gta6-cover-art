# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nemesisbug/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nemesisbug/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline, in-browser maker for GTA-style multi-panel poster covers, built
for the make.fun competition **gta6-cover-art-01**.

## What it does

- Turn your photos (up to 4 uploads, or the two bundled samples) plus a
  caption into poster cover art, exported as PNG in **1080 × 1080**,
  **1080 × 1350** and **1920 × 1080** — one click each, or all three at once.
- **5 layouts**: Hero + three, four-panel grid, nine-panel grid, tilted
  snapshots, full-bleed hero. One photo can fill several panels, or several
  photos can share the cover.
- **Per-panel crop**: click a panel, drag it to reframe the photo, scroll to
  zoom; pick which photo each panel shows, reset the crop, or fill every
  panel with one photo.
- **5 colour grades**: Vice Sunset, Neon Night, Pastel Dawn, Teal Noir,
  Golden Hour — each a wash + overlay tint + photo filter.
- **Lettering**: Anton title with outline and neon offset shadow, Pacifico
  script subtitle, halftone title block, badge ribbon, a five-star heat
  meter, film grain and vignette.
- **Undo / redo** (buttons or Ctrl+Z / Ctrl+Shift+Z) and a live preview.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. Everything is plain static files under
`app/` — vanilla JS + canvas 2D, no libraries, no network requests. The
fonts (Anton, Pacifico) are vendored under `app/fonts/` with their SIL Open
Font License texts. No Rockstar Games logo, artwork or fonts are used
anywhere; the sample photos were made with an image model for make.fun and
are free to use.

## Screenshots

The four screenshots in `screenshots/` are drawn by the app itself through
its `?shot=` scenes (`app/src/shots.js`): `cover`, `editor`, `portrait` and
`square`.
