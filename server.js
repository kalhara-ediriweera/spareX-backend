import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

// Routes imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Config & Middleware
import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.js';

// Load Env variables
dotenv.config();

console.log("MONGO_URI =", process.env.MONGO_URI);
console.log("Current directory =", process.cwd());

// Connect to MongoDB
connectDB();

const app = express();

// Set Security headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images from different origins
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Sanitize data (NoSQL injection prevention)
app.use(mongoSanitize());

// Rate Limiter for APIs
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 Minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes.'
});
app.use('/api', limiter);

// Serve uploads as static folders
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure default folders and basic placeholders exist
const setupStaticAssets = () => {
  const assets = [
    'uploads/products/default.jpg',
    'uploads/profiles/default.png'
  ];
  assets.forEach(asset => {
    const fullPath = path.join(__dirname, asset);
    if (!fs.existsSync(fullPath)) {
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, ''); // Create empty placeholder file
    }
  });
};
setupStaticAssets();

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('SpareX Spare Parts eCommerce API is running...');
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
