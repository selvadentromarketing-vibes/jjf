// A foreground wrapper around `astro preview` for Playwright's webServer.
//
// Astro 7 starts the preview server as a background process when it is not attached to a
// terminal and returns at once. Playwright treats a webServer command that exits as a failure
// ("Process from config.webServer exited early") even though the server is up. This starts it,
// stays alive while the tests run, and stops it when Playwright sends the signal.
import { spawnSync } from 'node:child_process';

const port = process.env.PORT || '4321';
const astro = new URL('../node_modules/.bin/astro', import.meta.url).pathname;
const run = (...args) => spawnSync(astro, args, { stdio: 'inherit' });

const started = run('preview', '--host', '--port', port);
if (started.status !== 0) process.exit(started.status ?? 1);

const stop = () => { run('preview', 'stop'); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
process.on('SIGHUP', stop);
setInterval(() => {}, 1 << 30);
