import { spawn } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Linux'ta Expo Electron sandbox hatasını önler.
 * Windows/macOS'ta env prefix gerekmez; `ELECTRON_DISABLE_SANDBOX=1 npm start` orada kırılır.
 */
if (platform() === 'linux') {
  process.env.ELECTRON_DISABLE_SANDBOX = '1';
}

const extraArgs = process.argv.slice(2);
const child = spawn('npx', ['expo', 'start', ...extraArgs], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
