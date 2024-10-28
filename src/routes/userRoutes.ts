import express from 'express';
import { signup, login, getProfile } from '../controllers/authControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', isAuthenticated, getProfile);

export default router;
