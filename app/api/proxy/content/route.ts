import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = request.nextUrl.searchParams.get("backendUrl");
    const contentUrl = request.nextUrl.searchParams.get("url");

    if (!backendUrl || !contentUrl) {
      return NextResponse.json({ error: "Missing backendUrl or url query parameters" }, { status: 400 });
    }

    const url = `${backendUrl.replace(/\/$/, "")}/api/content?url=${contentUrl}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-fairfetch-token": request.headers.get("x-fairfetch-token") ?? ""
      }
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
