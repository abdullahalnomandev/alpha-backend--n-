import { Model, Types } from 'mongoose';

export type IStory = {
  _id?: string;
  title: string;                    // Story title
  description?: string;             // Story description
  image?: string;                   // Story image
  club?: Types.ObjectId;            // Reference to Club
  createdAt?: Date;
  updatedAt?: Date;
};

export type StoryModel = Model<IStory>;


