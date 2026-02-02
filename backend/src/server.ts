import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import erpRoutes from './routes/erp.routes';
import logisticsRoutes from './routes/logistics.routes';
import careRoutes from './routes/care.routes';
import crmRoutes from './routes/crm.routes';
import itemsRoutes from './routes/items.routes';
import purchasesRoutes from './routes/purchases.routes';
import vendorsRoutes from './routes/vendors.routes';
import purchaseOrdersRoutes from './routes/purchase-orders.routes';
import billsRoutes from './routes/bills.routes';
import salesRoutes from './routes/sales.routes';
import expensesRoutes from './routes/expenses.routes';
import tasksRoutes from './routes/tasks.routes';
import reportsRoutes from './routes/reports.routes';
import searchRoutes from './routes/search.routes';
import aiInsightsRoutes from './routes/ai-insights.routes';
import paymentsRoutes from './routes/payments.routes';
import vendorCreditsRoutes from './routes/vendor-credits.routes';
import transferOrdersRoutes from './routes/transfer-orders.routes';
import invoicesRoutes from './routes/invoices.routes';
import customersRoutes from './routes/customers.routes';
import salesOrdersRoutes from './routes/sales-orders.routes';
import paymentsReceivedRoutes from './routes/payments-received.routes';
import deliveryChallansRoutes from './routes/delivery-challans.routes';
import binLocationsRoutes from './routes/binLocations.routes';
import brandsRoutes from './routes/brands.routes';
import manufacturersRoutes from './routes/manufacturers.routes';
import posSessionsRoutes from './routes/pos-sessions.routes';
import { readOnlyGuard } from './middleware/readOnly.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// FIXED CORS: This function allows any localhost port automatically
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://2xg-erp.vercel.app',
      'https://2xg-dashboard-pi.vercel.app',
      'https://erp.2xg.in',
      process.env.FRONTEND_URL
    ];

    // Check if origin is in the list OR is any localhost port
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'cache-control', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Read-only mode guard — blocks write operations when READ_ONLY_MODE=true
app.use(readOnlyGuard);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '2XG Dashboard API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/care', careRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiInsightsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/vendor-credits', vendorCreditsRoutes);
app.use('/api/transfer-orders', transferOrdersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales-orders', salesOrdersRoutes);
app.use('/api/payments-received', paymentsReceivedRoutes);
app.use('/api/delivery-challans', deliveryChallansRoutes);
app.use('/api/bin-locations', binLocationsRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/manufacturers', manufacturersRoutes);
app.use('/api/pos-sessions', posSessionsRoutes);

// Health check endpoint for deployment platforms
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '2XG ERP API is healthy',
    timestamp: new Date().toISOString()
  });
});

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

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1') {
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
}

// Export for serverless
export default app;
