import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  FiMessageCircle,
  FiSend,
  FiLoader,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiMail,
  FiPhone,
  FiCalendar,
  FiChevronDown,
  FiMessageSquare,
  FiList,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import PageShell from "../components/ui/PageShell";

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILTERS = ["All", "Open", "Closed"];

function ConversationList({
  conversations,
  activeId,
  onSelect,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  className = "",
}) {
  return (
    <div
      className={`${className} bg-white border-r border-admin-200 flex flex-col min-h-0`}
    >
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-admin-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-black text-base flex items-center gap-2">
            <FiMessageCircle className="w-4 h-4 text-cyan-500" />
            Chats
          </h2>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 border-0 rounded-lg outline-none focus:ring-2 focus:ring-neutral-500/30 placeholder-neutral-400"
          />
        </div>
        <div className="flex gap-1 mt-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                filter === f
                  ? "bg-admin-600 text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto admin-scrollbar">
        {conversations.length === 0 ? (
          <div className="text-center text-neutral-400 text-sm py-16 px-4">
            <FiMessageCircle className="w-10 h-10 mx-auto mb-3 text-neutral-200" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">New messages will appear here.</p>
          </div>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => {
              const isActive = activeId === conv.id;
              const lastMsg = conv.last_message || "";
              const preview =
                lastMsg.length > 70 ? lastMsg.slice(0, 70) + "\u2026" : lastMsg;
              const unread =
                conv.last_message_sender === "user" && conv.status === "open";

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer border-b border-admin-50 last:border-0 ${
                    isActive ? "bg-neutral-100" : "hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                        unread
                          ? "bg-admin-600 text-white"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {(conv.user_name || "V")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`text-sm truncate ${unread ? "font-bold text-black" : "font-semibold text-neutral-800"}`}
                        >
                          {conv.user_name || "Visitor"}
                        </p>
                        <span className="text-[11px] text-neutral-400 shrink-0">
                          {relativeTime(conv.last_message_at)}
                        </span>
                      </div>
                      {preview && (
                        <p
                          className={`text-xs truncate mt-0.5 ${unread ? "text-neutral-700 font-medium" : "text-neutral-400"}`}
                        >
                          {preview}
                        </p>
                      )}
                      {unread && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-admin-600" />
                          <span className="text-[10px] text-neutral-500 font-semibold">
                            New message
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBox({ msg }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-neutral-100 text-neutral-900 rounded-bl-md"
            : "bg-neutral-800 text-white rounded-br-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <div
          className={`flex items-center gap-1 mt-1 ${isUser ? "justify-end" : "justify-start"}`}
        >
          <span
            className={`text-[10px] ${isUser ? "text-neutral-400" : "text-white/70"}`}
          >
            {formatTime(msg.created_at)}
          </span>
          {!isUser && <FiCheck className="w-3 h-3 text-white/70" />}
        </div>
      </div>
    </div>
  );
}

function useUserOnline(conv) {
  if (!conv?.last_seen_at) return conv?.status === "open";
  const diff = Date.now() - new Date(conv.last_seen_at).getTime();
  return diff < 120000;
}

function LiveChat({ conversations, onConversationsChange }) {
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("Open");
  const [search, setSearch] = useState("");
  const messagesEnd = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);
  const userOnline = useUserOnline(activeConv);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = conversations
    .filter((c) => {
      const convDate = new Date(c.created_at).getTime();
      if (convDate < sevenDaysAgo) return false;
      if (filter === "Open") return c.status === "open";
      if (filter === "Closed") return c.status === "closed";
      return true;
    })
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (c.user_name || "").toLowerCase().includes(q) ||
        (c.last_message || "").toLowerCase().includes(q)
      );
    });

  useEffect(() => {
    if (!activeConv) return;
    let cancelled = false;

    supabase
      .from("conversations")
      .update({ notified: false })
      .eq("id", activeConv.id)
      .then();

    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConv.id)
        .order("created_at");
      if (!cancelled) setMessages(data || []);
    }

    load();

    const msgChannel = supabase
      .channel(`admin-messages:${activeConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          onConversationsChange((prev) =>
            prev.map((c) =>
              c.id === activeConv.id
                ? {
                    ...c,
                    last_message: payload.new.content,
                    last_message_sender: payload.new.sender,
                    last_message_at: payload.new.created_at,
                  }
                : c,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(msgChannel);
    };
  }, [activeConv?.id]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeConv || sending) return;

    setSending(true);
    setInput("");

    await supabase.from("messages").insert({
      conversation_id: activeConv.id,
      sender: "admin",
      content: text,
    });

    await supabase
      .from("conversations")
      .update({
        last_message: text,
        last_message_sender: "admin",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", activeConv.id);

    setSending(false);
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-11rem)] bg-white rounded-xl border border-admin-200 shadow-sm overflow-hidden">
      <ConversationList
        conversations={filtered}
        activeId={activeConv?.id}
        onSelect={(conv) => setActiveConv(conv)}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        className={`shrink-0 w-full lg:w-80 ${activeConv ? "hidden lg:flex" : "flex"}`}
      />

      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="shrink-0 px-5 py-3 border-b border-admin-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600 shrink-0">
                {(activeConv.user_name || "V")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-black text-sm truncate">
                  {activeConv.user_name || "Visitor"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveConv(null)}
              className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto admin-scrollbar px-5 py-4 space-y-3 bg-white">
            {messages.length === 0 && (
              <div className="text-center text-neutral-400 text-sm py-16">
                <p>No messages yet. Send a reply to start the conversation.</p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBox key={msg.id} msg={msg} />
            ))}
            <div ref={messagesEnd} />
          </div>

          <form
            onSubmit={handleSend}
            className="shrink-0 px-5 py-3 border-t border-admin-100 bg-white flex gap-2 items-end"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 px-4 py-1.5 text-sm border border-admin-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-500/30 focus:border-neutral-500 placeholder-neutral-400 resize-none"
              disabled={sending || activeConv.status === "closed"}
            />
            <button
              type="submit"
              disabled={
                !input.trim() || sending || activeConv.status === "closed"
              }
              className="w-10 h-10 rounded-full bg-admin-600 text-white flex items-center justify-center hover:bg-admin-600/90 transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
            >
              {sending ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiSend className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <FiMessageCircle className="w-16 h-16 mx-auto mb-4 text-neutral-200" />
            <p className="text-lg font-medium text-neutral-500">
              Select a conversation
            </p>
            <p className="text-sm text-neutral-300 mt-1">
              Choose a chat from the left panel to start replying.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageViewer({ conversation, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at");
      if (!cancelled) {
        setMessages(data || []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl mx-4 w-full max-w-2xl max-h-[80vh] flex flex-col cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 py-4 border-b border-admin-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-black text-sm">
              {conversation.user_name || "Visitor"}
            </p>
            <p className="text-xs text-neutral-400">
              {conversation.user_email}{" "}
              {conversation.user_phone ? `| ${conversation.user_phone}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto admin-scrollbar p-5 space-y-3 bg-white/50">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <FiLoader className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-neutral-400 text-sm py-10">
              <FiMessageCircle className="w-10 h-10 mx-auto mb-3 text-neutral-200" />
              <p>No messages in this session</p>
              <p className="text-xs mt-1">Messages are deleted after 7 days.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-neutral-100 text-neutral-900 rounded-bl-md"
                      : "bg-neutral-800 text-white rounded-br-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-neutral-400 text-right" : "text-white/70"}`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SessionsTable({ conversations }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [viewingConv, setViewingConv] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [filter, activeSearch]);

  const filtered = conversations
    .filter((c) => {
      if (filter === "new") return c.status === "open";
      if (filter === "closed") return c.status === "closed";
      return true;
    })
    .filter((c) => {
      if (!activeSearch.trim()) return true;
      const q = activeSearch.toLowerCase();
      return (
        (c.user_name || "").toLowerCase().includes(q) ||
        (c.user_email || "").toLowerCase().includes(q) ||
        (c.user_phone || "").toLowerCase().includes(q) ||
        (c.reason || "").toLowerCase().includes(q)
      );
    });

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  return (
    <div className="bg-white border border-admin-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-admin-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-black text-base flex items-center gap-2">
            <FiList className="w-4 h-4 text-amber-500" />
            Chat Sessions
          </h2>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (setActiveSearch(search), setPage(1))
              }
              placeholder="Search by name, email, phone..."
              className="w-full sm:w-56 pl-9 pr-3 h-9 border border-admin-200 rounded-none text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={() => {
              setActiveSearch(search);
              setPage(1);
            }}
            className="h-9 px-4 bg-admin-600 text-white text-sm font-medium rounded-full hover:bg-admin-700 transition-colors shrink-0"
          >
            Search
          </button>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 px-3 pr-8 rounded-none border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all cursor-pointer"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-600 border-b border-admin-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider w-12">
                #
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Phone
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Reason
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Date
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-white uppercase tracking-wider">
                Closed
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-neutral-400">
                  <FiMessageCircle className="w-10 h-10 mx-auto mb-3 text-neutral-200" />
                  <p>No chat sessions found</p>
                </td>
              </tr>
            ) : (
              paginated.map((conv, i) => (
                <tr
                  key={conv.id}
                  onClick={() => setViewingConv(conv)}
                  className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-gray-50`}
                >
                  <td className="px-5 py-4 text-neutral-400 text-xs">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600 shrink-0">
                        {(conv.user_name || "V")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-neutral-900">
                        {conv.user_name || "Visitor"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {conv.user_email ? (
                      <a
                        href={`mailto:${conv.user_email}`}
                        className="text-neutral-700 hover:text-neutral-900 hover:underline flex items-center gap-1.5"
                      >
                        <FiMail className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                        {conv.user_email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {conv.user_phone ? (
                      <a
                        href={`tel:${conv.user_phone}`}
                        className="text-neutral-700 hover:text-neutral-900 flex items-center gap-1.5"
                      >
                        <FiPhone className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        {conv.user_phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-4 text-neutral-700 max-w-[200px] truncate">
                    {conv.reason || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        conv.status === "open"
                          ? "bg-success-50 text-success-500"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${conv.status === "open" ? "bg-success-500" : "bg-neutral-400"}`}
                      />
                      {conv.status === "open" ? "New" : "Closed"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-500 text-xs">
                    {formatDate(conv.created_at)}
                  </td>
                  <td className="px-5 py-4 text-neutral-500 text-xs">
                    {conv.closed_at ? formatDate(conv.closed_at) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-admin-100 bg-white text-xs text-neutral-400 font-medium gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 px-1.5 rounded border border-admin-200 bg-white text-xs text-neutral-500 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
          </div>
          <span>{filtered.length} total</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded text-neutral-400 hover:bg-admin-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-1 text-neutral-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1 rounded text-neutral-400 hover:bg-admin-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewingConv && (
        <MessageViewer
          conversation={viewingConv}
          onClose={() => setViewingConv(null)}
        />
      )}
    </div>
  );
}

export default function ChatPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const tab = searchParams.get("tab") || "live";

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (cancelled || !data) return;

      const withLastMsg = await Promise.all(
        data.map(async (conv) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("content, sender, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);
          return {
            ...conv,
            last_message: msgs?.[0]?.content || "",
            last_message_sender: msgs?.[0]?.sender || "",
          };
        }),
      );

      if (!cancelled) {
        setConversations(withLastMsg);
        setLoading(false);
      }
    }

    fetch();

    const convChannel = supabase
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) =>
          setConversations((prev) => [
            { ...payload.new, last_message: "", last_message_sender: "" },
            ...prev,
          ]),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) =>
          setConversations((prev) =>
            prev.map((c) =>
              c.id === payload.new.id ? { ...c, ...payload.new } : c,
            ),
          ),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(convChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell backTo="/admin" title="" maxWidth="max-w-none">
      {tab === "live" ? (
        <LiveChat
          conversations={conversations}
          onConversationsChange={setConversations}
        />
      ) : (
        <SessionsTable conversations={conversations} />
      )}
    </PageShell>
  );
}
