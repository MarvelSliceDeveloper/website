"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IconMessage } from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import { timeAgo } from "@/lib/time-ago";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  sender: { id: string; name: string; role: string };
  receiver: { id: string; name: string; role: string };
  subject: string | null;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function AdminInboxMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<{ conversations: Conversation[] }>("/api/messages/conversations");
      setConversations(data.conversations || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api.get<{ conversations: Conversation[] }>("/api/messages/conversations")
      .then((data) => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openThread = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const data = await api.get<{ messages: Message[] }>(`/api/messages/${userId}`);
      setThread(data.messages || []);
    } catch { setThread([]); }
  };

  const sendMessage = async () => {
    if (!selectedUserId || !newMessage.trim()) return;
    try {
      await api.post("/api/messages", { receiverId: selectedUserId, body: newMessage });
      toast.success("Message sent");
      setNewMessage("");
      openThread(selectedUserId);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Inbox</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Direct messages with users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversation List */}
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Conversations</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">No conversations yet</p>
            ) : (
              conversations.map((conv) => {
                const other = conv.sender.id === selectedUserId ? conv.receiver : conv.sender;
                return (
                  <button
                    key={conv.id}
                    onClick={() => openThread(other.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-card-hover ${
                      selectedUserId === other.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                      {other.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{other.name}</p>
                      <p className="text-xs text-muted truncate">{conv.body}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="rounded-xl border border-border/60 bg-card lg:col-span-2 flex flex-col">
          {selectedUserId ? (
            <>
              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                {thread.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === selectedUserId ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
                      msg.senderId === selectedUserId
                        ? "bg-card-hover text-foreground border border-border"
                        : "bg-primary text-white"
                    }`}>
                      <p>{msg.body}</p>
                      <p className="text-[10px] mt-1 opacity-60">{timeAgo(msg.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="field flex-1"
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim()} className="btn-primary text-sm">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <IconMessage size={24} />
              </div>
              <p className="font-semibold text-foreground">Select a conversation</p>
              <p className="mt-1 text-sm text-muted-foreground">Choose a conversation from the left to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
