import { useState, useEffect, useRef, useCallback } from 'react';
import { FiFileText, FiLoader, FiPlus, FiEdit3, FiCalendar, FiCheck, FiAlertCircle, FiSidebar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { fetchAllNotes, createNote, updateNote, deleteNote, upsertNoteBlock } from './api';
import { NewNotePrompt, NoteTitleEditor, NewNoteButton } from './NoteTitle';
import { NoteDeleteButton, NoteDeleteEditorButton } from './NoteDelete';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLine(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - new Date(y, m - 1, d)) / 86400000);
  const label = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (diff === 0) return `Today, ${label}`;
  if (diff === 1) return `Yesterday, ${label}`;
  return label;
}

function formatDateShort(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function getNoteBlocks(note) {
  if (!note) return [];
  const blocks = note.blocks && note.blocks.length > 0 ? [...note.blocks] : [];
  if (blocks.length === 0 && note.content) {
    blocks.push({
      date: note.createdAt ? note.createdAt.slice(0, 10) : todayISO(),
      text: note.content,
      createdAt: note.createdAt,
      editedAt: null,
    });
  }
  return blocks.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Seamless, auto-expanding textarea component for each date entry
function SeamlessNoteBlock({ block, isToday, value, onChange, saveStatus }) {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(isToday ? 44 : 28, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <div className="mb-4 last:mb-2 border-b border-dashed border-[#e2e8f0] pb-3 last:border-none">
      <div className="flex items-center gap-2 mb-1.5 select-none">
        <span className={`text-[11px] font-bold tracking-wide ${isToday ? 'text-[#8b5cf6]' : 'text-[#64748b]'}`}>
          {formatDateLine(block.date)}
        </span>

        {block.editedAt && (
          <span title="Edited" className="flex items-center gap-0.5 text-[10px] text-[#f59e0b]">
            <FiEdit3 size={9} /> edited
          </span>
        )}

        {saveStatus === 'saving' && <span className="text-[10px] text-[#94a3b8] italic">saving…</span>}
        {saveStatus === 'saved' && (
          <span className="text-[10px] text-[#22c55e] flex items-center gap-0.5">
            <FiCheck size={10} /> saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-[10px] text-[#ef4444] flex items-center gap-0.5">
            <FiAlertCircle size={10} /> error saving
          </span>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(block.date, e.target.value);
          adjustHeight();
        }}
        placeholder={isToday ? "Write today's note…" : `Edit note for ${block.date}…`}
        className={`w-full text-sm font-mono leading-relaxed bg-transparent border-none outline-none resize-none p-0 overflow-hidden transition-colors ${
          isToday ? 'text-[#172554] placeholder-[#cbd5e1]' : 'text-[#334155] placeholder-[#d1d5db]'
        }`}
        style={{ minHeight: isToday ? 44 : 28 }}
      />
    </div>
  );
}

export default function MultiNotesSection() {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Stores transient input text per block key `${noteId}_${dateStr}`
  const [blockTexts, setBlockTexts] = useState({});
  const [customDate, setCustomDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const saveTimersRef = useRef({});

  useEffect(() => {
    fetchAllNotes()
      .then((fetched) => {
        const sorted = [...fetched].sort(
          (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        );
        setNotes(sorted);
        if (sorted.length > 0) setSelectedId(sorted[0]._id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedNote = notes.find((n) => n._id === selectedId) || null;

  // Save block changes with debounce
  const scheduleBlockSave = useCallback((noteId, dateStr, text) => {
    setSaveStatus('saving');
    const timerKey = `${noteId}_${dateStr}`;
    if (saveTimersRef.current[timerKey]) {
      clearTimeout(saveTimersRef.current[timerKey]);
    }

    saveTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        await upsertNoteBlock(noteId, { date: dateStr, text });
        setNotes((prev) => {
          const target = prev.find((n) => n._id === noteId);
          if (!target) return prev;
          const existingBlocks = getNoteBlocks(target);
          const idx = existingBlocks.findIndex((b) => b.date === dateStr);
          let updatedBlocks;
          if (idx >= 0) {
            updatedBlocks = existingBlocks.map((b) =>
              b.date === dateStr ? { ...b, text, editedAt: new Date().toISOString() } : b
            );
          } else {
            updatedBlocks = [
              ...existingBlocks,
              { date: dateStr, text, createdAt: new Date().toISOString(), editedAt: null },
            ];
          }
          const updatedNote = { ...target, blocks: updatedBlocks, updatedAt: new Date().toISOString() };
          const remaining = prev.filter((n) => n._id !== noteId);
          return [updatedNote, ...remaining];
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to save block:', err);
        setSaveStatus('error');
      }
    }, 600);
  }, []);

  const handleBlockChange = (dateStr, text) => {
    if (!selectedId) return;
    const key = `${selectedId}_${dateStr}`;
    setBlockTexts((prev) => ({ ...prev, [key]: text }));
    scheduleBlockSave(selectedId, dateStr, text);
  };

  const getBlockTextValue = (block) => {
    if (!selectedId) return block.text || '';
    const key = `${selectedId}_${block.date}`;
    return blockTexts[key] !== undefined ? blockTexts[key] : block.text || '';
  };

  const handleTitleChange = (newTitle) => {
    if (!selectedId) return;
    setNotes((prev) => {
      const target = prev.find((n) => n._id === selectedId);
      if (!target) return prev;
      const updatedNote = { ...target, title: newTitle, updatedAt: new Date().toISOString() };
      const remaining = prev.filter((n) => n._id !== selectedId);
      return [updatedNote, ...remaining];
    });
    setSaveStatus('saving');
    updateNote(selectedId, { title: newTitle })
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch(() => setSaveStatus('error'));
  };

  const handleConfirmCreate = async (title) => {
    setCreating(true);
    try {
      const newNote = await createNote({ title, content: '' });
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote._id);
      setShowNewPrompt(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      const remaining = notes.filter((n) => n._id !== id);
      setNotes(remaining);
      if (selectedId === id) setSelectedId(remaining.length > 0 ? remaining[0]._id : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomDateBlock = (e) => {
    if (e) e.preventDefault();
    if (!customDate || !selectedId) return;
    const key = `${selectedId}_${customDate}`;
    if (blockTexts[key] === undefined) {
      setBlockTexts((prev) => ({ ...prev, [key]: '' }));
    }
    scheduleBlockSave(selectedId, customDate, '');
    setShowDatePicker(false);
    setCustomDate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[#64748b]">
        <FiLoader className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  const today = todayISO();
  const rawBlocks = getNoteBlocks(selectedNote);

  // Ensure today's block exists in the rendered list if note is active
  const hasTodayBlock = rawBlocks.some((b) => b.date === today);
  const displayBlocks = [...rawBlocks];
  if (selectedNote && !hasTodayBlock) {
    displayBlocks.unshift({
      date: today,
      text: '',
      createdAt: new Date().toISOString(),
      editedAt: null,
      isNewToday: true,
    });
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden relative">
      {/* ── LEFT SIDEBAR ────────────────────────────────────── */}
      <div
        className={`flex flex-col shrink-0 border-r border-[#e2e8f0] bg-[#faf8ff] transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-[210px] opacity-100' : 'w-0 opacity-0 border-r-0'
        }`}
      >
        <div className="w-[210px] flex flex-col h-full">
          <div className="px-3 pt-4 pb-2 flex items-center justify-between border-b border-[#e2e8f0]">
            <span className="text-xs font-extrabold tracking-widest text-[#8b5cf6] uppercase">My Notes</span>
            <div className="flex items-center gap-1">
              <NewNoteButton onClick={() => setShowNewPrompt(true)} disabled={showNewPrompt} />
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse Sidebar"
                className="p-1 rounded-lg text-[#94a3b8] hover:text-[#8b5cf6] hover:bg-[#ede9fe] transition-colors cursor-pointer"
              >
                <FiChevronLeft size={16} />
              </button>
            </div>
          </div>

          {showNewPrompt && (
            <div className="pt-2">
              <NewNotePrompt onConfirm={handleConfirmCreate} onCancel={() => setShowNewPrompt(false)} loading={creating} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-1">
            {notes.length === 0 && !showNewPrompt ? (
              <p className="text-center text-[#94a3b8] text-xs px-3 pt-8 leading-relaxed">
                No notes yet.<br />Click <strong>New</strong> to start!
              </p>
            ) : (
              notes.map((note) => {
                const isActive = note._id === selectedId;
                const nb = getNoteBlocks(note);
                const latest = nb[0];
                return (
                  <div
                    key={note._id}
                    onClick={() => {
                      setSelectedId(note._id);
                    }}
                    className={`group relative mx-2 my-0.5 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                      isActive ? 'bg-[#ede9fe] border border-[#c4b5fd]' : 'hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <p className={`text-xs font-semibold truncate pr-5 ${isActive ? 'text-[#6d28d9]' : 'text-[#334155]'}`}>
                      {note.title || 'Untitled Note'}
                    </p>
                    <p className="text-[10px] text-[#94a3b8] mt-0.5">
                      {latest
                        ? formatDateShort(latest.createdAt || note.updatedAt)
                        : formatDateShort(note.updatedAt || note.createdAt)}
                    </p>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <NoteDeleteButton noteTitle={note.title} onConfirmDelete={() => handleDeleteNote(note._id)} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT MAIN CONTENT ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedNote ? (
          <>
            {/* Note Title Header */}
            <div className="px-6 pt-5 pb-3 border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-[#8b5cf6] hover:bg-[#ede9fe] transition-colors cursor-pointer shrink-0"
                >
                  <FiSidebar size={18} className={isSidebarOpen ? 'text-[#8b5cf6]' : 'text-[#64748b]'} />
                </button>
                <FiFileText className="text-[#8b5cf6] shrink-0" size={16} />
                <NoteTitleEditor title={selectedNote.title} onChange={handleTitleChange} saveStatus={saveStatus} />
                <NoteDeleteEditorButton noteTitle={selectedNote.title} onConfirmDelete={() => handleDeleteNote(selectedNote._id)} />
              </div>

              {/* Add Note for Custom Date Button */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-[#8b5cf6] px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] hover:border-[#c4b5fd] transition-colors cursor-pointer"
                  title="Add note for another date"
                >
                  <FiCalendar size={13} />
                  <span>Add Date Entry</span>
                </button>

                {showDatePicker && (
                  <form
                    onSubmit={handleAddCustomDateBlock}
                    className="absolute right-0 top-9 z-20 bg-white border border-[#e2e8f0] shadow-lg rounded-xl p-3 flex flex-col gap-2 w-56"
                  >
                    <label className="text-[11px] font-bold text-[#475569]">Select Date to Edit / Add:</label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="text-xs border border-[#cbd5e1] rounded-lg px-2 py-1 outline-none focus:border-[#8b5cf6]"
                      required
                    />
                    <div className="flex justify-end gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
                      >
                        Add Date
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Note Blocks List (Seamless Page Layout with Natural Page Scroll) */}
            <div className="flex-1 overflow-y-auto px-8 py-5">
              {displayBlocks.map((block) => {
                const isToday = block.date === today;
                const value = getBlockTextValue(block);

                return (
                  <SeamlessNoteBlock
                    key={block.date}
                    block={block}
                    isToday={isToday}
                    value={value}
                    onChange={handleBlockChange}
                    saveStatus={saveStatus}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 relative">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Show Notes Sidebar"
                className="absolute top-4 left-4 p-2 rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] hover:text-[#8b5cf6] hover:bg-[#faf8ff] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <FiSidebar size={16} /> Show Notes
              </button>
            )}
            <FiFileText size={36} className="text-[#c4b5fd]" />
            <p className="text-[#64748b] text-sm font-medium">No note selected</p>
            <p className="text-[#94a3b8] text-xs">Select a note or create a new one.</p>
            <button
              onClick={() => {
                setIsSidebarOpen(true);
                setShowNewPrompt(true);
              }}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold bg-[#8b5cf6] text-white px-4 py-2 rounded-xl hover:bg-[#7c3aed] transition-colors cursor-pointer"
            >
              <FiPlus size={13} /> New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
