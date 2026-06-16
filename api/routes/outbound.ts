import { Router, type Request, type Response } from 'express';
import { initialBatches, initialOutboundRecords } from '../../src/utils/mockData.js';
import type { VaccineBatch, OutboundRecord } from '../../shared/types.js';
import { getFIFOBatches, getWarningBatches, generateId } from '../../src/utils/businessLogic.js';

const router = Router();

let batches: VaccineBatch[] = [...initialBatches];
let outboundRecords: OutboundRecord[] = [...initialOutboundRecords];

router.get('/recommend', (req: Request, res: Response): void => {
  const { vaccineName } = req.query;

  if (!vaccineName) {
    res.status(400).json({ success: false, message: '请指定疫苗类型' });
    return;
  }

  const recommended = getFIFOBatches(batches, vaccineName as string);
  res.json({ success: true, data: recommended });
});

router.get('/warnings', (req: Request, res: Response): void => {
  const days = parseInt(req.query.days as string) || 30;
  const warnings = getWarningBatches(batches, days);
  res.json({ success: true, data: warnings });
});

router.get('/records', (req: Request, res: Response): void => {
  res.json({ success: true, data: outboundRecords });
});

router.post('/', (req: Request, res: Response): void => {
  const { batchId, quantity, operator, patientName } = req.body;

  if (!batchId || !quantity || !operator) {
    res.status(400).json({ success: false, message: '缺少必要参数' });
    return;
  }

  const batch = batches.find((b) => b.id === batchId);
  if (!batch) {
    res.status(404).json({ success: false, message: '批次不存在' });
    return;
  }

  if (batch.status === 'locked' || batch.status === 'expired') {
    res.status(400).json({ success: false, message: '该批次已锁定或过期，无法出库' });
    return;
  }

  if (quantity > batch.remainingQuantity) {
    res.status(400).json({ success: false, message: '库存不足' });
    return;
  }

  if (quantity <= 0) {
    res.status(400).json({ success: false, message: '出库数量必须大于0' });
    return;
  }

  const newRecord: OutboundRecord = {
    id: generateId(),
    batchId,
    vaccineName: batch.vaccineName,
    batchNo: batch.batchNo,
    quantity,
    operator,
    outboundTime: new Date().toISOString(),
    patientName
  };

  batch.remainingQuantity -= quantity;
  outboundRecords.unshift(newRecord);

  res.json({ success: true, data: newRecord });
});

export default router;
