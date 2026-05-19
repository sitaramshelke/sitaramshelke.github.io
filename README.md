# sitaramshelke.github.io

Personal website for [sitaramshelke.me](https://sitaramshelke.me), rebuilt as a small Astro static site.

## Development

```sh
npm ci --ignore-scripts
npm run dev
```

The local preview runs at `http://127.0.0.1:3000/` when using the current dev command.

## Build

```sh
npm run build
```

The static output is written to `dist/`. The GitHub Actions workflow deploys that folder to GitHub Pages.

## Security checks

```sh
npm run security
```

This runs `npm audit`, verifies npm registry signatures, and checks the lockfile for non-registry tarballs, missing integrity metadata, unexpected install scripts, blocked package names, and unpinned direct dependencies.
