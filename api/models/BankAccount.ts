import mongoose, { Schema, PopulatedDoc, Document } from 'mongoose';
import { ICurrency } from './Currency';

export interface IBankAccount extends Document {
  amount: number;
  currency: PopulatedDoc<ICurrency>;
}

const bankAccountSchema: Schema = new Schema<IBankAccount>(
  {
    amount: { type: Number, default: 0 },
    currency: {
        ref: 'Currency',
        type: Schema.Types.ObjectId,
        required: true,
      },
  },
  { timestamps: true }
);

export default mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);
