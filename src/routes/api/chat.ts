import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

type ChatBody = { messages?: unknown; context?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        let model;
        let gateway;
        const initialRunId = getLovableAiGatewayRunId(request);

        if (groqKey) {
          const groq = createOpenAICompatible({
            name: "groq",
            baseURL: "https://api.groq.com/openai/v1",
            headers: {
              Authorization: `Bearer ${groqKey}`,
            },
          });
          model = groq("llama-3.3-70b-versatile");
        } else {
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          gateway = createLovableAiGatewayProvider(key, initialRunId);
          model = gateway("google/gemini-3-flash-preview");
        }

        const system = `You are NutriTwin AI, a warm, evidence-based Indian nutrition assistant.
Give practical, concise, encouraging guidance about diet, meals, macros and healthy habits.
Favor Indian and regional foods. Use short paragraphs and bullet points. Use markdown.
You are not a doctor; for medical concerns, advise consulting a professional.
${body.context ? `\nUser profile context:\n${body.context}` : ""}`;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          headers: groqKey
            ? undefined
            : getLovableAiGatewayResponseHeaders(undefined, {
                ...(initialRunId ? { [RUN_ID_HEADER]: initialRunId } : {}),
              }),
        });

        if (groqKey) {
          return response;
        }

        return withLovableAiGatewayRunIdHeader(response, gateway!);
      },
    },
  },
});
