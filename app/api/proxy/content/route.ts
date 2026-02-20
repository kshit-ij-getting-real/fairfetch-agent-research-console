import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = request.nextUrl.searchParams.get("backendUrl");
    const contentUrl = request.nextUrl.searchParams.get("url");

    if (!backendUrl || !contentUrl) {
      return NextResponse.json({ error: "Missing backendUrl or url query parameters" }, { status: 400 });
    }

    const params = new URLSearchParams({ url: contentUrl });
    const endpoint = `${backendUrl.replace(/\/$/, "")}/api/content?${params.toString()}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-fairfetch-token": request.headers.get("x-fairfetch-token") ?? ""
      }
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
