import { Request, Response } from 'express';
import { Category, ICategory } from '../models/categoryModel';

export class CategoryController {
  // Create new category
  public async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const category: ICategory = await Category.create(req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Get all categories
  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories: ICategory[] = await Category.find();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Get single category
  public async getCategory(req: Request, res: Response): Promise<void> {
    try {
      const category: ICategory | null = await Category.findById(req.params.id);
      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Update category
  public async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const category: ICategory | null = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  // Delete category
  public async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const category: ICategory | null = await Category.findByIdAndDelete(
        req.params.id
      );
      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
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
