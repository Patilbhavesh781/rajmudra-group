import { Router, Response } from 'express';
import { ExpenseModel } from '../models.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth.js';
import { recordAudit } from '../audit.js';

const router = Router();

// GET /api/expenses/list
router.get('/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await ExpenseModel.find({});
    return res.json(expenses);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/create (Admin and authorized users)
router.post('/create', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, amount, paymentMode, paidTo, billPhotoUrl, date } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ error: 'खर्चाचे नाव आणि रक्कम आवश्यक आहे.' });
    }

    const newExpense = await ExpenseModel.create({
      title: title.trim(),
      category: category || 'इतर खर्च (General)',
      amount: Number(amount),
      paymentMode: paymentMode || 'cash',
      paidTo: paidTo ? paidTo.trim() : '',
      billPhotoUrl: billPhotoUrl || '',
      recordedBy: {
        userId: req.user!.id,
        name: req.user!.name,
      },
      date: date || new Date().toISOString().split('T')[0],
    });

    await recordAudit({
      action: 'EXPENSE_CREATED',
      entityType: 'expense',
      entityId: newExpense._id?.toString() || newExpense.id || newExpense.expenseNo,
      description: `${req.user!.name} recorded expense ${newExpense.expenseNo}.`,
      req,
      metadata: {
        expenseNo: newExpense.expenseNo,
        title: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category,
        paymentMode: newExpense.paymentMode,
        paidTo: newExpense.paidTo,
      },
    });

    return res.status(201).json({
      message: 'खर्च यशस्वीरित्या नोंदवला गेला (Expense recorded)',
      expense: newExpense,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const expenses = await ExpenseModel.find({});
    const targetExpense = expenses.find((expense: any) => expense._id?.toString() === id || expense.id === id);
    const result = await ExpenseModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'खर्च आढळला नाही (Expense not found)' });
    }
    await recordAudit({
      action: 'EXPENSE_DELETED',
      entityType: 'expense',
      entityId: id,
      description: `${req.user!.name} deleted expense ${targetExpense?.expenseNo || id}.`,
      req,
      metadata: targetExpense ? {
        expenseNo: targetExpense.expenseNo,
        title: targetExpense.title,
        amount: targetExpense.amount,
        category: targetExpense.category,
      } : {},
    });
    return res.json({ message: 'खर्च यशस्वीरित्या हटवला गेला (Expense deleted successfully)' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
