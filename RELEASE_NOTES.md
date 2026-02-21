# Release Notes

## 1.1.3 — 2026-02-21
- Fixed regression where definition popup could fail to appear if usage/history save encountered storage errors.
- Hardened word-history writes against malformed or missing synced data.

## 1.1.2 — 2026-02-21
- Internal quality/versioning update for next Web Store submission.
- Updated package and docs workflow for versioned uploads.
- No intended user-facing behavior changes from 1.1.1.

## 1.1.1 — 2026-02-21
- Added richer word lookup results in popup:
  - Synonyms and antonyms when available.
  - Source links (Wikipedia and Merriam-Webster).
- Added free-source fallback behavior for definition lookups.
- Removed free-tier daily definition limit (unlimited lookups).
- Improved cross-device sync reliability by compacting stored history payload.
- Added packaging and release helper docs/scripts.
