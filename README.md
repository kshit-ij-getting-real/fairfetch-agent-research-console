# fairfetch-agent-research-console

MacroScout Agent Console: a Next.js App Router demo for FairFetch's tokenized research loop.

## Local development

```bash
npm install
npm run dev
```

Set env vars:

- `NEXT_PUBLIC_FAIRFETCH_BACKEND_URL`
- `NEXT_PUBLIC_DEFAULT_RESEARCH_URL` (optional)

## Flow covered

1. Configure backend + auth and agent headers.
2. Select URL + license and mint spend token.
3. Redeem token for content and receipt.
4. Show receipt as audit trail proof block.
5. Persist last 5 research runs in localStorage.

## Deployment note

Vercel/Next.js 14 does not support `next.config.ts` during build. Keep configuration in `next.config.js` (or `next.config.mjs`) to avoid build failures.
