import { Router, type Request, type Response } from 'express';
import { initialStations, initialSlots, initialAppointments } from '../../src/utils/mockData.js';
import type { VaccinationStation, TimeSlot, Appointment } from '../../shared/types.js';
import { checkTimeConflict, generateId, generateTimeSlots } from '../../src/utils/businessLogic.js';

const router = Router();

let stations: VaccinationStation[] = [...initialStations];
let slots: TimeSlot[] = [...initialSlots];
let appointments: Appointment[] = [...initialAppointments];

router.get('/stations', (req: Request, res: Response): void => {
  res.json({ success: true, data: stations });
});

router.post('/stations', (req: Request, res: Response): void => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ success: false, message: '请输入接种位名称' });
    return;
  }

  const newStation: VaccinationStation = {
    id: generateId(),
    name,
    status: 'active'
  };

  stations.push(newStation);
  res.json({ success: true, data: newStation });
});

router.put('/stations/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updates = req.body;

  const index = stations.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, message: '接种位不存在' });
    return;
  }

  stations[index] = { ...stations[index], ...updates };
  res.json({ success: true, data: stations[index] });
});

router.delete('/stations/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = stations.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: '接种位不存在' });
    return;
  }

  stations.splice(index, 1);
  res.json({ success: true, message: '删除成功' });
});

router.get('/slots', (req: Request, res: Response): void => {
  const { stationId, date } = req.query;

  if (!stationId || !date) {
    res.status(400).json({ success: false, message: '请指定接种位和日期' });
    return;
  }

  let result = slots.filter((s) => s.stationId === stationId && s.date === date);

  if (result.length === 0) {
    result = generateTimeSlots(stationId as string, date as string);
    slots.push(...result);
  }

  result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  res.json({ success: true, data: result });
});

router.get('/appointments', (req: Request, res: Response): void => {
  const { date, stationId } = req.query;
  let result = [...appointments];

  if (date) {
    result = result.filter((a) => {
      const slot = slots.find((s) => s.id === a.slotId);
      return slot?.date === date;
    });
  }

  if (stationId) {
    result = result.filter((a) => {
      const slot = slots.find((s) => s.id === a.slotId);
      return slot?.stationId === stationId;
    });
  }

  res.json({ success: true, data: result });
});

router.post('/appointments', (req: Request, res: Response): void => {
  const { slotId, patientName, patientIdCard, phone, vaccineType } = req.body;

  if (!slotId || !patientName || !patientIdCard || !phone || !vaccineType) {
    res.status(400).json({ success: false, message: '缺少必要参数' });
    return;
  }

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) {
    res.status(404).json({ success: false, message: '时段不存在' });
    return;
  }

  if (slot.status !== 'available') {
    res.status(400).json({ success: false, message: '该时段已被预约' });
    return;
  }

  const sameDaySlots = slots.filter((s) => s.stationId === slot.stationId && s.date === slot.date);
  const conflict = checkTimeConflict(sameDaySlots, slot.startTime, slot.endTime);

  if (conflict.hasConflict) {
    res.status(400).json({ success: false, message: '时段存在冲突' });
    return;
  }

  const newAppointment: Appointment = {
    id: generateId(),
    slotId,
    patientName,
    patientIdCard,
    phone,
    vaccineType,
    status: 'booked',
    createdAt: new Date().toISOString()
  };

  appointments.push(newAppointment);
  slot.status = 'booked';
  slot.vaccineType = vaccineType;

  res.json({ success: true, data: newAppointment });
});

router.delete('/appointments/:id/cancel', (req: Request, res: Response): void => {
  const { id } = req.params;

  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) {
    res.status(404).json({ success: false, message: '预约不存在' });
    return;
  }

  appointment.status = 'cancelled';

  const slot = slots.find((s) => s.id === appointment.slotId);
  if (slot) {
    slot.status = 'available';
    slot.vaccineType = undefined;
  }

  res.json({ success: true, data: appointment });
});

export default router;
