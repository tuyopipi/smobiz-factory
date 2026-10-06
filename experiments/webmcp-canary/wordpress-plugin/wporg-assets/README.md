# wordpress.org directory assets

The banner and icon images shown on the plugin's wordpress.org listing page.

**These are not part of the plugin.** They belong in the SVN checkout's own
`assets/` directory, which sits next to `trunk/` and `tags/`:

```
nurevo-webmcp/          <- svn checkout root
├── assets/             <- these files go here
├── tags/
└── trunk/              <- the plugin itself (npm run plugin:build output)
```

Release 0.4.0 shipped them inside `trunk/` by mistake, so every user downloaded
~8 KB of banner art they never see. `scripts/build-plugin-zip.mjs` ships an
allowlist that deliberately excludes them; the plugin's own runtime artwork
(`assets/icon.svg`, `assets/logo.svg`) is separate and is bundled.

Updating these files takes effect on the listing page as soon as they are
committed to SVN — no plugin release is required.

| File | Where it appears |
| --- | --- |
| `banner-1544x500.png` | listing header, retina |
| `banner-772x250.png` | listing header, standard |
| `icon-256x256.png` | search results, retina |
| `icon-128x128.png` | search results, standard |

The copies here were recovered from the published 0.4.0 zip, which bundled them
inside `trunk/`. They are *not* the images the listing page uses: the real ones
live in SVN `assets/` and are larger (the 1544x500 banner is 100 KB there versus
4.5 KB here). Prefer the SVN copies as the source of truth.

Both carry Nurevo branding only - the banner reads "Get your business found by AI
search / Server-side schema.org - llms.txt - AI crawler ready" and the icon is
the bare brand mark. Nothing says "WebMCP", so the 0.4.0 to 0.5.0 rename needed
no artwork change.

## Still missing: screenshots

`screenshot-1.png`, `screenshot-2.png`, … also belong in this directory, and
readme.txt gains a matching `== Screenshots ==` section whose Nth caption
describes `screenshot-N.png`. Neither exists yet, so the section is deliberately
absent from readme.txt rather than listing captions with no images behind them.

Worth capturing when they are drawn:

1. The AEO score screen — score, traffic-light alert, checklist.
2. A one-click fix being applied (basic schema, llms.txt, AI crawler access).
3. The settings screen — extracted business data and SEO-plugin coexistence.
