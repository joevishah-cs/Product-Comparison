import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import type { StatusEmitter } from "./statusStream";

const prisma = new PrismaClient();

interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

const noopEmit: StatusEmitter = () => {};

function logStage(agentName: string, stage: string, detail: string, startedAt: number) {
  const elapsedMs = Date.now() - startedAt;
  console.log(`[ai:${agentName}] +${elapsedMs}ms ${stage} — ${detail}`);
}

export async function runInsightsAgent(productIds: string[], emit: StatusEmitter = noopEmit): Promise<string> {
  const startedAt = Date.now();
  const aiMode = process.env.AI_MODE || "mock";
  const agentName = "insights";

  if (aiMode === "mock") {
    logStage(agentName, "mock", `AI_MODE=mock, skipping Azure OpenAI for products [${productIds.join(", ")}]`, startedAt);
    emit({ stage: "mock", detail: "Using deterministic mock insights (AI_MODE=mock)" });
    const result = await generateMockInsights(productIds);
    emit({ stage: "done", detail: "Mock insights ready" });
    return result;
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    });

    const tools = defineTools();
    const systemPrompt = `You are a product intelligence analyst. Analyze the selected products and provide:
1. VERIFIED FACT: Direct comparisons from source data
2. COMPETITIVE ANALYSIS: Positioning and messaging recommendations
3. SUGGESTED MESSAGE: Marketing language grounded in the data
4. CLAIM REQUIRING VALIDATION: Assertions that need verification

Use only the tools to fetch data. Never invent specifications.`;

    const userPrompt = `Analyze these products for competitive positioning: ${productIds.join(", ")}. Provide a comprehensive analysis with advantages, disadvantages, and recommended positioning.`;

    logStage(agentName, "calling_model", `Requesting GPT-5 analysis for [${productIds.join(", ")}]`, startedAt);
    emit({ stage: "calling_model", detail: "Contacting Azure OpenAI for competitive analysis..." });

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: tools as any,
      tool_choice: "auto",
      max_completion_tokens: 8000,
      reasoning_effort: "low",
    } as any);

    const finalAnswer = await resolveToolLoop(client, systemPrompt, userPrompt, response, agentName, startedAt, emit);
    if (!finalAnswer || finalAnswer.trim().length === 0) {
      console.warn(`[ai:${agentName}] Empty response from Azure OpenAI, falling back to mock`);
      emit({ stage: "mock", detail: "AI response was empty — using mock fallback" });
      const fallback = await generateMockInsights(productIds);
      emit({ stage: "done", detail: "Mock insights ready (fallback)" });
      return fallback;
    }
    logStage(agentName, "done", "AI insights generated successfully", startedAt);
    emit({ stage: "done", detail: "Insights ready" });
    return finalAnswer;
  } catch (error) {
    console.error(`[ai:${agentName}] Error running insights agent:`, error);
    emit({ stage: "error", detail: "AI call failed — using mock fallback" });
    const fallback = await generateMockInsights(productIds);
    emit({ stage: "done", detail: "Mock insights ready (fallback)" });
    return fallback;
  }
}

async function resolveToolLoop(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string,
  response: Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>> & { choices: any[] },
  agentName: string,
  startedAt: number,
  emit: StatusEmitter
): Promise<string> {
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const REASONING_STATUS_MESSAGES = [
    "Cross-checking retrieved specs...",
    "Weighing the evidence...",
    "Connecting the data points...",
    "Double-checking source figures...",
    "Drafting a grounded answer...",
    "Refining the analysis...",
    "Verifying every claim against source data...",
  ];

  const MAX_ROUNDS = 8;
  let current = response;

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const message = current.choices[0].message;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || "";
    }

    messages.push({
      role: "assistant",
      content: message.content || null,
      tool_calls: message.tool_calls,
    });

    for (const toolCall of message.tool_calls) {
      const toolLabel = describeToolCall(toolCall.function.name, toolCall.function.arguments);
      logStage(agentName, "tool_call", `Invoking ${toolCall.function.name} — ${toolLabel}`, startedAt);
      emit({ stage: "tool_call", detail: `Looking up: ${toolLabel}` });

      const result = await executeTool(toolCall.function.name, toolCall.function.arguments);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    const statusMessage = REASONING_STATUS_MESSAGES[i % REASONING_STATUS_MESSAGES.length];
    logStage(agentName, "reasoning", `Round ${i + 1}/${MAX_ROUNDS}: sending tool results back to model`, startedAt);
    emit({ stage: "reasoning", detail: statusMessage });

    const isLastRound = i === MAX_ROUNDS - 1;
    current = await client.chat.completions.create({
      model: "gpt-5",
      messages,
      // On the final round, force a text answer instead of allowing another
      // tool call — otherwise the loop can exhaust its round budget while the
      // model is still mid-tool-call, returning empty content (see the
      // "Empty response... falling back to mock" warning this was causing).
      tools: isLastRound ? undefined : (defineTools() as any),
      tool_choice: isLastRound ? undefined : "auto",
      max_completion_tokens: 8000,
      reasoning_effort: "low",
    } as any);
  }

  emit({ stage: "finalizing", detail: "Finalizing response..." });
  return current.choices[0].message.content || "";
}

function describeToolCall(toolName: string, args: string): string {
  try {
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    if (toolName === "get_product_specs") return `specs for ${parsed.product_id}`;
    if (toolName === "compare_products") return `comparing ${(parsed.product_ids || []).join(", ")}`;
    if (toolName === "get_source_reference") return `source for ${parsed.attribute_key} on ${parsed.product_id}`;
    return toolName;
  } catch {
    return toolName;
  }
}

export async function runBattlecardAgent(productIds: string[], emit: StatusEmitter = noopEmit): Promise<string> {
  const startedAt = Date.now();
  const aiMode = process.env.AI_MODE || "mock";
  const agentName = "battlecard";

  if (aiMode === "mock") {
    logStage(agentName, "mock", `AI_MODE=mock, skipping Azure OpenAI for products [${productIds.join(", ")}]`, startedAt);
    emit({ stage: "mock", detail: "Using deterministic mock battlecard (AI_MODE=mock)" });
    const result = await generateMockBattlecard(productIds);
    emit({ stage: "done", detail: "Mock battlecard ready" });
    return result;
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    });

    const tools = defineTools();
    const systemPrompt = `You are a sales enablement specialist. Generate a battle card comparing products with:
1. Top selling points (maximum 3)
2. Common customer objections and responses
3. Competitive positioning statements

Use tools to fetch accurate data. Be concise and field-ready.`;

    const userPrompt = `Create a sales battle card comparing: ${productIds.join(", ")}`;

    logStage(agentName, "calling_model", `Requesting GPT-5 battlecard for [${productIds.join(", ")}]`, startedAt);
    emit({ stage: "calling_model", detail: "Contacting Azure OpenAI for sales battle card..." });

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: tools as any,
      tool_choice: "auto",
      max_completion_tokens: 8000,
      reasoning_effort: "low",
    } as any);

    const finalAnswer = await resolveToolLoop(client, systemPrompt, userPrompt, response, agentName, startedAt, emit);
    if (!finalAnswer || finalAnswer.trim().length === 0) {
      console.warn(`[ai:${agentName}] Empty response from Azure OpenAI, falling back to mock`);
      emit({ stage: "mock", detail: "AI response was empty — using mock fallback" });
      const fallback = await generateMockBattlecard(productIds);
      emit({ stage: "done", detail: "Mock battlecard ready (fallback)" });
      return fallback;
    }
    logStage(agentName, "done", "AI battlecard generated successfully", startedAt);
    emit({ stage: "done", detail: "Battlecard ready" });
    return finalAnswer;
  } catch (error) {
    console.error(`[ai:${agentName}] Error running battlecard agent:`, error);
    emit({ stage: "error", detail: "AI call failed — using mock fallback" });
    const fallback = await generateMockBattlecard(productIds);
    emit({ stage: "done", detail: "Mock battlecard ready (fallback)" });
    return fallback;
  }
}

function defineTools(): Tool[] {
  return [
    {
      type: "function",
      function: {
        name: "get_product_specs",
        description: "Fetch detailed specifications for a product",
        parameters: {
          type: "object",
          properties: {
            product_id: { type: "string", description: "Product ID" },
          },
          required: ["product_id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "compare_products",
        description: "Compare specifications across multiple products",
        parameters: {
          type: "object",
          properties: {
            product_ids: {
              type: "array",
              items: { type: "string" },
              description: "List of product IDs to compare",
            },
            attributes: {
              type: "array",
              items: { type: "string" },
              description: "Specific attributes to compare (e.g., SEER2, Sound level)",
            },
          },
          required: ["product_ids"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_source_reference",
        description: "Get the source document reference for an attribute value",
        parameters: {
          type: "object",
          properties: {
            product_id: { type: "string" },
            attribute_key: { type: "string" },
          },
          required: ["product_id", "attribute_key"],
        },
      },
    },
  ];
}

async function executeTool(toolName: string, args: string): Promise<string> {
  try {
    const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

    switch (toolName) {
      case "get_product_specs":
        return await getProductSpecs(parsedArgs.product_id);
      case "compare_products":
        return await compareProducts(parsedArgs.product_ids, parsedArgs.attributes);
      case "get_source_reference":
        return await getSourceReference(parsedArgs.product_id, parsedArgs.attribute_key);
      default:
        return JSON.stringify({ error: "Unknown tool" });
    }
  } catch (error) {
    console.error("Tool execution error:", error);
    return JSON.stringify({ error: String(error) });
  }
}

async function getProductSpecs(productId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: true,
      values: {
        include: { definition: true },
      },
    },
  });

  if (!product) return JSON.stringify({ error: "Product not found" });

  const specs: Record<string, string> = {};
  for (const value of product.values) {
    specs[value.definition.key] = value.normalizedValue || value.rawValue;
  }

  return JSON.stringify({
    id: product.id,
    brand: product.brand.name,
    model: product.model,
    specs,
  });
}

async function compareProducts(productIds: string[], attributes?: string[]): Promise<string> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      brand: true,
      values: {
        include: { definition: true },
      },
    },
  });

  const comparison: Record<string, Record<string, string>> = {};

  for (const product of products) {
    const specs: Record<string, string> = {};
    for (const value of product.values) {
      const key = value.definition.key;
      if (!attributes || attributes.includes(key)) {
        specs[key] = value.normalizedValue || value.rawValue;
      }
    }
    comparison[product.id] = specs;
  }

  return JSON.stringify(comparison);
}

async function getSourceReference(productId: string, attributeKey: string): Promise<string> {
  const value = await prisma.productAttributeValue.findFirst({
    where: {
      productId,
      definition: { key: attributeKey },
    },
    include: {
      definition: true,
    },
  });

  if (!value) return JSON.stringify({ error: "Attribute not found" });

  return JSON.stringify({
    product_id: productId,
    attribute: attributeKey,
    value: value.normalizedValue || value.rawValue,
    source: value.sourceLocation,
    confidence: value.confidence,
  });
}

async function generateMockInsights(productIds: string[]): Promise<string> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { brand: true },
  });

  const daikin = products.find((p) => p.brand.name === "Daikin");
  const competitors = products.filter((p) => p.brand.name !== "Daikin");

  if (!daikin || competitors.length === 0) {
    return "Unable to generate insights without Daikin and competitor products.";
  }

  return `**VERIFIED FACT:** ${daikin.model} provides source-backed specifications across energy efficiency, warranty, and installation compatibility.

**COMPETITIVE ANALYSIS:** When compared with ${competitors.map((c) => c.model).join(", ")}, ${daikin.model} positions strongest around warranty coverage and installation flexibility.

**SUGGESTED MESSAGE:** Lead with verified attributes in customer conversations; validate model-specific terms and availability before external use.

**CLAIM REQUIRING VALIDATION:** Confirm current program terms and market availability for all external-facing claims.`;
}

export async function runDashboardAgent(productIds: string[], emit: StatusEmitter = noopEmit): Promise<string> {
  const startedAt = Date.now();
  const aiMode = process.env.AI_MODE || "mock";
  const agentName = "dashboard";

  if (aiMode === "mock") {
    logStage(agentName, "mock", `AI_MODE=mock, skipping Azure OpenAI for products [${productIds.join(", ")}]`, startedAt);
    emit({ stage: "mock", detail: "Using deterministic mock dashboard (AI_MODE=mock)" });
    const result = await generateMockDashboard(productIds);
    emit({ stage: "done", detail: "Mock dashboard ready" });
    return result;
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    });

    const tools = defineTools();
    const systemPrompt = `You are a competitive intelligence executive briefing specialist. Generate tactical dashboard positioning insights focused on:

1. DAIKIN POSITIONING SUMMARY: Identify 3 specific, data-backed strengths where Daikin objectively leads, and 3 specific gaps for product roadmap planning. Focus on feature/spec wins, not soft messaging.

2. KEY ADVANTAGE SCORECARDS: Identify the winning product in each key metric (Efficiency, Noise, Warranty, Overall). Use tool to compare actual numeric values.

3. MARKETING TAKEAWAYS: Provide 4 strategic insights:
   - VERIFIED FACT: A specific, source-backed specification advantage or market reality
   - COMPETITIVE INTERPRETATION: What the spec data reveals about positioning opportunities
   - SUGGESTED MARKETING MESSAGE: A high-impact 1-line positioning statement
   - CLAIM REQUIRING VALIDATION: Specific claims needing legal/compliance review

Do NOT duplicate the AI Insights tab. Focus on DASHBOARD LEVEL insights: objective winners, feature gaps, positioning strategy. Use tools to ground everything in actual data.`;

    const userPrompt = `Generate executive dashboard briefing for products: ${productIds.join(", ")}. Identify objective winners per metric, feature strengths/gaps, and strategic positioning opportunities.`;

    logStage(agentName, "calling_model", `Requesting GPT-5 dashboard briefing for [${productIds.join(", ")}]`, startedAt);
    emit({ stage: "calling_model", detail: "Contacting Azure OpenAI for executive dashboard briefing..." });

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: tools as any,
      tool_choice: "auto",
      max_completion_tokens: 8000,
      reasoning_effort: "low",
    } as any);

    const finalAnswer = await resolveToolLoop(client, systemPrompt, userPrompt, response, agentName, startedAt, emit);
    if (!finalAnswer || finalAnswer.trim().length === 0) {
      console.warn(`[ai:${agentName}] Empty response from Azure OpenAI, falling back to mock`);
      emit({ stage: "mock", detail: "AI response was empty — using mock fallback" });
      const fallback = await generateMockDashboard(productIds);
      emit({ stage: "done", detail: "Mock dashboard ready (fallback)" });
      return fallback;
    }
    logStage(agentName, "done", "AI dashboard briefing generated successfully", startedAt);
    emit({ stage: "done", detail: "Dashboard briefing ready" });
    return finalAnswer;
  } catch (error) {
    console.error(`[ai:${agentName}] Error running dashboard agent:`, error);
    emit({ stage: "error", detail: "AI call failed — using mock fallback" });
    const fallback = await generateMockDashboard(productIds);
    emit({ stage: "done", detail: "Mock dashboard ready (fallback)" });
    return fallback;
  }
}

async function generateMockBattlecard(productIds: string[]): Promise<string> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { brand: true },
  });

  const daikin = products.find((p) => p.brand.name === "Daikin");

  if (!daikin) {
    return "Unable to generate battlecard without a Daikin product.";
  }

  return `**TOP SELLING POINTS**
1. Source-backed warranty and installation flexibility
2. Verified efficiency ratings and performance metrics
3. Cloud-connected diagnostics and real-time monitoring

**COMMON OBJECTION & RESPONSE**
- Objection: "How does this compare on initial cost?"
  Response: "Our focus is on total cost of ownership. Longer warranty and higher efficiency deliver value over the equipment lifetime."

**COMPETITIVE POSITIONING**
Position ${daikin.model} as the choice for customers prioritizing reliability, installation flexibility, and transparent feature comparison backed by verified specifications.`;
}

async function generateMockDashboard(productIds: string[]): Promise<string> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { brand: true, values: { include: { definition: true } } },
  });

  const daikin = products.find((p) => p.brand.name === "Daikin");
  const competitors = products.filter((p) => p.brand.name !== "Daikin");

  if (!daikin || competitors.length === 0) {
    return "Unable to generate dashboard insights without Daikin and competitor products.";
  }

  // Find actual spec winners by comparing numeric values
  const seer2Values = products.map(p => ({
    model: p.model,
    value: parseFloat(p.values.find(v => v.definition.key === "SEER2")?.rawValue?.match(/\d+\.?\d*/)?.[0] || "0")
  }));
  const seer2Leader = seer2Values.reduce((a, b) => a.value > b.value ? a : b).model;

  const soundValues = products.map(p => ({
    model: p.model,
    value: parseFloat(p.values.find(v => v.definition.key === "Sound level")?.rawValue?.match(/\d+\.?\d*/)?.[0] || "999")
  }));
  const soundLeader = soundValues.reduce((a, b) => a.value < b.value ? a : b).model;

  return `**DAIKIN POSITIONING SUMMARY**

VERIFIED DAIKIN EDGES:
- ${daikin.model} leads in warranty breadth and coverage duration vs selected competitors
- Superior installation flexibility with diverse configuration options documented in source materials
- Integrated diagnostics and monitoring capabilities for proactive maintenance positioning

COMPETITIVE GAPS:
- Sound level performance: ${soundLeader} demonstrates lower dBA rating in this segment
- Advanced control features: Some competitors offer expanded smart home integration options
- Regional feature availability: Specific geographic limitations on advanced functions

**KEY ADVANTAGE SCORECARDS**

Efficiency Leader: ${seer2Leader}
Quietest Product: ${soundLeader}
Best Warranty: ${daikin.model}
Daikin Strategic Edge: Installation compatibility and warranty depth

**MARKETING TAKEAWAYS**

VERIFIED FACT: Objective spec comparison shows ${daikin.model} leads in warranty duration (12yr parts & labor vs competitor 5-10yr) with verified source documentation.

COMPETITIVE INTERPRETATION: The competitive set shows efficiency (SEER2) is table-stakes at 17.0+, but Daikin differentiates via installation flexibility and extended warranty terms that reduce total cost of ownership.

SUGGESTED MARKETING MESSAGE: "Maximum warranty protection. Maximum installation flexibility. Minimal disruption to your current system."

CLAIM REQUIRING VALIDATION: Verify warranty terms are accurate for all regions before external marketing use; confirm feature availability in target markets and validate against competitor datasheets.`;
}
