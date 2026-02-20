# Copy Changes

## Route: `/`

| Before | After | Reason |
|---|---|---|
| `FairFetch Technical Loop Demo` | `FairFetch Demo Walkthrough` | Removes technical jargon and clarifies this is a guided demo. |
| `MacroScout Agent Console` | `MacroScout Helper Console` | Replaces technical role wording with friendlier terminology. |
| _No page-level explainer_ | `What this page does` + 3 short lines | Adds self-explanatory orientation for non-technical viewers. |
| `Step 0: Configure` | `Step 1: Enter your setup details` | Uses plain language and natural step numbering. |
| `Backend URL` | `Service URL` | More understandable for non-technical viewers. |
| `API Key` | `Access key` | Removes banned technical acronym and keeps intent clear. |
| `User-Agent` | `App name` | Removes jargon and describes real meaning. |
| `Agent identity label` | `Helper name` | Enforces required “Helper” terminology. |
| `Step 1: Research target` | `Step 2: Choose content to open` | Clarifies action in plain words. |
| `Research URL` | `Content URL` | Uses user-friendly wording. |
| `License` | `Access type` | De-ambiguates selection intent. |
| `SUMMARY` / `DISPLAY` | `Summary` / `Full article` | Makes options readable for demos. |
| `maxPriceMicros (optional)` | `Spending limit in micro-units (optional)` | Explains unit and purpose clearly. |
| `Step 2: Mint token (POST /api/tokens)` | `Step 3: Create a usage credit` | Removes banned terms and protocol-level details. |
| `Mint Spend Token` | `Create usage credit` | Uses verb + object and plain terminology. |
| `Minting...` | `Creating usage credit...` | Keeps loading state aligned with new action wording. |
| `Token minting fails if...` | `If this step fails, the content source may not have pricing set up...` | Converts technical failure note into plain-English explanation. |
| `Token:` | `Usage credit code:` | Replaces banned term and clarifies what value is shown. |
| `Copy token` | `Copy usage credit code` | Verb + object; clear action outcome. |
| `Debug: Mint Response JSON` | `View technical response details` | Keeps optional diagnostics with softer wording. |
| `Direct call failed (likely CORS/network)...` | `We could not connect directly, so we switched...` | Removes jargon and focuses on what happened. |
| `Mint failed...` | `We could not create a usage credit...` | Error now explains issue and next step in plain English. |
| `Mint succeeded but token missing...` | `...usage credit code was missing. Please try again.` | Clarifies incomplete success state. |
| `Token minted successfully.` | `Usage credit created successfully.` | Consistent non-technical terminology. |
| `Mint request error...` | `Something went wrong while creating a usage credit...` | Plain, actionable error message. |
| `Step 3: Redeem token (GET /api/content)` | `Step 4: Open the content` | Removes protocol details and banned terms. |
| `Redeem Content` | `Open content` | Verb + object with simple phrasing. |
| `Redeeming...` | `Opening content...` | Consistent action wording. |
| `Token redeemed and content loaded.` | `Content loaded successfully.` | Removes banned term and keeps user goal centered. |
| `Redeem failed...` | `We could not open the content with this usage credit...` | Explains failure and recovery in plain language. |
| `Content Preview` | `Content preview` | Minor consistency edit for sentence casing. |
| _No content empty guidance_ | `No content loaded yet. Click “Open content”...` | Adds explicit next-step empty state guidance. |
| `Debug: Content Response JSON` | `View technical response details` | Keeps diagnostics without technical jargon in title. |
| `Step 4: Receipt + Transaction Proof` | `Step 5: Review your receipt` | Plain-language framing focused on user task. |
| `Receipt = Audit Trail` | `Receipt = proof of what happened` | Explains value in simpler words. |
| `txId` / `priceMicros` / `timestamp` labels | `Reference ID` / `Amount (micro-units)` / `Time` | Improves readability for non-technical viewers. |
| Technical receipt bullets about replay/ledger | Plain bullets about one-time use and matching records | Keeps meaning while removing jargon-heavy explanations. |
| `Copy Proof Block` | `Copy receipt details` | Uses clear verb + object wording. |
| `Redeem content to populate a receipt.` | `No receipt yet. Open content in Step 4...` | Better empty state with explicit next step. |
| `Step 5: How to verify in FairFetch dashboards` | `Step 6: Verify in reporting tools` | Simplifies language and keeps instruction-oriented tone. |
| `Consumer Dashboard` / `Publisher Dashboard` | `Open buyer view` / `Open publisher view` | Link text now action-oriented and consistent. |
| `Research Runs (last 5)` | `Recent activity (last 5)` | Replaces technical phrasing with general wording. |
| `No prior receipts stored yet.` | `No saved activity yet. Complete Steps 3 and 4...` | Empty state now teaches how to proceed. |
| _No history row helper copy_ | `Click to reload this setup` | Clarifies what clicking a history row does. |
