"""Build/check the public download, deterministically, using Python's stdlib."""
from pathlib import Path
import io, sys, zipfile
ROOT = Path(__file__).resolve().parents[1]
FILES = ['README.md', 'node/nurevo-aeo.js', 'nextjs/nurevo.ts', 'php/nurevo-aeo.php', 'static/robots.txt']
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in FILES:
        entry = zipfile.ZipInfo('nurevo-server-integration/' + name, (2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, (ROOT / 'integration-kit' / name).read_bytes())
result = buffer.getvalue()
target = ROOT / 'public/downloads/nurevo-server-integration.zip'
if '--check' in sys.argv:
    assert target.read_bytes() == result, 'ZIP missing/stale; run npm run build'
    assert '/downloads/nurevo-server-integration.zip' in (ROOT/'public/guide/integration.html').read_text()
else:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(result)
with zipfile.ZipFile(io.BytesIO(result)) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(FILES)
print('PASS integration ZIP: deterministic content, five expected files, CRC and guide link')
