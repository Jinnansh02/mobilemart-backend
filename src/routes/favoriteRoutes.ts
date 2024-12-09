// routes/favoriteRoutes.ts
import express from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// Protect all favorite routes with authentication
router.use(isAuthenticated);

// Add product to favorites
router.post('/add', favoriteController.addToFavorites);

// Remove product from favorites
router.delete('/remove/:productId', favoriteController.removeFromFavorites);

// Get user's favorites
router.get('/', favoriteController.getFavorites);

export default router;
