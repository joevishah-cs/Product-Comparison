import { NextRequest, NextResponse } from "next/server";
import { runDashboardAgent } from "@/lib/ai/agent";
import { createAgentSSEResponse } from "@/lib/ai/statusStream";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productIds } = body;

  if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
    return NextResponse.json({ error: "At least 2 productIds required" }, { status: 400 });
  }

  console.log(`[api:ai/dashboard] Request received for products [${productIds.join(", ")}]`);

  return createAgentSSEResponse((emit) => runDashboardAgent(productIds, emit), "dashboard");
}
