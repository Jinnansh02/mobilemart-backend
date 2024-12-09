// models/favoriteModel.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './userModel';
import { IProduct } from './productModel';

export interface IFavorite extends Document {
  user: IUser['_id'];
  products: IProduct['_id'][];
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
