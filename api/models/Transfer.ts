import { IBankAccount } from './BankAccount';
import mongoose, { Schema, Document, PopulatedDoc } from 'mongoose';
import { IUser } from './User';

export interface ITransfer extends Document {
  user: PopulatedDoc<IUser>;
  accountFrom: PopulatedDoc<IBankAccount>;
  accountTo: PopulatedDoc<IBankAccount>;
  amount: number;
  description: string;
}

const transferSchema: Schema = new Schema<ITransfer>(
  {
    user: {
      ref: 'User',
      type: Schema.Types.ObjectId,
      required: true,
    },
    accountFrom: {
      ref: 'BankAccount',
      type: Schema.Types.ObjectId,
      required: true,
    },
    accountTo: {
      ref: 'BankAccount',
      type: Schema.Types.ObjectId,
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITransfer>('Transfer', transferSchema);