/**
 * Supabase Edge Function: ai-advisor
 *
 * Runs server-side so the AI provider key never reaches the browser. Set it with:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy ai-advisor
 *
 * With no key configured the function returns the caller's deterministic
 * source-backed grounding unchanged, so the application still answers correctly.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SectionKind =
  | "VERIFIED PRODUCT FACT"
  | "CALCULATED COMPARISON"
  | "AI ANALYTICAL INSIGHT"
  | "SUGGESTED MARKETING MESSAGE"
  | "CLAIM REQUIRING VALIDATION"
  | "INFORMATION UNAVAILABLE";

interface Section {
  kind: SectionKind;
  body: string;
  citations: string[];
}

interface RequestBody {
  question: string;
  products: {
    id: string;
    name: string;
    isDaikin: boolean;
    equipmentType: string;
    attributes: Record<string, { value: string | null; citation: string }>;
  }[];
  grounding: { sections: Section[] };
}

const SYSTEM_PROMPT = `You are a competitive intelligence advisor for Daikin sales and product marketing.

Hard rules:
- Answer ONLY from the product records supplied in the user message. Never introduce a
  specification, model, brand, price or certification that is not in those records.
- A null value means the source document left the cell blank. Report it as
  "Information unavailable". NEVER interpret a blank as "No", as zero, or as an absence
  of the feature.
- Never claim exclusivity ("only Daikin", "no competitor offers") when any competitor's
  value for that attribute is null.
- Do not rank refrigerants against one another.
- Do not compare products of different equipmentType values as if they were equivalent.
- Every factual statement must carry the citation string supplied with that value.

Return ONLY a JSON object of the form:
{"sections":[{"kind":"...","body":"...","citations":["..."]}]}

Valid kind values, used in this order where applicable:
VERIFIED PRODUCT FACT, CALCULATED COMPARISON, AI ANALYTICAL INSIGHT,
SUGGESTED MARKETING MESSAGE, CLAIM REQUIRING VALIDATION, INFORMATION UNAVAILABLE.

VERIFIED PRODUCT FACT and CALCULATED COMPARISON must be strictly derivable from the
records. AI ANALYTICAL INSIGHT may add judgement but must be labelled as such and carry
no invented numbers. SUGGESTED MARKETING MESSAGE must be plain enough for a homeowner.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const grounding = body.grounding?.sections?.length ? body.grounding : { sections: [] as Section[] };
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) return json(grounding, 200);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              `QUESTION: ${body.question}`,
              "",
              "PRODUCT RECORDS (JSON):",
              JSON.stringify(body.products),
              "",
              "DETERMINISTIC GROUNDING already computed by the application. Use it as the",
              "factual floor; you may reorganise and add an AI ANALYTICAL INSIGHT section,",
              "but you may not contradict it or add facts beyond the records:",
              JSON.stringify(grounding),
            ].join("\n"),
          },
        ],
      }),
    });

    if (!res.ok) return json(grounding, 200);

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json(grounding, 200);

    const parsed = JSON.parse(match[0]) as { sections?: Section[] };
    if (!Array.isArray(parsed.sections) || !parsed.sections.length) return json(grounding, 200);

    return json({ sections: parsed.sections }, 200);
  } catch {
    // Any provider failure falls back to the deterministic source-backed answer.
    return json(grounding, 200);
  }
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
