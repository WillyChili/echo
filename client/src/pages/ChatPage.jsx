import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import MicButton from '../components/MicButton.jsx';
import { useSpeech } from '../hooks/useSpeech.js';
import { cn } from '@/lib/utils';
import { authFetch } from '../lib/api.js';
import { useTranslation } from '../hooks/useTranslation.js';
import { useProfile } from '../context/ProfileContext.jsx';

const getToday = () => new Date().toISOString().slice(0, 10);

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405z" />
    </svg>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const { language } = useProfile();
  const location = useLocation();
  const today = getToday();

  const [messages, setMessages]               = useState([]); // { role, text, date, created_at }
  // Pre-fill input from navigation state (e.g. "Ask Echo about this" from Notes)
  const [input, setInput]                     = useState(location.state?.prefill || '');
  const [isLoading, setIsLoading]             = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [hasMore, setHasMore]                 = useState(false);
  const [micError, setMicError]               = useState(null);

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const scrollRef    = useRef(null);
  const oldestTsRef  = useRef(null); // created_at of oldest loaded message

  // ── Speech ────────────────────────────────────────────────────────────────
  const inputSnapshotRef = useRef('');

  const handleTranscript = useCallback((sessionText) => {
    const base = inputSnapshotRef.current;
    const sep = base && !base.endsWith(' ') ? ' ' : '';
    setInput(base + sep + sessionText);
  }, []);

  const { isRecording, isSupported, startRecording, stopRecording, error: speechError } =
    useSpeech(handleTranscript, language);

  useEffect(() => {
    if (speechError) setMicError(speechError);
  }, [speechError]);

  const toggleMic = () => {
    setMicError(null);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(() => { inputSnapshotRef.current = input; });
    }
  };

  // ── Load initial history (last 50) + digest check ────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch('/api/messages');
        const data = await res.json();
        const msgs = (data.messages || []).map((m) => ({
          role: m.role, text: m.content, date: m.date, created_at: m.created_at,
        }));
        setMessages(msgs);
        setHasMore(data.hasMore || false);
        if (msgs.length > 0) oldestTsRef.current = msgs[0].created_at;

        // Check if a new digest is ready (non-blocking)
        try {
          const digestRes  = await authFetch('/api/digest');
          const digestData = await digestRes.json();
          if (digestData?.digest) {
            setMessages((prev) => [...prev, { role: 'echo', text: digestData.digest, date: today }]);
          }
        } catch { /* digest failure is always silent */ }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    load();
  }, []);

  // ── Load older messages (infinite scroll up) ──────────────────────────────
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestTsRef.current) return;
    setIsLoadingMore(true);
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    try {
      const res  = await authFetch(`/api/messages?before=${encodeURIComponent(oldestTsRef.current)}`);
      const data = await res.json();
      const older = (data.messages || []).map((m) => ({
        role: m.role, text: m.content, date: m.date, created_at: m.created_at,
      }));
      if (older.length > 0) {
        oldestTsRef.current = older[0].created_at;
        setMessages((prev) => [...older, ...prev]);
        setHasMore(data.hasMore || false);
        // Restore scroll position so user stays at same spot
        requestAnimationFrame(() => {
          if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
        });
      } else {
        setHasMore(false);
      }
    } catch (e) { console.error('Failed to load messages:', e); } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  // ── Scroll listener for infinite scroll up ────────────────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      if (container.scrollTop < 80) loadMore();
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Send message ──────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (isRecording) stopRecording();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text, date: today }]);
    setIsLoading(true);

    try {
      let notes = [];
      try {
        const notesRes = await authFetch('/api/notes');
        if (notesRes.ok) notes = await notesRes.json();
      } catch { /* proceed without notes */ }

      const res  = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ userMessage: text, notes, language }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'echo', text: data.error || t('chat_error_generic'), isError: true, date: today },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'echo', text: data.reply, date: today }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'echo', text: t('chat_error_server'), isError: true, date: today },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, isRecording, stopRecording, language, today]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showWelcome = messages.length === 0 && !isLoading && !isLoadingHistory;

  // ── Render messages with date separators ─────────────────────────────────
  const renderMessages = () => {
    let lastDate = null;
    const elements = [];
    messages.forEach((msg, i) => {
      if (msg.date && msg.date !== lastDate) {
        elements.push(
          <DateSeparator key={`sep-${msg.date}`} date={msg.date} today={today} language={language} t={t} />
        );
        lastDate = msg.date;
      }
      elements.push(<MessageBubble key={i} msg={msg} />);
    });
    return elements;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Notice bar */}
      <div className="px-4 py-2.5 border-b border-border/60">
        <p className="text-xs text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-mint/50 bg-mint/10 text-mint font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-mint shrink-0" />
            {t('chat_notice')}
          </span>
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-muted-foreground animate-pulse">{t('chat_loading_more')}</span>
            </div>
          )}

          {showWelcome && (
            <MessageBubble msg={{ role: 'echo', text: t('chat_initial_message') }} />
          )}

          {renderMessages()}

          {isLoading && (
            <div className="flex items-start gap-2">
              <EchoAvatar />
              <div className="bg-secondary/70 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 squircle">
                <ThinkingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {micError && <p className="text-xs text-red-400 mb-2">{micError}</p>}
          <div className="flex items-center gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat_placeholder')}
              rows={1}
              className="flex-1 bg-card border border-input rounded-2xl px-4 py-[10px] text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed h-11 transition-colors squircle"
              style={{ overflowY: 'hidden' }}
            />
            <MicButton
              isRecording={isRecording}
              isSupported={isSupported}
              onToggle={toggleMic}
              size="md"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || isLoading}
              className={`rounded-full shrink-0 h-11 w-11 flex items-center justify-center transition-colors duration-150 focus:outline-none select-none ${
                input.trim() && !isLoading
                  ? 'bg-mint text-background active:bg-mint/70'
                  : 'bg-mint/20 text-mint/50 cursor-default'
              }`}
            >
              <SendIcon />
            </button>
          </div>
          {isRecording && (
            <p className="text-xs text-mint mt-2 text-center animate-pulse">{t('chat_listening')}</p>
          )}
        </div>
      </div>

    </div>
  );
}

function DateSeparator({ date, today, language, t }) {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let label;
  if (date === today) label = t('chat_today');
  else if (date === yesterday) label = t('chat_yesterday');
  else label = new Date(date + 'T12:00:00').toLocaleDateString(
    language === 'es' ? 'es-AR' : 'en-US',
    { month: 'short', day: 'numeric' }
  );

  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border/30" />
      <span className="text-xs text-muted-foreground/80 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[76%] bg-mint/15 text-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap squircle">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <EchoAvatar />
      <div
        className={cn(
          'max-w-[76%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap squircle',
          msg.isError
            ? 'bg-destructive/20 border border-destructive/40 text-red-300'
            : 'bg-secondary/70 border border-border/40 text-foreground'
        )}
      >
        {msg.text}
      </div>
    </div>
  );
}

function EchoAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-muted border border-border/50 flex items-center justify-center text-xs text-muted-foreground font-medium shrink-0 mt-0.5 select-none">
      e
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
