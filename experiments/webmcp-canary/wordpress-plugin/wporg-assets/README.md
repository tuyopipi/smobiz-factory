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

## Screenshots

`screenshot-1.png` to `screenshot-7.png` are the listing screenshots of 0.8.0.
The Nth caption in readme.txt's `== Screenshots ==` section describes
`screenshot-N.png`. Like the banners and icons they go in SVN `assets/`, not in
the plugin: `scripts/build-plugin-zip.mjs` ships an allowlist that does not
include them.

| File | Shows |
| --- | --- |
| `screenshot-1.png` | AEO score: 0-100 score, traffic-light badge, what AI cannot read, checklist |
| `screenshot-2.png` | Fix suggestions in the checklist (one-click llms.txt, business details) |
| `screenshot-3.png` | Settings: output switch, AI crawler rules, llms.txt, JSON-LD, store information |
| `screenshot-4.png` | The generated /llms.txt |
| `screenshot-5.png` | The Nurevo FAQ block in the block editor |
| `screenshot-6.png` | Per-page settings panel in the block editor sidebar |
| `screenshot-7.png` | First-run consent screen (nothing is sent before consent) |

They were captured from a local WordPress demo site ("Sakura Bistro") with the
English admin. A Japanese set was captured with the same numbering but is not
committed; wordpress.org shows `screenshot-N.png` for every language unless a
locale-specific file is added.
