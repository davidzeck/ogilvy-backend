/**
 * Routes Index
 * Main router that combines all route modules
 */

import { Router } from 'express';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Health check route (already in app.ts, but can be here too)
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

