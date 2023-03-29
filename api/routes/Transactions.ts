import express from 'express';
import { createTransfer, getReport } from '../controllers/Transactions.js';
import { checkUser } from '../middlewares/CheckUser.js';


const router = express.Router();

router.get('/report',checkUser, getReport);
router.post('/transfer',checkUser, createTransfer);

export default router;
