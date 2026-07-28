export type AgentStatusStage =
  | "starting"
  | "mock"
  | "calling_model"
  | "tool_call"
  | "reasoning"
  | "finalizing"
  | "done"
  | "error";

export interface AgentStatusEvent {
  stage: AgentStatusStage;
  detail: string;
}

export type StatusEmitter = (event: AgentStatusEvent) => void;

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Runs an agent function that reports progress via a StatusEmitter callback,
 * relaying each status update to the client as an SSE `status` event and
 * finishing with a `result` or `error` event. No token-level streaming —
 * the agent only ever returns one complete string, so we stream discrete
 * progress stages instead of partial text.
 */
export function createAgentSSEResponse(
  run: (emit: StatusEmitter) => Promise<string>,
  resultKey: string
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit: StatusEmitter = (event) => {
        controller.enqueue(encoder.encode(sseEncode("status", event)));
      };

      try {
        const result = await run(emit);
        controller.enqueue(encoder.encode(sseEncode("result", { [resultKey]: result })));
      } catch (error) {
        controller.enqueue(
          encoder.encode(sseEncode("error", { error: error instanceof Error ? error.message : String(error) }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
