import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nodeBin = process.execPath;
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const children = [];
let shuttingDown = false;

function killAll(code) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (process.platform === 'win32') {
    const ids = children.map((c) => c.pid).filter(Boolean);
    for (const pid of ids) {
      try {
        spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
      } catch {
        /* ignore */
      }
    }
  } else {
    for (const child of children) {
      if (!child.killed) child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code ?? 0), 200);
}

function run(name, command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', windowsHide: true });
  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`);
    killAll(code ?? 1);
  });
  return child;
}

children.push(run('api', nodeBin, ['--env-file', '.env', 'dev-server.js']));
children.push(run('vite', nodeBin, [viteBin]));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => killAll(0));
}