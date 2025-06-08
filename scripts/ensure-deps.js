// See CHANGELOG.md for 2025-06-08 [Added]
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const vitestPath = 'node_modules/.bin/vitest';
if (!existsSync(vitestPath)) {
  console.log('Installing project dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}
