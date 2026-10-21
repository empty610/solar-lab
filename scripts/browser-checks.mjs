import path from 'node:path';
import { spawn } from 'node:child_process';
import { sourceRoot } from './site.mjs';

const core = ['site', 'ui', 'model-runtime', 'loading', 'performance', 'activity', 'model-targets', 'authored-copy', 'recovered-copy', 'terminal-controls', 'archive-music'];
const extended = ['review', 'second-review', 'third-review', 'uranus', 'uranus-entry'];
const args = process.argv.slice(2);
const all = [...core, ...extended];
if (args.some(arg => arg !== '--all' && !all.includes(arg))) {
  console.error('Choose --all or one of: ' + all.join(', '));
  process.exitCode = 1;
} else {
  const selected = args.includes('--all') ? all : args.length ? args : core;
  for (const name of selected) {
    console.log('\nChecking: ' + name);
    const status = await new Promise(resolve => {
      const child = spawn(process.execPath, [path.join(sourceRoot, 'tests/browser/verify-' + name + '.cjs')], {
        cwd: sourceRoot, stdio: 'inherit', env: process.env,
      });
      child.on('error', error => { console.error(error.message); resolve(1); });
      child.on('exit', code => resolve(code ?? 1));
    });
    if (status !== 0) { process.exitCode = status; break; }
  }
}
