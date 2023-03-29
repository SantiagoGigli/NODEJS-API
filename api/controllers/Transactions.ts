import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { currencyChange } from '../../utils/currencyChange.js';
import BankAccount from '../models/BankAccount.js';
import Transfer from '../models/Transfer.js';
import User from '../models/User.js';

export interface matchQuery {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  bankAccount: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ITransaction {
  user: User;
  _id: string;
  accountFrom: string;
  accountTo: string;
  amount: number;
}

interface IAggregateResult {
  week: string;
  user: ITransactionResult;
}

type ITransactionResult = Record<
  string,
  {
    email: string;
    _id: string;
    transactions: ITransaction[];
  }
>;

export const getReport = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    const $match: matchQuery = {};

    if (from) $match.createdAt = { $gte: new Date(from as string) };
    if (to) $match.createdAt = { $lte: new Date(to as string) };
    if (to && from) {
      $match.createdAt = { $lte: new Date(to as string), $gte: new Date(from as string) };
    }

    const response: IAggregateResult[] = await Transfer.aggregate([
      { $match },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            _id: '$user._id',
            email: '$user.email',
          },
          transactions: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $project: {
          week: '$_id.week',
          user: {
            _id: '$_id._id',
            email: '$_id.email',
            transactions: '$transactions',
          },
          _id: 0,
        },
      },
    ]);

    if (!response || !response) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const transactionsByDate = response.reduce<Record<string, ITransactionResult[]>>((acc, data) => {
      if (!acc[data.week]) {
        acc[data.week] = [];
      }
      acc[data.week].push(data.user);
      return acc;
    }, {});

    const transactionsByUser = Object.entries(transactionsByDate || {}).reduce<
      Record<string, Record<string, { email: string; internal: number; external: number }>>
    >((acc, array) => {
      const week = array[0];
      const value = array[1];

      if (value) {
        value.forEach((userInWeek: any) => {
          if (!acc[week]) {
            acc[week] = {
              [userInWeek._id]: {
                email: userInWeek.email,
                internal: 0,
                external: 0,
              },
            };
          }
          userInWeek.transactions.forEach((transaction: any) => {
            const accounts = transaction.user.bankAccount.map((b: mongoose.Types.ObjectId) => b.toString());
            const internalOrExternal = accounts.includes(transaction.accountTo.toString()) ? 'internal' : 'external';
            acc[week] = {
              ...acc[week],
              [userInWeek._id]: {
                ...acc[week][userInWeek._id],
                email: userInWeek.email,
                [internalOrExternal]: acc[week][userInWeek._id][internalOrExternal] + 1,
              },
            };
          });

          acc[week] = {
            ...acc[week],
            [userInWeek._id]: {
              email: acc[week][userInWeek._id].email,
              percentageInternal: `${Math.round((acc[week][userInWeek._id]['internal'] * 100) / userInWeek.transactions.length)}%`,
              percentageExternal: `${(Math.round((acc[week][userInWeek._id]['external'] * 100) / userInWeek.transactions.length))}%`,
            },
          };
        });
      }
      return acc;
    }, {});

    return res.status(200).json({
      statusCode: 200,
      success: 'Ok',
      data: transactionsByUser,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

interface TransferBody {
  accountFrom: string;
  accountTo: string;
  amount: number;
  description: string;
}

export const createTransfer = async (req: Request, res: Response) => {
  try {
    const { accountFrom, accountTo, amount, description }: TransferBody = req.body;

    if (!accountFrom) {
      return res.status(400).json({ message: 'Missing accountFrom' });
    }

    if (!accountTo) {
      return res.status(400).json({ message: 'Missing accountTo' });
    }

    if (!amount) {
      return res.status(400).json({ message: 'Missing amount' });
    }

    if (!description) {
      return res.status(400).json({ message: 'Missing description' });
    }

    if (accountFrom === accountTo) {
      return res.status(400).json({ message: 'Cannot transfer to the same account' });
    }

    const accounts = await BankAccount.aggregate([
      {
        $match: {
          _id: {
            $in: [new mongoose.Types.ObjectId(accountFrom), new mongoose.Types.ObjectId(accountTo)],
          },
        },
      },
      {
        $lookup: {
          from: 'currencies',
          localField: 'currency',
          foreignField: '_id',
          as: 'currency',
        },
      },
      {
        $unwind: {
          path: '$currency',
        },
      },
      {
        $project: {
          _id: '$_id',
          amount: '$amount',
          currency: '$currency.name',
        },
      },
    ]);

    if (!accounts || accounts.length === 0) {
      return res.status(400).json({ message: 'Accounts not found' });
    }

    if (accounts[0].amount < amount) {
      return res.status(400).json({ message: 'Not enough funds' });
    }

    const accountUser1 = await User.findOne({ bankAccount: accounts[0]._id });

    if (!accountUser1) {
      return res.status(400).json({ message: 'User1 not found' });
    }

    const accountUser2 = await User.findOne({ bankAccount: accounts[1]._id });

    if (!accountUser2) {
      return res.status(400).json({ message: 'User2 not found' });
    }

    const isSameUser = accountUser1?._id.toString() === accountUser2?._id.toString();

    let responseCurrencyChange;

    if (accounts[0].currency !== accounts[1].currency) {
      responseCurrencyChange = await currencyChange({
        to: accounts[1].currency,
        from: accounts[0].currency,
        amount,
      });
    }

    await BankAccount.findByIdAndUpdate(
      { _id: accountFrom },
      {
        amount: accounts[0]?.amount - amount,
      },
      { new: true }
    );

    const finalAmount = responseCurrencyChange?.result || amount;

    await BankAccount.findByIdAndUpdate(
      { _id: accountTo },
      {
        amount: isSameUser
          ? accounts[1]?.amount + finalAmount
          : accounts[1]?.amount + (finalAmount - (amount * 1) / 100),
      },
      { new: true }
    );

    const payloadToSave = {
      ...req.body,
      user: accountUser1._id,
      amount: finalAmount,
    };

    const newTransfer = new Transfer(payloadToSave);
    newTransfer.save();

    return res.status(200).json({
      statusCode: 200,
      success: 'Transfer created',
      data: newTransfer,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};
