import { useState, useRef, useEffect, useCallback } from 'react';
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

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const { language } = useProfile();
  const today = getToday();

  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [micError, setMicError]           = useState(null);
  const [selectedDate, setSelectedDate]   = useState(today);
  const [chatDates, setChatDates]         = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

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

  // ── Load history on mount, then check for digest ──────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [datesRes, msgsRes] = await Promise.all([
          authFetch('/api/messages/dates'),
          authFetch(`/api/messages?date=${today}`),
        ]);
        const dates = await datesRes.json();
        const msgs  = await msgsRes.json();
        setChatDates(Array.isArray(dates) ? dates : []);
        const loaded = Array.isArray(msgs) ? msgs.map((m) => ({ role: m.role, text: m.content })) : [];
        setMessages(loaded);

        // Check if a new digest is ready (non-blocking)
        try {
          const digestRes  = await authFetch('/api/digest');
          const digestData = await digestRes.json();
          if (digestData?.digest) {
            setMessages((prev) => [...prev, { role: 'echo', text: digestData.digest }]);
            setChatDates((prev) => prev.includes(today) ? prev : [today, ...prev]);
          }
        } catch { /* digest failure is always silent */ }
      } catch {
        // proceed with empty state
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  // ── Load messages for a given date ───────────────────────────────────────
  const loadMessagesForDate = async (date) => {
    setMessages([]);
    try {
      const res  = await authFetch(`/api/messages?date=${date}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.map((m) => ({ role: m.role, text: m.content })));
      }
    } catch {}
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    loadMessagesForDate(newDate);
  };

  // ── Date navigator helpers ────────────────────────────────────────────────
  const allDates = [...new Set([today, ...chatDates])].sort((a, b) => b.localeCompare(a));
  const currentIndex = allDates.indexOf(selectedDate);
  const prevDate = allDates[currentIndex + 1] || null; // older
  const nextDate = allDates[currentIndex - 1] || null; // newer

  const formatDate = (dateStr) => {
    if (dateStr === today) return t('chat_today');
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === yesterday) return t('chat_yesterday');
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(
      language === 'es' ? 'es-AR' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
  };

  const isViewingPast = selectedDate !== today;

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
    setMessages((prev) => [...prev, { role: 'user', text }]);
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
          { role: 'echo', text: data.error || 'Something went wrong. Try again in a moment.', isError: true },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'echo', text: data.reply }]);
        // Make sure today is in chatDates
        setChatDates((prev) => prev.includes(today) ? prev : [today, ...prev]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'echo', text: t('chat_error_server'), isError: true },
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

  const showWelcome = messages.length === 0 && !isLoading && !loadingHistory && !isViewingPast;
  const showDateNav = chatDates.length > 0 || isViewingPast;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">

      {/* Notice bar */}
      <div className="px-4 py-2.5 border-b border-border/60">
        <p className="text-xs text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-mint/50 bg-mint/10 text-mint font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-mint shrink-0" />
            {t('chat_notice')}
          </span>
        </p>
      </div>

      {/* Date navigator */}
      {showDateNav && (
        <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-border/40">
          <button
            onClick={() => prevDate && handleDateChange(prevDate)}
            disabled={!prevDate}
            className="p-1 rounded-full text-muted-foreground transition-colors disabled:opacity-20 active:bg-secondary"
          >
            <ChevronLeftIcon />
          </button>
          <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-center">
            {formatDate(selectedDate)}
          </span>
          <button
            onClick={() => nextDate && handleDateChange(nextDate)}
            disabled={!nextDate}
            className="p-1 rounded-full text-muted-foreground transition-colors disabled:opacity-20 active:bg-secondary"
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {showWelcome && (
            <MessageBubble msg={{ role: 'echo', text: t('chat_initial_message') }} />
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

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

      {/* Input area — hidden when viewing past */}
      {!isViewingPast && (
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
              <p className="text-xs text-mint mt-2 text-center animate-pulse">
                {t('chat_listening')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Viewing past indicator */}
      {isViewingPast && (
        <div className="border-t border-border/60 px-4 py-3 text-center">
          <button
            onClick={() => handleDateChange(today)}
            className="text-xs text-mint font-medium active:opacity-70 transition-opacity"
          >
            {t('chat_today')} →
          </button>
        </div>
      )}

    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-mint/20 text-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap squircle">
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
          'max-w-[78%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap squircle',
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
