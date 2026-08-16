import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { PavtiModel, UserModel, ExpenseModel } from '../models.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../auth.js';
import { recordAudit } from '../audit.js';
import { MANDAL_CONFIG } from '../../shared/mandalConfig.js';

const router = Router();

// Helper: Convert number to Marathi words
export function numberToMarathiWords(amount: number): string {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'शून्य रुपये फक्त';

  const units: { [key: number]: string } = {
    1: 'एक', 2: 'दोन', 3: 'तीन', 4: 'चार', 5: 'पाच', 6: 'सहा', 7: 'सात', 8: 'आठ', 9: 'नऊ', 10: 'दहा',
    11: 'अकरा', 12: 'बारा', 13: 'तेरा', 14: 'चौदा', 15: 'पंधरा', 16: 'सोळा', 17: 'सतरा', 18: 'अठरा', 19: 'एकोणीस', 20: 'वीस',
    21: 'एकवीस', 22: 'बावीस', 23: 'तेवीस', 24: 'चोवीस', 25: 'पंचवीस', 26: 'सव्वीस', 27: 'सत्तावीस', 28: 'अठ्ठावीस', 29: 'एकोणतीस', 30: 'तीस',
    31: 'एकतीस', 32: 'बत्तीस', 33: 'तेहेतीस', 34: 'चौतीस', 35: 'पस्तीस', 36: 'छत्तीस', 37: 'सदतीस', 38: 'अडतीस', 39: 'एकेचाळीस', 40: 'चाळीस',
    41: 'एक्केचाळीस', 42: 'बेचाळीस', 43: 'त्रेचाळीस', 44: 'चव्वेचाळीस', 45: 'पंचेचाळीस', 46: 'शेहेचाळीस', 47: 'सत्तेचाळीस', 48: 'अठ्ठेचाळीस', 49: 'एकोणपन्नास', 50: 'पन्नास',
    51: 'एक्कावन्न', 52: 'बावन्न', 53: 'त्रेपन्न', 54: 'चोपन्न', 55: 'पंचावन्न', 56: 'छप्पन्न', 57: 'सत्तावन्न', 58: 'अठ्ठावन्न', 59: 'एकोणसाठ', 60: 'साठ',
    61: 'एकसष्ठ', 62: 'बासष्ठ', 63: 'त्रेसष्ठ', 64: 'चौसष्ठ', 65: 'पासष्ठ', 66: 'सहासष्ठ', 67: 'सदुसष्ठ', 68: 'अडुसष्ठ', 69: 'एकोणसत्तर', 70: 'सत्तर',
    71: 'एकाहत्तर', 72: 'बाहत्तर', 73: 'त्र्याहत्तर', 74: 'चौर्‍याहत्तर', 75: 'पंच्याहत्तर', 76: 'शहात्तर', 77: 'सत्याहत्तर', 78: 'अठ्ठ्याहत्तर', 79: 'एकोणऐंशी', 80: 'ऐंशी',
    81: 'एक्याऐंशी', 82: 'ब्याऐंशी', 83: 'त्र्याऐंशी', 84: 'चौऱ्याऐंशी', 85: 'पंच्याऐंशी', 86: 'शहाऐंशी', 87: 'सत्त्याऐंशी', 88: 'अठ्ठ्याऐंशी', 89: 'एकोणनव्वद', 90: 'नव्वद',
    91: 'एक्याण्णव', 92: 'ब्याण्णव', 93: 'त्र्याण्णव', 94: 'चौऱ्याण्णव', 95: 'पंच्याण्णव', 96: 'शहाण्णव', 97: 'सत्त्याण्णव', 98: 'अठ्ठ्याण्णव', 99: 'नऊ्याण्णव', 100: 'शंभर'
  };

  function convertLessThousand(n: number): string {
    if (n === 0) return '';
    if (n <= 100) return units[n] || String(n);
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      const hWord = h === 1 ? 'एकशे' : (units[h] ? units[h] + 'शे' : h + 'शे');
      return rem > 0 ? `${hWord} ${units[rem] || rem}` : hWord;
    }
    return '';
  }

  let words = '';
  let remaining = num;

  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    words += `${units[crore] || crore} कोटी `;
  }

  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    words += `${units[lakh] || lakh} लाख `;
  }

  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    words += `${units[thousand] || thousand} हजार `;
  }

  if (remaining > 0) {
    words += convertLessThousand(remaining);
  }

  return words.trim() + ' रुपये फक्त';
}

// Helper: Convert number to English words
export function numberToEnglishWords(amount: number): string {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return single[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return (tens[t] + (u > 0 ? ' ' + single[u] : '')).trim();
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += single[h] + ' Hundred';
      if (rem > 0) res += ' and ';
    }
    if (rem > 0) {
      res += convertTwoDigits(rem);
    }
    return res.trim();
  }

  let words = '';
  let remaining = num;

  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    words += convertThreeDigits(crore) + ' Crore ';
  }

  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    words += convertThreeDigits(lakh) + ' Lakh ';
  }

  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    words += convertThreeDigits(thousand) + ' Thousand ';
  }

  if (remaining > 0) {
    words += convertThreeDigits(remaining);
  }

  return words.trim() + ' Rupees Only';
}

// -------------------------------------------------------------
// GET /api/pavti/calculations
// Core requirement: Instant calculation metrics for BOTH users and admins
// -------------------------------------------------------------
router.get('/calculations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const allPavtis = await PavtiModel.find({ status: 'active' });
    const allUsers = await UserModel.find({});
    const allExpenses = await ExpenseModel.find({});

    const todayStr = new Date().toISOString().split('T')[0];

    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    let todayAmount = 0;
    let todayPaidAmount = 0;
    let todayUnpaidAmount = 0;
    let todayCount = 0;

    const modeTotals = {
      cash: { amount: 0, count: 0 },
      upi: { amount: 0, count: 0 },
      online: { amount: 0, count: 0 },
      cheque: { amount: 0, count: 0 },
    };

    const categoryTotals: { [key: string]: { amount: number; count: number } } = {};
    const collectorMap: { [userId: string]: {
      userId: string;
      name: string;
      role: string;
      phone: string;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      paidCount: number;
      unpaidCount: number;
      totalCount: number;
      todayAmount: number;
      todayCount: number;
      modes: { cash: number; upi: number; online: number; cheque: number };
      modesCount: { cash: number; upi: number; online: number; cheque: number };
    } } = {};

    // Initialize all registered users in collectorMap
    allUsers.forEach((u: any) => {
      const uId = u._id?.toString() || u.id;
      collectorMap[uId] = {
        userId: uId,
        name: u.name,
        role: u.role,
        phone: u.phone,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
        totalCount: 0,
        todayAmount: 0,
        todayCount: 0,
        modes: { cash: 0, upi: 0, online: 0, cheque: 0 },
        modesCount: { cash: 0, upi: 0, online: 0, cheque: 0 },
      };
    });

    for (const p of allPavtis) {
      const amt = Number(p.amount) || 0;
      const isPaid = p.paymentStatus !== 'unpaid';

      totalAmount += amt;
      if (isPaid) {
        paidAmount += amt;
        paidCount += 1;
      } else {
        unpaidAmount += amt;
        unpaidCount += 1;
      }

      const isToday = p.date === todayStr || p.createdAt?.startsWith(todayStr);
      if (isToday) {
        todayAmount += amt;
        todayCount += 1;
        if (isPaid) todayPaidAmount += amt;
        else todayUnpaidAmount += amt;
      }

      // Mode breakdown
      const mode = (p.paymentMode || 'cash') as 'cash' | 'upi' | 'online' | 'cheque';
      if (modeTotals[mode]) {
        modeTotals[mode].amount += amt;
        modeTotals[mode].count += 1;
      }

      // Category breakdown
      const cat = p.donationCategory || 'इतर वर्गणी (Other Seva)';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0 };
      }
      categoryTotals[cat].amount += amt;
      categoryTotals[cat].count += 1;

      // Collector breakdown
      const cId = p.collectedBy?.userId || 'unknown';
      if (!collectorMap[cId]) {
        collectorMap[cId] = {
          userId: cId,
          name: p.collectedBy?.name || 'अज्ञात कार्यकर्ता',
          role: p.collectedBy?.role || 'user',
          phone: p.collectedBy?.phone || '',
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalCount: 0,
          todayAmount: 0,
          todayCount: 0,
          modes: { cash: 0, upi: 0, online: 0, cheque: 0 },
          modesCount: { cash: 0, upi: 0, online: 0, cheque: 0 },
        };
      }
      collectorMap[cId].totalAmount += amt;
      if (isPaid) {
        collectorMap[cId].paidAmount += amt;
        collectorMap[cId].paidCount += 1;
      } else {
        collectorMap[cId].unpaidAmount += amt;
        collectorMap[cId].unpaidCount += 1;
      }
      collectorMap[cId].totalCount += 1;

      if (collectorMap[cId].modes[mode] !== undefined) {
        collectorMap[cId].modes[mode] += amt;
        collectorMap[cId].modesCount[mode] = (collectorMap[cId].modesCount[mode] || 0) + 1;
      }
      if (isToday) {
        collectorMap[cId].todayAmount += amt;
        collectorMap[cId].todayCount += 1;
      }
    }

    // Calculate total expenses
    const totalExpenses = allExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);
    const balanceInHand = paidAmount - totalExpenses; // Cash in hand is Paid - Expenses

    const currentUserId = req.user!.id;
    const myStats = collectorMap[currentUserId] || {
      userId: currentUserId,
      name: req.user!.name,
      role: req.user!.role,
      phone: req.user!.phone,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      paidCount: 0,
      unpaidCount: 0,
      totalCount: 0,
      todayAmount: 0,
      todayCount: 0,
      modes: { cash: 0, upi: 0, online: 0, cheque: 0 },
      modesCount: { cash: 0, upi: 0, online: 0, cheque: 0 },
    };

    const myPercentage = totalAmount > 0 ? ((myStats.totalAmount / totalAmount) * 100).toFixed(1) : '0';

    const collectorsList = Object.values(collectorMap).sort((a, b) => b.totalAmount - a.totalAmount);

    return res.json({
      mandalTotal: {
        totalAmount,
        paidAmount,
        unpaidAmount,
        paidCount,
        unpaidCount,
        totalReceipts: allPavtis.length,
        todayAmount,
        todayPaidAmount,
        todayUnpaidAmount,
        todayCount,
        totalExpenses,
        balanceInHand,
        date: todayStr,
      },
      paymentModes: modeTotals,
      categories: categoryTotals,
      collectors: collectorsList,
      userPersonalStats: {
        ...myStats,
        mandalContributionPercentage: myPercentage,
      },
      userRole: req.user!.role,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Calculation error:', err);
    return res.status(500).json({ error: 'Calculations computation error: ' + err.message });
  }
});

// -------------------------------------------------------------
// POST /api/pavti/create
// -------------------------------------------------------------
router.post('/create', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { donorName, donorPhone, donorAddress, amount, paymentMode, paymentStatus, transactionId, donationCategory, note, date } = req.body;

    if (!donorName || !amount) {
      return res.status(400).json({ error: 'दात्याचे नाव आणि रक्कम (Donor name & amount) आवश्यक आहेत.' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'वैध रक्कम प्रविष्ट करा (Please enter a valid amount).' });
    }

    const receiptNo = await PavtiModel.getNextReceiptNo();
    const amountInWords = numberToMarathiWords(parsedAmount);
    const amountInEnglishWords = numberToEnglishWords(parsedAmount);
    const receiptDate = date || new Date().toISOString().split('T')[0];
    const finalPaymentStatus = paymentStatus === 'unpaid' ? 'unpaid' : 'paid';

    // Generate Verification QR Code
    const appUrl = process.env.APP_URL || 'https://eakdant-mandal.org';
    const qrVerificationPayload = JSON.stringify({
      mandal: MANDAL_CONFIG.name.mr,
      receiptNo,
      donor: donorName,
      amount: parsedAmount,
      date: receiptDate,
      mode: paymentMode || 'cash',
      status: finalPaymentStatus.toUpperCase(),
      collector: req.user!.name,
      verified: MANDAL_CONFIG.verifiedCode,
    });

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrVerificationPayload, {
        margin: 1,
        color: { dark: '#92400e', light: '#ffffff' },
        width: 180,
      });
    } catch (qrErr) {
      console.warn('QR Code generation failed, continuing:', qrErr);
    }

    const newPavti = await PavtiModel.create({
      receiptNo,
      donorName: donorName.trim(),
      donorPhone: donorPhone ? donorPhone.trim() : '',
      donorAddress: donorAddress ? donorAddress.trim() : '',
      amount: parsedAmount,
      amountInWords,
      amountInEnglishWords,
      paymentMode: paymentMode || 'cash',
      paymentStatus: finalPaymentStatus,
      transactionId: transactionId ? transactionId.trim() : '',
      donationCategory: donationCategory || 'उत्सव वर्गणी (Utsav Vargani)',
      note: note ? note.trim() : '',
      collectedBy: {
        userId: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        phone: req.user!.phone,
      },
      date: receiptDate,
      verified: true,
      status: 'active',
      qrCodeDataUrl,
    });

    await recordAudit({
      action: 'PAVTI_CREATED',
      entityType: 'pavti',
      entityId: newPavti._id?.toString() || newPavti.id || receiptNo,
      description: `${req.user!.name} created receipt ${receiptNo}.`,
      req,
      metadata: {
        receiptNo,
        donorName: newPavti.donorName,
        amount: newPavti.amount,
        paymentMode: newPavti.paymentMode,
        paymentStatus: newPavti.paymentStatus,
      },
    });

    return res.status(201).json({
      message: 'पावती यशस्वीरित्या तयार झाली (Receipt generated successfully)',
      pavti: newPavti,
      ...newPavti,
    });
  } catch (err: any) {
    console.error('Create pavti error:', err);
    return res.status(500).json({ error: 'Create receipt error: ' + err.message });
  }
});

// -------------------------------------------------------------
// POST /api/pavti/update-payment-status
// CRITICAL REQUIREMENT: Admin ONLY authority to change payment status (e.g. Paid -> Unpaid)
// -------------------------------------------------------------
router.post('/update-payment-status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { receiptNo, paymentStatus } = req.body;

    if (!receiptNo || !paymentStatus) {
      return res.status(400).json({ error: 'पावती क्रमांक आणि नवीन पेमेंट स्थिती आवश्यक आहे (Receipt No and Payment Status required).' });
    }

    // STRICT CHECK: Only Admin has authority to change payment status
    const actor = await UserModel.findById(req.user!.id);
    if (req.user!.role !== 'admin' && !actor?.canUpdateReceiptStatus) {
      return res.status(403).json({
        error: 'फक्त ॲडमिनला पावतीचे पेड/अनपेड स्टेटस बदलण्याचा अधिकार आहे (Only Admin has authority to change Pavti payment status between Paid and Unpaid).'
      });
    }

    if (!['paid', 'unpaid'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status (must be paid or unpaid)' });
    }

    const pavti = await PavtiModel.findOne({ receiptNo });
    if (!pavti) {
      return res.status(404).json({ error: 'पावती क्रमांक सापडला नाही (Receipt not found).' });
    }

    await PavtiModel.updateOne(
      { receiptNo },
      {
        $set: {
          paymentStatus,
          updatedAt: new Date().toISOString(),
        }
      }
    );

    await recordAudit({
      action: 'PAVTI_PAYMENT_STATUS_CHANGED',
      entityType: 'pavti',
      entityId: pavti._id?.toString() || pavti.id || receiptNo,
      description: `${req.user!.name} changed receipt ${receiptNo} from ${pavti.paymentStatus} to ${paymentStatus}.`,
      req,
      metadata: { receiptNo, previousStatus: pavti.paymentStatus, paymentStatus, amount: pavti.amount },
    });

    return res.json({
      message: `पावती क्र. ${receiptNo} ची स्थिती यशस्वीरित्या बदलून '${paymentStatus.toUpperCase()}' करण्यात आली आहे.`,
      receiptNo,
      paymentStatus,
    });
  } catch (err: any) {
    console.error('Update payment status error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pavti/list
// -------------------------------------------------------------
router.get('/list', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, paymentMode, paymentStatus, category, date, onlyMine, status } = req.query;

    let filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (paymentMode && paymentMode !== 'all') {
      filter.paymentMode = paymentMode;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }
    if (date) {
      filter.date = date;
    }
    if (onlyMine === 'true') {
      filter['collectedBy.userId'] = req.user!.id;
    }

    let list = await PavtiModel.find(filter);

    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter((p: any) =>
        p.donorName?.toLowerCase().includes(q) ||
        p.receiptNo?.toLowerCase().includes(q) ||
        p.donorPhone?.includes(q) ||
        p.donorAddress?.toLowerCase().includes(q) ||
        p.collectedBy?.name?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'all') {
      list = list.filter((p: any) => p.donationCategory === category);
    }

    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /api/pavti/receipt/:receiptNo
// -------------------------------------------------------------
router.get('/receipt/:receiptNo', async (req, res) => {
  try {
    const pavti = await PavtiModel.findOne({ receiptNo: req.params.receiptNo });
    if (!pavti) {
      return res.status(404).json({ error: 'पावती क्रमांक सापडला नाही (Receipt not found)' });
    }
    return res.json(pavti);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Record successful client-side receipt file exports.
router.post('/receipt-exported', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const receiptNo = String(req.body.receiptNo || '').trim();
    const format = String(req.body.format || '').toLowerCase();
    if (!receiptNo || !['png', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'A valid receipt number and export format are required.' });
    }

    const pavti = await PavtiModel.findOne({ receiptNo });
    if (!pavti) return res.status(404).json({ error: 'Receipt not found.' });

    await recordAudit({
      action: format === 'png' ? 'PAVTI_PNG_EXPORTED' : 'PAVTI_PDF_EXPORTED',
      entityType: 'pavti',
      entityId: pavti._id?.toString() || pavti.id || receiptNo,
      description: `${req.user!.name} downloaded receipt ${receiptNo} as ${format.toUpperCase()}.`,
      req,
      metadata: { receiptNo, format, donorName: pavti.donorName, amount: pavti.amount },
    });

    return res.json({ recorded: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to record receipt export.' });
  }
});

// -------------------------------------------------------------
// POST /api/pavti/cancel
// -------------------------------------------------------------
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { receiptNo, reason } = req.body;
    if (!receiptNo) {
      return res.status(400).json({ error: 'Receipt number required' });
    }

    const pavti = await PavtiModel.findOne({ receiptNo });
    if (!pavti) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Only Admin or the creator can cancel
    if (req.user!.role !== 'admin' && pavti.collectedBy?.userId !== req.user!.id) {
      return res.status(403).json({ error: 'फक्त ॲडमिन किंवा पावती फाडणारा कार्यकर्ता पावती रद्द करू शकतो.' });
    }

    await PavtiModel.updateOne(
      { receiptNo },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: reason || 'रद्द करण्यात आली (Cancelled by user/admin)',
          cancelledBy: req.user!.name,
        }
      }
    );

    await recordAudit({
      action: 'PAVTI_CANCELLED',
      entityType: 'pavti',
      entityId: pavti._id?.toString() || pavti.id || receiptNo,
      description: `${req.user!.name} cancelled receipt ${receiptNo}.`,
      req,
      metadata: {
        receiptNo,
        donorName: pavti.donorName,
        amount: pavti.amount,
        reason: reason || 'Cancelled by user/admin',
      },
    });

    return res.json({ message: 'पावती रद्द करण्यात आली आहे (Receipt cancelled)', receiptNo });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
