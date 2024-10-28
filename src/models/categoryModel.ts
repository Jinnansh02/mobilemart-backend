import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  title: string;
  description: string;
}

const categorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
