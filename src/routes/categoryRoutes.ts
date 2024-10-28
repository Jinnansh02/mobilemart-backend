import express from 'express';
import { CategoryController } from '../controllers/categoryController';

const router = express.Router();
const categoryController = new CategoryController();

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
