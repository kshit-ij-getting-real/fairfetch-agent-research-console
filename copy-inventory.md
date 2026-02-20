# Copy Inventory

## Routes and pages

| Route | Page file | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Main demo page with setup, request, receipt, verification, and history sections. |

## User-visible strings

| Route | File path | Component | Current text | Where it appears | User intent context |
|---|---|---|---|---|---|
| `/` | `app/layout.tsx` | Page metadata title | `MacroScout Helper Console` | Browser tab title | Identify the page in browser tabs/bookmarks. |
| `/` | `app/layout.tsx` | Page metadata description | `Demo workspace for requesting paid content and reviewing receipts` | Search/share metadata | Explain page purpose before opening it. |
| `/` | `app/page.tsx` | Header eyebrow | `FairFetch Demo Walkthrough` | Top header | Signal this is a guided demo experience. |
| `/` | `app/page.tsx` | Header title | `MacroScout Helper Console` | Top header | Name the console in plain language. |
| `/` | `app/page.tsx` | Intro block title | `What this page does` | Top explanatory block | Give viewers immediate orientation. |
| `/` | `app/page.tsx` | Intro block body | `Use this demo to request paid content in a few guided steps.` | Top explanatory block | Clarify overall outcome. |
| `/` | `app/page.tsx` | Intro block body | `You will create a one-time usage credit, load content, and review the receipt.` | Top explanatory block | Set expectations for flow steps. |
| `/` | `app/page.tsx` | Intro block body | `Each section tells you what to do next so non-technical viewers can follow along.` | Top explanatory block | Reassure ease of use for demos. |
| `/` | `app/page.tsx` | Setup section title | `Step 1: Enter your setup details` | Setup card heading | Indicate first action area. |
| `/` | `app/page.tsx` | Input label | `Service URL` | Setup form | Tell user where requests are sent. |
| `/` | `app/page.tsx` | Input label | `Access key` | Setup form | Tell user what credential to provide. |
| `/` | `app/page.tsx` | Input label | `App name` | Setup form | Identify caller name used in requests. |
| `/` | `app/page.tsx` | Input label | `Helper name` | Setup form | Name the helper in saved receipts. |
| `/` | `app/page.tsx` | Target section title | `Step 2: Choose content to open` | Target card heading | Move user to selecting content. |
| `/` | `app/page.tsx` | Input label | `Content URL` | Target form | Enter source page to access. |
| `/` | `app/page.tsx` | Select label | `Access type` | Target form | Pick type of access to request. |
| `/` | `app/page.tsx` | Select option | `Summary` | Access type options | Pick short-form access mode. |
| `/` | `app/page.tsx` | Select option | `Full article` | Access type options | Pick full-content access mode. |
| `/` | `app/page.tsx` | Input label | `Spending limit in micro-units (optional)` | Target form | Optionally cap maximum spend. |
| `/` | `app/page.tsx` | Credit section title | `Step 3: Create a usage credit` | Credit card heading | Start payment/permission step. |
| `/` | `app/page.tsx` | Primary button | `Create usage credit` | Credit action button | Create one-time code to unlock content. |
| `/` | `app/page.tsx` | Primary button loading | `Creating usage credit...` | Credit action button while pending | Show action progress state. |
| `/` | `app/page.tsx` | Status message | `We could not connect directly, so we switched to the built-in helper route.` | Credit status line | Explain automatic fallback behavior. |
| `/` | `app/page.tsx` | Status message | `We could not create a usage credit. Check your setup details and try again. (Code {status})` | Credit status line | Explain failure and suggest fix. |
| `/` | `app/page.tsx` | Status message | `We received a success reply, but the usage credit code was missing. Please try again.` | Credit status line | Explain incomplete success response. |
| `/` | `app/page.tsx` | Status message | `Usage credit created successfully.` | Credit status line | Confirm successful action. |
| `/` | `app/page.tsx` | Status message | `Something went wrong while creating a usage credit. Please try again.` | Credit status line | Handle unexpected errors plainly. |
| `/` | `app/page.tsx` | Helper warning | `If this step fails, the content source may not have pricing set up for this page and access type yet.` | Credit card note | Explain common failure cause in plain language. |
| `/` | `app/page.tsx` | Value label | `Usage credit code` | Credit result block | Label the generated one-time code. |
| `/` | `app/page.tsx` | Secondary button | `Copy usage credit code` | Credit result block | Let user copy generated code. |
| `/` | `app/page.tsx` | Details summary | `View technical response details` | Credit debug details | Optional deeper inspection for troubleshooting. |
| `/` | `app/page.tsx` | Content section title | `Step 4: Open the content` | Content card heading | Start retrieval step. |
| `/` | `app/page.tsx` | Primary button | `Open content` | Content action button | Load target content using created code. |
| `/` | `app/page.tsx` | Primary button loading | `Opening content...` | Content action button while pending | Show retrieval progress state. |
| `/` | `app/page.tsx` | Status message | `We could not connect directly, so we switched to the built-in helper route.` | Content status line | Explain automatic fallback behavior. |
| `/` | `app/page.tsx` | Status message | `We could not open the content with this usage credit. Create a new usage credit and try again. (Code {status})` | Content status line | Explain likely invalid/used code and next step. |
| `/` | `app/page.tsx` | Status message | `Content loaded successfully.` | Content status line | Confirm successful retrieval. |
| `/` | `app/page.tsx` | Status message | `Something went wrong while opening content. Please try again.` | Content status line | Handle unexpected errors plainly. |
| `/` | `app/page.tsx` | Preview title | `Content preview` | Content preview panel | Label retrieved snippet. |
| `/` | `app/page.tsx` | Empty state | `No content loaded yet. Click “Open content” after creating a usage credit.` | Content section when empty | Teach clear next step. |
| `/` | `app/page.tsx` | Details summary | `View technical response details` | Content debug details | Optional deeper inspection for troubleshooting. |
| `/` | `app/page.tsx` | Receipt section title | `Step 5: Review your receipt` | Receipt card heading | Move user to proof and record review. |
| `/` | `app/page.tsx` | Receipt subtitle | `Receipt = proof of what happened` | Receipt card subtitle | Explain why receipt matters. |
| `/` | `app/page.tsx` | Field label | `Reference ID` | Receipt details grid | Show unique event identifier. |
| `/` | `app/page.tsx` | Field label | `Amount (micro-units)` | Receipt details grid | Show amount charged. |
| `/` | `app/page.tsx` | Field label | `Domain` | Receipt details grid | Show source domain. |
| `/` | `app/page.tsx` | Field label | `Path` | Receipt details grid | Show source page path. |
| `/` | `app/page.tsx` | Field label | `Time` | Receipt details grid | Show event time. |
| `/` | `app/page.tsx` | Bullet | `Each usage credit can be used once.` | Receipt bullets | Explain one-time behavior. |
| `/` | `app/page.tsx` | Bullet | `Opening content creates a permanent receipt reference.` | Receipt bullets | Explain persistent record generation. |
| `/` | `app/page.tsx` | Bullet | `Use the reference ID to find the same event in reporting tools.` | Receipt bullets | Explain lookup path for validation. |
| `/` | `app/page.tsx` | Bullet | `Both sides should show matching amount and time details.` | Receipt bullets | Explain what to compare during verification. |
| `/` | `app/page.tsx` | Secondary button | `Copy receipt details` | Receipt panel | Copy verification-ready text block. |
| `/` | `app/page.tsx` | Empty state | `No receipt yet. Open content in Step 4 to generate and display your receipt.` | Receipt section when empty | Teach required preceding action. |
| `/` | `app/page.tsx` | Verify section title | `Step 6: Verify in reporting tools` | Verification card heading | Guide post-action validation. |
| `/` | `app/page.tsx` | Bullet | `Open the buyer view and search by reference ID.` | Verification checklist | Direct first verification task. |
| `/` | `app/page.tsx` | Bullet | `Open the publisher view and find the same source and reference ID.` | Verification checklist | Direct cross-check on second side. |
| `/` | `app/page.tsx` | Bullet | `Confirm the amount and time match the receipt on this page.` | Verification checklist | Clarify completion criteria. |
| `/` | `app/page.tsx` | External link text | `Open buyer view` | Verification links | Shortcut to buyer reporting view. |
| `/` | `app/page.tsx` | External link text | `Open publisher view` | Verification links | Shortcut to publisher reporting view. |
| `/` | `app/page.tsx` | History section title | `Recent activity (last 5)` | Activity card heading | Show reusable recent runs. |
| `/` | `app/page.tsx` | Empty state | `No saved activity yet. Complete Steps 3 and 4 to save your first receipt.` | Activity section when empty | Teach how records get created. |
| `/` | `app/page.tsx` | Item helper line | `Click to reload this setup` | Each history row | Clarify click action for row. |
