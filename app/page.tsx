"use client";

import { useEffect, useMemo, useState } from "react";

type LicenseType = "SUMMARY" | "DISPLAY";

type TokenResponse = {
  token?: string;
  [key: string]: unknown;
};

type Receipt = {
  txId: string;
  priceMicros: number;
  domain: string;
  path: string;
  timestamp: string;
  [key: string]: unknown;
};

type ContentResponse = {
  content?: unknown;
  receipt?: Receipt;
  [key: string]: unknown;
};

type StoredRun = {
  id: string;
  url: string;
  license: LicenseType;
  userAgent: string;
  agentLabel: string;
  receipt: Receipt;
};

const defaultBackend = process.env.NEXT_PUBLIC_FAIRFETCH_BACKEND_URL ?? "";
const defaultUrl =
  process.env.NEXT_PUBLIC_DEFAULT_RESEARCH_URL ??
  "https://ai-essays.vercel.app/premium/demo-article";

function prettyJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function maskToken(token: string): string {
  if (token.length <= 10) return token;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export default function Home() {
  const [backendUrl, setBackendUrl] = useState(defaultBackend);
  const [apiKey, setApiKey] = useState("");
  const [userAgent, setUserAgent] = useState("MacroScout/1.0");
  const [agentLabel, setAgentLabel] = useState("MacroScout Agent");

  const [researchUrl, setResearchUrl] = useState(defaultUrl);
  const [license, setLicense] = useState<LicenseType>("SUMMARY");
  const [maxPriceMicros, setMaxPriceMicros] = useState("");

  const [mintLoading, setMintLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [mintStatus, setMintStatus] = useState("");
  const [redeemStatus, setRedeemStatus] = useState("");

  const [token, setToken] = useState("");
  const [mintDebug, setMintDebug] = useState<unknown>(null);
  const [contentPreview, setContentPreview] = useState("");
  const [contentDebug, setContentDebug] = useState<unknown>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [runs, setRuns] = useState<StoredRun[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("fairfetch-research-runs");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StoredRun[];
      setRuns(parsed.slice(0, 5));
    } catch {
      localStorage.removeItem("fairfetch-research-runs");
    }
  }, []);

  const saveRun = (nextRun: StoredRun) => {
    const nextRuns = [nextRun, ...runs].slice(0, 5);
    setRuns(nextRuns);
    localStorage.setItem("fairfetch-research-runs", JSON.stringify(nextRuns));
  };

  const mintBody = useMemo(() => {
    const body: { url: string; license: LicenseType; maxPriceMicros?: number } = {
      url: researchUrl,
      license
    };
    if (maxPriceMicros.trim()) {
      body.maxPriceMicros = Number(maxPriceMicros);
    }
    return body;
  }, [license, maxPriceMicros, researchUrl]);

  async function mintToken() {
    setMintLoading(true);
    setMintStatus("");
    setMintDebug(null);

    const directEndpoint = `${backendUrl.replace(/\/$/, "")}/api/tokens`;
    const proxyEndpoint = "/api/proxy/tokens";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "User-Agent": userAgent
    };

    async function doRequest(endpoint: string, viaProxy: boolean): Promise<Response> {
      if (viaProxy) {
        return fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backendUrl, headers, body: mintBody })
        });
      }

      return fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(mintBody)
      });
    }

    try {
      let response: Response;
      try {
        response = await doRequest(directEndpoint, false);
      } catch {
        response = await doRequest(proxyEndpoint, true);
        setMintStatus("Direct call failed (likely CORS/network). Auto-fell back to proxy route.");
      }

      const data = await response.json().catch(() => ({ error: "Failed to parse JSON response" }));
      setMintDebug(data);

      if (!response.ok) {
        setMintStatus(`Mint failed (${response.status}): ${prettyJson(data)}`);
        return;
      }

      const parsed = data as TokenResponse;
      if (!parsed.token) {
        setMintStatus("Mint succeeded but token missing in response.");
        return;
      }

      setToken(parsed.token);
      setMintStatus("Token minted successfully.");
    } catch (error) {
      setMintStatus(`Mint request error: ${String(error)}`);
    } finally {
      setMintLoading(false);
    }
  }

  async function redeemContent() {
    setRedeemLoading(true);
    setRedeemStatus("");
    setContentDebug(null);
    setContentPreview("");

    const queryUrl = encodeURIComponent(researchUrl);
    const directEndpoint = `${backendUrl.replace(/\/$/, "")}/api/content?url=${queryUrl}`;
    const proxyEndpoint = `/api/proxy/content?url=${queryUrl}&backendUrl=${encodeURIComponent(backendUrl)}`;

    async function doRequest(endpoint: string, viaProxy: boolean): Promise<Response> {
      if (viaProxy) {
        return fetch(endpoint, {
          method: "GET",
          headers: { "x-fairfetch-token": token }
        });
      }

      return fetch(endpoint, {
        method: "GET",
        headers: { "x-fairfetch-token": token }
      });
    }

    try {
      let response: Response;
      try {
        response = await doRequest(directEndpoint, false);
      } catch {
        response = await doRequest(proxyEndpoint, true);
        setRedeemStatus("Direct call failed (likely CORS/network). Auto-fell back to proxy route.");
      }

      const data = await response.json().catch(() => ({ error: "Failed to parse JSON response" }));
      setContentDebug(data);

      if (!response.ok) {
        setRedeemStatus(`Redeem failed (${response.status}): ${prettyJson(data)}`);
        return;
      }

      const parsed = data as ContentResponse;
      const candidateContent = parsed.content ?? data;
      const candidateReceipt = parsed.receipt;

      const previewText =
        typeof candidateContent === "string"
          ? candidateContent.slice(0, 1000)
          : prettyJson(candidateContent).slice(0, 1000);

      setContentPreview(previewText);

      if (candidateReceipt) {
        setReceipt(candidateReceipt);
        saveRun({
          id: `${candidateReceipt.txId}-${candidateReceipt.timestamp}`,
          url: researchUrl,
          license,
          userAgent,
          agentLabel,
          receipt: candidateReceipt
        });
      }

      setRedeemStatus("Token redeemed and content loaded.");
    } catch (error) {
      setRedeemStatus(`Redeem request error: ${String(error)}`);
    } finally {
      setRedeemLoading(false);
    }
  }

  const proofBlock = receipt
    ? [
        `AgentLabel: ${agentLabel}`,
        `URL: ${researchUrl}`,
        `License: ${license}`,
        `priceMicros: ${receipt.priceMicros}`,
        `txId: ${receipt.txId}`,
        `timestamp: ${receipt.timestamp}`,
        `userAgent: ${userAgent}`
      ].join("\n")
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 border-b border-slate-800 pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">FairFetch Technical Loop Demo</p>
        <h1 className="mt-2 text-3xl font-semibold">MacroScout Agent Console</h1>
      </header>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Step 0: Configure</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">Backend URL
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
            </label>
            <label className="text-sm">API Key
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </label>
            <label className="text-sm">User-Agent
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={userAgent} onChange={(e) => setUserAgent(e.target.value)} />
            </label>
            <label className="text-sm">Agent identity label
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={agentLabel} onChange={(e) => setAgentLabel(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Step 1: Research target</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm md:col-span-3">Research URL
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={researchUrl} onChange={(e) => setResearchUrl(e.target.value)} />
            </label>
            <label className="text-sm">License
              <select className="mt-1 w-full rounded bg-slate-950 p-2" value={license} onChange={(e) => setLicense(e.target.value as LicenseType)}>
                <option value="SUMMARY">SUMMARY</option>
                <option value="DISPLAY">DISPLAY</option>
              </select>
            </label>
            <label className="text-sm">maxPriceMicros (optional)
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={maxPriceMicros} onChange={(e) => setMaxPriceMicros(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Step 2: Mint token (POST /api/tokens)</h2>
          <button className="mt-4 rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60" onClick={mintToken} disabled={mintLoading || !backendUrl || !apiKey}>
            {mintLoading ? "Minting..." : "Mint Spend Token"}
          </button>
          {mintStatus && <p className="mt-3 text-sm text-slate-300">{mintStatus}</p>}
          <p className="mt-2 rounded border border-amber-600/40 bg-amber-950/40 p-2 text-sm text-amber-200">
            Token minting fails if the publisher has no active pricing rules for that domain/path/license.
          </p>
          {token && (
            <div className="mt-4 rounded border border-slate-700 p-3 text-sm">
              <p>Token: <span className="font-mono">{maskToken(token)}</span></p>
              <button className="mt-2 rounded bg-slate-700 px-3 py-1" onClick={() => navigator.clipboard.writeText(token)}>
                Copy token
              </button>
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-cyan-300">Debug: Mint Response JSON</summary>
            <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs">{prettyJson(mintDebug)}</pre>
          </details>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Step 3: Redeem token (GET /api/content)</h2>
          <button className="mt-4 rounded bg-emerald-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60" onClick={redeemContent} disabled={redeemLoading || !backendUrl || !token}>
            {redeemLoading ? "Redeeming..." : "Redeem Content"}
          </button>
          {redeemStatus && <p className="mt-3 text-sm text-slate-300">{redeemStatus}</p>}
          {contentPreview && (
            <div className="mt-4 rounded border border-slate-700 p-3">
              <h3 className="font-medium">Content Preview</h3>
              <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap text-xs text-slate-200">{contentPreview}</pre>
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-emerald-300">Debug: Content Response JSON</summary>
            <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs">{prettyJson(contentDebug)}</pre>
          </details>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Step 4: Receipt + Transaction Proof</h2>
          <h3 className="mt-2 text-xl font-semibold text-cyan-300">Receipt = Audit Trail</h3>
          {receipt ? (
            <div className="mt-4 space-y-3 rounded-lg border border-cyan-500/50 bg-slate-950 p-4">
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="text-slate-400">txId:</span> <span className="font-mono">{receipt.txId}</span></p>
                <p><span className="text-slate-400">priceMicros:</span> {receipt.priceMicros}</p>
                <p><span className="text-slate-400">domain:</span> {receipt.domain}</p>
                <p><span className="text-slate-400">path:</span> {receipt.path}</p>
                <p className="md:col-span-2"><span className="text-slate-400">timestamp:</span> {receipt.timestamp}</p>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                <li>Spend tokens are one-time use (prevents replay)</li>
                <li>Redemption creates an immutable ledger transaction (txId)</li>
                <li>txId is your audit handle across systems</li>
                <li>Publisher dashboard shows the same transaction row</li>
              </ul>
              <button className="rounded bg-cyan-500 px-3 py-1 text-slate-950" onClick={() => navigator.clipboard.writeText(proofBlock)}>
                Copy Proof Block
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Redeem content to populate a receipt.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Step 5: How to verify in FairFetch dashboards</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Open consumer dashboard transactions and search by txId.</li>
            <li>Open publisher dashboard ledger rows for matching domain/path + txId.</li>
            <li>Compare priceMicros + timestamp against this receipt proof block.</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a className="rounded border border-slate-700 px-3 py-1 text-cyan-300" href="https://dashboard.fairfetch.ai" target="_blank">Consumer Dashboard</a>
            <a className="rounded border border-slate-700 px-3 py-1 text-cyan-300" href="https://publisher.fairfetch.ai" target="_blank">Publisher Dashboard</a>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">Research Runs (last 5)</h2>
          <div className="mt-3 space-y-2 text-sm">
            {runs.length === 0 && <p className="text-slate-400">No prior receipts stored yet.</p>}
            {runs.map((run) => (
              <button
                key={run.id}
                className="w-full rounded border border-slate-700 p-2 text-left hover:border-cyan-500"
                onClick={() => {
                  setResearchUrl(run.url);
                  setLicense(run.license);
                  setUserAgent(run.userAgent);
                  setAgentLabel(run.agentLabel);
                  setReceipt(run.receipt);
                }}
              >
                <p>{run.receipt.timestamp}</p>
                <p className="text-slate-400">{run.receipt.domain}{run.receipt.path}</p>
                <p className="font-mono text-xs text-slate-400">{run.receipt.priceMicros} µ • {run.receipt.txId}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
