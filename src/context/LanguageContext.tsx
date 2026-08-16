import React, { createContext, useContext, useState, useEffect } from 'react';
import { MANDAL_CONFIG } from '../../shared/mandalConfig';

export type Language = 'mr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  getWordsForAmount: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  mr: {
    // Brand & Header
    mandal_name: MANDAL_CONFIG.name.mr,
    mandal_sub: MANDAL_CONFIG.village.mr,
    mandal_established: '॥ श्री गणेशाय नमः ॥',
    mandal_slogan: '॥ गणपती बाप्पा मोरया ॥',
    mandal_tagline: 'डिजिटल पावती व हिशोब व्यवस्थापन',
    blessing_footer: 'आपल्या सढळ हाताने केलेल्या सहकार्याबद्दल मंडळ आपले आभारी आहे!',
    ganpati_bappa_morya: '॥ गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ॥',

    // Nav Tabs
    tab_calculations: 'कॅल्क्युलेशन व हिशोब',
    tab_new_pavti: '+ नवीन पावती',
    tab_receipts: 'पावत्या यादी व शोध',
    tab_expenses: 'मंडळ खर्च (Expenses)',
    tab_users: 'कार्यकर्ते व्यवस्थापन',
    tab_db_status: 'MongoDB स्थिती',

    // User / Auth
    role_admin: '👑 ॲडमिन (Admin)',
    role_user: '🚩 कार्यकर्ता (Volunteer)',
    active_session_badge: 'सिंगल डिव्हाइस सुरक्षित (Active)',
    logout_btn: 'लॉगआउट (Logout)',
    logout_confirm_title: 'खात्यातून बाहेर पडायचे आहे का?',
    logout_confirm_desc: 'तुम्ही या डिव्हाइसवरून सुरक्षितपणे लॉगआउट व्हाल.',
    login_title: `${MANDAL_CONFIG.name.mr} लॉगिन`,
    login_phone_label: 'नोंदणीकृत मोबाईल नंबर',
    login_pass_label: 'पासवर्ड',
    login_btn: 'लॉगिन करा',
    single_device_note: 'सुरक्षितता: एका वेळी एकाच मोबाईल/लॅपटॉपवर लॉगिन राहील. इतर डिव्हाइसवर लॉगिन केल्यास जुने डिव्हाइस आपोआप लॉगआउट होईल.',

    // Common Actions
    action_refresh: 'रिफ्रेश',
    action_cancel: 'रद्द करा',
    action_save: 'जतन करा',
    action_submit: 'दाखल करा',
    action_close: 'बंद करा',
    action_view_print: 'पाहा / प्रिंट',
    action_print: 'प्रिंट (Print)',
    action_share_wp: 'WhatsApp शेअर',
    action_copy_msg: 'मेसेज कॉपी करा',
    action_copied: 'कॉपी झाले! ✓',
    action_search: 'शोध...',
    action_all: 'सर्व',
    action_filter: 'फिल्टर',
    action_export: 'एक्स्पोर्ट',
    action_change_status: 'स्थिती बदला (Status)',
    action_mark_paid: 'पेड करा (Mark Paid)',
    action_mark_unpaid: 'अनपेड करा (Mark Unpaid)',

    // Statuses
    status_active: 'सक्रिय (Active)',
    status_cancelled: 'रद्द (Cancelled)',
    status_paid: 'जमा (PAID)',
    status_unpaid: 'बाकी / प्रलंबित (UNPAID)',
    status_paid_desc: 'रक्कम रोख/युपीआय द्वारे जमा झाली आहे',
    status_unpaid_desc: 'रक्कम येणे बाकी / प्रलंबित आहे',

    // Calculations Dashboard
    calc_title: 'थेट कॅल्क्युलेशन व मंडळ हिशोब',
    calc_subtitle: 'ॲडमिन व कार्यकर्त्यांनी फाडलेल्या सर्व पावत्यांचे रिअल-टाइम आर्थिक विश्लेषण',
    stat_total_collection: 'एकूण देणगी संकलन',
    stat_paid_collection: 'रोख/जमा देणगी (Paid)',
    stat_unpaid_collection: 'बाकी/प्रलंबित देणगी (Unpaid)',
    stat_today_collection: 'आजचे देणगी संकलन',
    stat_total_receipts: 'एकूण फाडलेल्या पावत्या',
    stat_total_expenses: 'मंडळाचा एकूण खर्च',
    stat_net_balance: 'मंडळाकडे शिल्लक रक्कम',
    stat_my_contribution: 'माझे वैयक्तिक योगदान',
    stat_share_percentage: 'मंडळ संकलनात वाटा',
    leaderboard_title: '🏆 कार्यकर्ते संकलन यादी व हिशोब (Leaderboard)',
    leaderboard_sub: 'प्रत्येक कार्यकर्त्याने गोळा केलेली रक्कम व हिशोब',
    payment_modes_title: 'पेमेंट प्रकारानुसार संकलन (Payment Modes)',
    categories_title: 'देणगी प्रकारानुसार संकलन (Categories)',

    // Pavti Form
    form_title: 'नवीन पावती फाडा (Create Donation Receipt)',
    form_desc: 'पावती पूर्ण होताच सर्व कॅल्क्युलेशन व हिशोब तात्काळ सर्व ॲडमिन आणि कार्यकर्त्यांच्या स्क्रीनवर अपडेट होईल.',
    form_donor_name: 'श्री / सौ. दात्याचे पूर्ण नाव (Donor Full Name) *',
    form_donor_name_ph: 'उदा. श्री. विजय शामराव मोरे / सौ. सुनिता पाटील',
    form_amount: 'वर्गणी / देणगी रक्कम (Amount in ₹) *',
    form_amount_ph: 'रक्कम प्रविष्ट करा (उदा. 501, 1001, 5001)',
    form_quick_amounts: 'त्वरित रक्कम निवडा:',
    form_phone: 'मोबाईल नंबर (WhatsApp Number)',
    form_phone_ph: 'उदा. 9822XXXXXX (10 अंकी नंबर)',
    form_phone_hint: 'पावती थेट WhatsApp वर पाठवण्यासाठी',
    form_address: 'पत्ता / गल्ली (Address / Galli)',
    form_custom_address_ph: 'पूर्ण पत्ता प्रविष्ट करा',
    form_payment_mode: 'पेमेंट प्रकार (Payment Mode) *',
    form_payment_status: 'पेमेंट स्थिती (Payment Status) *',
    form_category: 'देणगी प्रकार (Donation Category)',
    form_date: 'पावती दिनांक (Receipt Date)',
    form_note: 'टीप / शेरा (Note / Remarks)',
    form_note_ph: 'उदा. वार्षिक देणगी / विशेष पूजा संकल्प',
    form_submit_btn: 'पावती तयार करा (Generate Pavti)',
    form_submitting: 'पावती तयार होत आहे...',
    form_collector_label: 'पावती देणारा:',

    // Payment Modes
    mode_cash: '💵 रोख (Cash)',
    mode_upi: '📱 युपीआय (UPI / QR)',
    mode_online: '🏦 बँक ट्रान्सफर (Bank)',
    mode_cheque: '📑 धनादेश (Cheque)',

    // Receipt Slip
    slip_official_title: 'अधिकृत डिजिटल देणगी पावती (Official Receipt)',
    slip_receipt_no: 'पावती क्र:',
    slip_date: 'दिनांक:',
    slip_donor_name: 'श्री / सौ. (दात्याचे नाव):',
    slip_address: 'पत्ता / गल्ली:',
    slip_phone: 'मोबाईल क्र:',
    slip_category: 'देणगी प्रकार:',
    slip_payment_mode: 'पेमेंट प्रकार:',
    slip_payment_status: 'पेमेंट स्थिती:',
    slip_amount_words: 'अक्षरी रक्कम (In Words):',
    slip_amount_badge: 'रक्कम ₹:',
    slip_collector: 'पावती देणारा:',
    slip_verified_badge: `अधिकृत पावती (${MANDAL_CONFIG.verifiedCode})`,
    slip_scan_note: 'स्कॅन करून पडताळणी करा',
    slip_mandal_stamp: `${MANDAL_CONFIG.name.mr} (अधिकृत)`,

    // Receipts List
    list_title: 'सर्व पावत्या यादी व शोध (All Donation Receipts)',
    list_subtitle: 'दात्याचे नाव, पावती नंबर, मोबाईल किंवा कार्यकर्त्यानुसार शोधा',
    list_search_ph: 'दात्याचे नाव, पावती क्र., मोबाईल, गल्ली किंवा कार्यकर्ता...',
    list_all_modes: 'सर्व पेमेंट प्रकार (All Modes)',
    list_all_status: 'सर्व स्थिती (All Status)',
    list_my_only: 'माझ्या पावत्या (My Only)',
    list_all_records: 'सर्व कार्यकर्त्यांच्या पावत्या',
    list_total_found: 'एकूण सापडलेल्या पावत्या:',
    list_filtered_total: 'एकूण रक्कम:',
    list_col_receipt_no: 'पावती क्र.',
    list_col_donor: 'दात्याचे नाव',
    list_col_amount: 'रक्कम (₹)',
    list_col_mode: 'पेमेंट प्रकार',
    list_col_status: 'स्थिती (Status)',
    list_col_address: 'पत्ता / गल्ली',
    list_col_collector: 'पावती देणारा',
    list_col_date: 'दिनांक',
    list_col_actions: 'कृती (Actions)',
    list_no_records: 'कोणतीही पावती सापडली नाही.',
    list_admin_only_change_alert: 'फक्त ॲडमिनला पावतीचे पेड/अनपेड स्टेटस बदलण्याचा अधिकार आहे.',

    // Expense Manager
    exp_title: 'मंडळ खर्च व्यवस्थापन (Expenses)',
    exp_subtitle: 'गणेशोत्सवातील विविध खर्च, बिले व हिशोब नोंदणी',
    exp_btn_new: '+ नवीन खर्च नोंदवा',
    exp_total_expenses: 'एकूण झालेला खर्च',
    exp_form_title: 'खर्चाचे शीर्षक / कारण *',
    exp_form_amount: 'खर्चाची रक्कम (₹) *',
    exp_form_paid_to: 'रक्कम कोणाला दिली (Paid To)',
    exp_form_category: 'खर्च प्रकार (Category)',

    // User Manager (Admin)
    usr_title: 'कार्यकर्ते व वापरकर्ते व्यवस्थापन',
    usr_subtitle: 'मंडळाचे अधिकृत कार्यकर्ते, ॲडमिन अधिकार व डिव्हाइस सुरक्षा',
    usr_btn_new: '+ नवीन कार्यकर्ता जोडा',
    usr_active_count: 'सक्रिय कार्यकर्ते',
    usr_device_management: 'सिंगल डिव्हाइस नियंत्रण',

    // DB Status
    db_title: 'डेटाबेस व सिस्टम स्थिती (Database Status)',
    db_subtitle: 'MongoDB कनेक्टिव्हिटी, क्लाउड डेटा बॅकअप व सुरक्षा',
    db_connected: 'MongoDB यशस्वीरित्या कनेक्टेड',
    db_local: 'लोकल JSON बॅकअप सक्रिय',
  },

  en: {
    // Brand & Header
    mandal_name: MANDAL_CONFIG.name.en,
    mandal_sub: MANDAL_CONFIG.village.en,
    mandal_established: MANDAL_CONFIG.village.mr,
    mandal_slogan: '॥ Shree Ganeshay Namah ॥ ॥ Ganpati Bappa Morya ॥',
    mandal_tagline: 'Digital Pavti & Finance Management',
    blessing_footer: 'The Mandal expresses heartfelt gratitude for your generous support and contribution!',
    ganpati_bappa_morya: '॥ Ganpati Bappa Morya, Mangalmurti Morya ॥',

    // Nav Tabs
    tab_calculations: 'Calculations & Accounts',
    tab_new_pavti: '+ New Receipt',
    tab_receipts: 'Receipts List & Search',
    tab_expenses: 'Mandal Expenses',
    tab_users: 'Volunteer Management',
    tab_db_status: 'MongoDB Status',

    // User / Auth
    role_admin: '👑 Admin',
    role_user: '🚩 Volunteer',
    active_session_badge: 'Single Device Secure (Active)',
    logout_btn: 'Logout',
    logout_confirm_title: 'Do you want to log out?',
    logout_confirm_desc: 'You will be securely logged out from this device.',
    login_title: `${MANDAL_CONFIG.name.en} Login`,
    login_phone_label: 'Registered Mobile Number',
    login_pass_label: 'Password',
    login_btn: 'Login Now',
    single_device_note: 'Security: Only one active session per account. Logging in on another device will automatically log out previous devices.',

    // Common Actions
    action_refresh: 'Refresh',
    action_cancel: 'Cancel',
    action_save: 'Save',
    action_submit: 'Submit',
    action_close: 'Close',
    action_view_print: 'View / Print',
    action_print: 'Print Receipt',
    action_share_wp: 'Share on WhatsApp',
    action_copy_msg: 'Copy Message',
    action_copied: 'Copied! ✓',
    action_search: 'Search...',
    action_all: 'All',
    action_filter: 'Filter',
    action_export: 'Export',
    action_change_status: 'Change Status',
    action_mark_paid: 'Mark as Paid',
    action_mark_unpaid: 'Mark as Unpaid',

    // Statuses
    status_active: 'Active',
    status_cancelled: 'Cancelled',
    status_paid: 'PAID (Received)',
    status_unpaid: 'UNPAID (Pending/Pledged)',
    status_paid_desc: 'Amount successfully received via Cash/UPI',
    status_unpaid_desc: 'Payment is pledged or pending collection',

    // Calculations Dashboard
    calc_title: 'Live Calculations & Financial Analytics',
    calc_subtitle: 'Real-time accounting dashboard across all receipts created by Admins and Volunteers',
    stat_total_collection: 'Total Donation Collection',
    stat_paid_collection: 'Paid / Received Collection',
    stat_unpaid_collection: 'Pending / Unpaid Pledges',
    stat_today_collection: "Today's Collection",
    stat_total_receipts: 'Total Receipts Generated',
    stat_total_expenses: 'Total Mandal Expenses',
    stat_net_balance: 'Net Balance in Hand',
    stat_my_contribution: 'My Personal Contribution',
    stat_share_percentage: 'Share of Mandal Total',
    leaderboard_title: '🏆 Volunteer Collection & Accounts Leaderboard',
    leaderboard_sub: 'Total collection and breakdown by each volunteer & admin',
    payment_modes_title: 'Collection by Payment Mode',
    categories_title: 'Collection by Donation Category',

    // Pavti Form
    form_title: 'Create Donation Receipt (New Pavti)',
    form_desc: 'Upon creation, all calculations and financial metrics instantly synchronize across all devices.',
    form_donor_name: 'Donor Full Name (Shree / Smt.) *',
    form_donor_name_ph: 'e.g. Mr. Vijay Shamrao More / Smt. Sunita Patil',
    form_amount: 'Donation Amount (in ₹) *',
    form_amount_ph: 'Enter amount (e.g. 501, 1001, 5001)',
    form_quick_amounts: 'Quick Amount Presets:',
    form_phone: 'WhatsApp / Mobile Number',
    form_phone_ph: 'e.g. 9822XXXXXX (10-digit number)',
    form_phone_hint: 'To share official receipt directly on WhatsApp',
    form_address: 'Address / Street (Galli)',
    form_custom_address_ph: 'Enter custom address (e.g. Uchgaon, Kolhapur)',
    form_payment_mode: 'Payment Mode *',
    form_payment_status: 'Payment Status *',
    form_category: 'Donation Category',
    form_date: 'Receipt Date',
    form_note: 'Note / Remarks',
    form_note_ph: 'e.g. Annual contribution / Special Pooja Seva',
    form_submit_btn: 'Generate Pavti Slip',
    form_submitting: 'Generating Receipt...',
    form_collector_label: 'Issued By:',

    // Payment Modes
    mode_cash: '💵 Cash',
    mode_upi: '📱 UPI / QR',
    mode_online: '🏦 Bank Transfer',
    mode_cheque: '📑 Cheque',

    // Receipt Slip
    slip_official_title: 'Official Digital Donation Receipt',
    slip_receipt_no: 'Receipt No:',
    slip_date: 'Date:',
    slip_donor_name: 'Received with thanks from:',
    slip_address: 'Address / Street:',
    slip_phone: 'Mobile No:',
    slip_category: 'Donation Purpose:',
    slip_payment_mode: 'Payment Mode:',
    slip_payment_status: 'Payment Status:',
    slip_amount_words: 'Amount in Words:',
    slip_amount_badge: 'Amount ₹:',
    slip_collector: 'Issued By:',
    slip_verified_badge: `Official Receipt (${MANDAL_CONFIG.verifiedCode})`,
    slip_scan_note: 'Scan QR to verify authenticity',
    slip_mandal_stamp: `${MANDAL_CONFIG.name.en} (Authorized)`,

    // Receipts List
    list_title: 'All Donation Receipts & Search',
    list_subtitle: 'Search by donor name, receipt number, phone, street, or volunteer',
    list_search_ph: 'Search donor name, receipt no., phone, address or collector...',
    list_all_modes: 'All Payment Modes',
    list_all_status: 'All Statuses',
    list_my_only: 'My Receipts Only',
    list_all_records: 'All Volunteers Receipts',
    list_total_found: 'Total Receipts Found:',
    list_filtered_total: 'Total Amount:',
    list_col_receipt_no: 'Receipt No.',
    list_col_donor: 'Donor Name',
    list_col_amount: 'Amount (₹)',
    list_col_mode: 'Mode',
    list_col_status: 'Status',
    list_col_address: 'Address',
    list_col_collector: 'Issued By',
    list_col_date: 'Date',
    list_col_actions: 'Actions',
    list_no_records: 'No receipts found matching your criteria.',
    list_admin_only_change_alert: 'Only Admin has the authority to change Pavti payment status between Paid and Unpaid.',

    // Expense Manager
    exp_title: 'Mandal Expense Management',
    exp_subtitle: 'Track festival purchases, decorator fees, sound, prasad & utilities',
    exp_btn_new: '+ Record New Expense',
    exp_total_expenses: 'Total Mandal Expenses',
    exp_form_title: 'Expense Title / Purpose *',
    exp_form_amount: 'Expense Amount (₹) *',
    exp_form_paid_to: 'Paid To (Vendor / Recipient)',
    exp_form_category: 'Expense Category',

    // User Manager (Admin)
    usr_title: 'Volunteer & User Management',
    usr_subtitle: 'Authorized volunteers, admin controls, and single-device security',
    usr_btn_new: '+ Add New Volunteer',
    usr_active_count: 'Active Volunteers',
    usr_device_management: 'Single Device Session Control',

    // DB Status
    db_title: 'Database & System Status',
    db_subtitle: 'MongoDB connection health, automated sync and backups',
    db_connected: 'MongoDB Connected Successfully',
    db_local: 'Local JSON Backup Active',
  },
};

// Helper: Convert number to Marathi words
export function toMarathiWords(amount: number): string {
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
export function toEnglishWords(amount: number): string {
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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rajmudra_lang');
    return (saved === 'en' || saved === 'mr') ? saved : 'mr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rajmudra_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'mr' ? 'en' : 'mr';
    setLanguage(nextLang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['mr'][key] || key;
  };

  const getWordsForAmount = (amount: number): string => {
    return language === 'en' ? toEnglishWords(amount) : toMarathiWords(amount);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getWordsForAmount,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
