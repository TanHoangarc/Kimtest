
export type ViewType = 'default' | 'tariff' | 'handbook' | 'policies' | 'template' | 'marketing' | 'submission' | 'admin' | 'dataEntry' | 'mblPayment' | 'fileManager' | 'aiTool';

export interface User {
  email: string;
  password?: string;
  role: 'Admin' | 'Document' | 'Customer';
}

export interface JobData {
  Thang?: string;
  Ma?: string;
  // Fix: Allow MaKH and SoTien to be strings to accommodate form input values.
  MaKH?: number | string;
  SoTien?: number | string;
  TrangThai?: string;
  NoiDung1?: string;
  NoiDung2?: string;
}

// Fix: Add BankingData interface to be exported to resolve import error.
export interface BankingData {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number | string;
  content: string;
}

export interface MblPaymentData {
  id: string;
  maLine: string;
  soTien: number | string;
  mbl: string;
  hoaDonUrl: string;
  hoaDonFilename: string;
}

export interface SubmissionData {
  id: string;
  hbl: string;
  fileUrl: string;
  fileName: string;
}

export interface Notification {
  id: string;
  userEmail: string;
  action: 'Nộp hồ sơ hoàn cược' | 'Thêm thanh toán MBL';
  details: string;
  timestamp: string; // ISO string
  read: boolean;
}