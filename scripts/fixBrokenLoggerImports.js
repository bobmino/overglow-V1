import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const re = /import \{[ \t]*\r?\nimport \{ logger \} from ['"]([^'"]+)['"];\r?\n/g;
const files = walk(process.cwd());
let fixed = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes("import { logger }")) continue;
  const next = src.replace(re, (_m, from) => `import { logger } from '${from}';\nimport {\n`);
  if (next !== src) {
    fs.writeFileSync(file, next);
    fixed += 1;
    console.log('FIXED', path.relative(process.cwd(), file));
  }
}

console.log('Total fixed:', fixed);
