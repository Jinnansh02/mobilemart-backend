import express from 'express';
import { ProductController } from '../controllers/productController';
import { upload } from '../utils/fileUpload';

const router = express.Router();
const productController = new ProductController();

router.post('/', upload.single('image'), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
