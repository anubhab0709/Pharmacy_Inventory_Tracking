import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

const mode = process.argv[2] || 'start';
const port = Number(process.env.PORT || 4000);

function clearPort(portNumber) {
  try {
    const output = execSync(`lsof -ti tcp:${portNumber}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!output) return;

    const pids = output.split(/\s+/).filter(Boolean);
    for (const pid of pids) {
      if (Number(pid) !== process.pid) {
        try {
          process.kill(Number(pid), 'SIGKILL');
        } catch {
          // Ignore stale processes that disappeared while we were stopping them.
        }
      }
    }
    console.log(`Stopped ${pids.length} existing process(es) on port ${portNumber}.`);
  } catch {
    // No process is bound to the port.
  }
}

clearPort(port);

const command = mode === 'dev' ? 'nodemon' : 'node';
const args = ['server.js'];
const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
