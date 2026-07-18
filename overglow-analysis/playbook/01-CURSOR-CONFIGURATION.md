# 01 — Configuration Cursor (V1)

## Rules à utiliser

| Fichier | Activation |
|---------|------------|
| `.cursor/rules/general.mdc` | `alwaysApply: true` |
| `.cursor/rules/backend.mdc` | globs `backend/**`, `server.js`, `scripts/**` |
| `.cursor/rules/frontend.mdc` | globs `frontend/src/**` |
| `.cursorrules` | Rôle CTO + pointeur vers les `.mdc` |

**Ne pas** maintenir un monolithe de règles contradictoires (ex. Next.js + `/api/v1/trips` + React Query obligatoire partout).

## Comment briefer un agent

1. Lire `OVERGLOW-PLAYBOOK.md` + `plan de situation.md`.  
2. Pour le BO : `BACKOFFICE-UX-AUDIT.md`.  
3. Exécuter contre le **code**, pas contre d’anciens MD Desktop non importés.  
4. Tout contenu métier → Mongo ; seeds idempotents.  
5. Commit seulement sur demande ; pas de secrets.

## Ce qu’un second modèle (Fable, etc.) peut faire

- Audit **lecture seule** / synthèse après que ces docs sont alignés.  
- Ne pas lui donner un playbook fantôme comme vérité.

## MCP utiles (optionnel)

- Browser Cursor pour smoke UI login admin.  
- GitHub CLI (`gh`) pour PR si demandé.
