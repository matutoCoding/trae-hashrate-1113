import type { VaccineBatch, VaccinationStation, TimeSlot, Appointment, OutboundRecord } from '../../shared/types';
import { formatDate, generateId, generateTimeSlots } from './businessLogic';

const today = new Date();
const getDateStr = (daysOffset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return formatDate(d);
};

export const initialBatches: VaccineBatch[] = [
  {
    id: 'batch-1',
    batchNo: 'CV202401001',
    vaccineName: '新冠疫苗',
    manufacturer: '国药中生',
    productionDate: '2024-01-15',
    expiryDate: getDateStr(25),
    quantity: 500,
    remainingQuantity: 480,
    status: 'warning',
    createdAt: '2024-01-20'
  },
  {
    id: 'batch-2',
    batchNo: 'CV202403002',
    vaccineName: '新冠疫苗',
    manufacturer: '北京科兴',
    productionDate: '2024-03-10',
    expiryDate: getDateStr(180),
    quantity: 1000,
    remainingQuantity: 950,
    status: 'normal',
    createdAt: '2024-03-15'
  },
  {
    id: 'batch-3',
    batchNo: 'CV202402003',
    vaccineName: '新冠疫苗',
    manufacturer: '国药中生',
    productionDate: '2024-02-20',
    expiryDate: getDateStr(10),
    quantity: 200,
    remainingQuantity: 45,
    status: 'warning',
    createdAt: '2024-02-25'
  },
  {
    id: 'batch-4',
    batchNo: 'FLU202408001',
    vaccineName: '流感疫苗',
    manufacturer: '赛诺菲巴斯德',
    productionDate: '2024-08-01',
    expiryDate: getDateStr(270),
    quantity: 800,
    remainingQuantity: 720,
    status: 'normal',
    createdAt: '2024-08-10'
  },
  {
    id: 'batch-5',
    batchNo: 'HPV202405001',
    vaccineName: 'HPV疫苗',
    manufacturer: '默沙东',
    productionDate: '2024-05-15',
    expiryDate: getDateStr(365),
    quantity: 300,
    remainingQuantity: 285,
    status: 'normal',
    createdAt: '2024-05-20'
  },
  {
    id: 'batch-6',
    batchNo: 'HEP202311001',
    vaccineName: '乙肝疫苗',
    manufacturer: '葛兰素史克',
    productionDate: '2023-11-10',
    expiryDate: getDateStr(-5),
    quantity: 400,
    remainingQuantity: 120,
    status: 'expired',
    createdAt: '2023-11-15'
  },
  {
    id: 'batch-7',
    batchNo: 'MMR202406001',
    vaccineName: '麻腮风疫苗',
    manufacturer: '默沙东',
    productionDate: '2024-06-01',
    expiryDate: getDateStr(60),
    quantity: 500,
    remainingQuantity: 420,
    status: 'normal',
    createdAt: '2024-06-10'
  },
  {
    id: 'batch-8',
    batchNo: 'CV202312005',
    vaccineName: '新冠疫苗',
    manufacturer: '北京科兴',
    productionDate: '2023-12-01',
    expiryDate: getDateStr(-15),
    quantity: 600,
    remainingQuantity: 80,
    status: 'locked',
    createdAt: '2023-12-10'
  }
];

export const initialStations: VaccinationStation[] = [
  { id: 'station-1', name: '接种位 A', status: 'active' },
  { id: 'station-2', name: '接种位 B', status: 'active' },
  { id: 'station-3', name: '接种位 C', status: 'active' },
  { id: 'station-4', name: '接种位 D', status: 'inactive' }
];

const todayStr = formatDate(today);
const tomorrowStr = formatDate(new Date(today.getTime() + 86400000));

export const initialSlots: TimeSlot[] = [
  ...generateTimeSlots('station-1', todayStr),
  ...generateTimeSlots('station-2', todayStr),
  ...generateTimeSlots('station-3', todayStr),
  ...generateTimeSlots('station-1', tomorrowStr),
  ...generateTimeSlots('station-2', tomorrowStr)
].map(slot => {
  if (slot.stationId === 'station-1' && slot.startTime === '09:00' && slot.date === todayStr) {
    return { ...slot, status: 'booked' as const, vaccineType: '新冠疫苗' };
  }
  if (slot.stationId === 'station-1' && slot.startTime === '09:30' && slot.date === todayStr) {
    return { ...slot, status: 'booked' as const, vaccineType: '流感疫苗' };
  }
  if (slot.stationId === 'station-2' && slot.startTime === '10:00' && slot.date === todayStr) {
    return { ...slot, status: 'booked' as const, vaccineType: '新冠疫苗' };
  }
  if (slot.stationId === 'station-2' && slot.startTime === '14:00' && slot.date === todayStr) {
    return { ...slot, status: 'locked' as const };
  }
  if (slot.stationId === 'station-1' && slot.startTime === '10:30' && slot.date === tomorrowStr) {
    return { ...slot, status: 'booked' as const, vaccineType: 'HPV疫苗' };
  }
  return slot;
});

export const initialAppointments: Appointment[] = [
  {
    id: generateId(),
    slotId: `station-1-${todayStr}-09:00`,
    patientName: '张三',
    patientIdCard: '110101199001011234',
    phone: '13800138001',
    vaccineType: '新冠疫苗',
    status: 'booked',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: generateId(),
    slotId: `station-1-${todayStr}-09:30`,
    patientName: '李四',
    patientIdCard: '110101198505055678',
    phone: '13800138002',
    vaccineType: '流感疫苗',
    status: 'booked',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: generateId(),
    slotId: `station-2-${todayStr}-10:00`,
    patientName: '王五',
    patientIdCard: '110101197810109012',
    phone: '13800138003',
    vaccineType: '新冠疫苗',
    status: 'completed',
    createdAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: generateId(),
    slotId: `station-1-${tomorrowStr}-10:30`,
    patientName: '赵六',
    patientIdCard: '110101199202023456',
    phone: '13800138004',
    vaccineType: 'HPV疫苗',
    status: 'booked',
    createdAt: new Date(Date.now() - 43200000).toISOString()
  }
];

export const initialOutboundRecords: OutboundRecord[] = [
  {
    id: generateId(),
    batchId: 'batch-1',
    vaccineName: '新冠疫苗',
    batchNo: 'CV202401001',
    quantity: 20,
    operator: '张医生',
    outboundTime: new Date(Date.now() - 3600000).toISOString(),
    patientName: '张三'
  },
  {
    id: generateId(),
    batchId: 'batch-4',
    vaccineName: '流感疫苗',
    batchNo: 'FLU202408001',
    quantity: 80,
    operator: '李护士',
    outboundTime: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: generateId(),
    batchId: 'batch-1',
    vaccineName: '新冠疫苗',
    batchNo: 'CV202401001',
    quantity: 15,
    operator: '张医生',
    outboundTime: new Date(Date.now() - 86400000).toISOString(),
    patientName: '陈七'
  },
  {
    id: generateId(),
    batchId: 'batch-5',
    vaccineName: 'HPV疫苗',
    batchNo: 'HPV202405001',
    quantity: 15,
    operator: '王医生',
    outboundTime: new Date(Date.now() - 172800000).toISOString(),
    patientName: '赵六'
  },
  {
    id: generateId(),
    batchId: 'batch-2',
    vaccineName: '新冠疫苗',
    batchNo: 'CV202403002',
    quantity: 50,
    operator: '李护士',
    outboundTime: new Date(Date.now() - 259200000).toISOString()
  }
];

export const vaccineTypes = ['新冠疫苗', '流感疫苗', 'HPV疫苗', '乙肝疫苗', '麻腮风疫苗', '肺炎疫苗', '水痘疫苗'];

export const operators = ['张医生', '李护士', '王医生', '刘护士长', '陈医生'];
