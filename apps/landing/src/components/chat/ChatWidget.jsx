import { useState, useEffect, useRef, useCallback } from 'react';
import { FiMessageCircle, FiX, FiSend, FiLoader, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { trackChat } from '../../lib/analytics';

const USER_ID_KEY = 'chat_user_identifier';

function getOrCreateUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

function formatTime(d) {
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function PreChatForm({ onSubmit, initial }) {
  const [name, setName] = useState(initial.name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [reason, setReason] = useState(initial.reason || '');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(initial.name && initial.email && initial.phone ? 2 : 1);

  function validateStep1() {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (!phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[\d\s+\-()]{7,15}$/.test(phone.trim())) errs.phone = 'Invalid phone number';
    return errs;
  }

  function handleNext(e) {
    e.preventDefault();
    const errs = validateStep1();
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), reason: reason.trim() });
    setSubmitting(false);
  }

  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col justify-between p-5 bg-gray-50/50">
        <div>
          <div className="text-center mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-2">
              <FiMessageCircle className="w-5 h-5 text-brand-green" />
            </div>
            <h3 className="text-sm font-bold text-dark-navy">Start a Conversation</h3>
            <p className="text-xs text-gray-500 mt-0.5">Share your details and we'll be right with you.</p>
          </div>
          <form id="prechat-step1-form" onSubmit={handleNext} className="space-y-3">
            <div>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="Your Name *"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                  errors.name ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="Email Address *"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                  errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
                placeholder="Phone Number *"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors ${
                  errors.phone ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green'
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </form>
        </div>
        <button
          type="submit"
          form="prechat-step1-form"
          className="w-full py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-green/90 transition-colors cursor-pointer mt-4"
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gray-50/50">
      <div>
        <div className="text-center mb-4">
          <button onClick={() => setStep(1)} className="text-xs text-brand-green hover:underline mb-1 cursor-pointer block text-left">&larr; Back</button>
          <h3 className="text-sm font-bold text-dark-navy">What brings you here?</h3>
          <p className="text-xs text-gray-500 mt-0.5">Tell us how we can help you.</p>
        </div>
        <form id="prechat-step2-form" onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green resize-none"
            />
          </div>
        </form>
      </div>
      <button
        type="submit"
        form="prechat-step2-form"
        disabled={!reason.trim() || submitting}
        className="w-full py-2.5 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-60 cursor-pointer mt-4"
      >
        {submitting ? 'Starting...' : 'Start Chat'}
      </button>
    </div>
  );
}

function CloseConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl mx-4 p-6 w-full max-w-sm">
        <h3 className="text-sm font-bold text-dark-navy mb-2">Close Chat?</h3>
        <p className="text-sm text-gray-500 mb-6">Are you sure you want to close? All chat messages will be lost.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-destructive-500 rounded-lg hover:bg-destructive-600 transition-colors cursor-pointer"
          >
            Close Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visitorInfo, setVisitorInfo] = useState({ name: '', email: '', phone: '' });
  const [showPreChat, setShowPreChat] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const messagesEnd = useRef(null);
  const chatScrollContainer = useRef(null);
  const userId = useRef(getOrCreateUserId());

  const scrollToBottom = useCallback((instant = false) => {
    requestAnimationFrame(() => {
      if (messagesEnd.current) {
        messagesEnd.current.scrollIntoView({
          behavior: instant ? 'auto' : 'smooth',
          block: 'end',
        });
      }
      if (chatScrollContainer.current) {
        chatScrollContainer.current.scrollTop = chatScrollContainer.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
    const timer = setTimeout(() => scrollToBottom(false), 80);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Merge messages avoiding duplicates by id or content+sender timestamp
  const mergeMessageList = useCallback((existing, incoming) => {
    const map = new Map();
    existing.forEach((m) => {
      map.set(m.id || `temp_${m.content}_${m.created_at}`, m);
    });
    incoming.forEach((m) => {
      // If temporary message with same content exists, replace with DB item
      for (const [key, val] of map.entries()) {
        if (key.startsWith('temp_') && val.content === m.content && val.sender === m.sender) {
          map.delete(key);
        }
      }
      map.set(m.id, m);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
  }, []);

  const initChat = useCallback(async (reset) => {
    if (reset) {
      setConversationId(null);
      setMessages([]);
      setShowPreChat(false);
      setLoading(true);
    }

    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_identifier', userId.current)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing?.length > 0) {
        const conv = existing[0];
        setConversationId(conv.id);
        setVisitorInfo({ name: conv.user_name || '', email: conv.user_email || '', phone: conv.user_phone || '' });
        setShowPreChat(false);

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at');
        setMessages(msgs || []);
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        setShowPreChat(true);
      }
    } catch (err) {
      console.warn('Chat initialization warning:', err);
      setShowPreChat(true);
    } finally {
      setLoading(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    initChat(false);
  }, [initChat]);

  // Realtime Supabase subscription
  useEffect(() => {
    if (!conversationId) return;

    const msgChannel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => mergeMessageList(prev, [payload.new]));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [conversationId, mergeMessageList]);

  // Fallback polling every 3 seconds to guarantee no messages are hidden/lost
  useEffect(() => {
    if (!conversationId || !open) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: latest } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (latest && latest.length > 0) {
          setMessages((prev) => {
            const prevIds = new Set(prev.map(m => m.id));
            const hasNew = latest.some(m => !prevIds.has(m.id));
            if (hasNew || latest.length !== prev.length) {
              return mergeMessageList(prev, latest);
            }
            return prev;
          });
        }
      } catch (e) {
        // silent fallback
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [conversationId, open, mergeMessageList]);

  // Heartbeat last seen update
  useEffect(() => {
    if (!conversationId || !open) return;

    const interval = setInterval(async () => {
      await supabase
        .from('conversations')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', conversationId);
    }, 30000);

    return () => clearInterval(interval);
  }, [conversationId, open]);

  async function handlePreChatSubmit(info) {
    try {
      const fullPayload = {
        user_identifier: userId.current,
        user_name: info.name,
        user_email: info.email,
        user_phone: info.phone,
        reason: info.reason || '',
        status: 'open',
      };

      let { data: conv, error } = await supabase
        .from('conversations')
        .insert(fullPayload)
        .select()
        .maybeSingle();

      // Fallback if columns like 'reason', 'user_email' or 'user_phone' are missing in Supabase schema
      if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('reason'))) {
        console.warn('Legacy conversations table schema detected, trying minimal payload:', error.message);
        const minimalRes = await supabase
          .from('conversations')
          .insert({
            user_identifier: userId.current,
            user_name: info.name,
            status: 'open',
          })
          .select()
          .maybeSingle();
        conv = minimalRes.data;
        error = minimalRes.error;
      }

      if (error) {
        console.error('Supabase chat error:', error);
        alert(`Live Chat Error: ${error.message}\n\nPlease run the SQL alter table script in your Supabase SQL Editor.`);
        return;
      }

      if (conv) {
        trackChat('started');
        setVisitorInfo(info);
        setShowPreChat(false);
        setConversationId(conv.id);

        if (info.reason) {
          const initMsg = {
            id: `temp_${Date.now()}`,
            conversation_id: conv.id,
            sender: 'user',
            content: info.reason,
            created_at: new Date().toISOString(),
          };
          setMessages([initMsg]);

          const { data: savedMsg } = await supabase
            .from('messages')
            .insert({
              conversation_id: conv.id,
              sender: 'user',
              content: info.reason,
            })
            .select()
            .maybeSingle();

          if (savedMsg) {
            setMessages((prev) => mergeMessageList(prev, [savedMsg]));
          }
        } else {
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Chat submit error:', err);
      alert(`Chat Error: ${err.message}`);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !conversationId || sending) return;

    setSending(true);
    setInput('');

    // Optimistically show message immediately so it's never hidden to the user
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom(false);

    try {
      const { data: insertedMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender: 'user',
          content: text,
        })
        .select()
        .maybeSingle();

      if (!error) {
        trackChat('message_sent');
        if (insertedMsg) {
          setMessages((prev) => mergeMessageList(prev, [insertedMsg]));
        }
        await supabase
          .from('conversations')
          .update({
            last_message: text,
            last_message_sender: 'user',
            last_message_at: new Date().toISOString(),
            notified: true,
          })
          .eq('id', conversationId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }

  async function handleCloseClick() {
    if (messages.length === 0) {
      if (conversationId) {
        await supabase.from('conversations').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', conversationId);
      }
      setOpen(false);
      setConversationId(null);
      setVisitorInfo({ name: '', email: '', phone: '' });
      setShowPreChat(true);
    } else {
      setShowCloseConfirm(true);
    }
  }

  async function handleConfirmClose() {
    if (conversationId) {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) console.error('Failed to close conversation:', error);
    }
    trackChat('closed');
    setShowCloseConfirm(false);
    setOpen(false);
    setConversationId(null);
    setMessages([]);
    setVisitorInfo({ name: '', email: '', phone: '' });
    setShowPreChat(true);
    setLoading(false);
  }

  function handleCancelClose() {
    setShowCloseConfirm(false);
  }

  function handleOpen() {
    trackChat('opened');
    setOpen(true);
    initChat(true);
  }

  return (
    <>
      {open && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in-up"
          style={{
            width: maximized ? 'calc(100vw - 2rem)' : 'min(90vw, 340px)',
            maxWidth: maximized ? 'none' : '360px',
            height: maximized ? 'calc(100vh - 2rem)' : '480px',
            maxHeight: maximized ? 'none' : '82vh',
            bottom: '1rem',
            right: maximized ? '1rem' : '1.25rem',
          }}
        >
          {/* Header */}
          <div className="bg-brand-green text-white flex items-center justify-between px-3.5 py-2.5 shrink-0 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <FiMessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold block leading-tight truncate">Live Support</span>
                <span className="text-[10px] text-white/80 block leading-tight">We typically reply in a few minutes</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMaximized((p) => !p)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title={maximized ? "Minimize" : "Maximize"}
              >
                {maximized ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleCloseClick}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Close chat"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : showPreChat ? (
            <PreChatForm onSubmit={handlePreChatSubmit} initial={visitorInfo} />
          ) : (
            <>
              {/* Message List */}
              <div
                ref={chatScrollContainer}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/70 min-h-0 overscroll-contain"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-8">
                    Send a message to start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words overflow-hidden ${
                            isUser
                              ? 'bg-brand-blue text-white rounded-br-sm shadow-sm'
                              : 'bg-white border border-gray-200 text-dark-navy rounded-bl-sm shadow-sm'
                          }`}
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 text-right select-none ${
                              isUser ? 'text-white/70' : 'text-gray-400'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEnd} className="h-0 w-0" />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="shrink-0 px-3.5 py-2.5 border-t border-gray-200 bg-white">
                <div className="relative flex items-center">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-3.5 pr-10 py-2 text-sm border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="absolute right-1 w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    {sending ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {!open && (
        <button
          onClick={handleOpen}
          className="chat-widget-mild fixed top-1/2 -translate-y-1/2 right-4 sm:right-6 z-50 w-10 h-10 rounded-full bg-brand-green text-white shadow-lg hover:bg-brand-green/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <span className="relative w-5 h-5 shrink-0">
            <FiMessageCircle className="w-5 h-5" />
            <svg className="absolute inset-0 w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <circle
                  key={i}
                  cx={9 + i * 3}
                  cy="12.5"
                  r="1.4"
                  fill="currentColor"
                  style={{
                    transformBox: 'fill-box',
                    animation: `chat-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </svg>
          </span>
        </button>
      )}

      {showCloseConfirm && (
        <CloseConfirm onConfirm={handleConfirmClose} onCancel={handleCancelClose} />
      )}
    </>
  );
}
