import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MicButton from '../components/MicButton.jsx';
import { Button } from '../components/ui/button.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { useSpeech } from '../hooks/useSpeech.js';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer.js';
import { authFetch } from '../lib/api.js';
import { cleanupSpeechText } from '../lib/speechCleanup.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { useProfile } from '../context/ProfileContext.jsx';

const LOCALE_MAP = { en: 'en-US', es: 'es-AR' };

function formatDate(dateStr, language = 'en') {
  const [year, month, day] = dateStr.split('-').map(Number);
  const locale = LOCALE_MAP[language] || 'en-US';
  const str = new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateShort(dateStr, language = 'en') {
  const [year, month, day] = dateStr.split('-').map(Number);
  const locale = LOCALE_MAP[language] || 'en-US';
  const sameYear = year === new Date().getFullYear();
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    month: 'long', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function formatTime(isoStr, language = 'en') {
  if (!isoStr) return '';
  const locale = LOCALE_MAP[language] || 'en-US';
  const date = new Date(isoStr.includes('T') ? isoStr : isoStr + 'Z');
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: language !== 'es' });
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// ── Audio-reactive wave animation ─────────────────────────────────────────────
function WaveAnimation({ heights }) {
  const MIN_H = 3, MAX_H = 40;
  return (
    <div className="flex items-center gap-[3px]" style={{ height: `${MAX_H}px`, flexShrink: 0 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: `${Math.max(MIN_H, h * MAX_H)}px`,
          borderRadius: '2px',
          backgroundColor: 'hsl(var(--mint))',
          opacity: Math.max(0.25, Math.min(1, 0.25 + h * 0.75)),
          transition: 'height 60ms ease-out, opacity 60ms ease-out',
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

// ── EAI-14: Spinning arc ring around mic button ───────────────────────────────
function SpinningRing() {
  // EAI-40: Button is now 90px (home size); ring sits 10px outside it
  const total = 110;
  const r = total / 2 - 4;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.28;
  return (
    <svg
      width={total} height={total}
      viewBox={`0 0 ${total} ${total}`}
      style={{
        position: 'absolute',
        inset: '-10px',
        animation: 'spin-ring 2s linear infinite',
        pointerEvents: 'none',
      }}
    >
      <circle
        cx={total / 2} cy={total / 2} r={r}
        fill="none"
        stroke="hsl(var(--mint))"
        strokeWidth="3"
        strokeDasharray={`${arc} ${circ - arc}`}
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function MiniCalendar({ year, month, today, selectedDate, noteDates, onSelectDate, onPrevMonth, onNextMonth, onClose, language }) {
  const todayYear = parseInt(today.split('-')[0]);
  const todayMonth = parseInt(today.split('-')[1]) - 1;
  const canGoNext = year < todayYear || (year === todayYear && month < todayMonth);

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    language === 'es' ? 'es-AR' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Centered panel */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border/80 rounded-2xl p-4 shadow-2xl w-72">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onPrevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="text-sm font-medium text-foreground">{monthLabel}</span>
          <button onClick={onNextMonth} disabled={!canGoNext} className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${canGoNext ? 'hover:bg-muted text-muted-foreground' : 'opacity-20 cursor-default text-muted-foreground'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasNote = noteDates.has(dateStr);
            const isFuture = dateStr > today;
            return (
              <button
                key={i}
                disabled={isFuture}
                onClick={() => onSelectDate(dateStr)}
                className={`flex flex-col items-center justify-center gap-0.5 h-9 w-8 mx-auto rounded-xl text-xs transition-colors
                  ${isFuture ? 'opacity-25 cursor-default' : 'cursor-pointer'}
                  ${isSelected ? 'bg-mint text-background font-semibold'
                    : isToday ? 'border border-mint/60 text-mint hover:bg-mint/10'
                    : !isFuture ? 'text-foreground hover:bg-muted' : 'text-foreground'}
                `}
              >
                <span>{day}</span>
                <span className={`w-1 h-1 rounded-full ${hasNote && !isSelected ? 'bg-mint' : 'invisible'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function TodayPage() {
  const todayDate = getTodayDate();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { displayName: profileDisplayName } = useProfile();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  // EAI-19: personalized greeting — use ProfileContext, fallback to email prefix
  const displayName = profileDisplayName || user?.email?.split('@')[0] || '';

  // EAI-16: id-based tracking (null = fresh new entry)
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const isSavingRef = useRef(false);
  const [micError, setMicError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [viewingDate, setViewingDate] = useState(null);

  // Calendar date picker
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const calendarRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef(null);

  // EAI-10: Long-press selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pressingId, setPressingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);


  // ── Speech ────────────────────────────────────────────────────────────────
  const contentSnapshotRef = useRef('');

  const handleTranscript = useCallback((sessionText) => {
    const base = contentSnapshotRef.current;
    const sep = base && !base.endsWith(' ') && !base.endsWith('\n') ? ' ' : '';
    setContent(base + sep + sessionText);
  }, []);

  const { isRecording, isCleaning, isSupported, startRecording, stopRecording, error: speechError, speechLang, toggleSpeechLang } =
    useSpeech(handleTranscript, {
      cleanupFn: (text) => cleanupSpeechText(text, speechLang),
    });

  // Enable visualizer on web only — on Android two simultaneous mic streams conflict
  const isAndroid = window.Capacitor?.getPlatform?.() === 'android';
  const barHeights = useAudioVisualizer(isRecording && !isAndroid, 9);

  useEffect(() => { if (speechError) setMicError(speechError); }, [speechError]);

  const toggleMic = () => {
    setMicError(null);
    if (isRecording) stopRecording();
    else startRecording(() => { contentSnapshotRef.current = content; });
  };

  // ── Load all notes ────────────────────────────────────────────────────────
  const fetchAllNotes = useCallback(async () => {
    try {
      const res = await authFetch('/api/notes');
      if (res.ok) setNotes(await res.json());
    } catch { /* ignore */ } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllNotes(); }, [fetchAllNotes]);

  // Persist draft to localStorage so it survives app backgrounding.
  // Skip during active recording — speech fires interim results 10-20x/sec and
  // localStorage.setItem() is synchronous, so writing on every interim result
  // blocks the main thread and degrades speech recognition quality.
  useEffect(() => {
    if (isRecording) return;
    if (content.trim()) {
      localStorage.setItem('echo_draft_content', content);
      if (currentNoteId) localStorage.setItem('echo_draft_note_id', currentNoteId);
      else localStorage.removeItem('echo_draft_note_id');
      if (viewingDate) localStorage.setItem('echo_draft_viewing_date', viewingDate);
      else localStorage.removeItem('echo_draft_viewing_date');
    } else {
      localStorage.removeItem('echo_draft_content');
      localStorage.removeItem('echo_draft_note_id');
      localStorage.removeItem('echo_draft_viewing_date');
    }
  }, [content, currentNoteId, viewingDate, isRecording]);

  // Derived: all notes when viewing today (infinite scroll), filtered when a past date is selected
  const displayedNotes = selectedDate === todayDate
    ? notes
    : notes.filter(n => n.date === selectedDate);
  const visibleNotes = selectedDate === todayDate
    ? displayedNotes.slice(0, visibleCount)
    : displayedNotes;
  const allNoteDates = new Set(notes.map(n => n.date));

  // Reset visible count when switching between today / past-date views
  useEffect(() => { setVisibleCount(10); }, [selectedDate]);

  // Infinite scroll — observe sentinel at bottom of list and load 10 more notes
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => c + 10); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleNotes.length]);

  // Close calendar on outside click
  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [calendarOpen]);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    setCalendarMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  };

  const handleNextMonth = () => {
    setCalendarMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  };

  // ── Save on demand (tap "Guardar") → archive note + fresh editor ─────────
  const saveAndNew = useCallback(async () => {
    if (!content.trim() || isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
      let res;
      if (currentNoteId) {
        res = await authFetch(`/api/notes/${currentNoteId}`, {
          method: 'PUT',
          body: JSON.stringify({ content }),
        });
      } else {
        res = await authFetch('/api/notes', {
          method: 'POST',
          body: JSON.stringify({ date: todayDate, content }),
        });
      }
      if (res.ok) {
        const wasFirstNote = notes.length === 0 && !currentNoteId;
        setSaveStatus('saved');
        fetchAllNotes();
        localStorage.removeItem('echo_draft_content');
        localStorage.removeItem('echo_draft_note_id');
        localStorage.removeItem('echo_draft_viewing_date');
        if (wasFirstNote) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3200);
        }
        setTimeout(() => {
          setSaveStatus('');
          setContent('');
          setCurrentNoteId(null);
          setViewingDate(null);
        }, 600);
      }
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('');
    } finally {
      isSavingRef.current = false;
    }
  }, [content, currentNoteId, todayDate, fetchAllNotes]);

  // ── Open a past note into the editor ─────────────────────────────────────
  const openNote = useCallback((note) => {
    setContent(note.content);
    setCurrentNoteId(note.id);
    setViewingDate(note.date);
    setSaveStatus('');
  }, []);

  const startNewEntry = useCallback(() => {
    setContent('');
    setCurrentNoteId(null);
    setViewingDate(null);
    setSaveStatus('');
    localStorage.removeItem('echo_draft_content');
    localStorage.removeItem('echo_draft_note_id');
    localStorage.removeItem('echo_draft_viewing_date');
  }, []);

  // ── Long-press handlers ───────────────────────────────────────────────────
  const handlePressStart = useCallback((id) => {
    setPressingId(id);
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setPressingId(null);
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
      if (navigator.vibrate) navigator.vibrate(40);
    }, 400);
  }, []);

  const handlePressEnd = useCallback((note) => {
    clearTimeout(longPressTimer.current);
    setPressingId(null);
    if (!longPressFired.current) {
      if (selectionMode) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(note.id)) { next.delete(note.id); if (next.size === 0) setSelectionMode(false); }
          else next.add(note.id);
          return next;
        });
      } else {
        // EAI-41: tap on already-active note → deselect (go back to new entry)
        if (currentNoteId === note.id) {
          startNewEntry();
        } else {
          openNote(note);
        }
      }
    }
  }, [selectionMode, currentNoteId, openNote, startNewEntry]);

  const handlePressCancel = useCallback(() => {
    clearTimeout(longPressTimer.current);
    setPressingId(null);
  }, []);

  const cancelSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); setConfirmDelete(false); };

  const deleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => authFetch(`/api/notes/${id}`, { method: 'DELETE' })));
    if (ids.includes(currentNoteId)) startNewEntry();
    setSelectionMode(false);
    setSelectedIds(new Set());
    fetchAllNotes();
  }, [selectedIds, currentNoteId, startNewEntry, fetchAllNotes]);

  const isNewEntry = !currentNoteId && !viewingDate;

  // EAI-42: save current note (if any content) then start fresh
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = async (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (window.scrollY === 0 && deltaY > 70 && !refreshing) {
      setRefreshing(true);
      await fetchAllNotes();
      setRefreshing(false);
    }
  };

  return (
    <>
      {/* Selection toolbar */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-chrome bg-background border-t border-border px-4 py-3 pb-6 flex items-center justify-between gap-4">
          {confirmDelete ? (
            <>
              <span className="text-sm text-destructive font-medium">{t('today_delete_confirm')}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>{t('today_cancel')}</Button>
                <Button variant="destructive" size="sm" onClick={async () => { setConfirmDelete(false); await deleteSelected(); }}>
                  {t('today_delete')}{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm text-foreground font-medium">{selectedIds.size} {t('today_selected')}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={cancelSelection}>{t('today_cancel')}</Button>
                <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                  {t('today_delete')}{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* ── Top section: always visible, never scrolls ── */}
        <div
          className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 pt-8 pb-4 flex flex-col gap-6"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {refreshing && (
            <div className="flex justify-center -mt-4 mb-0">
              <div className="w-5 h-5 rounded-full border-2 border-mint/30 border-t-mint animate-spin" />
            </div>
          )}

          {showCelebration && (
            <div className="celebrate-toast flex items-center gap-2.5 self-center px-4 py-2.5 rounded-2xl bg-mint/15 border border-mint/30 -mt-2 mb-0">
              <span className="text-lg">&#10024;</span>
              <span className="text-sm text-mint font-medium">{t('today_first_note')}</span>
            </div>
          )}

          {/* Header — EAI-19: personalized greeting */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {viewingDate ? (
                <>
                  <h1 className="text-2xl font-semibold text-foreground leading-tight">{formatDate(viewingDate, language)}</h1>
                  <p className="text-muted-foreground text-xs mt-0.5">{t('today_editing_past')}</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-foreground leading-tight">
                    {t('today_greeting_hey')}{displayName ? <>, <span className="capitalize">{displayName}</span></> : ''}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(todayDate, language)}</p>
                </>
              )}
            </div>
          </div>

          {/* Textarea with Save button inside (EAI-38) */}
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isNewEntry ? t('today_placeholder_new') : t('today_placeholder_edit')}
              rows={4}
              className="text-base pb-11"
            />
            {/* Speech language toggle — bottom left of textarea */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleSpeechLang}
                className="absolute bottom-2 left-2 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground active:bg-muted/60 transition-colors select-none"
              >
                {speechLang === 'es' ? '🎙 ES' : '🎙 EN'}
              </button>
            )}

            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {content.trim() && (
                <button
                  type="button"
                  onClick={() => { setContent(''); setSaveStatus(''); localStorage.removeItem('echo_draft_content'); localStorage.removeItem('echo_draft_note_id'); localStorage.removeItem('echo_draft_viewing_date'); }}
                  className="text-xs text-muted-foreground active:opacity-60 transition-opacity select-none"
                >
                  {t('today_clear')}
                </button>
              )}
              <Button
                size="sm"
                onClick={saveAndNew}
                disabled={!content.trim() || saveStatus === 'saving' || isCleaning}
              >
                {t('today_save')}
              </Button>
            </div>
          </div>

          {/* Ask Echo button */}
          {!isNewEntry && content.trim() && (
            <button
              type="button"
              onClick={() => navigate('/chat', { state: { prefill: content.trim() } })}
              className="flex items-center gap-2 self-start text-sm font-medium text-mint active:opacity-60 transition-opacity select-none"
            >
              {t('today_ask_echo')}
            </button>
          )}

          {/* Mic + waves */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex items-center justify-center gap-6">
              <div className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                <WaveAnimation heights={barHeights} />
              </div>
              <div className="relative flex items-center justify-center">
                {isRecording && <SpinningRing />}
                <MicButton
                  isRecording={isRecording}
                  isSupported={isSupported}
                  onToggle={toggleMic}
                  size="home"
                  isCleaning={isCleaning}
                />
              </div>
              <div className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                <WaveAnimation heights={[...barHeights].reverse()} />
              </div>
            </div>
            {isRecording && <span className="text-xs text-mint animate-pulse tracking-wide">{t('today_listening')}</span>}
            {isCleaning && <span className="text-xs text-mint/70 animate-pulse tracking-wide">{t('speech_cleaning')}</span>}
            {micError && <span className="text-xs text-red-400">{micError}</span>}
          </div>
        </div>

        {/* ── Notes header: fixed, never scrolls ── */}
        <div className="flex-shrink-0 px-4 pt-2 pb-2" ref={calendarRef}>
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-semibold text-foreground">
                  {selectedDate === todayDate ? t('today_notes_header') : formatDateShort(selectedDate, language)}
                </h2>
                <button
                  onClick={() => setCalendarOpen(o => !o)}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-mint/15 active:bg-mint/30 transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-mint" />
                </button>
              </div>
              {selectedDate !== todayDate ? (
                <button
                  onClick={() => setSelectedDate(todayDate)}
                  className="text-xs text-mint active:opacity-70 transition-opacity"
                >
                  {t('today_back_to_today')}
                </button>
              ) : (
                !selectionMode && <span className="text-xs text-muted-foreground/70">{t('today_hold_to_select')}</span>
              )}
            </div>
            {calendarOpen && (
              <MiniCalendar
                year={calendarMonth.year}
                month={calendarMonth.month}
                today={todayDate}
                selectedDate={selectedDate}
                noteDates={allNoteDates}
                onSelectDate={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onClose={() => setCalendarOpen(false)}
                language={language}
              />
            )}
          </div>
        </div>

        {/* ── Notes list: only this scrolls ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto w-full">
        <div className={`${selectionMode ? 'pb-24' : ''}`}>

          {notesLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 rounded-2xl border border-border/80 bg-card/80 animate-pulse">
                  <div className="h-3 w-32 bg-muted rounded mb-2" />
                  <div className="h-3.5 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : displayedNotes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {visibleNotes.map((note, idx) => {
                const isSelected = selectedIds.has(note.id);
                const isActive = currentNoteId === note.id;
                const isPressing = pressingId === note.id;
                return (
                  <li key={note.id} className="note-item" style={{ animationDelay: `${Math.min(idx * 0.04, 0.3)}s` }}>
                    <div
                      onPointerDown={() => handlePressStart(note.id)}
                      onPointerUp={() => handlePressEnd(note)}
                      onPointerCancel={handlePressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        touchAction: 'manipulation',
                        transform: isPressing ? 'scale(0.98)' : 'scale(1)',
                        transition: 'transform 0.1s ease, border-color 0.15s, background-color 0.15s',
                      }}
                      className={`w-full text-left px-4 py-3 rounded-2xl border squircle cursor-pointer select-none ${
                        isSelected ? 'border-mint bg-mint/10'
                        : isActive  ? 'border-mint bg-mint/5'
                        : 'border-border/80 bg-card/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDateShort(note.date, language)} · {formatTime(note.created_at, language)}
                          </span>
                        </div>
                        {selectionMode && (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-mint bg-mint' : 'border-border bg-transparent'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-background" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-foreground/70 mt-1 truncate leading-relaxed">
                        {note.content.slice(0, 80)}{note.content.length > 80 ? '…' : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              {selectedDate === todayDate ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-mint/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="13" x2="12" y2="17"/>
                      <line x1="10" y1="15" x2="14" y2="15"/>
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">{t('today_no_notes')}</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">{t('today_no_notes_hint')}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">{t('today_no_notes_date')}</p>
              )}
            </div>
          )}
          {/* Infinite scroll sentinel — only when showing all notes and there are more to load */}
          {selectedDate === todayDate && visibleCount < displayedNotes.length && (
            <div ref={sentinelRef} className="h-4" />
          )}
        </div>
        </div>
        </div>

      </div>
    </>
  );
}
