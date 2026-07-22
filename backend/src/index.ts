import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import challanRoutes from './routes/challan.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Status Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Mini ERP + CRM Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Mini ERP + CRM Server running on port ${config.port}`);
});

export default app;
