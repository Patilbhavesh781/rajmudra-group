import { Router, Response } from 'express';
import { MANDAL_CONFIG } from '../../shared/mandalConfig.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth.js';
import { ExpenseModel, PavtiModel } from '../models.js';
import { recordAudit } from '../audit.js';

const router = Router();

function safeCsvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  // Prevent spreadsheet programs from evaluating user-controlled cells as formulas.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map(row => row.map(safeCsvCell).join(',')).join('\r\n')}`;
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(csv);
}

router.get('/receipts.csv', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const receipts = await PavtiModel.find({}, { createdAt: -1 });
    const rows = receipts.map((receipt: any) => [
      receipt.receiptNo,
      receipt.date,
      receipt.donorName,
      receipt.donorPhone,
      receipt.donorAddress,
      receipt.amount,
      receipt.paymentMode,
      receipt.paymentStatus,
      receipt.transactionId,
      receipt.donationCategory,
      receipt.collectedBy?.name,
      receipt.status,
      receipt.cancellationReason,
      receipt.createdAt,
    ]);

    await recordAudit({
      action: 'RECEIPTS_REPORT_EXPORTED',
      entityType: 'pavti',
      description: `${req.user!.name} exported the receipts CSV report.`,
      req,
      metadata: { recordCount: receipts.length },
    });

    const csv = makeCsv([
      'Receipt No', 'Receipt Date', 'Donor Name', 'Donor Phone', 'Donor Address',
      'Amount', 'Payment Mode', 'Payment Status', 'Transaction Reference',
      'Donation Category', 'Collected By', 'Receipt Status', 'Cancellation Reason', 'Created At',
    ], rows);
    return sendCsv(res, `${MANDAL_CONFIG.exportPrefix}_Receipts_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to export receipts.' });
  }
});

router.get('/expenses.csv', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await ExpenseModel.find({});
    const rows = expenses.map((expense: any) => [
      expense.expenseNo,
      expense.date,
      expense.title,
      expense.category,
      expense.amount,
      expense.paymentMode,
      expense.paidTo,
      expense.recordedBy?.name,
      expense.createdAt,
    ]);

    await recordAudit({
      action: 'EXPENSES_REPORT_EXPORTED',
      entityType: 'expense',
      description: `${req.user!.name} exported the expenses CSV report.`,
      req,
      metadata: { recordCount: expenses.length },
    });

    const csv = makeCsv([
      'Expense No', 'Expense Date', 'Title', 'Category', 'Amount',
      'Payment Mode', 'Paid To', 'Recorded By', 'Created At',
    ], rows);
    return sendCsv(res, `${MANDAL_CONFIG.exportPrefix}_Expenses_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to export expenses.' });
  }
});

export default router;
