# SEA MOVES

SEA MOVES is a fully static React + Vite scenario model. Its mode catalog and
trips, parking, and shuttle calculations run in the browser; production does not
depend on the former Flask/Render API.

## Local development

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm run lint
npm run test:local-preview
npm run build
```

The parity test pins the original backend's default mode shares, trip totals,
cumulative parking-shortfall behavior, construction cost, and disabled-shuttle
response.

## Production

Deploy `dist/` to the existing SEA MOVES Netlify site. A production bundle must
not contain `onrender.com`, `127.0.0.1:5001`, `/api/calculate`, or `axios`.

The legacy `SEA-MOVES-BACK` repository and Render service can remain available
during cutover, but the static frontend does not call them.
