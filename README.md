# Hover Image Preview

Chrome extension for:
- Hover image previews on links
- Right-click word definitions with synonyms, antonyms, and source links

## Features
- Preview images by hovering links that point to image content
- Right-click selected text and choose **Define**
- Popup includes:
  - Word + phonetic (when available)
  - Definitions
  - Synonyms
  - Antonyms
  - Origin/etymology (when available)
  - Source links (Wikipedia / Merriam-Webster)
- Settings/history stored in Chrome extension storage
- Sync support across desktop Chrome profiles (same account, sync enabled)

## Project Files
- `manifest.json` — Extension manifest (MV3)
- `background.js` — Service worker, API fetches, context menu
- `contentScript.js` — Hover preview + definition popup UI logic
- `content.css` — Popup styles
- `storage.js` — User state and history storage helpers
- `options.html` / `options.js` — Settings page
- `package-extension.ps1` — One-command zip packaging
- `PRE_RELEASE_CHECKLIST.md` — Release checklist
- `STORE_LISTING_TEMPLATE.md` — Chrome Web Store copy/paste template
- `PRIVACY_POLICY.md` — Privacy policy text
- `RELEASE_NOTES.md` — Version history

## Local Install (Development)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder

## Usage
- **Image preview:** hover over links on any site
- **Define word:** highlight a word, right-click, choose **Define: <word>**

## Packaging for Upload
From this folder in PowerShell:

```powershell
.\package-extension.ps1
```

Output zip is created in `dist/` as:
- `chrome-hover-preview-vX.Y.Z.zip`

## Chrome Web Store (Unlisted) Quick Steps
1. Open Developer Dashboard: https://chrome.google.com/webstore/devconsole
2. Upload latest zip from `dist/`
3. Fill listing/policy fields (use `STORE_LISTING_TEMPLATE.md`)
4. Set visibility to **Unlisted**
5. Submit for review

## Sync Notes
- Sync works across desktop Chrome profiles when:
  - same Google account is used
  - Chrome sync has **Extensions** + **Settings** enabled
- Chrome mobile generally does not support custom desktop extensions

## Version
Current working version in source: **1.1.3**
