import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/Page\.jsx$/.test(e.name)) acc.push(full);
  }
  return acc;
}

const pages = walk('frontend/src/pages');
const FR_WORDS =
  /\b(Retour|Connexion|Enregistrer|Chargement|Erreur|Confirmer|Annuler|Rechercher|Aucun|Voir|Créer|Supprimer|Modifier|Tableau|Réservation|Expérience|Mot de passe|Adresse|Bienvenue|Aucun)\b/g;

const rows = pages.map((p) => {
  const s = fs.readFileSync(p, 'utf8');
  const hasT = /useTranslation/.test(s);
  const hardCommon = (s.match(FR_WORDS) || []).length;
  return { file: path.basename(p), hasT, hardCommon, lines: s.split('\n').length };
});

rows.sort((a, b) => a.hasT - b.hasT || b.hardCommon - a.hardCommon || b.lines - a.lines);

console.log('total pages', rows.length);
console.log('with i18n', rows.filter((r) => r.hasT).length);
console.log('without i18n', rows.filter((r) => !r.hasT).length);
console.log('\n=== WITHOUT useTranslation ===');
rows.filter((r) => !r.hasT).forEach((r) => console.log(`${r.hardCommon}\t${r.lines}\t${r.file}`));
console.log('\n=== WITH i18n but FR signals ===');
rows
  .filter((r) => r.hasT && r.hardCommon > 3)
  .forEach((r) => console.log(`${r.hardCommon}\t${r.lines}\t${r.file}`));
