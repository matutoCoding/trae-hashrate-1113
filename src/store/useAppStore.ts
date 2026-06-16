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
  DashboardStats,
  TraceRecord,
  RecallRecord,
  VaccinationStats
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
  calculateDaysRemaining,
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
  recallRecords: RecallRecord[];
  
  currentUser: { name: string; role: string } | null;
  selectedDate: string;
  selectedStationId: string | null;
  selectedVaccineType: string;
  
  addBatch: (batch: Omit<VaccineBatch, 'id' | 'status' | 'createdAt'>) => void;
  updateBatch: (id: string, updates: Partial<VaccineBatch>) => void;
  deleteBatch: (id: string) => void;
  lockBatch: (id: string) => void;
  refreshBatchStatuses: () => void;
  checkFIFOValidation: (batchId: string, vaccineName: string) => { valid: boolean; message: string; shouldUseBatch?: VaccineBatch };
  
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
  completeAppointmentWithVaccination: (data: {
    appointmentId: string;
    batchId: string;
    operator: string;
  }) => { success: boolean; message: string; record?: OutboundRecord };
  
  performScreeningForAppointment: (data: {
    appointmentId: string;
    healthInfo: HealthInfo;
  }) => { success: boolean; message: string; result: ContraindicationResult };
  
  getRecommendedBatches: (vaccineName: string) => VaccineBatch[];
  getWarningBatchesList: (days?: number) => VaccineBatch[];
  
  performOutbound: (data: {
    batchId: string;
    quantity: number;
    operator: string;
    patientName?: string;
    appointmentId?: string;
    patientIdCard?: string;
    phone?: string;
  }) => { success: boolean; message: string; record?: OutboundRecord };
  
  checkConflict: (stationId: string, date: string, startTime: string, endTime: string) => {
    hasConflict: boolean;
    conflicts: TimeSlot[];
    isValidTimeRange: boolean;
    timeRangeMessage: string;
  };
  
  performScreening: (healthInfo: HealthInfo) => ContraindicationResult;
  
  traceRecords: (params: {
    patientIdCard?: string;
    phone?: string;
    batchNo?: string;
  }) => TraceRecord[];
  
  recallBatch: (data: {
    batchId: string;
    reason: string;
  }) => { success: boolean; message: string; record?: RecallRecord };
  
  getRecalledPatients: (batchNo: string) => Appointment[];
  
  markAsNotified: (appointmentIds: string[], batchNo: string) => void;
  
  getVaccinationStats: (filter?: { vaccineType?: string }) => VaccinationStats;
  
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
      recallRecords: [],
      
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
        set((state) => {
          const updatedBatches = state.batches.map((b) => {
            if (b.id !== id) return b;
            const merged = { ...b, ...updates };
            if (updates.expiryDate !== undefined || updates.status !== undefined) {
              if (merged.status !== 'locked') {
                merged.status = calculateBatchStatus(merged.expiryDate);
              }
            }
            return merged;
          });
          return { batches: updatedBatches };
        });
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
      
      checkFIFOValidation: (batchId, vaccineName) => {
        const state = get();
        const targetBatch = state.batches.find(b => b.id === batchId);
        if (!targetBatch) {
          return { valid: false, message: '批次不存在' };
        }
        
        const availableBatches = getFIFOBatches(state.batches, vaccineName);
        
        if (availableBatches.length === 0) {
          return { valid: false, message: '该类型疫苗暂无可用库存' };
        }
        
        const firstBatch = availableBatches[0];
        
        if (firstBatch.id === batchId) {
          return { valid: true, message: '符合先进先出规则' };
        }
        
        const targetIndex = availableBatches.findIndex(b => b.id === batchId);
        if (targetIndex === -1) {
          return { valid: false, message: '该批次不可出库（已过期或锁定）' };
        }
        
        return {
          valid: false,
          message: `请先使用批号 ${firstBatch.batchNo}（有效期至 ${firstBatch.expiryDate}，剩余 ${firstBatch.remainingQuantity} 剂），该批次更早到期`,
          shouldUseBatch: firstBatch
        };
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
      
      completeAppointmentWithVaccination: (data) => {
        const state = get();
        const appointment = state.appointments.find((a) => a.id === data.appointmentId);
        
        if (!appointment) {
          return { success: false, message: '预约记录不存在' };
        }
        
        if (appointment.status === 'cancelled') {
          return { success: false, message: '该预约已取消，无法完成接种' };
        }
        
        if (appointment.status === 'completed') {
          return { success: false, message: '该预约已完成接种' };
        }
        
        if (appointment.status === 'booked') {
          return { success: false, message: '请先完成健康筛查，筛查通过后再进行接种' };
        }
        
        if (appointment.status === 'screening_failed') {
          return { success: false, message: '健康筛查未通过，不建议接种' };
        }
        
        const batch = state.batches.find((b) => b.id === data.batchId);
        if (!batch) {
          return { success: false, message: '批次不存在' };
        }
        
        if (batch.status === 'locked' || batch.status === 'expired') {
          return { success: false, message: '该批次已锁定或过期，无法出库' };
        }
        
        if (batch.vaccineName !== appointment.vaccineType) {
          return { success: false, message: `疫苗类型不匹配，请选择 ${appointment.vaccineType} 类型的批次` };
        }
        
        if (1 > batch.remainingQuantity) {
          return { success: false, message: '库存不足' };
        }
        
        const fifoCheck = get().checkFIFOValidation(data.batchId, appointment.vaccineType);
        if (!fifoCheck.valid) {
          return { success: false, message: fifoCheck.message };
        }
        
        const newRecord: OutboundRecord = {
          id: generateId(),
          batchId: data.batchId,
          vaccineName: batch.vaccineName,
          batchNo: batch.batchNo,
          quantity: 1,
          operator: data.operator,
          outboundTime: new Date().toISOString(),
          patientName: appointment.patientName,
          appointmentId: appointment.id,
          patientIdCard: appointment.patientIdCard,
          phone: appointment.phone
        };
        
        set((state) => ({
          outboundRecords: [newRecord, ...state.outboundRecords],
          batches: state.batches.map((b) =>
            b.id === data.batchId
              ? { ...b, remainingQuantity: b.remainingQuantity - 1 }
              : b
          ),
          appointments: state.appointments.map((a) =>
            a.id === data.appointmentId
              ? {
                  ...a,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                  outboundRecordId: newRecord.id,
                  batchId: batch.id,
                  batchNo: batch.batchNo
                }
              : a
          )
        }));
        
        return { success: true, message: '接种完成，已自动扣减库存', record: newRecord };
      },
      
      performScreeningForAppointment: (data) => {
        const state = get();
        const appointment = state.appointments.find((a) => a.id === data.appointmentId);
        
        if (!appointment) {
          return { success: false, message: '预约记录不存在', result: { hasContraindication: true, warnings: ['预约不存在'], suggestions: ['请重新选择预约'] } };
        }
        
        const result = screenContraindications(data.healthInfo);
        
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === data.appointmentId
              ? {
                  ...a,
                  status: result.hasContraindication ? 'screening_failed' as const : 'screening_passed' as const,
                  screeningResult: result,
                  screeningTime: new Date().toISOString(),
                  healthInfo: data.healthInfo
                }
              : a
          )
        }));
        
        return {
          success: true,
          message: result.hasContraindication ? '筛查未通过，存在接种禁忌' : '筛查通过，可以进行接种',
          result
        };
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
        
        const fifoCheck = get().checkFIFOValidation(data.batchId, batch.vaccineName);
        if (!fifoCheck.valid) {
          return { success: false, message: fifoCheck.message };
        }
        
        const newRecord: OutboundRecord = {
          id: generateId(),
          batchId: data.batchId,
          vaccineName: batch.vaccineName,
          batchNo: batch.batchNo,
          quantity: data.quantity,
          operator: data.operator,
          outboundTime: new Date().toISOString(),
          patientName: data.patientName,
          appointmentId: data.appointmentId,
          patientIdCard: data.patientIdCard,
          phone: data.phone
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
        if (startTime >= endTime) {
          return {
            hasConflict: false,
            conflicts: [],
            isValidTimeRange: false,
            timeRangeMessage: '结束时间必须晚于开始时间'
          };
        }
        
        const state = get();
        const slots = state.slots.filter(
          (s) => s.stationId === stationId && s.date === date
        );
        const conflictResult = checkTimeConflict(slots, startTime, endTime);
        
        return {
          ...conflictResult,
          isValidTimeRange: true,
          timeRangeMessage: '时间范围合法'
        };
      },
      
      performScreening: (healthInfo) => {
        return screenContraindications(healthInfo);
      },
      
      traceRecords: (params) => {
        const state = get();
        const results: TraceRecord[] = [];
        
        const filteredAppointments = state.appointments.filter((apt) => {
          if (params.patientIdCard && !apt.patientIdCard.includes(params.patientIdCard)) return false;
          if (params.phone && !apt.phone.includes(params.phone)) return false;
          if (params.batchNo && apt.batchNo !== params.batchNo) return false;
          return true;
        });
        
        const filteredByOutbound = params.batchNo
          ? state.appointments.filter((apt) => {
              const outRecords = state.outboundRecords.filter((o) => o.batchNo === params.batchNo);
              return outRecords.some((r) => r.appointmentId === apt.id);
            })
          : [];
        
        const allAppointments = [...new Map([...filteredAppointments, ...filteredByOutbound].map(a => [a.id, a])).values()];
        
        for (const apt of allAppointments) {
          const slot = state.slots.find((s) => s.id === apt.slotId);
          const station = state.stations.find((s) => s.id === slot?.stationId);
          const batch = apt.batchId ? state.batches.find((b) => b.id === apt.batchId) : undefined;
          const outboundRecord = apt.outboundRecordId
            ? state.outboundRecords.find((o) => o.id === apt.outboundRecordId)
            : state.outboundRecords.find((o) => o.appointmentId === apt.id);

          results.push({
            appointment: apt,
            slot,
            station,
            batch,
            outboundRecord: outboundRecord!
          });
        }
        
        if (params.batchNo) {
          const standaloneOutbounds = state.outboundRecords.filter((o) =>
            o.batchNo === params.batchNo && !o.appointmentId
          );
          
          for (const outRec of standaloneOutbounds) {
            const batch = state.batches.find((b) => b.id === outRec.batchId);
            results.push({
              outboundRecord: outRec,
              batch
            });
          }
        }
        
        return results.sort((a, b) => {
          const timeA = a.appointment?.createdAt ?? a.outboundRecord?.outboundTime ?? '';
          const timeB = b.appointment?.createdAt ?? b.outboundRecord?.outboundTime ?? '';
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });
      },
      
      recallBatch: (data) => {
        const state = get();
        const batch = state.batches.find((b) => b.id === data.batchId);
        
        if (!batch) {
          return { success: false, message: '批次不存在' };
        }
        
        if (batch.status === 'locked') {
          return { success: false, message: '该批次已锁定' };
        }
        
        const affectedRecords = state.outboundRecords.filter((o) => o.batchNo === batch.batchNo);
        const affectedCount = affectedRecords.length;
        const lockedQuantity = batch.remainingQuantity;
        
        const newRecord: RecallRecord = {
          id: generateId(),
          batchId: data.batchId,
          batchNo: batch.batchNo,
          vaccineName: batch.vaccineName,
          reason: data.reason,
          createdAt: new Date().toISOString(),
          createdBy: state.currentUser?.name || '系统',
          lockedQuantity,
          affectedCount
        };
        
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === data.batchId ? { ...b, status: 'locked' as const } : b
          ),
          recallRecords: [newRecord, ...state.recallRecords]
        }));
        
        return {
          success: true,
          message: `批次已锁定，受影响接种记录 ${affectedCount} 条`,
          record: newRecord
        };
      },
      
      getRecalledPatients: (batchNo) => {
        const state = get();
        return state.appointments.filter((a) => a.batchNo === batchNo && a.status === 'completed');
      },
      
      markAsNotified: (appointmentIds, batchNo) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            appointmentIds.includes(a.id) ? { ...a, notified: true } : a
          )
        }));
      },
      
      getVaccinationStats: (filter) => {
        const state = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const vaccineTypeMap = new Map<string, {
          completed: number;
          screeningFailed: number;
          totalScreening: number;
          warningBatchUsed: number;
        }>();
        
        const stationMap = new Map<string, number>();
        
        for (const apt of state.appointments) {
          const aptDate = apt.completedAt ? new Date(apt.completedAt) : new Date(apt.createdAt);
          if (aptDate.getMonth() !== currentMonth || aptDate.getFullYear() !== currentYear) continue;
          
          if (filter?.vaccineType && apt.vaccineType !== filter.vaccineType) continue;
          
          const stats = vaccineTypeMap.get(apt.vaccineType) || {
            completed: 0,
            screeningFailed: 0,
            totalScreening: 0,
            warningBatchUsed: 0
          };
          
          if (apt.status === 'completed') {
            stats.completed++;
            
            if (apt.batchId) {
              const batch = state.batches.find((b) => b.id === apt.batchId);
              if (batch && calculateDaysRemaining(batch.expiryDate) <= 30) {
                stats.warningBatchUsed++;
              }
            }
          }
          
          if (apt.status === 'screening_passed' || apt.status === 'screening_failed' || apt.status === 'completed') {
            stats.totalScreening++;
            if (apt.status === 'screening_failed') {
              stats.screeningFailed++;
            }
          }
          
          vaccineTypeMap.set(apt.vaccineType, stats);
          
          if (apt.status === 'completed') {
            const slot = state.slots.find((s) => s.id === apt.slotId);
            if (slot) {
              stationMap.set(slot.stationId, (stationMap.get(slot.stationId) || 0) + 1);
            }
          }
        }
        
        const byVaccineType = Array.from(vaccineTypeMap.entries()).map(([vaccineName, stats]) => ({
          vaccineName,
          monthlyCompleted: stats.completed,
          screeningFailedRate: stats.totalScreening > 0 ? Math.round((stats.screeningFailed / stats.totalScreening) * 100) : 0,
          warningBatchUsed: stats.warningBatchUsed
        }));
        
        const topStations = Array.from(stationMap.entries())
          .map(([stationId, completedCount]) => {
            const station = state.stations.find((s) => s.id === stationId);
            return {
              stationId,
              stationName: station?.name || '未知',
              completedCount
            };
          })
          .sort((a, b) => b.completedCount - a.completedCount);
        
        return {
          byVaccineType,
          topStations
        };
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
            return slot?.date === today && (a.status === 'booked' || a.status === 'screening_passed');
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
              return slot?.date === dateStr && a.status === 'completed';
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
        recallRecords: state.recallRecords,
        currentUser: state.currentUser
      })
    }
  )
);
