import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

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
        if (!groqKey) {
          return new Response("Missing GROQ_API_KEY in environment", { status: 500 });
        }

        const groq = createOpenAICompatible({
          name: "groq",
          baseURL: "https://api.groq.com/openai/v1",
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
        });
        const model = groq("llama-3.3-70b-versatile");

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

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
