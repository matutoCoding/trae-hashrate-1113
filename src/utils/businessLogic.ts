import type { VaccineBatch, TimeSlot, HealthInfo, ContraindicationResult } from '../../shared/types';

export function calculateDaysRemaining(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateBatchStatus(expiryDate: string): 'normal' | 'warning' | 'expired' {
  const daysRemaining = calculateDaysRemaining(expiryDate);
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= 30) return 'warning';
  return 'normal';
}

export function getFIFOBatches(batches: VaccineBatch[], vaccineName: string): VaccineBatch[] {
  return batches
    .filter(b =>
      b.vaccineName === vaccineName &&
      b.status !== 'locked' &&
      b.status !== 'expired' &&
      b.remainingQuantity > 0
    )
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
}

export function getWarningBatches(batches: VaccineBatch[], days: number = 30): VaccineBatch[] {
  return batches.filter(b => {
    const daysRemaining = calculateDaysRemaining(b.expiryDate);
    return daysRemaining > 0 && daysRemaining <= days && b.status !== 'locked' && b.status !== 'expired';
  });
}

export function checkTimeConflict(
  slots: TimeSlot[],
  startTime: string,
  endTime: string
): { hasConflict: boolean; conflicts: TimeSlot[] } {
  const conflicts = slots.filter(slot => {
    if (slot.status !== 'available') {
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      return (startTime < slotEnd && endTime > slotStart);
    }
    return false;
  });

  return { hasConflict: conflicts.length > 0, conflicts };
}

interface ContraindicationRule {
  type: string;
  condition: (info: HealthInfo) => boolean;
  message: string;
  suggestion: string;
  severity: 'warning' | 'danger';
}

const contraindicationRules: ContraindicationRule[] = [
  {
    type: 'fever',
    condition: (info) => info.temperature > 37.5,
    message: '体温超过37.5°C，存在发热症状',
    suggestion: '建议暂缓接种，待体温恢复正常后再接种',
    severity: 'danger'
  },
  {
    type: 'allergy',
    condition: (info) => info.hasVaccineAllergy,
    message: '有疫苗过敏史',
    suggestion: '需经医生谨慎评估后决定是否接种',
    severity: 'warning'
  },
  {
    type: 'pregnancy',
    condition: (info) => info.isPregnant,
    message: '处于妊娠期',
    suggestion: '建议咨询产科医生后决定是否接种',
    severity: 'warning'
  },
  {
    type: 'acuteIllness',
    condition: (info) => info.hasAcuteIllness,
    message: '患有急性疾病',
    suggestion: '建议暂缓接种，待急性疾病痊愈后再接种',
    severity: 'danger'
  },
  {
    type: 'immunocompromised',
    condition: (info) => info.isImmunocompromised,
    message: '免疫功能低下',
    suggestion: '需经医生评估后决定是否接种，可能需要调整接种方案',
    severity: 'warning'
  },
  {
    type: 'recentVaccination',
    condition: (info) => {
      if (!info.recentVaccinationDate) return false;
      const recent = new Date(info.recentVaccinationDate);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - recent.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays < 14;
    },
    message: '14天内曾接种其他疫苗',
    suggestion: '建议与上次接种间隔至少14天',
    severity: 'warning'
  }
];

export function screenContraindications(healthInfo: HealthInfo): ContraindicationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let hasContraindication = false;

  contraindicationRules.forEach(rule => {
    if (rule.condition(healthInfo)) {
      warnings.push(rule.message);
      suggestions.push(rule.suggestion);
      if (rule.severity === 'danger') {
        hasContraindication = true;
      }
    }
  });

  if (warnings.length === 0) {
    warnings.push('未发现明显接种禁忌');
    suggestions.push('可以正常接种，接种后请留观30分钟');
  }

  return { hasContraindication, warnings, suggestions };
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateTimeSlots(stationId: string, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 17;
  const interval = 30;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      if (hour === 12 && minute >= 0) continue;
      if (hour === 11 && minute >= 30) continue;

      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + interval;
      const endHourVal = endMinute >= 60 ? hour + 1 : hour;
      const endMinuteVal = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHourVal.toString().padStart(2, '0')}:${endMinuteVal.toString().padStart(2, '0')}`;

      slots.push({
        id: `${stationId}-${date}-${startTime}`,
        stationId,
        date,
        startTime,
        endTime,
        status: 'available'
      });
    }
  }

  return slots;
}
