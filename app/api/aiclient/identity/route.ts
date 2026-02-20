import { NextResponse } from "next/server";

const identityPayload = {
  name: "MacroScout Helper Console",
  description:
    "FairFetch helper console that can mint tokenized access and redeem licensed research content.",
  url: "https://fairfetch.onrender.com",
  version: "0.1.0"
};

export async function GET() {
  return NextResponse.json(identityPayload);
}

export async function POST() {
  return NextResponse.json(identityPayload);
}
