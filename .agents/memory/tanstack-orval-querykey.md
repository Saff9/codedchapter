---
name: TanStack Query v5 + Orval queryKey requirement
description: Orval-generated hooks' query option requires queryKey in TanStack Query v5
---

When passing `{ query: { enabled: boolean } }` to orval-generated hooks, TanStack Query v5 requires `queryKey` inside the `query` object.

**Why:** TanStack Query v5 made `queryKey` required in `UseQueryOptions`, so orval's generated hook signature propagates this requirement.

**How to apply:** Import and pass the companion `getXxxQueryKey(id)` helper alongside `enabled`:
```ts
import { useGetPost, getGetPostQueryKey } from "@workspace/api-client-react";
useGetPost(id, { query: { enabled: !!id, queryKey: getGetPostQueryKey(id) } });
```
