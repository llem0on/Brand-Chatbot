"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ChatMessage, ConversationState } from "@/lib/types";

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ConversationState[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadConversations() {
    apiFetch<ConversationState[]>("/admin/conversations").then(setConversations);
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeUserId) return;

    function loadMessages() {
      apiFetch<ChatMessage[]>(`/admin/conversations/${encodeURIComponent(activeUserId!)}/messages`).then(setMessages);
    }

    loadMessages();
    pollRef.current = setInterval(loadMessages, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeUserId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeUserId || !reply.trim()) return;
    setSending(true);
    await apiFetch(`/admin/conversations/${encodeURIComponent(activeUserId)}/reply`, {
      method: "POST",
      body: JSON.stringify({ message: reply }),
    });
    setReply("");
    setSending(false);
    apiFetch<ChatMessage[]>(`/admin/conversations/${encodeURIComponent(activeUserId)}/messages`).then(setMessages);
  }

  async function handleResolve() {
    if (!activeUserId) return;
    await apiFetch(`/admin/conversations/${encodeURIComponent(activeUserId)}/resolve`, { method: "POST" });
    setActiveUserId(null);
    loadConversations();
  }

  const active = conversations.find((c) => c.user_id === activeUserId);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink mb-8">Chat Eskalasi</h1>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        <div className="w-72 shrink-0 bg-surface border border-accent/10 rounded-lg overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink/40">Tidak ada chat yang dieskalasi</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setActiveUserId(conv.user_id)}
                className={`w-full text-left px-5 py-4 border-b border-accent/5 transition-colors ${
                  activeUserId === conv.user_id ? "bg-accent/10" : "hover:bg-accent/5"
                }`}
              >
                <p className="text-sm text-ink truncate">{conv.user_id}</p>
                <p className="text-xs text-ink/40 mt-1 line-clamp-2">{conv.escalation_summary}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 bg-surface border border-accent/10 rounded-lg flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-ink/30 text-sm">
              Pilih percakapan untuk membalas
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-accent/10">
                <div>
                  <p className="text-sm text-ink">{active.user_id}</p>
                  <p className="text-xs text-ink/40">{active.channel}</p>
                </div>
                <button className="admin-btn-outline" onClick={handleResolve}>
                  Selesaikan
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-md px-4 py-2.5 rounded-lg text-sm ${
                      msg.sender === "user"
                        ? "bg-bg text-ink/90"
                        : msg.sender === "admin"
                          ? "bg-accent-strong text-ink ml-auto"
                          : "bg-section text-ink/70"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="flex gap-2 px-5 py-4 border-t border-accent/10">
                <input
                  className="admin-input flex-1"
                  placeholder="Tulis balasan..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button type="submit" disabled={sending} className="admin-btn disabled:opacity-50">
                  Kirim
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
