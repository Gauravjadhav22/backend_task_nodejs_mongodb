import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  title: string;
  desc: string;
  image: string[];
  tags: string[];
}

const postSchema: Schema = new Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  image: [{ type: String, required: true }],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }], // Reference to Tag model
});

export const Post = mongoose.model<IPost>("Post", postSchema);
