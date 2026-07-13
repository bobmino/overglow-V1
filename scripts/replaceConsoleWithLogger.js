/**
 * Replace console.* with structured logger in app source (not scripts/tests).
 * Usage: node scripts/replaceConsoleWithLogger.js
 */
import fs from 'fs';
import path from 'path';

const roots = [
  { dir: 'backend', isFrontend: false },
  { dir: 'frontend/src', isFrontend: true },
  { dir: 'api', isFrontend: false },
];

const extraFiles = [
  { file: 'server.js', isFrontend: false },
  { file: 'config/db.js', isFrontend: false },
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'cypress', 'videos'].includes(e.name)) continue;
      walk(full, acc);
    } else if (/\.(js|jsx)$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function relativeImport(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

let changed = 0;

const jobs = [];
for (const root of roots) {
  for (const file of walk(root.dir)) {
    jobs.push({ file, isFrontend: root.isFrontend });
  }
}
for (const extra of extraFiles) {
  if (fs.existsSync(extra.file)) jobs.push(extra);
}

for (const { file, isFrontend } of jobs) {
  if (file.includes(`${path.sep}utils${path.sep}logger.js`) || file.includes('requestLogger.js')) continue;

  let src = fs.readFileSync(file, 'utf8');
  if (!/console\.(log|warn|error|debug|info)\s*\(/.test(src)) continue;

  const loggerFile = isFrontend ? 'frontend/src/utils/logger.js' : 'backend/utils/logger.js';

  let next = src
    .replace(/console\.log\s*\(/g, 'logger.info(')
    .replace(/console\.info\s*\(/g, 'logger.info(')
    .replace(/console\.debug\s*\(/g, 'logger.debug(')
    .replace(/console\.warn\s*\(/g, 'logger.warn(')
    .replace(/console\.error\s*\(/g, 'logger.error(');

  if (next === src) continue;

  if (!/from ['"].*logger(\.js)?['"]/.test(next)) {
    const imp = relativeImport(file, loggerFile);
    const importLine = `import { logger } from '${imp}';`;
    if (/^import\s/m.test(next)) {
      const lines = next.split('\n');
      let lastImport = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^import\s/.test(lines[i])) lastImport = i;
        else if (lastImport > 0 && lines[i].trim() && !/^import\s/.test(lines[i]) && !/^\s/.test(lines[i])) break;
      }
      lines.splice(lastImport + 1, 0, importLine);
      next = lines.join('\n');
    } else {
      next = `${importLine}\n${next}`;
    }
  }

  fs.writeFileSync(file, next);
  changed += 1;
  console.log('updated', file);
}

console.log(`Done: ${changed} files`);
