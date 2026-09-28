import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sub: { type: String },
  burnType: { type: String },
  iconName: { type: String },
  color: { type: String },
  bg: { type: String },
  createdAt: { type: String },
  deletedAt: { type: String }
}, { _id: false, strict: false });

const todoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  category: { type: String, default: 'Personal' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const notTodoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Others' },
  type: { type: String, enum: ['expense', 'income'], default: 'expense' },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const trackerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  columns: [columnSchema],
  checked: {
    type: Map,
    of: Boolean,
    default: {}
  },
  todos: [todoSchema],
  notTodos: [notTodoSchema],
  monthlyBudget: { type: Number, default: 0 },
  expenses: [expenseSchema]
}, { timestamps: true });

export default mongoose.model('Tracker', trackerSchema);

