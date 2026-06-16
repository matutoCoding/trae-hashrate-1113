import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Lock,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  Check,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateDaysRemaining, calculateBatchStatus } from '../utils/businessLogic';
import { vaccineTypes } from '../utils/mockData';
import type { VaccineBatch, BatchStatus } from '../../shared/types';
import { cn } from '../lib/utils';

const StatusBadge: React.FC<{ status: BatchStatus }> = ({ status }) => {
  const styles: Record<BatchStatus, string> = {
    normal: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    expired: 'bg-red-100 text-red-700',
    locked: 'bg-gray-100 text-gray-500'
  };

  const labels: Record<BatchStatus, string> = {
    normal: '正常',
    warning: '临期',
    expired: '已过期',
    locked: '已锁定'
  };

  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', styles[status])}>
      {status === 'warning' && <AlertTriangle className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
};

interface BatchFormData {
  batchNo: string;
  vaccineName: string;
  manufacturer: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
}

const initialFormData: BatchFormData = {
  batchNo: '',
  vaccineName: vaccineTypes[0],
  manufacturer: '',
  productionDate: '',
  expiryDate: '',
  quantity: 0
};

export const VaccineBatches: React.FC = () => {
  const { batches, addBatch, updateBatch, deleteBatch, lockBatch, refreshBatchStatuses } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<VaccineBatch | null>(null);
  const [formData, setFormData] = useState<BatchFormData>(initialFormData);
  const [confirmAction, setConfirmAction] = useState<{ type: string; batch: VaccineBatch } | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    refreshBatchStatuses();
  }, [refreshBatchStatuses]);

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBatch) {
      updateBatch(editingBatch.id, formData);
    } else {
      addBatch({
        ...formData,
        remainingQuantity: formData.quantity
      });
    }

    setShowModal(false);
    setEditingBatch(null);
    setFormData(initialFormData);
  };

  const handleEdit = (batch: VaccineBatch) => {
    setEditingBatch(batch);
    setFormData({
      batchNo: batch.batchNo,
      vaccineName: batch.vaccineName,
      manufacturer: batch.manufacturer,
      productionDate: batch.productionDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity
    });
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    if (confirmAction) {
      deleteBatch(confirmAction.batch.id);
      setConfirmAction(null);
    }
  };

  const handleConfirmLock = () => {
    if (confirmAction) {
      lockBatch(confirmAction.batch.id);
      setConfirmAction(null);
    }
  };

  const handleExpiryDateBlur = () => {
    if (editingBatch && formData.expiryDate && formData.expiryDate !== editingBatch.expiryDate) {
      updateBatch(editingBatch.id, { expiryDate: formData.expiryDate });
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">疫苗批次管理</h2>
          <p className="text-gray-500 mt-1">管理疫苗批次信息，登记效期，监控库存状态</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshBatchStatuses}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            title="状态已自动更新，点击可手动刷新"
          >
            <RefreshCw className="w-4 h-4" />
            刷新状态（已自动更新）
          </button>
          <button
            onClick={() => {
              setEditingBatch(null);
              setFormData(initialFormData);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E42D2] transition-colors shadow-md shadow-blue-100"
          >
            <Plus className="w-4 h-4" />
            新增批次
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索批号、疫苗名称、生产厂家..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BatchStatus | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] bg-white"
            >
              <option value="all">全部状态</option>
              <option value="normal">正常</option>
              <option value="warning">临期</option>
              <option value="expired">已过期</option>
              <option value="locked">已锁定</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  批号
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  疫苗名称
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  生产厂家
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  生产日期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  有效期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  剩余天数
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  库存
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBatches.map((batch) => {
                const daysRemaining = calculateDaysRemaining(batch.expiryDate);
                return (
                  <tr
                    key={batch.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      batch.status === 'warning' && 'bg-orange-50/30',
                      batch.status === 'expired' && 'bg-red-50/30'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-800">
                        {batch.batchNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-800">{batch.vaccineName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{batch.manufacturer}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{batch.productionDate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{batch.expiryDate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          daysRemaining <= 0 && 'text-red-600',
                          daysRemaining > 0 && daysRemaining <= 30 && 'text-orange-600',
                          daysRemaining > 30 && 'text-green-600'
                        )}
                      >
                        {daysRemaining > 0 ? `${daysRemaining} 天` : '已过期'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-800">
                        {batch.remainingQuantity} / {batch.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(batch)}
                          className="p-2 text-gray-400 hover:text-[#165DFF] hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {batch.status === 'warning' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'lock', batch })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="锁定批次"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({ type: 'delete', batch })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无匹配的批次数据</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingBatch ? '编辑批次' : '新增疫苗批次'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBatch(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    批号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.batchNo}
                    onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                    placeholder="如：CV202401001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    疫苗名称 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vaccineName}
                    onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] bg-white"
                    required
                  >
                    {vaccineTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生产厂家 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                  placeholder="如：国药中生"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生产日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.productionDate}
                    onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    有效期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    onBlur={handleExpiryDateBlur}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                    required
                  />
                  {editingBatch && formData.expiryDate && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const newStatus = calculateBatchStatus(formData.expiryDate);
                          const originalStatus = editingBatch.status;
                          const statusLabels: Record<BatchStatus, string> = {
                            normal: '正常',
                            warning: '临期',
                            expired: '已过期',
                            locked: '已锁定'
                          };
                          const statusStyles: Record<string, string> = {
                            normal: 'text-green-600 bg-green-50',
                            warning: 'text-orange-600 bg-orange-50',
                            expired: 'text-red-600 bg-red-50',
                            locked: 'text-gray-600 bg-gray-50'
                          };
                          if (newStatus !== originalStatus) {
                            return (
                              <div className={cn('text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1', statusStyles[newStatus])}>
                                <AlertTriangle className="w-3 h-3" />
                                修改后将变为：{statusLabels[newStatus]}
                              </div>
                            );
                          }
                          return (
                            <div className={cn('text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1', statusStyles[newStatus])}>
                              修改后状态：{statusLabels[newStatus]}
                            </div>
                          );
                        })()}
                        {autoSaved && (
                          <div className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1 text-green-600 bg-green-50">
                            <Check className="w-3 h-3" />
                            已实时更新
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        失焦自动保存，无需点保存按钮
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  入库数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                  placeholder="请输入入库数量"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBatch(null);
                  }}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E42D2] transition-colors"
                >
                  {editingBatch ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  确认{confirmAction.type === 'lock' ? '锁定' : '删除'}
                </h3>
                <p className="text-sm text-gray-500">
                  {confirmAction.type === 'lock'
                    ? '锁定后该批次将无法出库'
                    : '删除后数据将无法恢复'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 p-3 bg-gray-50 rounded-lg">
              批号：<span className="font-mono">{confirmAction.batch.batchNo}</span>
              <br />
              疫苗：{confirmAction.batch.vaccineName}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={confirmAction.type === 'lock' ? handleConfirmLock : handleConfirmDelete}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认{confirmAction.type === 'lock' ? '锁定' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
