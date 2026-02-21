# Chrome Extension Pre-Release Checklist (Unlisted)

## 1) Code + version
- [ ] Confirm extension works locally via `chrome://extensions` → **Load unpacked**.
- [ ] Update `manifest.json` version (increment from last release).
- [ ] Remove/confirm any demo-only text you do not want in production.
- [ ] Confirm no console errors on key flows (image preview, word define popup).

## 2) Required listing assets
- [ ] Extension name and short description finalized.
- [ ] Detailed description prepared.
- [ ] At least one screenshot ready.
- [ ] 128x128 icon ready (and other sizes if used).
- [ ] Support/contact email available.
- [ ] Privacy policy URL prepared if requested by data usage form.

## 3) Store compliance choices
- [ ] Set publisher declaration: **Trader** or **Non-trader** (EEA prompt).
- [ ] For personal/hobby use, choose **Non-trader**.
- [ ] Confirm all permissions are necessary and accurately described.

## 4) Package correctly
- [ ] Zip the extension contents directly (do not zip a parent wrapper folder).
- [ ] Ensure zip includes: `manifest.json`, scripts, styles, options page, icons.

## 5) Upload as Unlisted
- [ ] Open Chrome Web Store Developer Dashboard.
- [ ] Click **New Item** and upload zip.
- [ ] Complete store listing and policy sections.
- [ ] Set visibility/distribution to **Unlisted**.
- [ ] Submit for review.

## 6) Post-approval install + sync test
- [ ] Install from the unlisted listing URL on Device A.
- [ ] Install from the same listing URL on Device B (same Google account/profile).
- [ ] In Chrome sync settings, ensure **Extensions** and **Settings** sync are enabled.
- [ ] On Device A: look up 3–5 words.
- [ ] On Device B: verify settings/history sync after a short delay.

## 7) Release notes log
- [ ] Save release date, version, and what changed.
- [ ] Keep the unlisted URL in your project notes.
