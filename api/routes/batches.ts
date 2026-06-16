import { Router, type Request, type Response } from 'express';
import { initialBatches } from '../../src/utils/mockData.js';
import type { VaccineBatch } from '../../shared/types.js';
import { calculateBatchStatus, generateId } from '../../src/utils/businessLogic.js';

const router = Router();

let batches: VaccineBatch[] = [...initialBatches];

router.get('/', (req: Request, res: Response): void => {
  const { vaccineName, status } = req.query;
  let result = [...batches];

  if (vaccineName) {
    result = result.filter((b) => b.vaccineName.includes(vaccineName as string));
  }
  if (status) {
    result = result.filter((b) => b.status === status);
  }

  res.json({ success: true, data: result });
});

router.post('/', (req: Request, res: Response): void => {
  const { batchNo, vaccineName, manufacturer, productionDate, expiryDate, quantity } = req.body;

  if (!batchNo || !vaccineName || !manufacturer || !productionDate || !expiryDate || !quantity) {
    res.status(400).json({ success: false, message: '缺少必要参数' });
    return;
  }

  const status = calculateBatchStatus(expiryDate);
  const newBatch: VaccineBatch = {
    id: generateId(),
    batchNo,
    vaccineName,
    manufacturer,
    productionDate,
    expiryDate,
    quantity,
    remainingQuantity: quantity,
    status,
    createdAt: new Date().toISOString()
  };

  batches.push(newBatch);
  res.json({ success: true, data: newBatch });
});

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updates = req.body;

  const index = batches.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, message: '批次不存在' });
    return;
  }

  if (updates.expiryDate) {
    updates.status = calculateBatchStatus(updates.expiryDate);
  }

  batches[index] = { ...batches[index], ...updates };
  res.json({ success: true, data: batches[index] });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = batches.findIndex((b) => b.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: '批次不存在' });
    return;
  }

  batches.splice(index, 1);
  res.json({ success: true, message: '删除成功' });
});

router.put('/:id/lock', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = batches.findIndex((b) => b.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: '批次不存在' });
    return;
  }

  batches[index] = { ...batches[index], status: 'locked' };
  res.json({ success: true, data: batches[index] });
});

export default router;
