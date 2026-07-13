/**
 * Convert Tailwind physical directional utilities to logical (RTL-safe).
 * Run: node scripts/rtlLogicalCodemod.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '..', 'frontend', 'src');

const replacements = [
  // Order matters: longer tokens first
  [/rounded-tl-/g, 'rounded-ss-'],
  [/rounded-tr-/g, 'rounded-se-'],
  [/rounded-bl-/g, 'rounded-es-'],
  [/rounded-br-/g, 'rounded-ee-'],
  [/rounded-l-/g, 'rounded-s-'],
  [/rounded-r-/g, 'rounded-e-'],
  [/\bborder-l-/g, 'border-s-'],
  [/\bborder-r-/g, 'border-e-'],
  [/\bborder-l\b/g, 'border-s'],
  [/\bborder-r\b/g, 'border-e'],
  [/\btext-left\b/g, 'text-start'],
  [/\btext-right\b/g, 'text-end'],
  // margins / paddings
  [/\bml-/g, 'ms-'],
  [/\bmr-/g, 'me-'],
  [/\bpl-/g, 'ps-'],
  [/\bpr-/g, 'pe-'],
  // positioning (avoid left/right in non-class contexts via word boundary + digit/auto/full)
  [/\bleft-(\[|[0-9]|auto|full|px)/g, 'start-$1'],
  [/\bright-(\[|[0-9]|auto|full|px)/g, 'end-$1'],
  // inset helpers
  [/\binset-x-/g, 'inset-inline-'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
    } else if (/\.(jsx?|tsx?|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let changedFiles = 0;
let totalReplacements = 0;

for (const file of walk(srcRoot)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  for (const [pattern, replacement] of replacements) {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      const matches = before.match(pattern);
      totalReplacements += matches ? matches.length : 1;
    }
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles += 1;
    console.log('updated', path.relative(srcRoot, file));
  }
}

console.log(`Done: ${changedFiles} files, ~${totalReplacements} replacements`);
