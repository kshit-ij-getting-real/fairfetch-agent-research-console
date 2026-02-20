import { NextRequest, NextResponse } from "next/server";

type ProxyTokenRequest = {
  backendUrl?: string;
  apiKey?: string;
  userAgent?: string;
  agentLabel?: string;
  body?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ProxyTokenRequest;

    if (!payload.backendUrl || !payload.apiKey) {
      return NextResponse.json({ error: "Missing backendUrl or apiKey" }, { status: 400 });
    }

    const endpoint = `${payload.backendUrl.replace(/\/$/, "")}/api/tokens`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": payload.apiKey,
        "User-Agent": payload.userAgent ?? "MacroScout/1.0",
        "x-agent-label": payload.agentLabel ?? "MacroScout Agent"
      },
      body: JSON.stringify(payload.body ?? {})
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "x-request-id": response.headers.get("x-request-id") ?? ""
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
