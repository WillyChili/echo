import { useState, useRef, useEffect, useCallback } from 'react';
import MicButton from '../components/MicButton.jsx';
import { Button } from '../components/ui/button.jsx';
import { useSpeech } from '../hooks/useSpeech.js';
import { cn } from '@/lib/utils';
import { authFetch } from '../lib/api.js';

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405z" />
    </svg>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'echo', text: "I'm Echo — made from your words. What's on your mind?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [micError, setMicError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Speech ────────────────────────────────────────────────────────────────
  const inputSnapshotRef = useRef('');

  const handleTranscript = useCallback((sessionText) => {
    const base = inputSnapshotRef.current;
    const sep = base && !base.endsWith(' ') ? ' ' : '';
    setInput(base + sep + sessionText);
  }, []);

  const { isRecording, isSupported, startRecording, stopRecording, error: speechError } =
    useSpeech(handleTranscript);

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

      const res = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ userMessage: text, notes }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'echo', text: data.error || 'Something went wrong. Try again in a moment.', isError: true },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'echo', text: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'echo', text: "Can't reach the server right now. Make sure it's running.", isError: true },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, isRecording, stopRecording]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Notice bar */}
      <div className="bg-card/60 border-b border-border/60 py-2 px-4">
        <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          Echo learns from your notes. The more you write, the more it sounds like you.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
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

      {/* Input area */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {micError && <p className="text-xs text-red-400 mb-2">{micError}</p>}
          <div className="flex items-end gap-2">
            <MicButton
              isRecording={isRecording}
              isSupported={isSupported}
              onToggle={toggleMic}
              size="sm"
            />
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say something..."
                rows={1}
                className="w-full bg-card border border-input rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed max-h-40 transition-colors squircle"
                style={{ overflowY: 'auto' }}
              />
            </div>
            {/* EAI-10: no hover — active: only */}
            <Button
              size="icon"
              onClick={send}
              disabled={!input.trim() || isLoading}
              className="rounded-full mb-0.5 shrink-0"
            >
              <SendIcon />
            </Button>
          </div>
          {isRecording && (
            <p className="text-xs text-mint mt-2 text-center animate-pulse">
              Listening — speak naturally
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-secondary text-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap squircle">
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
