// routes/orderRoutes.ts
import express from 'express';
import {
  createOrder,
  getOrderById,
  updateOrderToDelivered,
  updateOrderStatus,
  getMyOrders,
  getAllOrders,
  stripeWebhook,
  checkOrderPaymentStatus,
} from '../controllers/orderController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Protected routes
router.post('/', isAuthenticated, createOrder);
router.get('/myorders', isAuthenticated, getMyOrders);
router.get('/:id', isAuthenticated, getOrderById);

// Admin routes
router.get('/', isAuthenticated, isAdmin, getAllOrders);
router.put('/:id/status', isAuthenticated, isAdmin, updateOrderStatus);
router.put('/:id/deliver', isAuthenticated, isAdmin, updateOrderToDelivered);

router.get(
  '/check-payment-status/:id',
  isAuthenticated,
  checkOrderPaymentStatus
);

export default router;
