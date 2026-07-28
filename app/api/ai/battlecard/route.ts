import { NextRequest, NextResponse } from "next/server";
import { runBattlecardAgent } from "@/lib/ai/agent";
import { createAgentSSEResponse } from "@/lib/ai/statusStream";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productIds } = body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "productIds required" }, { status: 400 });
  }

  console.log(`[api:ai/battlecard] Request received for products [${productIds.join(", ")}]`);

  return createAgentSSEResponse((emit) => runBattlecardAgent(productIds, emit), "battlecard");
}
