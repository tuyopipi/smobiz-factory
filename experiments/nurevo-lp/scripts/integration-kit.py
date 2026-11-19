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
    # Compare what is inside, not the compressed bytes: deflate output differs
    # between zlib builds (e.g. zlib vs zlib-ng), so a byte comparison fails on
    # a machine other than the one that built the ZIP.
    def entries(data):
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            return [(i.filename, i.date_time, i.external_attr, i.compress_type, archive.read(i)) for i in archive.infolist()]
    assert target.exists() and entries(target.read_bytes()) == entries(result), 'ZIP missing/stale; run npm run build'
    assert '/downloads/nurevo-server-integration.zip' in (ROOT/'public/guide/integration.html').read_text()
else:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(result)
with zipfile.ZipFile(io.BytesIO(result)) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(FILES)
print('PASS integration ZIP: deterministic content, five expected files, CRC and guide link')
