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
  status: 'booked' | 'screening_passed' | 'screening_failed' | 'completed' | 'cancelled';
  createdAt: string;
  screeningResult?: ContraindicationResult;
  screeningTime?: string;
  healthInfo?: HealthInfo;
  outboundRecordId?: string;
  completedAt?: string;
  batchId?: string;
  batchNo?: string;
  notified?: boolean;
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
  appointmentId?: string;
  patientIdCard?: string;
  phone?: string;
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

export interface TraceRecord {
  appointment?: Appointment;
  slot?: TimeSlot | undefined;
  station?: VaccinationStation | undefined;
  batch?: VaccineBatch | undefined;
  outboundRecord: OutboundRecord;
}

export interface RecallRecord {
  id: string;
  batchId: string;
  batchNo: string;
  vaccineName: string;
  reason: string;
  createdAt: string;
  createdBy: string;
  lockedQuantity: number;
  affectedCount: number;
}

export interface VaccinationStats {
  byVaccineType: {
    vaccineName: string;
    monthlyCompleted: number;
    screeningFailedRate: number;
    warningBatchUsed: number;
  }[];
  topStations: {
    stationId: string;
    stationName: string;
    completedCount: number;
  }[];
  monthlyDetail?: Appointment[];
  screeningDetail?: Appointment[];
}

export type BatchStatus = VaccineBatch['status'];
export type SlotStatus = TimeSlot['status'];
export type AppointmentStatus = Appointment['status'];
