"use client";

export interface AgentStatusEvent {
  stage: string;
  detail: string;
}

/**
 * Posts to an SSE-streaming AI route and reports discrete status updates as they
 * arrive (not token-level text — the agent only ever returns one finished string,
 * so we surface progress stages instead: "Contacting Azure OpenAI...", "Looking up
 * specs for X...", etc). Resolves with the final result string once the stream
 * sends its `result` event.
 */
export async function fetchAgentStream(
  url: string,
  body: unknown,
  resultKey: string,
  onStatus: (event: AgentStatusEvent) => void
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

  while (true) {
    const { done, value } = await reader.read();
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
      const data = JSON.parse(dataLine.replace("data: ", ""));

      if (eventName === "status") {
        onStatus(data as AgentStatusEvent);
      } else if (eventName === "result") {
        result = data[resultKey] || "";
      } else if (eventName === "error") {
        throw new Error(data.error || "AI stream failed");
      }
    }
  }

  return result;
}
