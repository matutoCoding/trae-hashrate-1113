import { Router, type Request, type Response } from 'express';
import { initialSlots } from '../../src/utils/mockData.js';
import type { TimeSlot, HealthInfo } from '../../shared/types.js';
import { checkTimeConflict, screenContraindications } from '../../src/utils/businessLogic.js';

const router = Router();

let slots: TimeSlot[] = [...initialSlots];

router.post('/conflict', (req: Request, res: Response): void => {
  const { stationId, date, startTime, endTime } = req.body;

  if (!stationId || !date || !startTime || !endTime) {
    res.status(400).json({ success: false, message: '缺少必要参数' });
    return;
  }

  const stationSlots = slots.filter((s) => s.stationId === stationId && s.date === date);
  const result = checkTimeConflict(stationSlots, startTime, endTime);

  res.json({
    success: true,
    data: {
      hasConflict: result.hasConflict,
      conflicts: result.conflicts
    }
  });
});

router.post('/contraindication', (req: Request, res: Response): void => {
  const healthInfo: HealthInfo = req.body;

  if (!healthInfo) {
    res.status(400).json({ success: false, message: '请提供健康信息' });
    return;
  }

  const result = screenContraindications({
    temperature: healthInfo.temperature || 36.5,
    hasVaccineAllergy: healthInfo.hasVaccineAllergy || false,
    isPregnant: healthInfo.isPregnant || false,
    hasAcuteIllness: healthInfo.hasAcuteIllness || false,
    hasChronicDisease: healthInfo.hasChronicDisease || false,
    isImmunocompromised: healthInfo.isImmunocompromised || false,
    recentVaccinationDate: healthInfo.recentVaccinationDate
  });

  res.json({ success: true, data: result });
});

export default router;
