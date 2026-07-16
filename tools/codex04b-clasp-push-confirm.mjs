// Executes the same clasp.files.push() operation used by `clasp push`.
// The CLI prompt cannot run in the automation shell; --force is never used.
import { resolve } from 'node:path';

const packageRoot = resolve(process.env.APPDATA, 'npm', 'node_modules', '@google', 'clasp', 'build', 'src');
const moduleUrl = (file) => `file:///${resolve(packageRoot, file).replace(/\\/g, '/')}`;
const { initAuth } = await import(moduleUrl('auth/auth.js'));
const { initClaspInstance } = await import(moduleUrl('core/clasp.js'));

const auth = await initAuth({ userKey: 'ios-dev' });
if (!auth.credentials) throw new Error('clasp credentials unavailable for ios-dev');
const clasp = await initClaspInstance({
  credentials: auth.credentials,
  configFile: process.cwd(),
});
const files = await clasp.files.push();
console.log(JSON.stringify({
  ok: true,
  commandSemantics: 'clasp.files.push',
  force: false,
  pushedFileCount: files.length,
  pushedFiles: files.map((file) => file.localPath),
}, null, 2));
