import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';

export default function ThisWeekSection({
  columns,
  days,
  checked,
  animatingKey,
  editingColId,
  editName,
  setEditName,
  startRename,
  saveRename,
  handleRenameKey,
  deleteList,
  reorderList,
  openModal,
  toggleCheck,
  isPastWeek
}) {
  const [draggedColId, setDraggedColId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  return (
    <table className="w-full h-full border-collapse" style={{ minWidth: 520 }}>
      <colgroup>
        <col style={{ width: 130, minWidth: 120 }} />
        {columns.map(c => <col key={c.id} />)}
        <col style={{ width: 90 }} />
      </colgroup>

      <thead className="sticky top-0 z-10 bg-[#fffcf5]">
        <tr>
          <th className="px-5 py-1.5 text-left border-b border-[#cbd5e1] border-r-2 border-r-[#fca5a5]">
            <div className="inline-flex items-center gap-1.5 bg-[#eef2ff] px-3 py-0.5 rounded-lg border border-[#e0e7ff]">
              <span className="text-xs font-bold text-[#6366f1] tracking-widest">DAY</span>
            </div>
          </th>

          {columns.map(col => (
            <th 
              key={col.id} 
              draggable
              onDragStart={(e) => {
                setDraggedColId(col.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColId !== col.id) setDragOverColId(col.id);
              }}
              onDragLeave={() => {
                if (dragOverColId === col.id) setDragOverColId(null);
              }}
              onDragEnd={() => {
                setDraggedColId(null);
                setDragOverColId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedColId && draggedColId !== col.id) {
                  reorderList(draggedColId, col.id);
                }
                setDraggedColId(null);
                setDragOverColId(null);
              }}
              className={`px-3 py-1.5 text-center border-b border-[#cbd5e1] border-r border-[#cbd5e1] group relative cursor-grab active:cursor-grabbing transition-colors ${
                dragOverColId === col.id ? 'bg-[#e0e7ff]' : ''
              } ${draggedColId === col.id ? 'opacity-50' : ''}`}
            >
              {editingColId === col.id ? (
                <input autoFocus value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={handleRenameKey} onBlur={saveRename}
                  className="w-full text-center border-b border-[#6366f1] outline-none text-sm bg-transparent font-bold text-[#172554]"
                />
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: col.bg }}>
                    {col.Icon ? (
                      <col.Icon style={{ color: col.color }} size={14} />
                    ) : (
                      <span className="text-xs leading-none select-none">{col.iconName}</span>
                    )}
                    <span className="text-sm font-bold text-[#172554] tracking-wide">{col.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#7c8499]">{col.sub}</span>
                    {col.burnType === 'front' && (
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[8px] font-extrabold border border-red-200">🔥 IMP</span>
                    )}
                    {col.burnType === 'back' && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 text-[8px] font-bold border border-blue-200">🧊 BACK</span>
                    )}
                  </div>
                  {!isPastWeek && (
                    <div className="absolute inset-0 bg-[#fffcf5]/95 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded">
                      <button onClick={e => { e.stopPropagation(); startRename(col.id, col.name); }}
                        className="p-1.5 bg-[#eef2ff] text-[#6366f1] rounded-full hover:bg-[#6366f1] hover:text-white transition-all" title="Rename">
                        <FiEdit2 size={11} strokeWidth={2.5} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteList(col.id); }}
                        className="p-1.5 bg-red-50 text-red-400 rounded-full hover:bg-red-400 hover:text-white transition-all" title="Delete">
                        <FiTrash2 size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </th>
          ))}

          <th className="px-2 py-1.5 text-center border-b border-[#cbd5e1]">
            {!isPastWeek && (
              <div className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-70 transition-opacity" onClick={openModal}>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f3f0ff]">
                  <div className="w-3 h-3 rounded-full border border-dashed border-[#6366f1] flex items-center justify-center">
                    <FiPlus size={8} className="text-[#6366f1]" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-[#6366f1] tracking-wide">NEW LIST</span>
                </div>
                <span className="text-[10px] text-[#7c8499]">Add habit</span>
              </div>
            )}
          </th>
        </tr>
      </thead>

      <tbody>
        {days.map((day, rowIdx) => {
          const today = new Date();
          const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isCurrentDay = day.iso === todayIso;
          return (
            <tr key={day.iso} className={`border-b border-[#cbd5e1] last:border-b-0 transition-colors ${isCurrentDay ? 'bg-[#eef2ff]/50 hover:bg-[#e0e7ff]/60' : rowIdx % 2 === 0 ? 'bg-[#fffcf5]' : 'bg-[#f8fafc]'}`}>
              <td className="px-5 py-1 border-r-2 border-r-[#fca5a5]">
                <div className="flex flex-col">
                  <span className={`text-sm font-bold leading-tight tracking-wide ${isCurrentDay ? 'text-[#4338ca]' : 'text-[#172554]'}`}>{day.name}</span>
                  <span className={`text-[10px] font-medium leading-none ${isCurrentDay ? 'text-[#6366f1] font-bold' : 'text-[#64748b]'}`}>{day.date}</span>
                </div>
              </td>

              {columns.map(col => {
                const key = `${day.iso}-${col.id}`;
                const isFuture = day.iso > todayIso;
                const isToday = day.iso === todayIso;
                const isChecked = isFuture ? false : !!checked[key];
                const isAnimating = animatingKey === key;
                return (
                  <td key={col.id} className="py-1 px-3 text-center border-r border-[#cbd5e1]">
                    <div className="flex items-center justify-center">
                      <div
                        onClick={() => isToday && toggleCheck(day.iso, col.id)}
                        className={`
                          w-6 h-6 rounded-[7px] border-2 flex items-center justify-center
                          transition-all duration-200 select-none
                          ${isAnimating ? 'animate-vibrate' : ''}
                          ${isFuture
                            ? 'bg-[#f1f5f9] border-[#cbd5e1] cursor-not-allowed opacity-40'
                            : !isToday
                              ? isChecked
                                ? 'bg-[#6366f1]/50 border-[#6366f1]/50 text-white cursor-not-allowed opacity-60'
                                : 'bg-[#f8fafc] border-[#cbd5e1] cursor-not-allowed opacity-40'
                              : isChecked
                                ? 'bg-[#6366f1] border-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.45)] scale-105 cursor-pointer'
                                : 'bg-white border-[#94a3b8] hover:border-[#6366f1] hover:scale-110 cursor-pointer shadow-sm'
                          }
                        `}
                      >
                        {isChecked && <FiCheck size={12} strokeWidth={3} className="text-white" />}
                      </div>
                    </div>
                  </td>
                );
              })}

              <td className="py-1 px-2 text-center">
                {!isPastWeek && (
                  <div className="flex items-center justify-center">
                    <div
                      onClick={openModal}
                      className="w-5.5 h-5.5 rounded-full border border-dashed border-[#c4bfdd] text-[#c4bfdd] flex items-center justify-center cursor-pointer hover:border-[#6366f1] hover:text-[#6366f1] transition-all hover:scale-110"
                    >
                      <FiPlus size={10} strokeWidth={2} />
                    </div>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
