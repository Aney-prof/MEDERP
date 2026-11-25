import { Medicine, Patient, Supplier, ScheduleH1RegisterEntry, SaleInvoice } from '../types/pharmacy';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Sun Pharma Distribution Hub',
    contactPerson: 'Rajesh Varma',
    phone: '+91 98201 44521',
    email: 'orders@sunpharma-hub.com',
    address: 'Gala 14, Apex Pharma Estate, Andheri East, Mumbai - 400069',
    gstin: '27AABCS1429B1Z2',
    dlNumber: 'MH-MZ4-204918 / 205919',
    outstandingBalance: 14250.00
  },
  {
    id: 'sup-2',
    name: 'Cipla Meditech Agencies',
    contactPerson: 'Kunal Singhania',
    phone: '+91 94120 77812',
    email: 'kunal@ciplameditech.in',
    address: 'Plot 88, Okhla Phase 3, New Delhi - 110020',
    gstin: '07AAACC2211C1ZX',
    dlNumber: 'DL-SW1-102947 / 102948',
    outstandingBalance: 8400.00
  },
  {
    id: 'sup-3',
    name: 'Abbott Healthcare Depot',
    contactPerson: 'Priyanka Sen',
    phone: '+91 97410 88923',
    email: 'depot.blr@abbott-supply.com',
    address: 'Peenya Industrial Area, Bengaluru - 560058',
    gstin: '29AAACA4480P1ZT',
    dlNumber: 'KA-B1-330192 / 330193',
    outstandingBalance: 0.00
  },
  {
    id: 'sup-4',
    name: 'Micro Labs & Generic Consortium',
    contactPerson: 'Nitin Deshmukh',
    phone: '+91 98860 33119',
    email: 'distributors@microlabs.co.in',
    address: 'Survey 22, Bommasandra, Bengaluru - 560099',
    gstin: '29AAACM6721K1ZW',
    dlNumber: 'KA-B2-441092 / 441093',
    outstandingBalance: 21800.00
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    brandName: 'Dolo 650',
    genericComposition: 'Paracetamol 650 mg',
    manufacturer: 'Micro Labs Ltd',
    hsnCode: '30049060',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '15 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'OTC',
    batches: [
      {
        id: 'b-101',
        batchNumber: 'DL65-24J12',
        mfgDate: '2025-10',
        expiryDate: '2027-09',
        mrp: 34.00,
        purchaseRate: 23.50,
        saleRate: 30.50,
        wholesaleRate: 26.00,
        quantity: 180,
        reorderLevel: 50,
        location: 'Rack A-01',
        supplierId: 'sup-4'
      },
      {
        id: 'b-102',
        batchNumber: 'DL65-23F08',
        mfgDate: '2024-06',
        expiryDate: '2026-11', // Expiring in next few weeks! (Near Expiry)
        mrp: 32.50,
        purchaseRate: 22.00,
        saleRate: 29.00,
        wholesaleRate: 25.00,
        quantity: 24,
        reorderLevel: 50,
        location: 'Rack A-01 (Front)',
        supplierId: 'sup-4'
      }
    ]
  },
  {
    id: 'med-2',
    brandName: 'Calpol 650',
    genericComposition: 'Paracetamol 650 mg',
    manufacturer: 'GlaxoSmithKline (GSK)',
    hsnCode: '30049060',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '15 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'OTC',
    batches: [
      {
        id: 'b-103',
        batchNumber: 'GSK-CP-902',
        mfgDate: '2025-08',
        expiryDate: '2027-07',
        mrp: 35.50,
        purchaseRate: 24.80,
        saleRate: 32.00,
        wholesaleRate: 27.50,
        quantity: 95,
        reorderLevel: 30,
        location: 'Rack A-02',
        supplierId: 'sup-2'
      }
    ]
  },
  {
    id: 'med-3',
    brandName: 'Crocin 650 Advance',
    genericComposition: 'Paracetamol 650 mg (Fast Release)',
    manufacturer: 'Haleon / GSK',
    hsnCode: '30049060',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '15 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'OTC',
    batches: [
      {
        id: 'b-104',
        batchNumber: 'CR-65-88A',
        mfgDate: '2025-11',
        expiryDate: '2027-10',
        mrp: 38.00,
        purchaseRate: 26.00,
        saleRate: 34.00,
        wholesaleRate: 29.00,
        quantity: 65,
        reorderLevel: 25,
        location: 'Rack A-02',
        supplierId: 'sup-2'
      }
    ]
  },
  {
    id: 'med-4',
    brandName: 'Augmentin 625 Duo',
    genericComposition: 'Amoxicillin 500 mg + Clavulanic Acid 125 mg',
    manufacturer: 'GlaxoSmithKline (GSK)',
    hsnCode: '30041010',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '10 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H1',
    batches: [
      {
        id: 'b-105',
        batchNumber: 'AUG-24K09',
        mfgDate: '2025-09',
        expiryDate: '2027-02',
        mrp: 224.50,
        purchaseRate: 165.00,
        saleRate: 202.00,
        wholesaleRate: 180.00,
        quantity: 85,
        reorderLevel: 20,
        location: 'Cabinet H1-01',
        supplierId: 'sup-2'
      },
      {
        id: 'b-106',
        batchNumber: 'AUG-23M02',
        mfgDate: '2024-03',
        expiryDate: '2026-10', // Expiring this month!
        mrp: 215.00,
        purchaseRate: 158.00,
        saleRate: 193.00,
        wholesaleRate: 172.00,
        quantity: 8,
        reorderLevel: 20,
        location: 'Cabinet H1-01 (Dump Box)',
        supplierId: 'sup-2'
      }
    ]
  },
  {
    id: 'med-5',
    brandName: 'Clavam 625',
    genericComposition: 'Amoxicillin 500 mg + Clavulanic Acid 125 mg',
    manufacturer: 'Alkem Laboratories',
    hsnCode: '30041010',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '10 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H1',
    batches: [
      {
        id: 'b-107',
        batchNumber: 'CLV-9921D',
        mfgDate: '2025-07',
        expiryDate: '2027-06',
        mrp: 218.00,
        purchaseRate: 154.00,
        saleRate: 196.00,
        wholesaleRate: 175.00,
        quantity: 110,
        reorderLevel: 30,
        location: 'Cabinet H1-02',
        supplierId: 'sup-1'
      }
    ]
  },
  {
    id: 'med-6',
    brandName: 'Pan-D Capsule',
    genericComposition: 'Pantoprazole 40 mg + Domperidone 30 mg SR',
    manufacturer: 'Alkem Laboratories',
    hsnCode: '30049099',
    gstPercent: 12,
    dosageForm: 'Capsule',
    packSize: '15 Caps / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H',
    batches: [
      {
        id: 'b-108',
        batchNumber: 'PAND-8831',
        mfgDate: '2025-11',
        expiryDate: '2027-10',
        mrp: 235.00,
        purchaseRate: 160.00,
        saleRate: 210.00,
        wholesaleRate: 185.00,
        quantity: 140,
        reorderLevel: 40,
        location: 'Rack B-04',
        supplierId: 'sup-1'
      }
    ]
  },
  {
    id: 'med-7',
    brandName: 'Telma 40',
    genericComposition: 'Telmisartan 40 mg',
    manufacturer: 'Glenmark Pharmaceuticals',
    hsnCode: '30049082',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '30 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H',
    batches: [
      {
        id: 'b-109',
        batchNumber: 'TEL40-552',
        mfgDate: '2025-06',
        expiryDate: '2027-05',
        mrp: 260.00,
        purchaseRate: 182.00,
        saleRate: 234.00,
        wholesaleRate: 205.00,
        quantity: 90,
        reorderLevel: 25,
        location: 'Rack C-01 (Cardio)',
        supplierId: 'sup-1'
      }
    ]
  },
  {
    id: 'med-8',
    brandName: 'Glycomet GP 2',
    genericComposition: 'Metformin 500 mg SR + Glimepiride 2 mg',
    manufacturer: 'USV Private Limited',
    hsnCode: '30049085',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '15 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H',
    batches: [
      {
        id: 'b-110',
        batchNumber: 'GGP2-1089',
        mfgDate: '2025-04',
        expiryDate: '2027-03',
        mrp: 178.00,
        purchaseRate: 122.00,
        saleRate: 158.00,
        wholesaleRate: 139.00,
        quantity: 75,
        reorderLevel: 30,
        location: 'Rack C-03 (Diabetic)',
        supplierId: 'sup-1'
      }
    ]
  },
  {
    id: 'med-9',
    brandName: 'Azithral 500',
    genericComposition: 'Azithromycin 500 mg',
    manufacturer: 'Alembic Pharmaceuticals',
    hsnCode: '30042010',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '5 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H1',
    batches: [
      {
        id: 'b-111',
        batchNumber: 'AZ5-3312',
        mfgDate: '2025-08',
        expiryDate: '2027-07',
        mrp: 132.00,
        purchaseRate: 91.00,
        saleRate: 118.00,
        wholesaleRate: 102.00,
        quantity: 55,
        reorderLevel: 20,
        location: 'Cabinet H1-03',
        supplierId: 'sup-3'
      }
    ]
  },
  {
    id: 'med-10',
    brandName: 'Lantus SoloStar Pen (100 IU/ml)',
    genericComposition: 'Insulin Glargine 100 units/ml',
    manufacturer: 'Sanofi India Ltd',
    hsnCode: '30043110',
    gstPercent: 5,
    dosageForm: 'Injection',
    packSize: '1 Cartridge Pen (3 ml)',
    category: 'Cold Chain',
    schedule: 'Schedule H',
    temperatureRequirement: '2°C - 8°C (Do Not Freeze)',
    batches: [
      {
        id: 'b-112',
        batchNumber: 'LNT-87701',
        mfgDate: '2025-05',
        expiryDate: '2026-12', // Near Expiry in 2 months
        mrp: 985.00,
        purchaseRate: 780.00,
        saleRate: 890.00,
        wholesaleRate: 830.00,
        quantity: 12,
        reorderLevel: 8,
        location: 'Cold Storage Fridge-A',
        supplierId: 'sup-3'
      }
    ]
  },
  {
    id: 'med-11',
    brandName: 'Asthalin Inhaler (100 mcg)',
    genericComposition: 'Salbutamol 100 mcg / actuation',
    manufacturer: 'Cipla Ltd',
    hsnCode: '30049089',
    gstPercent: 12,
    dosageForm: 'Inhaler',
    packSize: '200 Metered Doses',
    category: 'Allopathic',
    schedule: 'Schedule H',
    batches: [
      {
        id: 'b-113',
        batchNumber: 'ASTH-4412',
        mfgDate: '2025-02',
        expiryDate: '2027-01',
        mrp: 168.00,
        purchaseRate: 118.00,
        saleRate: 151.00,
        wholesaleRate: 132.00,
        quantity: 42,
        reorderLevel: 15,
        location: 'Rack D-01',
        supplierId: 'sup-2'
      }
    ]
  },
  {
    id: 'med-12',
    brandName: 'Shelcal 500',
    genericComposition: 'Calcium 500 mg + Vitamin D3 250 IU',
    manufacturer: 'Torrent Pharmaceuticals',
    hsnCode: '30045090',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '15 Tabs / Strip',
    category: 'Nutraceutical',
    schedule: 'OTC',
    batches: [
      {
        id: 'b-114',
        batchNumber: 'SHL-9110B',
        mfgDate: '2025-01',
        expiryDate: '2026-09', // EXPIRED last month (for testing return dump workflow)
        mrp: 142.00,
        purchaseRate: 98.00,
        saleRate: 128.00,
        wholesaleRate: 110.00,
        quantity: 14,
        reorderLevel: 25,
        location: 'Quarantine / Return Bin',
        supplierId: 'sup-1',
        isDamaged: true
      },
      {
        id: 'b-115',
        batchNumber: 'SHL-2501K',
        mfgDate: '2025-10',
        expiryDate: '2027-09',
        mrp: 145.00,
        purchaseRate: 100.00,
        saleRate: 130.00,
        wholesaleRate: 112.00,
        quantity: 120,
        reorderLevel: 25,
        location: 'Rack B-01',
        supplierId: 'sup-1'
      }
    ]
  },
  {
    id: 'med-13',
    brandName: 'Montair LC',
    genericComposition: 'Levocetirizine 5 mg + Montelukast 10 mg',
    manufacturer: 'Cipla Ltd',
    hsnCode: '30049099',
    gstPercent: 12,
    dosageForm: 'Tablet',
    packSize: '10 Tabs / Strip',
    category: 'Allopathic',
    schedule: 'Schedule H',
    batches: [
      {
        id: 'b-116',
        batchNumber: 'MLC-8092',
        mfgDate: '2025-06',
        expiryDate: '2027-05',
        mrp: 215.00,
        purchaseRate: 148.00,
        saleRate: 192.00,
        wholesaleRate: 169.00,
        quantity: 6, // Low Stock Alert Trigger!
        reorderLevel: 25,
        location: 'Rack D-03',
        supplierId: 'sup-2'
      }
    ]
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    uhid: 'SH-2026-0104',
    name: 'Suresh Chandra Sharma',
    phone: '+91 98112 34567',
    email: 'scsharma49@gmail.com',
    age: 62,
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'B-402, Shivalik Residency, Sector 14, Noida, UP',
    knownAllergies: ['Sulfa drugs', 'Aspirin'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    creditBalance: 1240.00, // Due balance
    creditLimit: 5000.00,
    totalPurchases: 18450.00,
    lastVisit: '2026-10-14',
    prescriptions: [
      {
        id: 'rx-201',
        date: '2026-10-01',
        doctorName: 'Dr. V. K. Aggarwal, MD (Med)',
        clinicHospital: 'Fortis Heart & Endocrine Institute',
        doctorRegNo: 'DMC-24891',
        diagnosis: 'Essential Hypertension, Glycated HbA1c 7.8%',
        nextRefillDate: '2026-10-31', // REFILL DUE IN 4 DAYS!
        medicines: [
          { medicineName: 'Telma 40', dosage: '1 Tab - Morning (08:00 AM) after breakfast', durationDays: 30, refillRemaining: 3 },
          { medicineName: 'Glycomet GP 2', dosage: '1 Tab - Night (08:30 PM) after dinner', durationDays: 30, refillRemaining: 3 },
          { medicineName: 'Pan-D Capsule', dosage: '1 Cap - Morning empty stomach', durationDays: 15, refillRemaining: 1 }
        ]
      }
    ]
  },
  {
    id: 'pat-2',
    uhid: 'SH-2026-0188',
    name: 'Meenakshi Iyer',
    phone: '+91 98451 90812',
    email: 'meenakshi.iyer@outlook.com',
    age: 48,
    gender: 'Female',
    bloodGroup: 'O+',
    address: 'Flat 12, Green Glen Layout, Bellandur, Bengaluru',
    knownAllergies: ['Penicillin (Severe Urticaria)'],
    chronicConditions: ['Bronchial Asthma', 'Osteopenia'],
    creditBalance: 0.00,
    creditLimit: 10000.00,
    totalPurchases: 12900.00,
    lastVisit: '2026-10-22',
    prescriptions: [
      {
        id: 'rx-202',
        date: '2026-09-25',
        doctorName: 'Dr. Radhika Srinivasan, DNB (Pulm)',
        clinicHospital: 'Apollo Chest & Allergy Clinic',
        doctorRegNo: 'KMC-89201',
        diagnosis: 'Moderate Persistent Asthma, Nocturnal wheezing',
        nextRefillDate: '2026-10-25', // ALREADY OVERDUE BY 2 DAYS!
        medicines: [
          { medicineName: 'Asthalin Inhaler (100 mcg)', dosage: '2 Puffs SOS for breathlessness', durationDays: 60, refillRemaining: 2 },
          { medicineName: 'Montair LC', dosage: '1 Tab at bedtime', durationDays: 30, refillRemaining: 1 },
          { medicineName: 'Shelcal 500', dosage: '1 Tab after lunch daily', durationDays: 30, refillRemaining: 2 }
        ]
      }
    ]
  },
  {
    id: 'pat-3',
    uhid: 'SH-2026-0245',
    name: 'Rameshwar Lal Patel',
    phone: '+91 97230 44589',
    age: 71,
    gender: 'Male',
    bloodGroup: 'A+',
    address: 'Shop 4, GIDC Colony, Makarpura, Vadodara, Gujarat',
    knownAllergies: [],
    chronicConditions: ['Type 1/Insulin Dependent Diabetes', 'Ischemic Heart Disease'],
    creditBalance: 3200.00,
    creditLimit: 7500.00,
    totalPurchases: 34200.00,
    lastVisit: '2026-10-18',
    prescriptions: [
      {
        id: 'rx-203',
        date: '2026-10-05',
        doctorName: 'Dr. Hitesh Shah, DM (Cardiology)',
        clinicHospital: 'Sterling Hospital',
        doctorRegNo: 'GMC-55102',
        diagnosis: 'Post-CABG Follow up & Glycemic control',
        nextRefillDate: '2026-11-04',
        medicines: [
          { medicineName: 'Lantus SoloStar Pen (100 IU/ml)', dosage: '18 Units Sub-Q at 10 PM daily', durationDays: 30, refillRemaining: 5 },
          { medicineName: 'Telma 40', dosage: '1 Tab daily morning', durationDays: 30, refillRemaining: 5 }
        ]
      }
    ]
  },
  {
    id: 'pat-4',
    uhid: 'SH-2026-0312',
    name: 'Ananya Deshpande',
    phone: '+91 98220 11984',
    email: 'ananya.d@techcorp.in',
    age: 29,
    gender: 'Female',
    bloodGroup: 'AB+',
    address: 'C-7, Mayur Nagari, Pimple Saudagar, Pune',
    knownAllergies: [],
    chronicConditions: [],
    creditBalance: 0.00,
    creditLimit: 3000.00,
    totalPurchases: 2450.00,
    lastVisit: '2026-10-26',
    prescriptions: [
      {
        id: 'rx-204',
        date: '2026-10-26',
        doctorName: 'Dr. Amit Joshi, MBBS',
        clinicHospital: 'Joshi Family Health Clinic',
        doctorRegNo: 'MMC-66231',
        diagnosis: 'Acute Upper Respiratory Tract Infection with Fever',
        medicines: [
          { medicineName: 'Dolo 650', dosage: '1 Tab TDS for 3 days', durationDays: 3, refillRemaining: 0 },
          { medicineName: 'Augmentin 625 Duo', dosage: '1 Tab BD for 5 days', durationDays: 5, refillRemaining: 0 }
        ]
      }
    ]
  }
];

export const INITIAL_SCHEDULE_H1_REGISTER: ScheduleH1RegisterEntry[] = [
  {
    id: 'h1-1',
    date: '2026-10-26',
    invoiceNumber: 'INV-2026-0038',
    patientName: 'Ananya Deshpande',
    patientAddress: 'C-7, Mayur Nagari, Pune',
    doctorName: 'Dr. Amit Joshi, MBBS',
    doctorAddressReg: 'MMC-66231 / Joshi Clinic Pune',
    medicineName: 'Augmentin 625 Duo (Amoxicillin + Clav)',
    batchNumber: 'AUG-24K09',
    quantitySold: 10
  },
  {
    id: 'h1-2',
    date: '2026-10-25',
    invoiceNumber: 'INV-2026-0032',
    patientName: 'Vikramjit Roy',
    patientAddress: 'Flat 304, Green Palms, Salt Lake, Kolkata',
    doctorName: 'Dr. Subhash Bose, MD',
    doctorAddressReg: 'WBMC-19820 / AMRI Hospital',
    medicineName: 'Azithral 500 (Azithromycin)',
    batchNumber: 'AZ5-3312',
    quantitySold: 5
  },
  {
    id: 'h1-3',
    date: '2026-10-24',
    invoiceNumber: 'INV-2026-0027',
    patientName: 'Tanvi Saxena',
    patientAddress: 'H-92, South Extension Part 2, New Delhi',
    doctorName: 'Dr. Poonam Sachdeva, MS (ENT)',
    doctorAddressReg: 'DMC-44512 / Max Super Specialty',
    medicineName: 'Clavam 625',
    batchNumber: 'CLV-9921D',
    quantitySold: 10
  }
];

export const INITIAL_INVOICES: SaleInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0038',
    date: '2026-10-26',
    time: '18:42',
    patientId: 'pat-4',
    patientName: 'Ananya Deshpande',
    patientPhone: '+91 98220 11984',
    doctorName: 'Dr. Amit Joshi',
    doctorRegNo: 'MMC-66231',
    items: [
      {
        medicineId: 'med-1',
        brandName: 'Dolo 650',
        batchNumber: 'DL65-24J12',
        expiryDate: '2027-09',
        hsnCode: '30049060',
        quantity: 1,
        freeQuantity: 0,
        mrp: 34.00,
        rate: 30.50,
        discountPercent: 5,
        gstPercent: 12,
        amount: 28.98,
        schedule: 'OTC'
      },
      {
        medicineId: 'med-4',
        brandName: 'Augmentin 625 Duo',
        batchNumber: 'AUG-24K09',
        expiryDate: '2027-02',
        hsnCode: '30041010',
        quantity: 1,
        freeQuantity: 0,
        mrp: 224.50,
        rate: 202.00,
        discountPercent: 5,
        gstPercent: 12,
        amount: 191.90,
        schedule: 'Schedule H1'
      }
    ],
    subTotal: 232.50,
    totalDiscount: 11.62,
    cgstTotal: 13.25,
    sgstTotal: 13.25,
    grandTotal: 247.00,
    roundOff: 0.12,
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    billedBy: 'Kailash Pandey (Reg. No. 44192)'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-0037',
    date: '2026-10-26',
    time: '15:15',
    patientName: 'Walk-in Cash Customer',
    patientPhone: '+91 90000 00000',
    doctorName: 'Self / OTC',
    items: [
      {
        medicineId: 'med-2',
        brandName: 'Calpol 650',
        batchNumber: 'GSK-CP-902',
        expiryDate: '2027-07',
        hsnCode: '30049060',
        quantity: 2,
        freeQuantity: 0,
        mrp: 35.50,
        rate: 32.00,
        discountPercent: 0,
        gstPercent: 12,
        amount: 64.00,
        schedule: 'OTC'
      }
    ],
    subTotal: 64.00,
    totalDiscount: 0.00,
    cgstTotal: 3.84,
    sgstTotal: 3.84,
    grandTotal: 72.00,
    roundOff: 0.32,
    paymentMode: 'Cash',
    paymentStatus: 'Paid',
    cashReceived: 100,
    changeReturned: 28,
    billedBy: 'Kailash Pandey (Reg. No. 44192)'
  }
];
