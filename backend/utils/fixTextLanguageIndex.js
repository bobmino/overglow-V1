/**
 * MongoDB text indexes default language_override to field "language".
 * Our locale codes (fr/en/es/ar) conflict — especially "ar".
 * Call before seeding CMS content that includes Arabic.
 */
export async function ensureSafeTextIndexes(Model, indexName, fields) {
  const coll = Model.collection;
  let indexes = [];
  try {
    indexes = await coll.indexes();
  } catch {
    return;
  }
  for (const idx of indexes) {
    if (!idx.key || !Object.values(idx.key).includes('text')) continue;
    const override = idx.language_override || 'language';
    if (override === 'language') {
      await coll.dropIndex(idx.name);
    }
  }
  const existing = await coll.indexes();
  if (!existing.some((i) => i.name === indexName)) {
    await coll.createIndex(fields, {
      name: indexName,
      default_language: 'none',
      language_override: '_searchLang',
    });
  }
}
