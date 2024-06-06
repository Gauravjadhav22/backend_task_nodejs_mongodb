import mongoose, { Schema, Document } from 'mongoose';

interface ITag extends Document {
  name: string;
}

const tagSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true }
});

const Tag = mongoose.model<ITag>('Tag', tagSchema);
export default Tag;
