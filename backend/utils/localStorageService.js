import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

/**
 * Répertoire uploads (volume Docker ou dossier projet).
 * STORAGE_DRIVER=local écrit ici ; servi via express.static('/uploads').
 */
export const getUploadDir = () => {
  const fromEnv = (process.env.UPLOAD_DIR || 'uploads').trim();
  return path.isAbsolute(fromEnv) ? fromEnv : path.join(ROOT, fromEnv);
};

export const ensureUploadDir = async (subdir = '') => {
  const dir = subdir ? path.join(getUploadDir(), subdir) : getUploadDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

/**
 * Écrit un buffer sur disque et retourne l’URL publique `/uploads/...`.
 * @param {Buffer} buffer
 * @param {string} filename — ex. uuid.webp
 * @param {string} [subdir] — ex. documents
 * @returns {Promise<{ url: string, absolutePath: string, filename: string }>}
 */
export const saveBufferToUploads = async (buffer, filename, subdir = '') => {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new Error('Invalid upload buffer');
  }
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const dir = await ensureUploadDir(subdir);
  const absolutePath = path.join(dir, safeName);
  await fs.writeFile(absolutePath, buffer);
  const urlPath = subdir
    ? `/uploads/${subdir.replace(/\\/g, '/')}/${safeName}`
    : `/uploads/${safeName}`;
  logger.info(`Saved upload: ${urlPath}`);
  return { url: urlPath, absolutePath, filename: safeName };
};

export const isLocalStorageEnabled = () => {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
  return driver === 'local' || driver === 'disk';
};
