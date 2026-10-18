# Home Energy Cost Calculator

Static site, plain HTML/CSS/JS, no build step and no dependencies.

- `src/calc.js`: pure calculation logic (no DOM). Keep all math here.
- `src/app.js`: DOM wiring and localStorage.
- `tests/`: unit tests with Node's built-in runner. Run `npm test` before finishing any change.
- `.github/workflows/deploy.yml`: runs tests, then deploys to GitHub Pages on push to `main`.

Never insert user-typed text with `innerHTML`; use `textContent`.
