import { useState, useEffect, useCallback, useRef } from 'react';
import { FaYoutube, FaWalking } from 'react-icons/fa';
import {
  FiCode,
  FiPlus,
  FiList,
  FiX,
  FiCheck,
  FiLogOut,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiCheckSquare,
  FiSquare,
  FiPieChart,
  FiTarget,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiTrendingDown,
  FiEdit3,
  FiCpu,
  FiSend,
  FiMessageSquare,
  FiZap,
  FiRefreshCw,
  FiDownload,
} from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { downloadExpensePDF } from '../utils/generateExpensePdf';
import NotesSection from '../notes/NotesSection';
import GoalsSection from '../goals/GoalsSection';
import ThisWeekSection from '../thisweek/ThisWeekSection';
const API = `${API_BASE_URL}/api/tracker`;

const INITIAL_COLUMNS = [
  { id: 'yt', name: 'YT', sub: 'YouTube', iconName: 'FaYoutube', Icon: FaYoutube, color: '#ef4444', bg: '#fef2f2', createdAt: new Date(2000, 0, 1).toISOString() },
  { id: 'dsa', name: 'DSA', sub: 'Practice', iconName: 'FiCode', Icon: FiCode, color: '#6366f1', bg: '#eef2ff', createdAt: new Date(2000, 0, 1).toISOString() },
  { id: 'walk', name: 'WALK', sub: '30 min', iconName: 'FaWalking', Icon: FaWalking, color: '#22c55e', bg: '#f0fdf4', createdAt: new Date(2000, 0, 1).toISOString() },
];

const ICON_MAP = {
  FaYoutube: { Icon: FaYoutube, bg: '#fef2f2', color: '#ef4444' },
  FiCode: { Icon: FiCode, bg: '#eef2ff', color: '#6366f1' },
  FaWalking: { Icon: FaWalking, bg: '#f0fdf4', color: '#22c55e' },
  FiList: { Icon: FiList, bg: '#f3f0ff', color: '#6366f1' },
};

function hydrateColumns(rawCols) {
  return rawCols.map(c => {
    const meta = ICON_MAP[c.iconName];
    if (meta) {
      return { ...c, ...meta };
    }
    return c;
  });
}

function getEmojiForHabit(name) {
  const upper = name.toUpperCase();
  if (upper.includes('GYM') || upper.includes('WORKOUT') || upper.includes('EXERCISE') || upper.includes('TRAIN')) return '🏋️';
  if (upper.includes('READ') || upper.includes('BOOK') || upper.includes('STUDY') || upper.includes('LEARN')) return '📚';
  if (upper.includes('CODE') || upper.includes('DEV') || upper.includes('PROGRAM') || upper.includes('TECH')) return '💻';
  if (upper.includes('WALK') || upper.includes('RUN') || upper.includes('JOG') || upper.includes('STEPS') || upper.includes('HIKE')) return '🏃';
  if (upper.includes('MEDITATE') || upper.includes('YOGA') || upper.includes('CALM') || upper.includes('BREATHE')) return '🧘';
  if (upper.includes('SLEEP') || upper.includes('REST') || upper.includes('BED')) return '😴';
  if (upper.includes('EAT') || upper.includes('DIET') || upper.includes('FOOD') || upper.includes('WATER') || upper.includes('DRINK') || upper.includes('MILK')) return '🍏';
  if (upper.includes('MONEY') || upper.includes('BUDGET') || upper.includes('SAVE') || upper.includes('FINANCE') || upper.includes('PAY')) return '💵';
  if (upper.includes('CLEAN') || upper.includes('HOUSE') || upper.includes('CHORE') || upper.includes('WASH')) return '🧹';
  if (upper.includes('JOURNAL') || upper.includes('WRITE') || upper.includes('DIARY')) return '✍️';
  if (upper.includes('GAME') || upper.includes('PLAY')) return '🎮';
  if (upper.includes('MUSIC') || upper.includes('SING') || upper.includes('PIANO') || upper.includes('GUITAR') || upper.includes('SONG')) return '🎵';
  if (upper.includes('DANCE')) return '💃';
  if (upper.includes('CALL') || upper.includes('TALK') || upper.includes('MEET') || upper.includes('PHONE')) return '📞';

  const fallbacks = ['🎯', '✨', '🔥', '🚀', '📌', '⚡', '📝', '🌟'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
}

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  return WEEK_DAYS.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${dateVal}`;
    return { name, date: dateStr, iso };
  });
}

function getWeekLabel(weekOffset = 0) {
  const days = getWeekDates(weekOffset);
  return `${days[0].date} – ${days[6].date}`;
}

const CATEGORY_STYLES = {
  Personal: { bg: '#eef2ff', text: '#6366f1', border: '#c7d2fe', emoji: '👤' },
  Work: { bg: '#fdf2f8', text: '#ec4899', border: '#fbcfe8', emoji: '💼' },
  Study: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', emoji: '📚' },
  Health: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', emoji: '🏃' },
  Urgent: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', emoji: '⚡' },
};

const EXPENSE_CATEGORIES = {
  Shopping: { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8', emoji: '🛍️' },
  Food: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', emoji: '🍔' },
  Bills: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', emoji: '💳' },
  Travel: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', emoji: '🚗' },
  Others: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe', emoji: '📦' },
};

export default function TrackerPage() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [checked, setChecked] = useState({});
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBurnType, setNewBurnType] = useState('front');
  const [editingColId, setEditingColId] = useState(null);
  const [editName, setEditName] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [animatingKey, setAnimatingKey] = useState(null);

  // ── Notebook Tab & To-Do State ───────────────────────
  const [activeTab, setActiveTab] = useState('THIS WEEK');
  const [todos, setTodos] = useState([
    { id: '1', text: 'Review daily study goals', completed: false, category: 'Study', createdAt: new Date().toISOString() },
    { id: '2', text: 'Drink 2L water & 30 min walk', completed: true, category: 'Health', createdAt: new Date().toISOString() },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCat, setNewTodoCat] = useState('Personal');
  const [todoFilter, setTodoFilter] = useState('active');

  // ── Not To-Do State ───────────────────────────────────
  const [notTodos, setNotTodos] = useState([]);
  const [newNotTodoText, setNewNotTodoText] = useState('');

  // ── Monthly Expense State ────────────────────────────
  const [monthlyBudget, setMonthlyBudget] = useState(25000);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current month, -1 = prev, +1 = next
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetModalTab, setBudgetModalTab] = useState('set'); // 'set' | 'income'
  const [budgetInput, setBudgetInput] = useState('');
  const [incomeReason, setIncomeReason] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('Shopping');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // ── AI Analysis & Coach State ────────────────────────
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: "👋 Hello! I'm your **DiscipliniAI Coach & Data Analyst**.\n\nI have real-time access to your habit streaks, to-dos, and monthly expenses. Ask me any question or pick a prompt below to analyze your discipline!" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef(null);

  const saveTimerRef = useRef(null);
  const getToken = () => localStorage.getItem('token');

  // ── Load data from backend on mount ──────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }

    fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.columns) {
          setColumns(hydrateColumns(data.columns));
        }
        if (data.checked) {
          setChecked(data.checked);
        }
        if (data.todos !== undefined) {
          setTodos(data.todos);
        }
        if (data.notTodos !== undefined) {
          setNotTodos(data.notTodos);
        }
        if (data.monthlyBudget !== undefined && data.monthlyBudget !== null) {
          setMonthlyBudget(data.monthlyBudget);
        }
        if (data.expenses !== undefined) {
          setExpenses(data.expenses);
        }
      })
      .catch(err => console.error('Failed to load tracker data:', err))
      .finally(() => setLoadingData(false));
  }, [navigate]);

  // ── Auto-save to backend ─────────────────────────────
  const saveToBackend = useCallback((newColumns, newChecked, newTodos = todos, newBudget = monthlyBudget, newExpenses = expenses, newNotTodos = notTodos) => {
    const token = getToken();
    if (!token) return;

    clearTimeout(saveTimerRef.current);
    setSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const serialisableCols = newColumns.map(({ Icon, bg: _bg, ...rest }) => rest);
        await fetch(API, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            columns: serialisableCols,
            checked: newChecked,
            todos: newTodos,
            notTodos: newNotTodos,
            monthlyBudget: newBudget,
            expenses: newExpenses
          }),
        });
      } catch (err) {
        console.error('Save failed:', err);
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [todos, notTodos, monthlyBudget, expenses]);

  // ── To-Do Handlers ────────────────────────────────────
  const handleAddTodo = (e) => {
    if (e) e.preventDefault();
    if (!newTodoText.trim()) return;
    const item = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      category: newTodoCat,
      createdAt: new Date().toISOString()
    };
    const updatedTodos = [item, ...todos];
    setTodos(updatedTodos);
    setNewTodoText('');
    saveToBackend(columns, checked, updatedTodos, monthlyBudget, expenses);
  };

  const handleToggleTodo = (id) => {
    const updatedTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updatedTodos);
    saveToBackend(columns, checked, updatedTodos, monthlyBudget, expenses);
  };

  const handleDeleteTodo = (id) => {
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);
    saveToBackend(columns, checked, updatedTodos, monthlyBudget, expenses);
  };

  const handleClearCompleted = () => {
    const updatedTodos = todos.filter(t => !t.completed);
    setTodos(updatedTodos);
    saveToBackend(columns, checked, updatedTodos, monthlyBudget, expenses, notTodos);
  };

  // ── Not To-Do Handlers ────────────────────────────────
  const handleAddNotTodo = (e) => {
    if (e) e.preventDefault();
    if (!newNotTodoText.trim()) return;
    const item = {
      id: Date.now().toString(),
      text: newNotTodoText.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [item, ...notTodos];
    setNotTodos(updated);
    setNewNotTodoText('');
    saveToBackend(columns, checked, todos, monthlyBudget, expenses, updated);
  };

  const handleDeleteNotTodo = (id) => {
    const updated = notTodos.filter(n => n.id !== id);
    setNotTodos(updated);
    saveToBackend(columns, checked, todos, monthlyBudget, expenses, updated);
  };

  // ── Monthly Expense Handlers ─────────────────────────
  const handleSaveBudget = (e) => {
    if (e) e.preventDefault();
    const parsed = Number(budgetInput);
    if (isNaN(parsed) || parsed < 0) return;
    setMonthlyBudget(parsed);
    setShowBudgetModal(false);
    setBudgetInput('');
    saveToBackend(columns, checked, todos, parsed, expenses);
  };

  const handleAddIncome = (e) => {
    if (e) e.preventDefault();
    const amt = Number(incomeAmount);
    if (!incomeReason.trim() || isNaN(amt) || amt <= 0) return;
    const newBudget = monthlyBudget + amt;
    const incomeEntry = {
      id: `inc-${Date.now()}`,
      title: incomeReason.trim(),
      amount: amt,
      category: 'Income',
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    const updatedExpenses = [incomeEntry, ...expenses];
    setMonthlyBudget(newBudget);
    setExpenses(updatedExpenses);
    setShowBudgetModal(false);
    setIncomeReason('');
    setIncomeAmount('');
    saveToBackend(columns, checked, todos, newBudget, updatedExpenses);
  };

  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    const amt = Number(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amt) || amt <= 0) return;

    const newExp = {
      id: `exp-${Date.now()}`,
      title: expenseTitle.trim(),
      amount: amt,
      category: expenseCat,
      date: expenseDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const updatedExpenses = [newExp, ...expenses];
    setExpenses(updatedExpenses);
    setExpenseTitle('');
    setExpenseAmount('');
    saveToBackend(columns, checked, todos, monthlyBudget, updatedExpenses);
  };

  const handleDeleteExpense = (id) => {
    const expToDelete = expenses.find(exp => exp.id === id);
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    // If deleting an income entry, reduce the budget by that income amount
    const newBudget = expToDelete?.type === 'income'
      ? Math.max(0, monthlyBudget - Number(expToDelete.amount))
      : monthlyBudget;
    setExpenses(updatedExpenses);
    if (expToDelete?.type === 'income') setMonthlyBudget(newBudget);
    saveToBackend(columns, checked, todos, newBudget, updatedExpenses);
  };

  // Month navigation helper
  function getSelectedMonthInfo(offset = 0) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    const year = d.getFullYear();
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${monthNum}`; // e.g. "2026-08"
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g. "August 2026"
    const shortLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { year, monthNum, monthKey, label, shortLabel, dateObj: d };
  }

  const selectedMonthInfo = getSelectedMonthInfo(selectedMonthOffset);

  // Filter expenses that belong specifically to the selected month (auto-resets every month)
  const monthlyExpenses = expenses.filter(exp => {
    const expDate = exp.date || exp.createdAt;
    return expDate && String(expDate).startsWith(selectedMonthInfo.monthKey);
  });

  // Expense calculations for the selected month (income entries excluded from totalSpent)
  const totalSpent = monthlyExpenses
    .filter(exp => exp.type !== 'income')
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  // Effective budget for selected month = monthlyBudget (base) + income entries for that month
  const monthlyIncomeAdded = monthlyExpenses
    .filter(exp => exp.type === 'income')
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const effectiveBudget = monthlyBudget; // monthlyBudget already includes all added income
  const remainingBalance = effectiveBudget - totalSpent;
  const spentPercentage = effectiveBudget > 0 ? Math.min(100, Math.round((totalSpent / effectiveBudget) * 100)) : 0;

  // ── Previous week's total spend ─────────────────────
  // "Previous week" = Mon–Sun of the week that just ended before the current one
  function getPrevWeekRange() {
    const now = new Date();
    const day = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;
    // Start of current week (Monday)
    const currentMon = new Date(now);
    currentMon.setDate(now.getDate() + diffToMonday);
    currentMon.setHours(0, 0, 0, 0);
    // Previous Monday = 7 days before
    const prevMon = new Date(currentMon);
    prevMon.setDate(currentMon.getDate() - 7);
    // Previous Sunday = 1 day before current Monday
    const prevSun = new Date(currentMon);
    prevSun.setDate(currentMon.getDate() - 1);
    prevSun.setHours(23, 59, 59, 999);
    return { prevMon, prevSun };
  }
  const { prevMon, prevSun } = getPrevWeekRange();
  const prevWeekSpent = expenses
    .filter(exp => {
      if (exp.type === 'income') return false;
      const d = new Date(exp.date || exp.createdAt);
      return d >= prevMon && d <= prevSun;
    })
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const prevWeekLabel = `${prevMon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${prevSun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;


  // ── Habit Progress & Temporal Filtering ──────────────
  const days = getWeekDates(weekOffset);
  const weekLabel = getWeekLabel(weekOffset);

  // Calculate start and end of the currently viewed week
  const weekStart = days[0].dateObj || new Date(days[0].iso);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const visibleColumns = columns.filter(col => {
    // If it lacks createdAt, assume it's always been there
    const createdAt = col.createdAt ? new Date(col.createdAt) : new Date(2000, 0, 1);
    
    // It must be created before or during the currently viewed week
    if (createdAt > weekEnd) return false;

    // If it was deleted, it's only visible if the viewed week's START is BEFORE the deletion
    if (col.deletedAt) {
      const deletedAt = new Date(col.deletedAt);
      if (weekStart >= deletedAt) return false;
    }
    
    return true;
  });

  const totalCells = days.length * visibleColumns.length;
  const checkedCount = days.reduce((count, day) => {
    visibleColumns.forEach(col => {
      const key = `${day.iso}-${col.id}`;
      if (checked[key]) count++;
    });
    return count;
  }, 0);
  const pct = totalCells === 0 ? 0 : Math.round((checkedCount / totalCells) * 100);
  const circumference = 2 * Math.PI * 26;

  // ── Handlers ─────────────────────────────────────────
  const toggleCheck = (dayIso, colId) => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dayIso !== todayIso) return;

    const key = `${dayIso}-${colId}`;
    setAnimatingKey(key);
    setTimeout(() => setAnimatingKey(null), 450);

    const newChecked = { ...checked, [key]: !checked[key] };
    setChecked(newChecked);
    saveToBackend(columns, newChecked, todos, monthlyBudget, expenses);
  };

  const openModal = () => { setNewName(''); setNewBurnType('front'); setShowInput(true); };
  const closeModal = () => setShowInput(false);

  const addList = () => {
    const name = newName.trim().toUpperCase();
    if (!name) return;

    const emoji = getEmojiForHabit(name);
    const colors = [
      { color: '#6366f1', bg: '#eef2ff' },
      { color: '#ec4899', bg: '#fdf2f8' },
      { color: '#f59e0b', bg: '#fffbeb' },
      { color: '#10b981', bg: '#ecfdf5' },
      { color: '#8b5cf6', bg: '#f5f3ff' },
      { color: '#3b82f6', bg: '#eff6ff' }
    ];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const colorScheme = colors[hash % colors.length];

    const newCol = {
      id: `list-${Date.now()}`,
      name,
      sub: 'Habit',
      burnType: newBurnType,
      iconName: emoji,
      color: colorScheme.color,
      bg: colorScheme.bg,
      createdAt: new Date().toISOString()
    };

    const newColumns = [...columns, newCol];
    setColumns(newColumns);
    saveToBackend(newColumns, checked, todos, monthlyBudget, expenses);
    closeModal();
  };

  const deleteList = (colId) => {
    const isPastWeek = weekOffset < 0;
    if (isPastWeek) return; // Prevent deleting from past weeks

    const newColumns = columns.map(c => 
      c.id === colId ? { ...c, deletedAt: new Date(weekStart).toISOString() } : c
    );
    setColumns(newColumns);
    saveToBackend(newColumns, checked, todos, monthlyBudget, expenses);
  };

  const reorderList = (draggedId, targetId) => {
    const dragIdx = columns.findIndex(c => c.id === draggedId);
    const dropIdx = columns.findIndex(c => c.id === targetId);
    if (dragIdx < 0 || dropIdx < 0 || dragIdx === dropIdx) return;
    
    const newColumns = [...columns];
    const [draggedItem] = newColumns.splice(dragIdx, 1);
    newColumns.splice(dropIdx, 0, draggedItem);
    
    setColumns(newColumns);
    saveToBackend(newColumns, checked, todos, monthlyBudget, expenses);
  };

  const startRename = (id, name) => { 
    if (weekOffset < 0) return; // Disable rename for past weeks
    setEditingColId(id); setEditName(name); 
  };
  const cancelRename = () => { setEditingColId(null); setEditName(''); };
  const saveRename = () => {
    if (!editName.trim()) { cancelRename(); return; }
    const newColumns = columns.map(c => c.id === editingColId ? { ...c, name: editName.trim().toUpperCase() } : c);
    setColumns(newColumns);
    saveToBackend(newColumns, checked, todos, monthlyBudget, expenses);
    cancelRename();
  };

  const handleKey = e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') closeModal(); };
  const handleRenameKey = e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelRename(); };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  // ── AI Chat Handler ──────────────────────────────────
  const handleSendAiMessage = async (customText) => {
    const query = (typeof customText === 'string' ? customText : aiInput).trim();
    if (!query || aiLoading) return;

    const userMsg = { sender: 'user', text: query };
    const updatedHistory = [...aiMessages, userMsg];
    setAiMessages(updatedHistory);
    setAiInput('');
    setAiLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: query,
          history: aiMessages.slice(-6)
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(res.status === 404 ? 'AI service endpoint (/api/ai/chat) is not deployed on the backend server yet.' : `Server returned status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      setAiMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      console.error('AI chat error:', err);
      setAiMessages(prev => [
        ...prev,
        { sender: 'ai', text: `⚠️ ${err.message || 'Unable to connect to AI server. Please make sure OPENROUTER_API_KEY is configured in backend .env'}` }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (showAiModal && aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, showAiModal, aiLoading]);

  const NOTEBOOK_TABS = ['THIS WEEK', 'TO-DO LIST', 'MONTHLY EXP', 'STATS', 'GOALS', 'NOTES'];
  const TAB_COLORS = ['#6366f1', '#ec4899', '#10b981', '#22c55e', '#f59e0b', '#8b5cf6'];

  const filteredTodos = todos.filter(t => {
    if (todoFilter === 'active') return !t.completed;
    if (todoFilter === 'completed') return t.completed;
    return true;
  }).sort((a, b) => Number(a.id) - Number(b.id));
  const completedTodosCount = todos.filter(t => t.completed).length;

  if (loadingData) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#c4a882 0%,#b8956a 100%)' }}>
        <div className="bg-[#fffcf5] rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#172554] font-semibold">Loading your tracker…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#c4a882 0%,#b8956a 100%)' }}
    >
      {/* ── New List Modal ─────────────────────────────── */}
      {showInput && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={closeModal}>
          <div
            className="bg-[#fffcf5] rounded-2xl p-6 w-80 shadow-2xl border border-[#ede8db] relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-[#7c8499] hover:text-[#172554]">
              <FiX size={18} />
            </button>
            <h3 className="text-base font-bold text-[#172554] mb-1">Add New Habit</h3>
            <p className="text-xs text-[#7c8499] mb-4">Enter habit title (e.g. Gym, Reading, Code)</p>

            <input
              autoFocus
              type="text"
              placeholder="Habit name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKey}
              className="w-full px-3 py-2 border border-[#ede8db] rounded-lg text-sm bg-white outline-none focus:border-[#6366f1] mb-3 font-semibold text-[#172554]"
            />

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setNewBurnType('front')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  newBurnType === 'front'
                    ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                    : 'bg-[#faf8f0] border-[#ede8db] text-[#7c8499] hover:bg-white'
                }`}
              >
                🔥 Front Burn (IMP)
              </button>
              <button
                type="button"
                onClick={() => setNewBurnType('back')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  newBurnType === 'back'
                    ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                    : 'bg-[#faf8f0] border-[#ede8db] text-[#7c8499] hover:bg-white'
                }`}
              >
                🧊 Back Burn
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#7c8499] hover:bg-[#f3f0ff]">
                Cancel
              </button>
              <button
                onClick={addList}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] shadow-sm transition-all"
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Budget Modal (two-tab: Set Budget / Add Income) ───── */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowBudgetModal(false)}>
          <div
            className="bg-[#fffcf5] rounded-2xl p-6 shadow-2xl border border-[#ede8db] relative animate-in fade-in zoom-in-95 duration-150"
            style={{ width: 360 }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowBudgetModal(false)} className="absolute top-4 right-4 text-[#7c8499] hover:text-[#172554]">
              <FiX size={18} />
            </button>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-xl mb-4 border border-[#e2e8f0]">
              <button
                onClick={() => setBudgetModalTab('set')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${budgetModalTab === 'set'
                    ? 'bg-white text-[#10b981] shadow-sm'
                    : 'text-[#64748b] hover:text-[#172554]'
                  }`}
              >
                💰 Set Budget
              </button>
              <button
                onClick={() => setBudgetModalTab('income')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${budgetModalTab === 'income'
                    ? 'bg-white text-[#6366f1] shadow-sm'
                    : 'text-[#64748b] hover:text-[#172554]'
                  }`}
              >
                ➕ Add Income
              </button>
            </div>

            {/* Tab: Set Budget */}
            {budgetModalTab === 'set' && (
              <>
                <h3 className="text-base font-bold text-[#172554] mb-1">Set Monthly Budget</h3>
                <p className="text-xs text-[#7c8499] mb-4">Enter your base salary / monthly income for this month.</p>
                <form onSubmit={handleSaveBudget}>
                  <div className="relative mb-4">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-[#64748b]">₹</span>
                    <input
                      autoFocus
                      type="number"
                      placeholder="25000"
                      value={budgetInput}
                      onChange={e => setBudgetInput(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-[#ede8db] rounded-lg text-sm bg-white outline-none focus:border-[#10b981] font-semibold text-[#172554]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#7c8499] hover:bg-[#f1f5f9]">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] shadow-sm transition-all"
                    >
                      Save Budget
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Tab: Add Income */}
            {budgetModalTab === 'income' && (
              <>
                <h3 className="text-base font-bold text-[#172554] mb-1">Add Extra Income</h3>
                <p className="text-xs text-[#7c8499] mb-1">Current budget: <span className="font-bold text-[#10b981]">₹{monthlyBudget.toLocaleString('en-IN')}</span></p>
                <p className="text-xs text-[#7c8499] mb-4">Add money you received (freelance, bonus, gift, etc.) — it will be added to your budget.</p>
                <form onSubmit={handleAddIncome}>
                  {/* Reason / Source */}
                  <div className="mb-3">
                    <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-1 block">Where did this money come from?</label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. Gift, Freelance project, Side income…"
                      value={incomeReason}
                      onChange={e => setIncomeReason(e.target.value)}
                      className="w-full px-3 py-2 border border-[#ede8db] rounded-lg text-sm bg-white outline-none focus:border-[#6366f1] font-medium text-[#172554]"
                    />
                  </div>
                  {/* Amount */}
                  <div className="mb-4">
                    <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-1 block">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-[#64748b]">₹</span>
                      <input
                        type="number"
                        placeholder="500"
                        value={incomeAmount}
                        onChange={e => setIncomeAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-[#ede8db] rounded-lg text-sm bg-white outline-none focus:border-[#6366f1] font-semibold text-[#172554]"
                      />
                    </div>
                  </div>
                  {/* Preview */}
                  {incomeAmount && !isNaN(Number(incomeAmount)) && Number(incomeAmount) > 0 && (
                    <div className="mb-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-3 py-2 text-xs text-[#16a34a] font-semibold">
                      ✅ New budget will be: <span className="font-extrabold">₹{(monthlyBudget + Number(incomeAmount)).toLocaleString('en-IN')}</span>
                      <span className="ml-1 text-[#22c55e]">(+₹{Number(incomeAmount).toLocaleString('en-IN')})</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#7c8499] hover:bg-[#f1f5f9]">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] shadow-sm transition-all"
                    >
                      Add Income
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AI Analysis & Chat Modal ────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setShowAiModal(false)}>
          <div
            className="bg-[#fffcf5] rounded-3xl w-full max-w-xl h-[85vh] max-h-[680px] shadow-2xl border border-[#ede8db] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-inner text-white font-bold text-base">
                  ✨
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide flex items-center gap-1.5">
                    DiscipliniAI Analyst & Coach
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full border border-indigo-400/20">
                      Live Data
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Habits, tasks, and monthly budget insights</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiMessages([
                    { sender: 'ai', text: "👋 Chat reset! Ask me anything about your current habits, to-do lists, or spending." }
                  ])}
                  title="Clear Chat"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
                >
                  <FiRefreshCw size={14} />
                </button>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Suggested Quick Prompts */}
            <div className="px-4 py-2.5 bg-[#f8f5ee] border-b border-[#e2dcd2] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[10px] font-bold text-[#64748b] shrink-0 uppercase tracking-wider">Quick Prompts:</span>
              {[
                { label: '👨‍💻 About Founder', prompt: 'Tell me about Mr. Sandeep, the creator of DiscipliniOS, the vision behind this app, and where I can find his portfolio.' },
                { label: '📊 Habit Consistency', prompt: 'Analyze my current habit consistency and tell me where I should improve.' },
                { label: '💰 Budget & Expense Analysis', prompt: 'Analyze my monthly expenses and budget. How much have I spent and what are my top categories?' },
                { label: '📋 Pending Tasks Review', prompt: 'Review my to-do tasks and recommend which urgent tasks I should tackle next.' },
                { label: '💡 Discipline Tips', prompt: 'Give me 3 personalized tips to stay disciplined this week based on my tracker progress.' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiMessage(p.prompt)}
                  disabled={aiLoading}
                  className="text-[11px] font-semibold px-2.5 py-1 bg-white border border-[#cbd5e1] hover:border-[#6366f1] hover:text-[#6366f1] text-[#334155] rounded-full shadow-xs shrink-0 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fffcf5]">
              {aiMessages.map((msg, i) => {
                // Format links to make them clickable
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const formattedContent = typeof msg.text === 'string' ? msg.text.split(urlRegex).map((part, pIdx) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a
                        key={pIdx}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-bold text-[#4f46e5] hover:text-[#3730a3] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1 transition-all mx-0.5"
                      >
                        {part} ↗
                      </a>
                    );
                  }
                  return part;
                }) : msg.text;

                return (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs font-bold mt-0.5">
                        ✨
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${msg.sender === 'user'
                        ? 'bg-[#6366f1] text-white rounded-br-xs font-medium'
                        : 'bg-white border border-[#e2dcd2] text-[#1e293b] rounded-bl-xs'
                        }`}
                    >
                      {formattedContent}
                    </div>
                  </div>
                );
              })}

              {aiLoading && (
                <div className="flex gap-2.5 justify-start items-center">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs font-bold animate-pulse">
                    ✨
                  </div>
                  <div className="bg-white border border-[#e2dcd2] text-[#6366f1] rounded-2xl rounded-bl-xs px-4 py-2.5 text-xs flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-ping" />
                    <span className="font-semibold">Analyzing your discipline data…</span>
                  </div>
                </div>
              )}

              <div ref={aiChatEndRef} />
            </div>

            {/* Chat Input Box */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }}
              className="p-3 bg-[#fdfbf7] border-t border-[#e2dcd2] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ask AI about habits, tasks, expenses, or advice..."
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                disabled={aiLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-[#cbd5e1] rounded-2xl text-xs font-medium text-[#172554] outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 shadow-inner"
              />

              <button
                type="submit"
                disabled={!aiInput.trim() || aiLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <FiSend size={13} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Outer Layout ──────────────────────────────── */}
      <div className="w-full h-full md:w-[98vw] md:h-[95vh] flex flex-col md:flex-row relative overflow-hidden">

        {/* Spiral Spine (Desktop only) */}
        <div className="hidden md:flex w-10 bg-[#3a3530] rounded-l-xl flex-col justify-around items-center py-4 z-10 shadow-lg border-r border-[#2d2925] shrink-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-7 h-3.5 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 rounded-full shadow-inner border border-gray-500 transform -rotate-12" />
          ))}
        </div>

        {/* Mobile Top Notebook Strip */}
        <div className="flex md:hidden w-full h-2.5 bg-[#3a3530] shrink-0 flex justify-around items-center px-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-4 h-1.5 bg-gray-300 rounded-full" />
          ))}
        </div>

        {/* Notebook Page */}
        <div className="flex-1 bg-[#fffcf5] rounded-none md:rounded-l-xl flex flex-col shadow-none md:shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden border-0 md:border md:border-[#cbd5e1] md:border-r-0 w-full h-full">

          {/* ── Responsive Header ─────────────────────────────────── */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#cbd5e1] bg-[#fffcf5] gap-2">
            
            {/* Top row: Profile on Left, Actions (AI + Logout) on Right */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <img
                  src={user?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.email || 'User')}`}
                  alt="Profile"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-[#cbd5e1] shadow-sm shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#172554] leading-tight truncate max-w-[130px] sm:max-w-none">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                  {saving ? (
                    <span className="text-[9px] sm:text-[10px] text-[#6366f1] font-semibold animate-pulse">saving…</span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] text-[#7c8499] font-medium">online</span>
                  )}
                </div>
              </div>

              {/* Action buttons (AI + Logout) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAiModal(true)}
                  className="flex items-center gap-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 text-white rounded-full px-2.5 sm:px-3.5 py-1 text-xs font-bold shadow-sm hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                  title="Open AI Data Analysis & Coach"
                >
                  <span className="text-amber-300 text-xs">✨</span>
                  <span className="hidden xs:inline">AI Analysis</span>
                  <span className="inline xs:hidden">AI</span>
                </button>

                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#cbd5e1] text-[#7c8499] hover:text-[#172554] flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <FiLogOut size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Bottom/Middle section: Date/Tab Pill Bar */}
            <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
              {activeTab === 'THIS WEEK' && (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white border border-[#cbd5e1] rounded-full px-2.5 sm:px-3 py-1 shadow-sm text-xs text-[#172554] font-medium">
                  <FiCalendar size={12} className="text-[#6366f1] shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-[#172554] whitespace-nowrap">{weekLabel}</span>
                  {weekOffset > -8 && (
                    <button
                      onClick={() => setWeekOffset(w => w - 1)}
                      title="Previous Week"
                      className="hover:bg-[#dcfce7] rounded-full p-0.5 transition-colors cursor-pointer ml-1"
                    >
                      <FiChevronLeft size={12} />
                    </button>
                  )}
                  {weekOffset !== 0 && (
                    <button
                      onClick={() => setWeekOffset(0)}
                      title="Go to current week"
                      className="px-1.5 py-0.5 rounded text-[9px] bg-green-200 text-green-800 hover:bg-green-300 font-bold ml-0.5 cursor-pointer"
                    >
                      Today
                    </button>
                  )}
                  {weekOffset < 0 && (
                    <button
                      onClick={() => setWeekOffset(w => w + 1)}
                      title="Next Week"
                      className="hover:bg-[#dcfce7] rounded-full p-0.5 ml-0.5 transition-colors cursor-pointer"
                    >
                      <FiChevronRight size={12} />
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'TO-DO LIST' && (
                <div className="flex items-center gap-1.5 bg-[#fdf2f8] border border-[#fbcfe8] rounded-full px-3 py-1 text-xs font-bold text-[#ec4899]">
                  <FiCheckSquare size={13} />
                  <span>{completedTodosCount} of {todos.length} Done</span>
                </div>
              )}

              {activeTab === 'MONTHLY EXP' && (
                <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-3 py-1 text-xs font-bold text-[#16a34a] shadow-sm">
                  <FiCalendar size={12} />
                  <span>{selectedMonthInfo.shortLabel}</span>
                  <button
                    onClick={() => setSelectedMonthOffset(o => o - 1)}
                    title="Previous Month"
                    className="hover:bg-[#dcfce7] rounded-full p-0.5 ml-1 transition-colors cursor-pointer"
                  >
                    <FiChevronLeft size={11} />
                  </button>
                  <button
                    onClick={() => setSelectedMonthOffset(o => o + 1)}
                    title="Next Month"
                    className="hover:bg-[#dcfce7] rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <FiChevronRight size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Horizontal Scrollable Tab Bar for Mobile ── */}
          <div className="flex md:hidden overflow-x-auto px-2 py-1.5 bg-[#f8f5ee] border-b border-[#cbd5e1] gap-1.5 scrollbar-none shrink-0">
            {[
              { id: 'THIS WEEK', label: 'This Week', icon: FiCalendar, color: '#6366f1' },
              { id: 'TO-DO LIST', label: 'To-Do List', icon: FiCheckSquare, color: '#ec4899' },
              { id: 'MONTHLY EXP', label: 'Expenses', icon: FiDollarSign, color: '#10b981' },
              { id: 'STATS', label: 'Stats', icon: FiPieChart, color: '#22c55e' },
              { id: 'GOALS', label: 'Goals', icon: FiTarget, color: '#f59e0b' },
              { id: 'NOTES', label: 'Notes', icon: FiFileText, color: '#8b5cf6' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'text-white shadow-sm scale-105'
                      : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#172554]'
                  }`}
                  style={isActive ? { background: tab.color } : {}}
                >
                  <IconComp size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Active Tab View Content ─────────────────── */}
          <div className="flex-1 overflow-auto bg-[#fffcf5] relative">

            {/* TAB 1: THIS WEEK (HABIT TRACKER MATRIX) */}
            {activeTab === 'THIS WEEK' && (
              <ThisWeekSection
                columns={visibleColumns}
                days={days}
                checked={checked}
                animatingKey={animatingKey}
                editingColId={editingColId}
                editName={editName}
                setEditName={setEditName}
                startRename={startRename}
                saveRename={saveRename}
                handleRenameKey={handleRenameKey}
                deleteList={deleteList}
                reorderList={reorderList}
                openModal={openModal}
                toggleCheck={toggleCheck}
                isPastWeek={weekOffset < 0}
              />
            )}

            {/* TAB 2: TO-DO LIST + NOT TO-DO (Split View) */}
            {activeTab === 'TO-DO LIST' && (
              <div className="p-3 sm:p-5 h-full flex flex-col md:flex-row gap-4 sm:gap-5 overflow-y-auto md:overflow-hidden">

                {/* ── LEFT: TO-DO LIST ─────────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                  {/* Panel Header */}
                  <div className="px-4 py-3 border-b border-[#e2e8f0] bg-gradient-to-r from-[#fdf2f8] to-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#ec4899] flex items-center justify-center text-white text-sm">✅</div>
                      <div>
                        <h2 className="text-sm font-extrabold text-[#172554] leading-tight">TO-DO LIST</h2>
                        <p className="text-[10px] text-[#64748b]">Things you SHOULD do</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
                      {['all', 'active', 'done'].map(f => (
                        <button
                          key={f}
                          onClick={() => setTodoFilter(f === 'done' ? 'completed' : f)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${
                            (f === 'done' ? todoFilter === 'completed' : todoFilter === f)
                              ? 'bg-white text-[#ec4899] shadow-sm'
                              : 'text-[#64748b] hover:text-[#172554]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add Task Form */}
                  <form onSubmit={handleAddTodo} className="px-3 py-2.5 border-b border-[#e2e8f0] bg-[#fafafa] flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Add a new task..."
                      value={newTodoText}
                      onChange={e => setNewTodoText(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-[#e2e8f0] rounded-xl text-xs outline-none focus:border-[#ec4899] font-medium text-[#172554] bg-white"
                    />
                    <select
                      value={newTodoCat}
                      onChange={e => setNewTodoCat(e.target.value)}
                      className="px-2 py-1.5 border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#172554] bg-white outline-none focus:border-[#ec4899] cursor-pointer"
                    >
                      {Object.keys(CATEGORY_STYLES).map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_STYLES[cat].emoji} {cat}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#ec4899] hover:bg-[#db2777] shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <FiPlus size={12} strokeWidth={3} /> Add
                    </button>
                  </form>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredTodos.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#e2e8f0] rounded-2xl p-4">
                        <span className="text-2xl mb-1">🎉</span>
                        <p className="text-xs font-bold text-[#172554]">No tasks yet</p>
                        <p className="text-[10px] text-[#64748b]">Add something to get started!</p>
                      </div>
                    ) : (
                      filteredTodos.map(todo => {
                        const catStyle = CATEGORY_STYLES[todo.category] || CATEGORY_STYLES.Personal;
                        return (
                          <div
                            key={todo.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                              todo.completed
                                ? 'bg-[#f8fafc] border-[#e2e8f0] opacity-70'
                                : 'bg-white border-[#e2e8f0] hover:border-[#ec4899] hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <button
                                onClick={() => handleToggleTodo(todo.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                  todo.completed
                                    ? 'bg-[#ec4899] border-[#ec4899] text-white'
                                    : 'border-[#cbd5e1] hover:border-[#ec4899] bg-white'
                                }`}
                              >
                                {todo.completed && <FiCheck size={11} strokeWidth={3} />}
                              </button>
                              <span className={`text-xs font-semibold truncate ${
                                todo.completed ? 'line-through text-[#94a3b8]' : 'text-[#172554]'
                              }`}>
                                {todo.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
                                style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
                              >
                                {catStyle.emoji}
                              </span>
                              <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="p-1 text-[#94a3b8] hover:text-[#ef4444] rounded hover:bg-red-50 transition-all cursor-pointer"
                              >
                                <FiTrash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {todos.some(t => t.completed) && (
                    <div className="px-3 py-2 border-t border-[#e2e8f0] bg-[#fafafa] flex justify-between items-center text-[10px] shrink-0">
                      <span className="text-[#64748b] font-medium">{completedTodosCount} of {todos.length} done</span>
                      <button onClick={handleClearCompleted} className="text-[#ec4899] font-bold hover:underline cursor-pointer">
                        Clear Done
                      </button>
                    </div>
                  )}
                </div>

                {/* ── DIVIDER ──────────────────────────────────── */}
                <div className="hidden md:flex flex-col items-center justify-center gap-1 shrink-0">
                  <div className="w-px flex-1 bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent" />
                  <div className="w-8 h-8 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-sm shadow-sm">
                    ⚡
                  </div>
                  <div className="w-px flex-1 bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent" />
                </div>

                {/* ── RIGHT: NOT TO-DO LIST ─────────────────────── */}
                <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-[#fecaca] shadow-sm overflow-hidden">
                  {/* Panel Header */}
                  <div className="px-4 py-3 border-b border-[#fecaca] bg-gradient-to-r from-red-50 to-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#dc2626] flex items-center justify-center text-white text-sm">🚫</div>
                      <div>
                        <h2 className="text-sm font-extrabold text-[#7f1d1d] leading-tight">NOT TO-DO LIST</h2>
                        <p className="text-[10px] text-[#b91c1c]">Things you must AVOID</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-red-600">
                      🚫 {notTodos.length} to avoid
                    </div>
                  </div>

                  {/* Add Form */}
                  <form onSubmit={handleAddNotTodo} className="px-3 py-2.5 border-b border-[#fecaca] bg-red-50/40 flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="e.g. Scroll reels, skip gym, procrastinate..."
                      value={newNotTodoText}
                      onChange={e => setNewNotTodoText(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-red-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium text-[#172554] bg-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <FiPlus size={12} strokeWidth={3} /> Add
                    </button>
                  </form>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {notTodos.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-red-200 rounded-2xl p-4 bg-red-50/30">
                        <span className="text-2xl mb-1">🎯</span>
                        <p className="text-xs font-bold text-[#172554]">Nothing here yet</p>
                        <p className="text-[10px] text-[#64748b]">Add distractions & bad habits to avoid!</p>
                      </div>
                    ) : (
                      notTodos.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-red-200 bg-white hover:border-red-400 hover:shadow-sm transition-all flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-red-500">
                              {idx + 1}
                            </div>
                            <span className="text-xs font-semibold text-[#172554] truncate">{item.text}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-200">AVOID</span>
                            <button
                              onClick={() => handleDeleteNotTodo(item.id)}
                              className="p-1 text-[#94a3b8] hover:text-[#ef4444] rounded hover:bg-red-50 transition-all cursor-pointer"
                            >
                              <FiTrash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer tip */}
                  <div className="px-3 py-2 border-t border-red-100 bg-red-50/30 shrink-0">
                    <p className="text-[10px] text-center text-[#b91c1c] font-medium">
                      💡 Discipline = doing right things + avoiding wrong ones
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MONTHLY EXPENSE VIEW */}
            {activeTab === 'MONTHLY EXP' && (
              <div className="p-3 sm:p-6 w-full h-full flex flex-col md:flex-row gap-4 sm:gap-6 overflow-y-auto md:overflow-hidden">

                {/* LEFT SIDE: Fixed Control & Budget Panel */}
                <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto pr-1">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1] gap-2 flex-wrap">
                    <div>
                      <h2 className="text-lg font-bold text-[#172554] flex items-center gap-2">
                        <span>💰</span> Monthly Expense Tracker
                      </h2>
                      <p className="text-[11px] text-[#64748b]">Track budget, daily spends & monthly balances</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Month / Calendar Selector */}
                      <div className="flex items-center gap-1 bg-white border border-[#cbd5e1] rounded-xl px-2.5 py-1.5 shadow-sm text-xs text-[#172554] font-bold">
                        <FiCalendar size={13} className="text-[#10b981]" />
                        <span className="min-w-[95px] text-center">{selectedMonthInfo.label}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => setSelectedMonthOffset(o => o - 1)}
                            title="Previous Month (e.g. July, May)"
                            className="w-5 h-5 rounded hover:bg-[#f1f5f9] flex items-center justify-center transition-colors text-[#64748b] hover:text-[#172554] cursor-pointer"
                          >
                            <FiChevronLeft size={12} />
                          </button>
                          {selectedMonthOffset !== 0 && (
                            <button
                              onClick={() => setSelectedMonthOffset(0)}
                              title="Go to current month"
                              className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold cursor-pointer"
                            >
                              Today
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedMonthOffset(o => o + 1)}
                            title="Next Month"
                            className="w-5 h-5 rounded hover:bg-[#f1f5f9] flex items-center justify-center transition-colors text-[#64748b] hover:text-[#172554] cursor-pointer"
                          >
                            <FiChevronRight size={12} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => downloadExpensePDF({ monthlyBudget, expenses: monthlyExpenses, user, monthLabel: selectedMonthInfo.label })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#eef2ff] border border-[#c7d2fe] rounded-xl text-xs font-bold text-[#4f46e5] hover:bg-[#e0e7ff] transition-all shadow-sm shrink-0 cursor-pointer"
                        title="Download PDF Expense Statement"
                      >
                        <FiDownload size={12} /> Download PDF
                      </button>

                      <button
                        onClick={() => { setBudgetInput(monthlyBudget.toString()); setBudgetModalTab('set'); setShowBudgetModal(true); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-xs font-bold text-[#16a34a] hover:bg-[#dcfce7] transition-all shadow-sm shrink-0 cursor-pointer"
                      >
                        <FiEdit3 size={12} /> Set Budget
                      </button>
                    </div>
                  </div>

                  {/* 3 Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Monthly Budget Card */}
                    <div className="bg-white p-3 rounded-xl border border-[#cbd5e1] shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#64748b] font-semibold">
                        <span>Monthly Budget</span>
                        <span className="text-[#10b981] font-bold text-sm">₹</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-xl font-extrabold text-[#172554]">₹{monthlyBudget.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-white p-3 rounded-xl border border-[#cbd5e1] shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-[#64748b] font-semibold">
                        <span>Total Spent</span>
                        <FiTrendingDown className="text-[#ef4444]" />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-xl font-extrabold text-[#ef4444]">₹{totalSpent.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Remaining Balance Card */}
                    <div className={`p-3 rounded-xl border shadow-sm flex flex-col justify-between transition-all ${remainingBalance < 0
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : remainingBalance <= monthlyBudget * 0.2
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span>Remaining Balance</span>
                        <FiCreditCard />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-xl font-extrabold">₹{remainingBalance.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>


                  {/* Progress Bar */}
                  <div className="bg-white p-3 rounded-xl border border-[#cbd5e1] shadow-sm space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#172554]">
                      <span>Budget Used ({spentPercentage}%)</span>
                      <span>₹{totalSpent.toLocaleString('en-IN')} / ₹{monthlyBudget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${spentPercentage > 90 ? 'bg-red-500' : spentPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${spentPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Add Expense Form */}
                  <form onSubmit={handleAddExpense} className="bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-[#172554] tracking-wide uppercase">Add New Expense</h4>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Expense title (e.g. Shopping, Milk)..."
                        value={expenseTitle}
                        onChange={e => setExpenseTitle(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-[#e2e8f0] rounded-xl text-xs outline-none focus:border-[#10b981] font-medium text-[#172554] bg-[#fafafa]"
                      />

                      <div className="relative shrink-0 sm:w-32">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-[#64748b]">₹</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={expenseAmount}
                          onChange={e => setExpenseAmount(e.target.value)}
                          className="w-full pl-6 pr-2.5 py-1.5 border border-[#e2e8f0] rounded-xl text-xs outline-none focus:border-[#10b981] font-medium text-[#172554] bg-[#fafafa]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="date"
                        value={expenseDate}
                        onChange={e => setExpenseDate(e.target.value)}
                        className="px-2.5 py-1.5 border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#172554] outline-none focus:border-[#10b981] bg-[#fafafa]"
                      />

                      {/* Category Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {Object.keys(EXPENSE_CATEGORIES).map(cat => {
                          const style = EXPENSE_CATEGORIES[cat];
                          const isSelected = expenseCat === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setExpenseCat(cat)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'shadow-sm scale-105' : 'opacity-60 hover:opacity-100'}`}
                              style={{ background: style.bg, color: style.text, borderColor: style.border }}
                              title={cat}
                            >
                              {style.emoji}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] shadow-sm transition-all flex items-center gap-1 shrink-0"
                      >
                        <FiPlus size={14} strokeWidth={3} /> Add
                      </button>
                    </div>
                  </form>
                </div>

                {/* RIGHT SIDE: Scrollable Expense History */}
                <div className="w-full md:w-1/2 flex flex-col h-full bg-[#fdfbf7] p-4 rounded-2xl border border-[#cbd5e1] overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1] mb-3 shrink-0">
                    <h3 className="text-xs font-bold text-[#64748b] tracking-wider uppercase flex items-center gap-1.5">
                      <span>📋</span> EXPENSE HISTORY
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#7c3aed] bg-[#fdf4ff] px-2.5 py-0.5 rounded-full border border-[#e9d5ff]" title={prevWeekLabel}>
                        Last week: ₹{prevWeekSpent.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => downloadExpensePDF({ monthlyBudget, expenses: monthlyExpenses, user, monthLabel: selectedMonthInfo.label })}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#cbd5e1] hover:border-[#6366f1] hover:text-[#6366f1] text-[#334155] rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                        title="Export PDF Statement"
                      >
                        <FiDownload size={11} /> Export PDF
                      </button>
                      <span className="text-[11px] font-semibold text-[#10b981] bg-[#f0fdf4] px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                        {monthlyExpenses.length} Entries ({selectedMonthInfo.shortLabel})
                      </span>
                    </div>
                  </div>

                  {/* Scrollable list container */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5">
                    {monthlyExpenses.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-[#cbd5e1] rounded-2xl p-6">
                        <span className="text-3xl mb-2">🗓️</span>
                        <p className="text-sm font-bold text-[#172554]">No expenses logged for {selectedMonthInfo.label}</p>
                        <p className="text-xs text-[#64748b]">Add your daily expenses on the left to track this month!</p>
                      </div>
                    ) : (
                      (() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const sorted = [...monthlyExpenses].sort((a, b) => {
                          const dateA = new Date(a.date || a.createdAt);
                          const dateB = new Date(b.date || b.createdAt);
                          return dateB - dateA; // latest first
                        });

                        return sorted.map(exp => {
                          const catStyle = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.Others;
                          const expDate = new Date(exp.date || exp.createdAt);
                          expDate.setHours(0, 0, 0, 0);

                          const createdAtDate = new Date(exp.createdAt || Date.now());
                          createdAtDate.setHours(0, 0, 0, 0);

                          const isBackDate = expDate < createdAtDate;
                          const isFuture = expDate > today;
                          const isIncome = exp.type === 'income';

                          const formattedDate = new Date(exp.date || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <div
                              key={exp.id}
                              className={`bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between gap-3 transition-all ${isIncome
                                  ? 'border-[#bbf7d0] hover:border-[#22c55e] bg-[#f0fdf4]/60'
                                  : 'border-[#cbd5e1] hover:border-[#10b981]'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isIncome ? (
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold border shrink-0 bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]">
                                    💚 Income
                                  </span>
                                ) : (
                                  <span
                                    className="px-2 py-0.5 rounded-lg text-xs font-bold border shrink-0"
                                    style={{ background: catStyle.bg, color: catStyle.text, borderColor: catStyle.border }}
                                  >
                                    {catStyle.emoji} {exp.category}
                                  </span>
                                )}

                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-[#172554] truncate">{exp.title}</span>
                                    {isIncome && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#86efac] shrink-0">
                                        ✨ Added to Budget
                                      </span>
                                    )}
                                    {!isIncome && isBackDate && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a] shrink-0">
                                        📅 Back Date
                                      </span>
                                    )}
                                    {!isIncome && isFuture && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ede9fe] text-[#7c3aed] border border-[#ddd6fe] shrink-0">
                                        🔮 Upcoming
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-[#64748b] flex items-center gap-1">
                                    <FiCalendar size={9} /> {formattedDate}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className={`text-sm font-extrabold ${isIncome ? 'text-[#16a34a]' : 'text-[#ef4444]'
                                  }`}>
                                  {isIncome ? '+' : '-'}₹{Number(exp.amount).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: STATS VIEW */}
            {activeTab === 'STATS' && (
              <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
                <div className="border-b border-[#cbd5e1] pb-3">
                  <h2 className="text-xl font-bold text-[#172554] flex items-center gap-2">
                    <FiPieChart className="text-[#22c55e]" /> Habit Statistics & Progress
                  </h2>
                  <p className="text-xs text-[#64748b]">Track your daily and weekly completion rates</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#cbd5e1] shadow-sm flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-[#6366f1]">{pct}%</span>
                    <span className="text-xs font-bold text-[#172554] mt-1">Weekly Success Rate</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#cbd5e1] shadow-sm flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-[#22c55e]">{checkedCount}</span>
                    <span className="text-xs font-bold text-[#172554] mt-1">Total Habits Done</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#cbd5e1] shadow-sm flex flex-col items-center col-span-2 md:col-span-1">
                    <span className="text-3xl font-extrabold text-[#f59e0b]">{columns.length}</span>
                    <span className="text-xs font-bold text-[#172554] mt-1">Active Habit Lists</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#cbd5e1] shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-[#172554]">Habit Breakdown</h3>
                  {columns.map(col => {
                    const colCheckedCount = days.filter(d => checked[`${d.iso}-${col.id}`]).length;
                    const colPct = Math.round((colCheckedCount / 7) * 100);
                    return (
                      <div key={col.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#172554] flex items-center gap-1.5">
                            {col.Icon ? <col.Icon style={{ color: col.color }} size={12} /> : col.iconName} {col.name}
                          </span>
                          <span style={{ color: col.color }}>{colCheckedCount}/7 days ({colPct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${colPct}%`, background: col.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: GOALS VIEW */}
            {activeTab === 'GOALS' && (
              <GoalsSection />
            )}

            {/* TAB 6: NOTES VIEW */}
            {activeTab === 'NOTES' && (
              <NotesSection />
            )}

          </div>

          {/* ── Bottom Bar: Progress + Motivation ──────── */}
          <div className="shrink-0 border-t border-[#ede8db] px-3 sm:px-5 py-2 flex items-center justify-between bg-[#faf8f0] gap-2 sm:gap-4">

            <div className="hidden md:flex items-center gap-1.5 bg-[#fef9c3] border border-[#fde68a] rounded-xl px-4 py-2 shadow-sm relative text-xs">
              <FiStar size={12} className="text-[#facc15]" />
              <p className="font-bold text-[#172554]">Small steps every day lead to big results. 😊</p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 bg-white border border-[#ede8db] rounded-xl px-3 sm:px-4 py-1.5 shadow-sm w-full sm:w-auto sm:min-w-[220px]">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="#ede8db" strokeWidth="4" />
                  <circle
                    cx="30" cy="30" r="26" fill="none"
                    stroke="#6366f1" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (pct / 100) * circumference}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-extrabold text-[#172554]">{pct}%</span>
              </div>
              <div className="flex-1 sm:flex-initial">
                <p className="text-xs font-bold text-[#172554] leading-tight">Weekly Progress</p>
                <p className="text-[10px] text-[#7c8499] mt-0.5">{checkedCount} of {totalCells} completed</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-[#f3f0ff] border border-[#ddd6fe] rounded-xl px-4 py-2 shadow-sm text-xs">
              <FiStar size={11} className="text-[#6366f1]" />
              <p className="text-[#7c8499]"><span className="font-bold text-[#172554]">Keep going!</span> Consistency today, success tomorrow.</p>
            </div>
          </div>
        </div>

        {/* ── Notebook Tabs (right side - Desktop only) ──────────────── */}
        <div className="hidden md:flex flex-col justify-center gap-1 shrink-0">
          {NOTEBOOK_TABS.map((tab, i) => {
            const isActive = activeTab === tab;
            return (
              <div key={tab} className="relative flex items-center justify-center">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-extrabold tracking-widest text-white px-2 py-3 rounded-r-xl select-none shadow-md transition-all cursor-pointer border-r-2 border-y border-white/20 ${isActive ? 'scale-105 shadow-xl opacity-100 ring-2 ring-white/50' : 'opacity-75 hover:opacity-100 hover:scale-105'}`}
                  style={{
                    background: TAB_COLORS[i],
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: isActive ? 'rotate(180deg) translateX(-3px)' : 'rotate(180deg)',
                    minHeight: 60,
                  }}
                >
                  {tab}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
