import { useState, useEffect, useRef, useCallback } from 'react';
import MicButton from '../components/MicButton.jsx';
import { Button } from '../components/ui/button.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { useSpeech } from '../hooks/useSpeech.js';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer.js';
import { authFetch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { useProfile } from '../context/ProfileContext.jsx';

const LOCALE_MAP = { en: 'en-US', es: 'es-ES' };

function formatDate(dateStr, language = 'en') {
  const [year, month, day] = dateStr.split('-').map(Number);
  const locale = LOCALE_MAP[language] || 'en-US';
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
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
  // Button is w-28 = 112px; ring sits 10px outside it
  const total = 132;
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

function MiniCalendar({ year, month, today, selectedDate, noteDates, onSelectDate, onPrevMonth, onNextMonth, onClose }) {
  const todayYear = parseInt(today.split('-')[0]);
  const todayMonth = parseInt(today.split('-')[1]) - 1;
  const canGoNext = year < todayYear || (year === todayYear && month < todayMonth);

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  // EAI-19: personalized greeting — use ProfileContext, fallback to email prefix
  const displayName = profileDisplayName || user?.email?.split('@')[0] || '';

  // EAI-16: id-based tracking (null = fresh new entry)
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [micError, setMicError] = useState(null);
  const [viewingDate, setViewingDate] = useState(null);

  // Calendar date picker
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const calendarRef = useRef(null);

  // EAI-10: Long-press selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pressingId, setPressingId] = useState(null);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);


  // ── Speech ────────────────────────────────────────────────────────────────
  const contentSnapshotRef = useRef('');

  const handleTranscript = useCallback((sessionText) => {
    const base = contentSnapshotRef.current;
    const sep = base && !base.endsWith(' ') && !base.endsWith('\n') ? ' ' : '';
    setContent(base + sep + sessionText);
  }, []);

  const { isRecording, isSupported, startRecording, stopRecording, error: speechError } =
    useSpeech(handleTranscript, language);

  const barHeights = useAudioVisualizer(false, 9); // disabled - conflicts with SpeechRecognition on Android

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
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAllNotes(); }, [fetchAllNotes]);

  // Derived: notes for selected date + all dates that have notes (for calendar dots)
  const displayedNotes = notes.filter(n => n.date === selectedDate);
  const allNoteDates = new Set(notes.map(n => n.date));

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
    if (!content.trim()) return;
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
        setSaveStatus('saved');
        fetchAllNotes();
        setTimeout(() => {
          setSaveStatus('');
          setContent('');
          setCurrentNoteId(null);
          setViewingDate(null);
        }, 600);
      }
    } catch { setSaveStatus(''); }
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
        openNote(note);
      }
    }
  }, [selectionMode, openNote]);

  const handlePressCancel = useCallback(() => {
    clearTimeout(longPressTimer.current);
    setPressingId(null);
  }, []);

  const cancelSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };

  const deleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => authFetch(`/api/notes/${id}`, { method: 'DELETE' })));
    if (ids.includes(currentNoteId)) startNewEntry();
    setSelectionMode(false);
    setSelectedIds(new Set());
    fetchAllNotes();
  }, [selectedIds, currentNoteId, startNewEntry, fetchAllNotes]);

  const isNewEntry = !currentNoteId && !viewingDate;

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
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border px-4 py-3 pb-6 flex items-center justify-between gap-4">
          <span className="text-sm text-foreground font-medium">{selectedIds.size} {t('today_selected')}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelSelection}>{t('today_cancel')}</Button>
            <Button variant="destructive" size="sm" onClick={deleteSelected} className="bg-red-600 text-white">
              {t('today_delete')}{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
            </Button>
          </div>
        </div>
      )}

      <div
        className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {refreshing && (
          <div className="flex justify-center -mt-4 mb-0">
            <span className="text-xs text-mint animate-pulse">↓</span>
          </div>
        )}

        {/* Header — EAI-19: personalized greeting */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {viewingDate ? (
              <>
                <h1 className="text-xl font-semibold text-foreground leading-tight">{formatDate(viewingDate, language)}</h1>
                <p className="text-muted-foreground text-xs mt-0.5">{t('today_editing_past')}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-0.5">{formatDate(todayDate, language)}</p>
                <h1 className="text-xl font-semibold text-foreground leading-tight">
                  {t('today_greeting_hey')}{displayName ? <>, <span className="capitalize">{displayName}</span></> : ''}
                </h1>
              </>
            )}
          </div>
          {!isNewEntry && (
            <Button variant="outline" size="sm" onClick={startNewEntry}>{t('today_new_note')}</Button>
          )}
        </div>

        {/* Textarea with Save button inside (EAI-38) */}
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isNewEntry ? t('today_placeholder_new') : t('today_placeholder_edit')}
            rows={8}
            className="text-base pb-11"
          />
          <span className={`absolute bottom-[14px] left-5 text-xs transition-opacity duration-300 pointer-events-none ${
            saveStatus === 'saving' ? 'text-muted-foreground opacity-100'
            : saveStatus === 'saved'  ? 'text-mint opacity-100'
            : 'opacity-0'
          }`}>
            {saveStatus === 'saving' ? t('today_saving') : t('today_saved')}
          </span>
          <Button
            size="sm"
            onClick={saveAndNew}
            disabled={!content.trim() || saveStatus === 'saving'}
            className="absolute bottom-2 right-2"
          >
            {t('today_save')}
          </Button>
        </div>

        {/* EAI-13: Big centered mic (w-28) + EAI-14: spinning ring + waves */}
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex items-center justify-center gap-6">
            <WaveAnimation heights={barHeights} />
            {/* EAI-13: mic container with EAI-14 ring */}
            <div className="relative flex items-center justify-center">
              {isRecording && <SpinningRing />}
              <MicButton
                isRecording={isRecording}
                isSupported={isSupported}
                onToggle={toggleMic}
                size="lg"
              />
            </div>
            <WaveAnimation heights={[...barHeights].reverse()} />
          </div>
          {isRecording && <span className="text-xs text-mint animate-pulse tracking-wide">{t('today_listening')}</span>}
          {micError && <span className="text-xs text-red-400">{micError}</span>}
        </div>

        {/* Notes section with calendar picker */}
        <div className={`mt-6 ${selectionMode ? 'pb-24' : ''}`}>
          <div className="relative" ref={calendarRef}>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalendarOpen(o => !o)}
                className="flex items-center gap-1.5 group"
              >
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {selectedDate === todayDate ? t('today_notes_header') : formatDateShort(selectedDate, language)}
                </h2>
                <CalendarIcon className="w-3.5 h-3.5 text-mint opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
              {selectedDate !== todayDate ? (
                <button
                  onClick={() => setSelectedDate(todayDate)}
                  className="text-xs text-mint active:opacity-70 transition-opacity"
                >
                  {t('today_back_to_today')}
                </button>
              ) : (
                !selectionMode && <span className="text-xs text-muted-foreground/80">{t('today_hold_to_select')}</span>
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
              />
            )}
          </div>

          {displayedNotes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {displayedNotes.map((note) => {
                const isSelected = selectedIds.has(note.id);
                const isActive = currentNoteId === note.id;
                const isPressing = pressingId === note.id;
                return (
                  <li key={note.id}>
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
                        : 'border-border/50 bg-card/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground shrink-0">{formatTime(note.created_at, language)}</span>
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
            <p className="text-muted-foreground text-sm text-center py-4">
              {selectedDate === todayDate ? t('today_no_notes') : t('today_no_notes_date')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
