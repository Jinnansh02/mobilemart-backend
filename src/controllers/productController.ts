import { Request, Response } from 'express';
import { Product, IProduct } from '../models/productModel';
import { uploadToFirebase } from '../utils/fileUpload';
import mongoose from 'mongoose';

export class ProductController {
  // Create new product
  public async createProduct(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Product image is required',
        });
        return;
      }

      const imageUrl = await uploadToFirebase(req.file);
      const productData = { ...req.body, imageUrl };

      const product: IProduct = await Product.create(productData);
      await product.populate('category');

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Get all products with optional filters
  public async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const { category, minPrice, maxPrice, search } = req.query;
      const query: any = {};

      if (category) {
        query.category = new mongoose.Types.ObjectId(category as string);
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const products: IProduct[] = await Product.find(query)
        .populate('category')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Get single product
  public async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const product: IProduct | null = await Product.findById(
        req.params.id
      ).populate('category');

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Update product
  public async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      let updateData = { ...req.body };

      if (req.file) {
        const imageUrl = await uploadToFirebase(req.file);
        updateData = { ...updateData, imageUrl };
      }

      const product: IProduct | null = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('category');

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Delete product
  public async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const product: IProduct | null = await Product.findByIdAndDelete(
        req.params.id
      );

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
}
