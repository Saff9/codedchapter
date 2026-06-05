---
name: api-zod duplicate export conflict
description: lib/api-zod/src/index.ts must only re-export from generated/api, not generated/types
---

The orval codegen creates two output paths for lib/api-zod:
- `generated/api.ts` — Zod validators (e.g. CreatePostBody, CreateCommentBody)  
- `generated/types/` — TypeScript interfaces with the same names

Exporting both causes TS2308 duplicate-member errors when running tsc --build.

**Why:** Both files export the same names; `export *` from both creates an ambiguity error.

**How to apply:** Keep `lib/api-zod/src/index.ts` as:
```ts
export * from "./generated/api";
```
Do NOT add `export * from "./generated/types"` — TypeScript types are already available via api-client-react.
