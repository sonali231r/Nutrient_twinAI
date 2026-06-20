import { useMemo, useRef, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { Send, Sparkles, Loader2, MessageSquareHeart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchHealthRecord, fetchProfile } from "@/lib/user-data";
import { labelFor, GOALS, REGIONS, FOOD_PREFERENCES } from "@/lib/nutrition/constants";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — NutriTwin AI" }] }),
  component: Assistant,
});

const SUGGESTIONS = [
  "Can I eat rice at night?",
  "Suggest protein-rich vegetarian foods.",
  "I have diabetes, what should I avoid?",
  "I want to gain muscle — how should I eat?",
];

function Assistant() {
  const { user } = useAuth();
  const uid = user?.id;

  const profileQ = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => fetchProfile(uid!),
    enabled: !!uid,
  });
  const healthQ = useQuery({
    queryKey: ["health", uid],
    queryFn: () => fetchHealthRecord(uid!),
    enabled: !!uid,
  });

  const context = useMemo(() => {
    const p = profileQ.data;
    const h = healthQ.data;
    if (!p && !h) return "";
    return [
      p?.full_name ? `Name: ${p.full_name}` : "",
      p?.age ? `Age: ${p.age}` : "",
      p?.gender ? `Gender: ${p.gender}` : "",
      h?.goal ? `Goal: ${labelFor(GOALS, h.goal)}` : "",
      h?.food_preference ? `Diet: ${labelFor(FOOD_PREFERENCES, h.food_preference)}` : "",
      h?.region ? `Region: ${labelFor(REGIONS, h.region)}` : "",
      h?.bmi ? `BMI: ${h.bmi}` : "",
      h?.daily_calories ? `Daily calorie target: ${h.daily_calories}` : "",
      h?.health_risk ? `Health risk: ${h.health_risk}` : "",
      h?.allergies?.length ? `Allergies: ${h.allergies.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("; ");
  }, [profileQ.data, healthQ.data]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ context }),
      }),
    [context],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <AppShell>
      <PageHeader
        title="AI Nutrition Assistant"
        description="Ask anything about food, diet and healthy habits."
      />
      <div className="flex h-[calc(100vh-13rem)] flex-col rounded-xl border border-border bg-card">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquareHeart className="h-6 w-6" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your personal nutrition coach. Try one of these to get started:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-primary/40 hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  ) : (
                    text
                  )}
                </div>
              </div>
            );
          })}

          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about diet, meals, macros…"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> NutriTwin AI is not a medical professional. Consult a
        doctor for medical concerns.
      </p>
    </AppShell>
  );
}
