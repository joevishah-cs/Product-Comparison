"use client";

export interface AgentStatusEvent {
  stage: string;
  detail: string;
}

// A genuinely working request keeps sending status events every few seconds
// (each tool call, each reasoning round). If nothing arrives for this long,
// the connection has stalled (dropped network, backend hang) rather than just
// being a slow-but-alive AI call — abort instead of spinning forever.
const STALL_TIMEOUT_MS = 90_000;

/**
 * Posts to an SSE-streaming AI route and reports discrete status updates as they
 * arrive (not token-level text — the agent only ever returns one finished string,
 * so we surface progress stages instead: "Contacting Azure OpenAI...", "Looking up
 * specs for X...", etc). Resolves with the final result string once the stream
 * sends its `result` event. Throws if the stream stalls for longer than
 * STALL_TIMEOUT_MS with no new data, so the UI never spins indefinitely.
 */
export async function fetchAgentStream(
  url: string,
  body: unknown,
  resultKey: string,
  onStatus: (event: AgentStatusEvent) => void
): Promise<string> {
  const controller = new AbortController();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!res.body) {
    // Fallback for environments without streaming bodies: parse as plain JSON.
    const data = await res.json();
    return data[resultKey] || "";
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";
  let resultReceived = false;

  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const resetStallTimer = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => controller.abort(), STALL_TIMEOUT_MS);
  };

  try {
    resetStallTimer();

    while (true) {
      const { done, value } = await reader.read();
      resetStallTimer();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event: "));
        const dataLine = lines.find((l) => l.startsWith("data: "));
        if (!eventLine || !dataLine) continue;

        const eventName = eventLine.replace("event: ", "").trim();
        const data = JSON.parse(dataLine.slice("data: ".length));

        if (eventName === "status") {
          onStatus(data as AgentStatusEvent);
        } else if (eventName === "result") {
          result = data[resultKey] || "";
          resultReceived = true;
        } else if (eventName === "error") {
          throw new Error(data.error || "AI stream failed");
        }
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("AI response stalled — no update received for 90 seconds. Please try again.");
    }
    throw error;
  } finally {
    if (stallTimer) clearTimeout(stallTimer);
  }

  if (!resultReceived) {
    throw new Error("AI stream ended without a result — please try again.");
  }

  return result;
}
