# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nemesisbug/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nemesisbug/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline, in-browser maker for GTA-style multi-panel poster covers, built for the make.fun competition gta6-cover-art-01. Pick your photos, add a caption, choose a layout and a colour grade, and export a finished cover — everything runs locally in your browser, with no uploads and no account.

## What it does

- **Photos:** upload up to 4 of your own photos, or start from the two bundled sample photos.
- **Caption to cover:** turn a photo and a caption into poster cover art in a few clicks.
- **PNG export:** 1080x1080, 1080x1350, and 1920x1080.
- **5 layouts:** Hero + three, four-panel grid, nine-panel grid, tilted snapshots, and full-bleed hero.
- **Per-panel crop:** drag to reposition and scroll to zoom each photo inside its panel.
- **5 colour grades:** Vice Sunset, Neon Night, Pastel Dawn, Teal Noir, and Golden Hour.
- **Lettering and dressing:** Anton title lettering with outline and neon shadow, Pacifico script subtitle, halftone title block, badge ribbon, five-star heat meter, film grain, and vignette.
- **Editing comfort:** undo/redo and a live preview, so every change shows up on the cover right away.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser.

The app is plain static files under `app/` — vanilla JavaScript and canvas 2D, no libraries, and no network requests. The Anton and Pacifico fonts are vendored under `app/fonts/` with their SIL OFL licence texts included. It contains no Rockstar Games logo, artwork, or fonts. The sample photos were made with an image model for make.fun and are free to use.

## Screenshots

The four screenshots in `screenshots/` are drawn by the app itself, through its `?shot=` scenes in `app/src/shots.js`: cover, editor, portrait, and square.
