import mongoose, { Schema,Document } from 'mongoose';

export interface ICurrency extends Document {
  name: string;
}

const currencySchema: Schema = new Schema<ICurrency>(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICurrency>('Currency', currencySchema);
