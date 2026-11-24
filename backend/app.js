
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import trackerRoutes from './routes/tracker.js';
import aiRoutes from './routes/ai.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
    res.status(200).send('API is running...');
});

export default app;
