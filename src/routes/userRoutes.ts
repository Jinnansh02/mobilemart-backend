import express from 'express';
import { signup, login } from '../controllers/authControllers';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

export default router;
