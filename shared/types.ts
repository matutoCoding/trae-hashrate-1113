export interface VaccineBatch {
  id: string;
  batchNo: string;
  vaccineName: string;
  manufacturer: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  remainingQuantity: number;
  status: 'normal' | 'warning' | 'expired' | 'locked';
  createdAt: string;
}

export interface VaccinationStation {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface TimeSlot {
  id: string;
  stationId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'locked';
  vaccineType?: string;
}

export interface Appointment {
  id: string;
  slotId: string;
  patientName: string;
  patientIdCard: string;
  phone: string;
  vaccineType: string;
  status: 'booked' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface OutboundRecord {
  id: string;
  batchId: string;
  vaccineName: string;
  batchNo: string;
  quantity: number;
  operator: string;
  outboundTime: string;
  patientName?: string;
}

export interface ContraindicationResult {
  hasContraindication: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface HealthInfo {
  temperature: number;
  hasVaccineAllergy: boolean;
  isPregnant: boolean;
  hasAcuteIllness: boolean;
  hasChronicDisease: boolean;
  isImmunocompromised: boolean;
  recentVaccinationDate?: string;
}

export interface DashboardStats {
  totalInventory: number;
  warningBatches: number;
  todayAppointments: number;
  todayCompleted: number;
  weeklyData: { date: string; count: number }[];
  recentOutbounds: OutboundRecord[];
}

export type BatchStatus = VaccineBatch['status'];
export type SlotStatus = TimeSlot['status'];
export type AppointmentStatus = Appointment['status'];
