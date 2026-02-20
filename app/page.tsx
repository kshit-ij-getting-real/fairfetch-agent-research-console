"use client";

import { useEffect, useMemo, useState } from "react";

type LicenseType = "SUMMARY" | "DISPLAY";

type MintResponse = {
  token?: string;
  [key: string]: unknown;
};

type Receipt = {
  txId: string;
  priceMicros: number;
  domain: string;
  path: string;
  license?: LicenseType;
  timestamp: string;
  [key: string]: unknown;
};

type RedeemResponse = {
  content?: unknown;
  receipt?: Receipt;
  [key: string]: unknown;
};

type RunRecord = {
  id: string;
  timestamp: string;
  targetUrl: string;
  requestUrl: string;
  license: LicenseType;
  agentLabel: string;
  userAgent: string;
  receipt: Receipt;
  contentPreview: string;
};

type TechnicalState = {
  mintStatus?: number;
  redeemStatus?: number;
  mintError?: string;
  redeemError?: string;
  requestId?: string;
  mintRaw?: unknown;
  redeemRaw?: unknown;
};

const LOCAL_STORAGE_SETTINGS_KEY = "fairfetch-demo-settings";
const LOCAL_STORAGE_RUNS_KEY = "fairfetch-demo-runs";

const DEFAULT_TARGETS = [
  "https://fairfetch-publisher-macro-notes.vercel.app/premium/demo-article",
  "https://fairfetch-publisher-macro-notes.vercel.app/premium/fed-liquidity-watch",
  "https://fairfetch-publisher-macro-notes.vercel.app/premium/india-fii-flows"
];

const defaultBackendUrl = process.env.NEXT_PUBLIC_FAIRFETCH_BACKEND_URL ?? "";

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function maskApiKey(value: string) {
  if (!value) return "Not set";
  if (value.length < 8) return "••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

function buildLicensedUrl(url: string, license: LicenseType, useMarker: boolean) {
  if (!useMarker) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("via", "fairfetch");
    parsed.searchParams.set("license", license);
    return parsed.toString();
  } catch {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    params.set("via", "fairfetch");
    params.set("license", license);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }
}

function extractContentSnippet(content: unknown) {
  if (typeof content === "string") {
    return content.slice(0, 900);
  }
  if (content == null) {
    return "No content returned.";
  }
  return JSON.stringify(content, null, 2).slice(0, 900);
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const maybeJson = safeJsonParse(text);
  return {
    text,
    data: maybeJson ?? text
  };
}

function mapErrorMessage(status: number, body: unknown) {
  const bodyText = typeof body === "string" ? body.toLowerCase() : JSON.stringify(body).toLowerCase();
  if (status === 401 || status === 403) return "API key not accepted. Create a new key and try again.";
  if (bodyText.includes("pricing") || bodyText.includes("rule")) {
    return "No active pricing rule matches this domain, path, and license. Create a pricing rule under Publisher Pricing, then try again.";
  }
  if (status === 422 && bodyText.includes("max")) return "Price exceeds your max price limit.";
  if (status === 409 && bodyText.includes("max")) return "Price exceeds your max price limit.";
  return "Request failed. Open technical details for more context.";
}

export default function Page() {
  const [backendUrl, setBackendUrl] = useState(defaultBackendUrl);
  const [apiKey, setApiKey] = useState("");
  const [agentLabel, setAgentLabel] = useState("MacroScout Agent");
  const [userAgent, setUserAgent] = useState("MacroScout/1.0");

  const [targetUrl, setTargetUrl] = useState(DEFAULT_TARGETS[0]);
  const [license, setLicense] = useState<LicenseType>("SUMMARY");
  const [useLicensedMarker, setUseLicensedMarker] = useState(true);
  const [maxPriceMicros, setMaxPriceMicros] = useState("600000");

  const [running, setRunning] = useState(false);
  const [stepState, setStepState] = useState<{ mint: boolean; fetch: boolean; receipt: boolean }>({
    mint: false,
    fetch: false,
    receipt: false
  });

  const [contentPreview, setContentPreview] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [latestRun, setLatestRun] = useState<RunRecord | null>(null);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);

  const [technical, setTechnical] = useState<TechnicalState>({});
  const [connectionState, setConnectionState] = useState("Idle");

  useEffect(() => {
    const rawSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    const rawRuns = localStorage.getItem(LOCAL_STORAGE_RUNS_KEY);

    if (rawSettings) {
      const parsed = safeJsonParse(rawSettings) as Partial<{
        backendUrl: string;
        apiKey: string;
        agentLabel: string;
        userAgent: string;
      }> | null;

      if (parsed) {
        if (typeof parsed.backendUrl === "string") setBackendUrl(parsed.backendUrl);
        if (typeof parsed.apiKey === "string") setApiKey(parsed.apiKey);
        if (typeof parsed.agentLabel === "string") setAgentLabel(parsed.agentLabel);
        if (typeof parsed.userAgent === "string") setUserAgent(parsed.userAgent);
      }
    }

    if (rawRuns) {
      const parsedRuns = safeJsonParse(rawRuns) as RunRecord[] | null;
      if (Array.isArray(parsedRuns)) setRecentRuns(parsedRuns.slice(0, 5));
    }
  }, []);

  const requestUrl = useMemo(
    () => buildLicensedUrl(targetUrl, license, useLicensedMarker),
    [targetUrl, license, useLicensedMarker]
  );

  const viewLabel = useMemo(() => {
    try {
      const u = new URL(requestUrl);
      return u.searchParams.get("via") === "fairfetch" ? "Licensed AI view" : "Human paywall preview";
    } catch {
      return requestUrl.includes("via=fairfetch") ? "Licensed AI view" : "Human paywall preview";
    }
  }, [requestUrl]);

  const requestDetails = useMemo(() => {
    const base = backendUrl.replace(/\/$/, "");
    return {
      mint: {
        method: "POST",
        endpoint: `${base}/api/tokens`,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": maskApiKey(apiKey),
          "User-Agent": userAgent
        }
      },
      redeem: {
        method: "GET",
        endpoint: `${base}/api/content?url=${encodeURIComponent(requestUrl)}`,
        headers: {
          "x-fairfetch-token": "minted token"
        }
      }
    };
  }, [backendUrl, apiKey, requestUrl, userAgent]);

  const saveSettings = () => {
    localStorage.setItem(
      LOCAL_STORAGE_SETTINGS_KEY,
      JSON.stringify({ backendUrl, apiKey, agentLabel, userAgent })
    );
    setStatusMessage("Settings saved locally.");
  };

  const saveRun = (run: RunRecord) => {
    const nextRuns = [run, ...recentRuns.filter((item) => item.id !== run.id)].slice(0, 5);
    setRecentRuns(nextRuns);
    localStorage.setItem(LOCAL_STORAGE_RUNS_KEY, JSON.stringify(nextRuns));
  };

  const resetCopyFlags = () => {
    setCopiedProof(false);
    setCopiedReceipt(false);
    setCopiedTxId(false);
  };

  const runLicensedFetch = async () => {
    setRunning(true);
    setStatusMessage("");
    setErrorMessage("");
    setStepState({ mint: false, fetch: false, receipt: false });
    setTechnical({});
    resetCopyFlags();

    const mintBody: { url: string; license: LicenseType; maxPriceMicros?: number } = {
      url: requestUrl,
      license
    };
    if (maxPriceMicros.trim()) mintBody.maxPriceMicros = Number(maxPriceMicros);

    const directMintUrl = `${backendUrl.replace(/\/$/, "")}/api/tokens`;
    const directRedeemUrl = `${backendUrl.replace(/\/$/, "")}/api/content?url=${encodeURIComponent(requestUrl)}`;

    try {
      setStatusMessage("Quoting and minting token...");

      let mintResponse: Response;
      let mintedViaProxy = false;
      try {
        mintResponse = await fetch(directMintUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "User-Agent": userAgent,
            "x-agent-label": agentLabel
          },
          body: JSON.stringify(mintBody)
        });
      } catch {
        mintedViaProxy = true;
        mintResponse = await fetch("/api/proxy/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            backendUrl,
            apiKey,
            userAgent,
            agentLabel,
            body: mintBody
          })
        });
      }

      const mintParsed = await parseResponse(mintResponse);
      const mintRequestId = mintResponse.headers.get("x-request-id") ?? undefined;

      setTechnical((prev) => ({
        ...prev,
        mintStatus: mintResponse.status,
        mintRaw: mintParsed.data,
        requestId: mintRequestId ?? prev.requestId
      }));

      if (!mintResponse.ok) {
        setErrorMessage(mapErrorMessage(mintResponse.status, mintParsed.data));
        setTechnical((prev) => ({ ...prev, mintError: mintParsed.text }));
        setRunning(false);
        return;
      }

      const minted = mintParsed.data as MintResponse;
      if (!minted.token) {
        setErrorMessage("Token mint completed but no token was returned.");
        setTechnical((prev) => ({ ...prev, mintError: mintParsed.text }));
        setRunning(false);
        return;
      }

      setStepState((prev) => ({ ...prev, mint: true }));
      setStatusMessage(mintedViaProxy ? "Token minted through proxy fallback." : "Token minted.");

      setStatusMessage("Fetching licensed content...");

      let redeemResponse: Response;
      let redeemViaProxy = false;
      try {
        redeemResponse = await fetch(directRedeemUrl, {
          method: "GET",
          headers: {
            "x-fairfetch-token": minted.token
          }
        });
      } catch {
        redeemViaProxy = true;
        const redeemProxyUrl = `/api/proxy/content?${new URLSearchParams({ url: requestUrl, backendUrl }).toString()}`;
        redeemResponse = await fetch(redeemProxyUrl, {
          method: "GET",
          headers: {
            "x-fairfetch-token": minted.token
          }
        });
      }

      const redeemParsed = await parseResponse(redeemResponse);
      const redeemRequestId = redeemResponse.headers.get("x-request-id") ?? undefined;

      setTechnical((prev) => ({
        ...prev,
        redeemStatus: redeemResponse.status,
        redeemRaw: redeemParsed.data,
        requestId: redeemRequestId ?? prev.requestId
      }));

      if (!redeemResponse.ok) {
        setErrorMessage(mapErrorMessage(redeemResponse.status, redeemParsed.data));
        setTechnical((prev) => ({ ...prev, redeemError: redeemParsed.text }));
        setRunning(false);
        return;
      }

      setStepState((prev) => ({ ...prev, fetch: true }));

      const redeemed = redeemParsed.data as RedeemResponse;
      const snippet = extractContentSnippet(redeemed.content ?? redeemed);
      const nextReceipt = redeemed.receipt;

      if (!nextReceipt) {
        setErrorMessage("Content returned without receipt metadata.");
        setRunning(false);
        return;
      }

      const receiptWithLicense: Receipt = { ...nextReceipt, license };
      setReceipt(receiptWithLicense);
      setContentPreview(snippet.slice(0, 900));
      setStepState({ mint: true, fetch: true, receipt: true });
      setStatusMessage(redeemViaProxy ? "Content fetched through proxy fallback." : "Receipt written.");

      const run: RunRecord = {
        id: `${receiptWithLicense.txId}-${receiptWithLicense.timestamp}`,
        timestamp: receiptWithLicense.timestamp,
        targetUrl,
        requestUrl,
        license,
        agentLabel,
        userAgent,
        receipt: receiptWithLicense,
        contentPreview: snippet.slice(0, 900)
      };
      setLatestRun(run);
      saveRun(run);
    } catch (error) {
      setErrorMessage("Network issue while calling FairFetch. Proxy fallback also failed.");
      setTechnical((prev) => ({ ...prev, redeemError: String(error) }));
    } finally {
      setRunning(false);
    }
  };

  const proofBlock = receipt
    ? [
        `AgentLabel: ${latestRun?.agentLabel ?? agentLabel}`,
        `UserAgent: ${latestRun?.userAgent ?? userAgent}`,
        `URL: ${latestRun?.requestUrl ?? requestUrl}`,
        `License: ${receipt.license ?? license}`,
        `priceMicros: ${receipt.priceMicros}`,
        `txId: ${receipt.txId}`,
        `timestamp: ${receipt.timestamp}`
      ].join("\n")
    : "";

  const receiptBlock = receipt
    ? [
        `txId: ${receipt.txId}`,
        `priceMicros: ${receipt.priceMicros}`,
        `domain: ${receipt.domain}`,
        `path: ${receipt.path}`,
        `license: ${receipt.license ?? license}`,
        `timestamp: ${receipt.timestamp}`
      ].join("\n")
    : "";

  const testConnection = async () => {
    if (!backendUrl) {
      setConnectionState("Enter a backend URL first.");
      return;
    }

    setConnectionState("Checking...");
    try {
      const url = `${backendUrl.replace(/\/$/, "")}/api/content?url=${encodeURIComponent("https://example.com")}`;
      const response = await fetch(url, { method: "GET" });
      setConnectionState(`Reachable. HTTP ${response.status}`);
    } catch {
      try {
        const proxyUrl = `/api/proxy/content?${new URLSearchParams({
          url: "https://example.com",
          backendUrl
        }).toString()}`;
        const proxyResponse = await fetch(proxyUrl, { method: "GET" });
        setConnectionState(`Reachable through proxy. HTTP ${proxyResponse.status}`);
      } catch {
        setConnectionState("Connection failed.");
      }
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 text-slate-100 sm:px-6">
      <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-3xl font-semibold">MacroScout Research Agent</h1>
        <p className="mt-2 text-sm text-slate-300">
          Fetch premium research via FairFetch licensing and receive a receipt.
        </p>
      </header>

      <section className="rounded-2xl border border-cyan-700/50 bg-slate-900/70 p-5">
        <h2 className="text-xl font-semibold">Demo run</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Target report
            <input
              list="target-options"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
            />
            <datalist id="target-options">
              {DEFAULT_TARGETS.map((url) => (
                <option key={url} value={url} />
              ))}
            </datalist>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={useLicensedMarker}
              onChange={(event) => setUseLicensedMarker(event.target.checked)}
            />
            Use licensed access marker
          </label>

          <label className="text-sm">
            License type
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2"
              value={license}
              onChange={(event) => setLicense(event.target.value as LicenseType)}
            >
              <option value="SUMMARY">SUMMARY</option>
              <option value="DISPLAY">DISPLAY</option>
            </select>
          </label>

          <label className="text-sm">
            Max price micros
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2"
              value={maxPriceMicros}
              onChange={(event) => setMaxPriceMicros(event.target.value)}
            />
          </label>
        </div>

        <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          Final request URL: <span className="font-mono">{requestUrl}</span>
        </p>

        <button
          className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={runLicensedFetch}
          disabled={running || !backendUrl || !apiKey || !targetUrl}
        >
          {running ? "Running..." : "Run licensed fetch"}
        </button>

        <div className="mt-4 grid gap-2 text-sm">
          <p>{stepState.mint ? "✅" : "⬜"} 1) Quote and mint token</p>
          <p>{stepState.fetch ? "✅" : "⬜"} 2) Fetch content</p>
          <p>{stepState.receipt ? "✅" : "⬜"} 3) Receipt written</p>
        </div>

        {statusMessage && <p className="mt-3 text-sm text-emerald-300">{statusMessage}</p>}
        {errorMessage && (
          <div className="mt-3 rounded-lg border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-200">
            <p>{errorMessage}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-rose-100">Show technical details</summary>
              <div className="mt-2 space-y-2 text-xs">
                <p>Mint status: {technical.mintStatus ?? "N/A"}</p>
                <p>Redeem status: {technical.redeemStatus ?? "N/A"}</p>
                <p>Request id: {technical.requestId ?? "N/A"}</p>
                {(technical.mintError || technical.redeemError) && (
                  <pre className="overflow-auto rounded bg-slate-950 p-2">
                    {technical.mintError ?? ""}
                    {technical.redeemError ? `\n${technical.redeemError}` : ""}
                  </pre>
                )}
              </div>
            </details>
          </div>
        )}

        {(receipt || contentPreview) && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <h3 className="text-lg font-semibold">Returned content</h3>
              <p className="mt-1 text-xs text-cyan-300">{viewLabel}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{contentPreview}</p>
            </article>

            <article className="rounded-xl border border-cyan-600 bg-cyan-950/20 p-4">
              <h3 className="text-lg font-semibold">Receipt</h3>
              {receipt ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="text-slate-400">txId:</span> <span className="font-mono">{receipt.txId}</span></p>
                  <p><span className="text-slate-400">priceMicros:</span> {receipt.priceMicros}</p>
                  <p><span className="text-slate-400">domain:</span> {receipt.domain}</p>
                  <p><span className="text-slate-400">path:</span> {receipt.path}</p>
                  <p><span className="text-slate-400">license:</span> {receipt.license ?? license}</p>
                  <p><span className="text-slate-400">timestamp:</span> {receipt.timestamp}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-slate-500 px-3 py-1 text-xs"
                      onClick={async () => {
                        await navigator.clipboard.writeText(receiptBlock);
                        setCopiedReceipt(true);
                        setTimeout(() => setCopiedReceipt(false), 1200);
                      }}
                    >
                      {copiedReceipt ? "Copied" : "Copy receipt"}
                    </button>
                    <button
                      className="rounded-lg border border-cyan-500 px-3 py-1 text-xs"
                      onClick={async () => {
                        await navigator.clipboard.writeText(proofBlock);
                        setCopiedProof(true);
                        setTimeout(() => setCopiedProof(false), 1200);
                      }}
                    >
                      {copiedProof ? "Copied" : "Copy proof block"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-300">Run a fetch to generate a receipt.</p>
              )}
            </article>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Show this next</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Publisher Transactions should show the same txId</li>
          <li>AI Usage and Spend should update after redemption</li>
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border border-slate-600 px-3 py-1 text-xs"
            disabled={!receipt?.txId}
            onClick={async () => {
              if (!receipt?.txId) return;
              await navigator.clipboard.writeText(receipt.txId);
              setCopiedTxId(true);
              setTimeout(() => setCopiedTxId(false), 1200);
            }}
          >
            {copiedTxId ? "Copied" : "Copy txId"}
          </button>
          <a className="text-xs text-cyan-300 underline" href="https://dashboard.fairfetch.ai" target="_blank">
            Consumer dashboard
          </a>
          <a className="text-xs text-cyan-300 underline" href="https://publisher.fairfetch.ai" target="_blank">
            Publisher dashboard
          </a>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <details>
          <summary className="cursor-pointer text-lg font-semibold">Advanced controls</summary>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <h3 className="font-semibold">Setup</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-sm md:col-span-2">
                  Backend URL
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={backendUrl}
                    onChange={(event) => setBackendUrl(event.target.value)}
                  />
                </label>
                <label className="text-sm">
                  API key
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Agent label
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={agentLabel}
                    onChange={(event) => setAgentLabel(event.target.value)}
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  User agent
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
                    value={userAgent}
                    onChange={(event) => setUserAgent(event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg bg-slate-700 px-3 py-1 text-sm" onClick={saveSettings}>Save</button>
                <button className="rounded-lg border border-slate-500 px-3 py-1 text-sm" onClick={testConnection}>
                  Test connection
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-300">Connection status: {connectionState}</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <h3 className="font-semibold">Request details</h3>
              <div className="mt-2 space-y-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold text-slate-100">Mint request</p>
                  <p>{requestDetails.mint.method} {requestDetails.mint.endpoint}</p>
                  <pre className="mt-1 overflow-auto rounded bg-slate-900 p-2">{pretty(requestDetails.mint.headers)}</pre>
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Redeem request</p>
                  <p>{requestDetails.redeem.method} {requestDetails.redeem.endpoint}</p>
                  <pre className="mt-1 overflow-auto rounded bg-slate-900 p-2">{pretty(requestDetails.redeem.headers)}</pre>
                </div>
              </div>
            </div>

            <details className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <summary className="cursor-pointer font-semibold">Technical details</summary>
              <div className="mt-3 space-y-3 text-xs">
                <p>Mint HTTP status: {technical.mintStatus ?? "N/A"}</p>
                <p>Redeem HTTP status: {technical.redeemStatus ?? "N/A"}</p>
                <p>Request id: {technical.requestId ?? "N/A"}</p>
                <div>
                  <p className="mb-1 font-semibold">Mint raw response</p>
                  <pre className="max-h-64 overflow-auto rounded bg-slate-900 p-2">{pretty(technical.mintRaw ?? null)}</pre>
                </div>
                <div>
                  <p className="mb-1 font-semibold">Redeem raw response</p>
                  <pre className="max-h-64 overflow-auto rounded bg-slate-900 p-2">{pretty(technical.redeemRaw ?? null)}</pre>
                </div>
                {(technical.mintError || technical.redeemError) && (
                  <div>
                    <p className="mb-1 font-semibold">Error response bodies</p>
                    <pre className="max-h-40 overflow-auto rounded bg-slate-900 p-2">
                      {technical.mintError ?? ""}
                      {technical.redeemError ? `\n${technical.redeemError}` : ""}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        </details>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold">Recent runs</h2>
        {recentRuns.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No runs yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentRuns.map((run) => (
              <button
                key={run.id}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-left text-sm hover:border-cyan-500"
                onClick={() => {
                  setTargetUrl(run.targetUrl);
                  setLicense(run.license);
                  setReceipt(run.receipt);
                  setContentPreview(run.contentPreview);
                  setLatestRun(run);
                  setStatusMessage("Loaded a previous run.");
                }}
              >
                <p className="text-xs text-slate-400">{run.timestamp}</p>
                <p>{run.receipt.domain}{run.receipt.path}</p>
                <p className="font-mono text-xs text-slate-400">{run.receipt.priceMicros} micros · {run.receipt.txId}</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
