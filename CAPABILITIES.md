# FairFetch Demo Capabilities Map

1. **Configure backend URL and API key**
   - Location: Advanced controls → Setup panel.

2. **Configure agent identity inputs that affect calls (agent label, user agent)**
   - Location: Advanced controls → Setup panel.
   - Usage: sent on token mint request headers.

3. **Choose target URL and license type (SUMMARY or DISPLAY)**
   - Location: Demo run → Target report input and License type selector.

4. **Optional max price cap**
   - Location: Demo run → Max price micros.

5. **Mint spend token (POST /api/tokens)**
   - Location: Primary action button **Run licensed fetch**.
   - Flow: step 1 in progress tracker.

6. **Redeem token for content (GET /api/content)**
   - Location: Primary action button **Run licensed fetch**.
   - Flow: step 2 in progress tracker.

7. **Show content preview and show receipt with txId**
   - Location: Demo run output cards → Returned content and Receipt.

8. **Copy receipt and copy proof block**
   - Location: Receipt card buttons.

9. **Show last 5 runs history (localStorage) and allow reselecting a run**
   - Location: Recent runs section.

10. **Show troubleshooting details (HTTP status, error message, request id if present)**
    - Location: Error card toggle and Advanced controls → Technical details.

11. **Optional proxy fallback for CORS (route handlers)**
    - Location: Internal network behavior in `app/api/proxy/tokens/route.ts` and `app/api/proxy/content/route.ts`.

12. **Optional demonstration of human paywall vs licensed AI view**
    - Location: Demo run → Use licensed access marker toggle.
    - Output label in Returned content card changes based on `via=fairfetch`.
