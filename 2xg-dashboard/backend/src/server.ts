import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import erpRoutes from './routes/erp.routes';
import logisticsRoutes from './routes/logistics.routes';
import careRoutes from './routes/care.routes';
import crmRoutes from './routes/crm.routes';
import itemsRoutes from './routes/items.routes';
import purchasesRoutes from './routes/purchases.routes';
import salesRoutes from './routes/sales.routes';
import expensesRoutes from './routes/expenses.routes';
import tasksRoutes from './routes/tasks.routes';
import reportsRoutes from './routes/reports.routes';
import searchRoutes from './routes/search.routes';
import aiInsightsRoutes from './routes/ai-insights.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '2XG Dashboard API'
  });
});

// API Routes
app.use('/api/erp', erpRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/care', careRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiInsightsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 2XG Dashboard API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
