GoDrishti Landing Page - Source Package

- src/, public/ and config files: full landing-page source (TanStack Start + Tailwind v4).
- assets-real/: the actual media used by the page (hero video, logo, sensor photo, poster, story and udder images).
  In the Lovable project these live behind .asset.json pointers; this folder holds the raw files.
- Install with: bun install (or npm install), then run: bun run dev

Note: src/routes/index.tsx in this package imports the media files directly from
src/assets/ (the Lovable project used .asset.json pointer files, which were
replaced with the real files here).
