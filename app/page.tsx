"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_STRINGS } from "@/src/strings";

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
  const [agentLabel, setAgentLabel] = useState("MacroScout Helper");

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
        setMintStatus(APP_STRINGS.credit.fallback);
      }

      const data = await response
        .json()
        .catch(() => ({ error: "Could not read the response details" }));
      setMintDebug(data);

      if (!response.ok) {
        setMintStatus(`${APP_STRINGS.credit.fail} (Code ${response.status})`);
        return;
      }

      const parsed = data as TokenResponse;
      if (!parsed.token) {
        setMintStatus(APP_STRINGS.credit.missing);
        return;
      }

      setToken(parsed.token);
      setMintStatus(APP_STRINGS.credit.success);
    } catch {
      setMintStatus(APP_STRINGS.credit.requestError);
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
        setRedeemStatus(APP_STRINGS.content.fallback);
      }

      const data = await response
        .json()
        .catch(() => ({ error: "Could not read the response details" }));
      setContentDebug(data);

      if (!response.ok) {
        setRedeemStatus(`${APP_STRINGS.content.fail} (Code ${response.status})`);
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

      setRedeemStatus(APP_STRINGS.content.success);
    } catch {
      setRedeemStatus(APP_STRINGS.content.requestError);
    } finally {
      setRedeemLoading(false);
    }
  }

  const proofBlock = receipt
    ? [
        `${APP_STRINGS.receipt.helperName}: ${agentLabel}`,
        `${APP_STRINGS.receipt.sourceUrl}: ${researchUrl}`,
        `${APP_STRINGS.receipt.accessType}: ${license}`,
        `${APP_STRINGS.receipt.amount}: ${receipt.priceMicros}`,
        `${APP_STRINGS.receipt.reference}: ${receipt.txId}`,
        `${APP_STRINGS.receipt.time}: ${receipt.timestamp}`,
        `${APP_STRINGS.receipt.appName}: ${userAgent}`
      ].join("\n")
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 border-b border-slate-800 pb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">{APP_STRINGS.header.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold">{APP_STRINGS.header.title}</h1>
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
          <p className="font-semibold text-cyan-200">{APP_STRINGS.header.introTitle}</p>
          {APP_STRINGS.header.introLines.map((line) => (
            <p key={line} className="mt-1">{line}</p>
          ))}
        </div>
      </header>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.setup.title}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">{APP_STRINGS.setup.backendUrl}
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
            </label>
            <label className="text-sm">{APP_STRINGS.setup.apiKey}
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </label>
            <label className="text-sm">{APP_STRINGS.setup.userAgent}
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={userAgent} onChange={(e) => setUserAgent(e.target.value)} />
            </label>
            <label className="text-sm">{APP_STRINGS.setup.helperLabel}
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={agentLabel} onChange={(e) => setAgentLabel(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.target.title}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm md:col-span-3">{APP_STRINGS.target.url}
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={researchUrl} onChange={(e) => setResearchUrl(e.target.value)} />
            </label>
            <label className="text-sm">{APP_STRINGS.target.license}
              <select className="mt-1 w-full rounded bg-slate-950 p-2" value={license} onChange={(e) => setLicense(e.target.value as LicenseType)}>
                <option value="SUMMARY">{APP_STRINGS.target.summary}</option>
                <option value="DISPLAY">{APP_STRINGS.target.display}</option>
              </select>
            </label>
            <label className="text-sm">{APP_STRINGS.target.maxPrice}
              <input className="mt-1 w-full rounded bg-slate-950 p-2" value={maxPriceMicros} onChange={(e) => setMaxPriceMicros(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.credit.title}</h2>
          <button className="mt-4 rounded bg-cyan-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60" onClick={mintToken} disabled={mintLoading || !backendUrl || !apiKey}>
            {mintLoading ? APP_STRINGS.credit.ctaBusy : APP_STRINGS.credit.ctaIdle}
          </button>
          {mintStatus && <p className="mt-3 text-sm text-slate-300">{mintStatus}</p>}
          <p className="mt-2 rounded border border-amber-600/40 bg-amber-950/40 p-2 text-sm text-amber-200">
            {APP_STRINGS.credit.warning}
          </p>
          {token && (
            <div className="mt-4 rounded border border-slate-700 p-3 text-sm">
              <p>{APP_STRINGS.credit.passLabel}: <span className="font-mono">{maskToken(token)}</span></p>
              <button className="mt-2 rounded bg-slate-700 px-3 py-1" onClick={() => navigator.clipboard.writeText(token)}>
                {APP_STRINGS.credit.copyCta}
              </button>
            </div>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-cyan-300">{APP_STRINGS.credit.detailsSummary}</summary>
            <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs">{prettyJson(mintDebug)}</pre>
          </details>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.content.title}</h2>
          <button className="mt-4 rounded bg-emerald-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-60" onClick={redeemContent} disabled={redeemLoading || !backendUrl || !token}>
            {redeemLoading ? APP_STRINGS.content.ctaBusy : APP_STRINGS.content.ctaIdle}
          </button>
          {redeemStatus && <p className="mt-3 text-sm text-slate-300">{redeemStatus}</p>}
          {contentPreview ? (
            <div className="mt-4 rounded border border-slate-700 p-3">
              <h3 className="font-medium">{APP_STRINGS.content.previewTitle}</h3>
              <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap text-xs text-slate-200">{contentPreview}</pre>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">{APP_STRINGS.content.empty}</p>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-emerald-300">{APP_STRINGS.content.detailsSummary}</summary>
            <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs">{prettyJson(contentDebug)}</pre>
          </details>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.receipt.title}</h2>
          <h3 className="mt-2 text-xl font-semibold text-cyan-300">{APP_STRINGS.receipt.subtitle}</h3>
          {receipt ? (
            <div className="mt-4 space-y-3 rounded-lg border border-cyan-500/50 bg-slate-950 p-4">
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="text-slate-400">{APP_STRINGS.receipt.reference}:</span> <span className="font-mono">{receipt.txId}</span></p>
                <p><span className="text-slate-400">{APP_STRINGS.receipt.amount}:</span> {receipt.priceMicros}</p>
                <p><span className="text-slate-400">Domain:</span> {receipt.domain}</p>
                <p><span className="text-slate-400">Path:</span> {receipt.path}</p>
                <p className="md:col-span-2"><span className="text-slate-400">{APP_STRINGS.receipt.time}:</span> {receipt.timestamp}</p>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                <li>{APP_STRINGS.receipt.bullet1}</li>
                <li>{APP_STRINGS.receipt.bullet2}</li>
                <li>{APP_STRINGS.receipt.bullet3}</li>
                <li>{APP_STRINGS.receipt.bullet4}</li>
              </ul>
              <button className="rounded bg-cyan-500 px-3 py-1 text-slate-950" onClick={() => navigator.clipboard.writeText(proofBlock)}>
                {APP_STRINGS.receipt.copyCta}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">{APP_STRINGS.receipt.empty}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.verify.title}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>{APP_STRINGS.verify.bullet1}</li>
            <li>{APP_STRINGS.verify.bullet2}</li>
            <li>{APP_STRINGS.verify.bullet3}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <a className="rounded border border-slate-700 px-3 py-1 text-cyan-300" href="https://dashboard.fairfetch.ai" target="_blank">{APP_STRINGS.verify.consumerLink}</a>
            <a className="rounded border border-slate-700 px-3 py-1 text-cyan-300" href="https://publisher.fairfetch.ai" target="_blank">{APP_STRINGS.verify.publisherLink}</a>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold">{APP_STRINGS.history.title}</h2>
          <div className="mt-3 space-y-2 text-sm">
            {runs.length === 0 && <p className="text-slate-400">{APP_STRINGS.history.empty}</p>}
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
                <p className="mt-1 text-xs text-cyan-300">{APP_STRINGS.history.itemHint}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
