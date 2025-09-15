# Adding a New Scholarship Ruleset

This project loads scholarship eligibility rules from JSON files (client) and from Convex DB (server). Follow this guide to add a new scholarship safely and predictably.

## 1) Create the rule file

- Location: `types/rules/{id}.json`
- Format: Array of rules (leaf or group). Each leaf should include a `messageKey` (and an optional `message` fallback).

Example (minimal):

```
[
  {
    "id": "min_ielts",
    "field": "ielts",
    "type": "minScore",
    "value": 6.5,
    "messageKey": "{id}.ielts.min",
    "message": "Your IELTS score does not meet the minimum."
  }
]
```

Notes:
- Use canonical field names expected by the engine (see `src/lib/mappers.ts`). If your UI field names differ, extend the mapper.
- You can include group rules: `{ operator: 'all'|'any', rules: [...] }`.

## 2) Add localization keys

- Files: `src/locales/en.json`, `src/locales/vi.json`
- Add translation for each `messageKey` you used in the JSON.

```
// en.json
{
  "{id}.ielts.min": "Your IELTS score does not meet the minimum"
}

// vi.json
{
  "{id}.ielts.min": "Điểm IELTS của bạn chưa đạt yêu cầu tối thiểu"
}
```

## 3) Validate locally

Run the validator:

```
npm run validate:rules
```

This checks JSON structure and ensures every `messageKey` exists in the locales.

## 4) Preview in client

The client loader discovers `types/rules/*.json` automatically. You can see discovered IDs in the Admin page (see below).

## 5) Publish to server (Convex)

Use the Admin Ruleset Registry (open the app with `?admin=1`):

- Paste your `types/rules/{id}.json` content into the form.
- Set `scholarshipId` to `{id}` and choose a `version`.
- Tick "Set as active" to activate.
- Submit.

Server-side evaluation will use the active ruleset from DB. Client continues to use bundled files for preview; production evaluation should rely on the DB rules.

## 6) Field mapping

If your form uses different field names, update `src/lib/mappers.ts` to normalize to canonical keys (e.g., `englishScore -> ielts`, `yearsOfExperience -> workExperience`).

## 7) Testing

- Add unit tests if needed under `tests/`. See existing examples for the evaluator, loader, and mapper.
- CI will run validators and tests on every PR.

## Troubleshooting

- Missing translations: The validator reports missing `messageKey`s.
- Schema errors: Check the rule fields and structure; use the examples as reference.
- Not appearing in client list: ensure the file is under `types/rules/{id}.json` and the Vite build includes it.

