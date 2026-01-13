import { model, Schema } from 'mongoose';
import {
  ICategory,
  CategoryModel,
} from './category.interface';

const categorySchema = new Schema<ICategory, CategoryModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (value: string) => value.toLowerCase(),
    },
  },
  { timestamps: true }
);

export const Category = model<ICategory, CategoryModel>(
  'Category',
  categorySchema
);

