import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VaccineBatch,
  VaccinationStation,
  TimeSlot,
  Appointment,
  OutboundRecord,
  HealthInfo,
  ContraindicationResult,
  DashboardStats
} from '../../shared/types';
import {
  initialBatches,
  initialStations,
  initialSlots,
  initialAppointments,
  initialOutboundRecords,
  vaccineTypes
} from '../utils/mockData';
import {
  calculateBatchStatus,
  getFIFOBatches,
  getWarningBatches,
  checkTimeConflict,
  screenContraindications,
  generateId,
  formatDate,
  generateTimeSlots
} from '../utils/businessLogic';

interface AppState {
  batches: VaccineBatch[];
  stations: VaccinationStation[];
  slots: TimeSlot[];
  appointments: Appointment[];
  outboundRecords: OutboundRecord[];
  
  currentUser: { name: string; role: string } | null;
  selectedDate: string;
  selectedStationId: string | null;
  selectedVaccineType: string;
  
  addBatch: (batch: Omit<VaccineBatch, 'id' | 'status' | 'createdAt'>) => void;
  updateBatch: (id: string, updates: Partial<VaccineBatch>) => void;
  deleteBatch: (id: string) => void;
  lockBatch: (id: string) => void;
  refreshBatchStatuses: () => void;
  
  addStation: (name: string) => void;
  updateStation: (id: string, updates: Partial<VaccinationStation>) => void;
  deleteStation: (id: string) => void;
  
  getSlotsForDate: (stationId: string, date: string) => TimeSlot[];
  
  createAppointment: (data: {
    slotId: string;
    patientName: string;
    patientIdCard: string;
    phone: string;
    vaccineType: string;
  }) => { success: boolean; message: string; appointment?: Appointment };
  
  cancelAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  
  getRecommendedBatches: (vaccineName: string) => VaccineBatch[];
  getWarningBatchesList: (days?: number) => VaccineBatch[];
  
  performOutbound: (data: {
    batchId: string;
    quantity: number;
    operator: string;
    patientName?: string;
  }) => { success: boolean; message: string; record?: OutboundRecord };
  
  checkConflict: (stationId: string, date: string, startTime: string, endTime: string) => {
    hasConflict: boolean;
    conflicts: TimeSlot[];
  };
  
  performScreening: (healthInfo: HealthInfo) => ContraindicationResult;
  
  getDashboardStats: () => DashboardStats;
  
  setSelectedDate: (date: string) => void;
  setSelectedStationId: (id: string | null) => void;
  setSelectedVaccineType: (type: string) => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  resetAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      batches: initialBatches,
      stations: initialStations,
      slots: initialSlots,
      appointments: initialAppointments,
      outboundRecords: initialOutboundRecords,
      
      currentUser: null,
      selectedDate: formatDate(new Date()),
      selectedStationId: initialStations[0]?.id || null,
      selectedVaccineType: vaccineTypes[0],
      
      addBatch: (batchData) => {
        const status = calculateBatchStatus(batchData.expiryDate);
        const newBatch: VaccineBatch = {
          ...batchData,
          id: generateId(),
          status,
          createdAt: new Date().toISOString()
        };
        set((state) => ({ batches: [...state.batches, newBatch] }));
      },
      
      updateBatch: (id, updates) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          )
        }));
      },
      
      deleteBatch: (id) => {
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== id)
        }));
      },
      
      lockBatch: (id) => {
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, status: 'locked' } : b
          )
        }));
      },
      
      refreshBatchStatuses: () => {
        set((state) => ({
          batches: state.batches.map((b) => {
            if (b.status === 'locked') return b;
            const newStatus = calculateBatchStatus(b.expiryDate);
            return { ...b, status: newStatus };
          })
        }));
      },
      
      addStation: (name) => {
        const newStation: VaccinationStation = {
          id: generateId(),
          name,
          status: 'active'
        };
        set((state) => ({ stations: [...state.stations, newStation] }));
      },
      
      updateStation: (id, updates) => {
        set((state) => ({
          stations: state.stations.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          )
        }));
      },
      
      deleteStation: (id) => {
        set((state) => ({
          stations: state.stations.filter((s) => s.id !== id)
        }));
      },
      
      getSlotsForDate: (stationId, date) => {
        const state = get();
        let slots = state.slots.filter((s) => s.stationId === stationId && s.date === date);
        
        if (slots.length === 0) {
          slots = generateTimeSlots(stationId, date);
          set((state) => ({ slots: [...state.slots, ...slots] }));
        }
        
        return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      },
      
      createAppointment: (data) => {
        const state = get();
        const slot = state.slots.find((s) => s.id === data.slotId);
        
        if (!slot) {
          return { success: false, message: '时段不存在' };
        }
        
        if (slot.status !== 'available') {
          return { success: false, message: '该时段已被预约' };
        }
        
        const sameDaySlots = state.slots.filter(
          (s) => s.stationId === slot.stationId && s.date === slot.date
        );
        const conflict = checkTimeConflict(sameDaySlots, slot.startTime, slot.endTime);
        
        if (conflict.hasConflict) {
          return { success: false, message: '时段存在冲突' };
        }
        
        const newAppointment: Appointment = {
          id: generateId(),
          slotId: data.slotId,
          patientName: data.patientName,
          patientIdCard: data.patientIdCard,
          phone: data.phone,
          vaccineType: data.vaccineType,
          status: 'booked',
          createdAt: new Date().toISOString()
        };
        
        set((state) => ({
          appointments: [...state.appointments, newAppointment],
          slots: state.slots.map((s) =>
            s.id === data.slotId
              ? { ...s, status: 'booked' as const, vaccineType: data.vaccineType }
              : s
          )
        }));
        
        return { success: true, message: '预约成功', appointment: newAppointment };
      },
      
      cancelAppointment: (id) => {
        const state = get();
        const appointment = state.appointments.find((a) => a.id === id);
        
        if (!appointment) return;
        
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled' as const } : a
          ),
          slots: state.slots.map((s) =>
            s.id === appointment.slotId
              ? { ...s, status: 'available' as const, vaccineType: undefined }
              : s
          )
        }));
      },
      
      completeAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: 'completed' as const } : a
          )
        }));
      },
      
      getRecommendedBatches: (vaccineName) => {
        return getFIFOBatches(get().batches, vaccineName);
      },
      
      getWarningBatchesList: (days = 30) => {
        return getWarningBatches(get().batches, days);
      },
      
      performOutbound: (data) => {
        const state = get();
        const batch = state.batches.find((b) => b.id === data.batchId);
        
        if (!batch) {
          return { success: false, message: '批次不存在' };
        }
        
        if (batch.status === 'locked' || batch.status === 'expired') {
          return { success: false, message: '该批次已锁定或过期，无法出库' };
        }
        
        if (data.quantity > batch.remainingQuantity) {
          return { success: false, message: '库存不足' };
        }
        
        if (data.quantity <= 0) {
          return { success: false, message: '出库数量必须大于0' };
        }
        
        const newRecord: OutboundRecord = {
          id: generateId(),
          batchId: data.batchId,
          vaccineName: batch.vaccineName,
          batchNo: batch.batchNo,
          quantity: data.quantity,
          operator: data.operator,
          outboundTime: new Date().toISOString(),
          patientName: data.patientName
        };
        
        set((state) => ({
          outboundRecords: [newRecord, ...state.outboundRecords],
          batches: state.batches.map((b) =>
            b.id === data.batchId
              ? { ...b, remainingQuantity: b.remainingQuantity - data.quantity }
              : b
          )
        }));
        
        return { success: true, message: '出库成功', record: newRecord };
      },
      
      checkConflict: (stationId, date, startTime, endTime) => {
        const state = get();
        const slots = state.slots.filter(
          (s) => s.stationId === stationId && s.date === date
        );
        return checkTimeConflict(slots, startTime, endTime);
      },
      
      performScreening: (healthInfo) => {
        return screenContraindications(healthInfo);
      },
      
      getDashboardStats: () => {
        const state = get();
        const today = formatDate(new Date());
        
        const totalInventory = state.batches.reduce(
          (sum, b) => sum + (b.status !== 'locked' && b.status !== 'expired' ? b.remainingQuantity : 0),
          0
        );
        
        const warningBatches = getWarningBatches(state.batches, 30).length;
        
        const todayAppointments = state.appointments.filter(
          (a) => {
            const slot = state.slots.find((s) => s.id === a.slotId);
            return slot?.date === today && a.status === 'booked';
          }
        ).length;
        
        const todayCompleted = state.appointments.filter(
          (a) => {
            const slot = state.slots.find((s) => s.id === a.slotId);
            return slot?.date === today && a.status === 'completed';
          }
        ).length;
        
        const weeklyData: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = formatDate(d);
          const count = state.appointments.filter(
            (a) => {
              const slot = state.slots.find((s) => s.id === a.slotId);
              return slot?.date === dateStr && (a.status === 'booked' || a.status === 'completed');
            }
          ).length;
          weeklyData.push({ date: dateStr.slice(5), count });
        }
        
        const recentOutbounds = state.outboundRecords.slice(0, 5);
        
        return {
          totalInventory,
          warningBatches,
          todayAppointments,
          todayCompleted,
          weeklyData,
          recentOutbounds
        };
      },
      
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedStationId: (id) => set({ selectedStationId: id }),
      setSelectedVaccineType: (type) => set({ selectedVaccineType: type }),
      
      login: (username, password) => {
        if (username === 'admin' && password === 'admin123') {
          set({ currentUser: { name: '管理员', role: 'admin' } });
          return true;
        }
        if (username === 'doctor' && password === 'doctor123') {
          set({ currentUser: { name: '张医生', role: 'doctor' } });
          return true;
        }
        if (username === 'reception' && password === 'reception123') {
          set({ currentUser: { name: '前台小李', role: 'reception' } });
          return true;
        }
        return false;
      },
      
      logout: () => set({ currentUser: null }),
      
      resetAllData: () => {
        set({
          batches: initialBatches,
          stations: initialStations,
          slots: initialSlots,
          appointments: initialAppointments,
          outboundRecords: initialOutboundRecords
        });
      }
    }),
    {
      name: 'vaccine-system-storage',
      partialize: (state) => ({
        batches: state.batches,
        stations: state.stations,
        slots: state.slots,
        appointments: state.appointments,
        outboundRecords: state.outboundRecords,
        currentUser: state.currentUser
      })
    }
  )
);
