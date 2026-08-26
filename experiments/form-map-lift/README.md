# Form Map Lift Experiment

This implements **THE TEST**:

```text
X% (no map) -> Y% (with map)
Y - X = business size
```

Decision thresholds are fixed before execution:

```text
Y - X >= 20pt  go all in
5-20pt         narrow to hard verticals such as government / insurance
< 5pt          stop
```

## Safety Constraints

- Never submit real sites.
- Never create fake accounts.
- Wait at least 60 seconds before revisiting the same site.
- Do not ignore robots.txt.
- `page.route()` must block POST / PUT / PATCH to the target origin.
- Any run with `submitted: true` is discarded.

## Human-Owned Inputs

Codex must not select the 20 real sites. Fill these by hand:

- `fixtures/sites.manifest.json`
- `fixtures/maps/{site_id}.json`

Each selected site must:

- be reachable without login
- have a registration / application / quote / inquiry form
- contain at least 8 fields
- have `robots_checked: true` before any run

## Commands

Summarize scored runs:

```bash
npm run form-map:summarize
```

Open one site with POST blocking in headed Chromium:

```bash
npm run form-map:run -- --site-id government_application_01 --arm A --trial 1 --headless false
```

The current runner writes the prompt and opens the page safely. It intentionally does not choose
sites or auto-generate maps.
