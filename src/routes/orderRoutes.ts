// routes/orderRoutes.ts
import express from 'express';
import {
  createOrder,
  getOrderById,
  updateOrderToDelivered,
  getMyOrders,
  stripeWebhook,
} from '../controllers/orderController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', isAuthenticated, createOrder);
router.get('/myorders', isAuthenticated, getMyOrders);
router.get('/:id', isAuthenticated, getOrderById);
router.put('/:id/deliver', isAuthenticated, isAdmin, updateOrderToDelivered);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

export default router;
