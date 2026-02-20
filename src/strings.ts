export const APP_STRINGS = {
  metadata: {
    title: "MacroScout Helper Console",
    description: "Demo workspace for requesting paid content and reviewing receipts"
  },
  header: {
    eyebrow: "FairFetch Demo Walkthrough",
    title: "MacroScout Helper Console",
    introTitle: "What this page does",
    introLines: [
      "Use this demo to request paid content in a few guided steps.",
      "You will create a one-time usage credit, load content, and review the receipt.",
      "Each section tells you what to do next so non-technical viewers can follow along."
    ]
  },
  setup: {
    title: "Step 1: Enter your setup details",
    backendUrl: "Service URL",
    apiKey: "Access key",
    userAgent: "App name",
    helperLabel: "Helper name"
  },
  target: {
    title: "Step 2: Choose content to open",
    url: "Content URL",
    license: "Access type",
    summary: "Summary",
    display: "Full article",
    maxPrice: "Spending limit in micro-units (optional)"
  },
  credit: {
    title: "Step 3: Create a usage credit",
    ctaIdle: "Create usage credit",
    ctaBusy: "Creating usage credit...",
    warning:
      "If this step fails, the content source may not have pricing set up for this page and access type yet.",
    passLabel: "Usage credit code",
    copyCta: "Copy usage credit code",
    detailsSummary: "View technical response details",
    fallback:
      "We could not connect directly, so we switched to the built-in helper route.",
    fail: "We could not create a usage credit. Check your setup details and try again.",
    missing: "We received a success reply, but the usage credit code was missing. Please try again.",
    success: "Usage credit created successfully.",
    requestError: "Something went wrong while creating a usage credit. Please try again."
  },
  content: {
    title: "Step 4: Open the content",
    ctaIdle: "Open content",
    ctaBusy: "Opening content...",
    previewTitle: "Content preview",
    empty:
      "No content loaded yet. Click “Open content” after creating a usage credit.",
    detailsSummary: "View technical response details",
    fallback:
      "We could not connect directly, so we switched to the built-in helper route.",
    fail: "We could not open the content with this usage credit. Create a new usage credit and try again.",
    success: "Content loaded successfully.",
    requestError: "Something went wrong while opening content. Please try again."
  },
  receipt: {
    title: "Step 5: Review your receipt",
    subtitle: "Receipt = proof of what happened",
    helperName: "Helper name",
    sourceUrl: "Source URL",
    accessType: "Access type",
    amount: "Amount (micro-units)",
    reference: "Reference ID",
    time: "Time",
    appName: "App name",
    bullet1: "Each usage credit can be used once.",
    bullet2: "Opening content creates a permanent receipt reference.",
    bullet3: "Use the reference ID to find the same event in reporting tools.",
    bullet4: "Both sides should show matching amount and time details.",
    copyCta: "Copy receipt details",
    empty:
      "No receipt yet. Open content in Step 4 to generate and display your receipt."
  },
  verify: {
    title: "Step 6: Verify in reporting tools",
    bullet1: "Open the buyer view and search by reference ID.",
    bullet2: "Open the publisher view and find the same source and reference ID.",
    bullet3: "Confirm the amount and time match the receipt on this page.",
    consumerLink: "Open buyer view",
    publisherLink: "Open publisher view"
  },
  history: {
    title: "Recent activity (last 5)",
    empty:
      "No saved activity yet. Complete Steps 3 and 4 to save your first receipt.",
    itemHint: "Click to reload this setup"
  }
} as const;
