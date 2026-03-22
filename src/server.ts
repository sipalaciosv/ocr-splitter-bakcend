import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ocrRoutes from './routes/ocr.routes.js';
import groupRoutes from './routes/group.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'OCR Splitter Backend',
    });
});

// API Routes
app.use('/api/ocr', ocrRoutes);
app.use('/api/groups', groupRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 OCR Splitter Backend Started');
    console.log('=================================');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 OCR endpoint: http://localhost:${PORT}/api/ocr/process`);
    console.log(`👥 Groups endpoint: http://localhost:${PORT}/api/groups`);
    console.log('=================================');
});
