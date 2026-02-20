import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backendUrl, headers, body: payload } = body as {
      backendUrl: string;
      headers: Record<string, string>;
      body: unknown;
    };

    const url = `${String(backendUrl).replace(/\/$/, "")}/api/tokens`;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
