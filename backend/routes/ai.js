import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Tracker from '../models/Tracker.js';

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(requireAuth);

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Messageeeeeee is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'OpenRouter API key is not configured in backend .env (OPENROUTER_API_KEY)'
      });
    }

    // Fetch user profile and tracker data
    const user = await User.findById(req.user.userId).select('name email');
    const tracker = await Tracker.findOne({ user: req.user.userId });

    // Aggregate user context for AI analysis
    const habits = tracker?.columns?.map(c => ({ id: c.id, name: c.name, sub: c.sub })) || [];
    const checkedMap = Object.fromEntries(tracker?.checked || new Map());
    const totalChecks = Object.values(checkedMap).filter(Boolean).length;

    const todos = tracker?.todos || [];
    const completedTodos = todos.filter(t => t.completed);
    const pendingTodos = todos.filter(t => !t.completed);

    const monthlyBudget = tracker?.monthlyBudget || 0;
    const expenses = tracker?.expenses || [];
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const remainingBalance = monthlyBudget - totalSpent;

    // Group expenses by category
    const categorySpending = {};
    expenses.forEach(e => {
      const cat = e.category || 'Others';
      categorySpending[cat] = (categorySpending[cat] || 0) + Number(e.amount || 0);
    });

    const contextSummary = `
=== USER PROFILE & DISCIPLINE DATA ===
User Name: ${user?.name || 'User'}
Email: ${user?.email || 'N/A'}

--- 🎯 HABIT TRACKER STATUS ---
Active Habits: ${habits.length > 0 ? habits.map(h => `${h.name} (${h.sub || 'Daily'})`).join(', ') : 'No habits created yet'}
Total Habit Completions Logged: ${totalChecks}

--- 📋 TO-DO TASKS STATUS ---
Total Tasks: ${todos.length}
Completed Tasks (${completedTodos.length}): ${completedTodos.map(t => `[✓] ${t.text} (${t.category})`).join(', ') || 'None'}
Pending Tasks (${pendingTodos.length}): ${pendingTodos.map(t => `[ ] ${t.text} (${t.category})`).join(', ') || 'None'}

--- 💰 MONTHLY EXPENSE & BUDGET STATUS ---
Monthly Budget: ₹${monthlyBudget.toLocaleString('en-IN')}
Total Spent So Far: ₹${totalSpent.toLocaleString('en-IN')}
Remaining Balance: ₹${remainingBalance.toLocaleString('en-IN')}
Budget Utilization: ${monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0}%
Category-wise Breakdown:
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString('en-IN')}`).join('\n') || '- No expense logs yet'}

Recent Expenses:
${expenses.slice(0, 10).map(e => `- ${e.date || 'N/A'}: ${e.title} - ₹${e.amount} [${e.category}]`).join('\n') || '- No expenses logged yet'}
=== ABOUT THE FOUNDER & CREATOR ===
Founder & Creator: Mr. Sandeep
Portfolio / Personal Website: https://sandeep-lilac.vercel.app/
Mission & Vision: Mr. Sandeep created this awesome DiscipliniOS platform to help individuals track their daily habits, master their monthly expenses, and develop rock-solid discipline for consistent personal and professional growth.
===================================
`;

    const systemPrompt = `You are "DiscipliniAI Coach & Data Analyst", an intelligent, motivational, and highly analytical AI assistant built directly into the user's personal productivity and financial discipline OS.

Your job:
1. Provide deep, actionable analysis and insights on the user's habits, pending to-dos, monthly spending habits, and discipline consistency.
2. Directly answer user questions using their real-time data provided below.
3. Be encouraging, concise, direct, and structured (use bullet points, bold text, emojis where helpful).
4. If the user asks for budget advice, habit tips, or productivity strategies, give personalized recommendations based on their exact numbers and tasks.
5. If the user speaks or asks in Hindi or Hinglish, reply in friendly Hinglish/Hindi as appropriate.
6. If the user asks about the founder or creator (Mr. Sandeep), speak inspiringly and positively about him! Highlight how Mr. Sandeep engineered this awesome DiscipliniOS web app to empower people to track their habits, master their expenses, build rock-solid discipline, and consistently grow every day. Always invite the user to check out his portfolio with the clickable link: https://sandeep-lilac.vercel.app/ to learn more about him.

${contextSummary}
`;

    // Prepare message history for OpenRouter
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(h => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    const modelToUse = process.env.OPENROUTER_MODEL || 'openrouter/auto';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://diciplini-ai.vercel.app',
        'X-Title': 'DiscipliniAI'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error response:', data);
      throw new Error(data.error?.message || `OpenRouter API returned status ${response.status}`);
    }

    const reply = data.choices?.[0]?.message?.content || "I couldn't generate an analysis right now. Please try again.";

    res.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      message: error.message || 'Server error while processing AI analysis'
    });
  }
});

export default router;
