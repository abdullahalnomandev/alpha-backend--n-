import { Model } from "mongoose";

export type ICategory = {
  _id?: string;
  name: string;                    // Category name
  createdAt?: Date;
  updatedAt?: Date;
};

export type CategoryModel = Model<ICategory>;

