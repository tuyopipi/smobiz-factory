// Test-only safety boundary: mocks may replace fetch, but never fall through to live services.
import net from 'node:net';
import tls from 'node:tls';
const deny=()=>{throw new Error('Network disabled in offline regression tests');};
globalThis.fetch=deny;
net.Socket.prototype.connect=deny;
tls.connect=deny;
