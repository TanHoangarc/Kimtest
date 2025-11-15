
export type ViewType = 'default' | 'tariff' | 'handbook' | 'policies' | 'template' | 'marketing' | 'submission' | 'admin' | 'dataEntry';

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