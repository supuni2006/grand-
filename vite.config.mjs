// `npm run dev` now starts BOTH the website (Vite) and the account/order server (server.js),
// and forwards /api requests from Vite to the server. No second terminal needed.
import { spawn } from 'node:child_process';
import net from 'node:net';

const API_PORT = 3000;

function apiServer() {
  let child;
  return {
    name: 'start-api-server',
    configureServer() {
      const probe = net.connect(API_PORT, '127.0.0.1');
      probe.on('connect', () => {
        probe.destroy();
        console.log(`[api] server already running on port ${API_PORT}`);
      });
      probe.on('error', () => {
        child = spawn(process.execPath, ['server.js'], {
          stdio: 'inherit',
          env: { ...process.env, PORT: String(API_PORT) },
        });
        child.on('exit', (code) => { if (code) console.log(`[api] server.js stopped (code ${code}). Is port ${API_PORT} used by another app?`); });
      });
      const stop = () => { if (child) child.kill(); };
      process.on('exit', stop);
      process.on('SIGINT', () => { stop(); process.exit(); });
      process.on('SIGTERM', () => { stop(); process.exit(); });
    },
  };
}

export default {
  plugins: [apiServer()],
  server: { proxy: { '/api': `http://127.0.0.1:${API_PORT}` } },
};
