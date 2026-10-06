# Dashboard assets: cutover notes

Not a task list for now — this records the order a future production deploy has
to follow. Nothing here has been applied to production.

## What changed

`webmcp-canary/public/` is now the single source for the dashboard: the page and
all eight of its scripts live there and are served by the worker from its
`ASSETS` binding.

Before, three places supplied one page:

| Part | Served by | From |
| --- | --- | --- |
| `/dashboard` HTML | worker (zone route + ASSETS) | `webmcp-canary/public/dashboard.html` |
| 6 shared scripts | Pages | `nurevo-lp/public/dashboard-*.js` |
| `dashboard-rulesets.js`, `dashboard-aeo-metrics.js` | worker (Text import + per-file route) | `webmcp-canary/public/` |

The page and its scripts could therefore be updated independently and drift, and
the two copies of the six shared scripts had already diverged: the Pages copies
carried a `addNav()` helper and the role-based navigation hiding that the canary
copies had lost. The live content was copied across before the duplicates were
deleted, so the bytes served do not change.

## Cutover order

The dependency is one-way: the worker has to be serving all eight scripts
**before** the Pages copies disappear. Reverse the order and `/dashboard` loads
with six missing scripts for as long as the gap lasts.

1. **Deploy the worker.** It gains the `nurevo.jp/dashboard-*.js` route and
   serves all eight from `./public`. The Pages copies still exist at this point;
   the route simply takes precedence, so the page keeps working either way. This
   step is reversible on its own.
2. **Verify** every script answers 200 from the worker and matches the committed
   source — the same check used locally:
   `for f in csrf auth places members rulesets guidance aeo-metrics guide; do curl -sI https://nurevo.jp/dashboard-$f.js; done`
   Confirm the dashboard still renders the AEO score panel and the ruleset panel,
   since those two are the ones whose serving path changed.
3. **Only then deploy Pages** with the duplicates removed.

Rolling back after step 3 means restoring the Pages files; rolling back after
step 1 means reverting the worker. Doing step 3 first has no clean rollback,
because the scripts would be gone from both places at once.

## Note for whoever deploys this

`wrangler.jsonc` lost its `rules` entry: the two scripts were bundled into the
worker as `Text` modules. They are ordinary static assets and are now served from
`./public` like the rest, so the worker bundle gets smaller and there is no
longer a copy of them compiled into it.

`nurevo-lp/public/` keeps its own `/dashboard` links. Those still work — the
worker owns that path through its zone route, not Pages.
