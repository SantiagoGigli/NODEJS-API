import { Request, Response, NextFunction } from 'express';

export const checkUser = async (req: Request, res: Response, next: NextFunction) => {
  const {user, pass} = req.headers

  if (user !== "Test" || pass !== "12345" ) {
    return res.status(402).json({ message: 'User unauthorized' });
  }

  next()
};
