# Migration note — Operator status normalization (PROMPT 14)

## Context

Operator documents historically used mixed status values (e.g. `Verified`).
The Mongoose enum expects:

`Pending` | `Under Review` | `Active` | `Suspended` | `Rejected`

## Runtime fix (already in code)

`normalizeOperatorStatus` in:

- `backend/controllers/adminController.js`
- `backend/controllers/onboardingController.js`

Maps:

| Old value   | New value |
|-------------|-----------|
| `Verified`  | `Active`  |
| anything else invalid | `Pending` |

Applied on save via `saveOperatorSafely` (admin) / equivalent onboarding paths.

## Optional one-shot MongoDB script

Run only if you still see invalid statuses in Compass / logs:

```js
// mongosh — dry-run then update
db.operators.find({ status: { $nin: ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'] } })

db.operators.updateMany(
  { status: 'Verified' },
  { $set: { status: 'Active' } }
)

db.operators.updateMany(
  { status: { $nin: ['Pending', 'Under Review', 'Active', 'Suspended', 'Rejected'] } },
  { $set: { status: 'Pending' } }
)
```

No separate migration runner is required for day-to-day operation: normalization runs on write.
