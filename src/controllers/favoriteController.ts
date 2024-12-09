// controllers/favoriteController.ts
import { Request, Response } from 'express';
import { Favorite } from '../models/favoriteModel';
import { AuthRequest } from '../middleware/authMiddleware';

export const favoriteController = {
  // Add product to favorites
  addToFavorites: async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      let favorite = await Favorite.findOne({ user: userId });

      if (!favorite) {
        // Create new favorite list if it doesn't exist
        favorite = await Favorite.create({
          user: userId,
          products: [productId],
        });
      } else {
        // Check if product already exists in favorites
        if (favorite.products.includes(productId)) {
          return res
            .status(400)
            .json({ message: 'Product already in favorites' });
        }

        // Add product to existing favorites
        favorite.products.push(productId);
        await favorite.save();
      }

      return res.status(200).json({
        message: 'Product added to favorites',
        favorite,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error adding product to favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Remove product from favorites
  removeFromFavorites: async (
    req: AuthRequest,
    res: Response
  ): Promise<any> => {
    try {
      const userId = req.user?.id;
      const { productId } = req.params;

      const favorite = await Favorite.findOne({ user: userId });

      if (!favorite) {
        return res.status(404).json({ message: 'Favorite list not found' });
      }

      // Remove product from favorites
      favorite.products = favorite.products.filter(
        (id: any) => id.toString() !== productId
      );
      await favorite.save();

      return res.status(200).json({
        message: 'Product removed from favorites',
        favorite,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error removing product from favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get user's favorite list
  getFavorites: async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user?.id;

      let favorite = await Favorite.findOne({ user: userId })
        .populate('products', 'name description price imageUrl') // Populate product details
        .exec();

      if (!favorite?._id) {
        favorite = await Favorite.create({ user: userId });
      }

      // if (!favorite) {
      //   return res.status(404).json({ message: 'Favorite list not found' });
      // }

      return res.status(200).json({ favorite });
    } catch (error) {
      return res.status(500).json({
        message: 'Error fetching favorites',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
