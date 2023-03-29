import mongoose, { Document, PopulatedDoc, Schema } from 'mongoose';
import { IBankAccount } from './BankAccount';

export interface IUser extends Document {
    bankAccount: PopulatedDoc<IBankAccount>[];
    name: string;
    email: string;
}

const userSchema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    bankAccount: [{
      ref: 'BankAccount',
      type: Schema.Types.ObjectId,
      required: true,
    }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
