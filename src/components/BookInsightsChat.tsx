import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

const STORAGE_KEY = "bv-insights-chat";

const PRESETS = [
  "Which book is growing faster?",
  "How many views did each book get this year?",
  "Compare Year 1 of both books",
  "What's a good estimate for next year?",
  "Give me 3 quick insights",
];

function AnalystMark() {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{ background: "var(--bv-night)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="var(--bv-coral)" strokeWidth="1.8">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <path d="M9 13.5v-2M12 13.5V10M15 13.5v-3" stroke="white" />
      </svg>
    </div>
  );
}

export default function BookInsightsChat() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setInitial(raw ? (JSON.parse(raw) as UIMessage[]) : []);
    } catch {
      setInitial([]);
    }
  }, []);
  return (
    <section
      id="insights"
      className="mt-10 rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: "var(--bv-line)", background: "var(--bv-surface)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AnalystMark />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--bv-ink-faint)" }}>
              Q&amp;A · AI-POWERED
            </p>
            <h2 className="font-display text-2xl">Ask the views analyst</h2>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm" style={{ color: "var(--bv-ink-soft)" }}>
        Ask anything about how each book is being read — or tap a question below to get started.
      </p>
      {initial ? <ChatWindow initial={initial} /> : <div className="h-[420px]" />}
    </section>
  );
}

function ChatWindow({ initial }: { initial: UIMessage[] }) {
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "bv-insights",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => setError(e.message || "Something went wrong. Please try again."),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, status]);

  const focus = () => wrapRef.current?.querySelector("textarea")?.focus();
  useEffect(() => {
    if (!busy) focus();
  }, [busy]);

  const ask = (q: string) => {
    const t = q.trim();
    if (!t || busy) return;
    setError(null);
    setText("");
    void sendMessage({ text: t });
  };

  return (
    <div ref={wrapRef} className="mt-5">
      <Conversation className="h-[420px] rounded-xl border" style={{ borderColor: "var(--bv-line)", background: "var(--bv-paper)" }}>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<AnalystMark />}
              title="Pre-insights ready"
              description="I know the yearly views for The Fox and the Cub and Rao's Expedition Book. What would you like to know?"
            />
          ) : (
            messages.map((m) => (
              <Message from={m.role} key={m.id}>
                <MessageContent
                  className={
                    m.role === "user"
                      ? "!bg-[var(--bv-night)] !text-[var(--bv-surface)]"
                      : "!bg-transparent text-[var(--bv-ink)]"
                  }
                >
                  {m.parts.map((p, i) =>
                    p.type === "text" ? (
                      m.role === "assistant" ? (
                        <MessageResponse key={i}>{p.text}</MessageResponse>
                      ) : (
                        <span key={i}>{p.text}</span>
                      )
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="!bg-transparent">
                <Shimmer>Reading the numbers…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <Suggestions className="mt-3">
        {PRESETS.map((q) => (
          <Suggestion key={q} suggestion={q} onClick={ask} disabled={busy} />
        ))}
      </Suggestions>

      {error && (
        <p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--bv-paper)", color: "var(--bv-coral)" }}>
          {error}
        </p>
      )}

      <div className="mt-3">
        <PromptInput onSubmit={(msg) => ask(msg.text ?? text)}>
          <PromptInputTextarea
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            placeholder="Ask about views, growth, or comparisons…"
          />
          <PromptInputFooter className="justify-between">
            <button
              type="button"
              className="text-xs underline-offset-2 hover:underline"
              style={{ color: "var(--bv-ink-faint)" }}
              onClick={() => {
                setMessages([]);
                localStorage.removeItem(STORAGE_KEY);
                focus();
              }}
            >
              Clear chat
            </button>
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
