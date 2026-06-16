import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Search,
  History
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateDaysRemaining, formatDateTime } from '../utils/businessLogic';
import { vaccineTypes, operators } from '../utils/mockData';
import type { VaccineBatch, OutboundRecord } from '../../shared/types';
import { cn } from '../lib/utils';

const StatusBadge: React.FC<{ status: VaccineBatch['status'] }> = ({ status }) => {
  const styles: Record<VaccineBatch['status'], string> = {
    normal: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    expired: 'bg-red-100 text-red-700',
    locked: 'bg-gray-100 text-gray-500'
  };

  const labels: Record<VaccineBatch['status'], string> = {
    normal: '正常',
    warning: '临期优先',
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

export const Outbound: React.FC = () => {
  const {
    batches,
    outboundRecords,
    selectedVaccineType,
    setSelectedVaccineType,
    getRecommendedBatches,
    getWarningBatchesList,
    performOutbound,
    refreshBatchStatuses
  } = useAppStore();

  const [recommendedBatches, setRecommendedBatches] = useState<VaccineBatch[]>([]);
  const [warningBatches, setWarningBatches] = useState<VaccineBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<VaccineBatch | null>(null);
  const [outboundQuantity, setOutboundQuantity] = useState(1);
  const [operator, setOperator] = useState(operators[0]);
  const [patientName, setPatientName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'outbound' | 'history'>('outbound');

  useEffect(() => {
    refreshBatchStatuses();
    setRecommendedBatches(getRecommendedBatches(selectedVaccineType));
    setWarningBatches(getWarningBatchesList(30));
  }, [selectedVaccineType, refreshBatchStatuses, getRecommendedBatches, getWarningBatchesList]);

  const handleOutbound = () => {
    if (!selectedBatch) {
      setErrorMessage('请先选择要出库的批次');
      return;
    }

    const result = performOutbound({
      batchId: selectedBatch.id,
      quantity: outboundQuantity,
      operator,
      patientName: patientName || undefined
    });

    if (result.success) {
      setShowSuccess(true);
      setErrorMessage('');
      setSelectedBatch(null);
      setOutboundQuantity(1);
      setPatientName('');
      setRecommendedBatches(getRecommendedBatches(selectedVaccineType));
      setWarningBatches(getWarningBatchesList(30));

      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">效期出库管理</h2>
          <p className="text-gray-500 mt-1">按效期先进先出，临期疫苗优先出库，过期批次自动锁定</p>
        </div>
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('outbound')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'outbound'
                ? 'bg-[#165DFF] text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            <PackageCheck className="w-4 h-4" />
            出库操作
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'history'
                ? 'bg-[#165DFF] text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            <History className="w-4 h-4" />
            出库记录
          </button>
        </div>
      </div>

      {warningBatches.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800">临期预警提醒</h3>
              <p className="text-sm text-orange-600 mt-1">
                共有 <span className="font-bold">{warningBatches.length}</span> 个批次将在30天内过期，请优先安排出库使用
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {warningBatches.slice(0, 5).map((batch) => (
                  <span
                    key={batch.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full text-xs text-orange-700"
                  >
                    <span className="font-mono">{batch.batchNo}</span>
                    <span className="text-orange-500">|</span>
                    <span>{calculateDaysRemaining(batch.expiryDate)}天后过期</span>
                  </span>
                ))}
                {warningBatches.length > 5 && (
                  <span className="text-xs text-orange-500">等 {warningBatches.length - 5} 个批次</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outbound' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#165DFF]" />
                选择疫苗类型
              </h3>
              <div className="flex flex-wrap gap-3">
                {vaccineTypes.map((type) => {
                  const count = batches.filter(
                    (b) =>
                      b.vaccineName === type &&
                      b.status !== 'locked' &&
                      b.status !== 'expired' &&
                      b.remainingQuantity > 0
                  ).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedVaccineType(type)}
                      className={cn(
                        'px-5 py-3 rounded-xl border-2 transition-all font-medium flex items-center gap-2',
                        selectedVaccineType === type
                          ? 'border-[#165DFF] bg-[#165DFF]/5 text-[#165DFF] shadow-md shadow-blue-100'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      )}
                    >
                      {type}
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        selectedVaccineType === type ? 'bg-[#165DFF] text-white' : 'bg-gray-100 text-gray-500'
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-[#165DFF]" />
                推荐出库批次（按效期先进先出排序）
              </h3>
              {recommendedBatches.length === 0 ? (
                <div className="text-center py-12">
                  <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">该类型疫苗暂无可用库存</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedBatches.map((batch, index) => {
                    const daysRemaining = calculateDaysRemaining(batch.expiryDate);
                    return (
                      <div
                        key={batch.id}
                        onClick={() => {
                          if (batch.status !== 'locked' && batch.status !== 'expired') {
                            setSelectedBatch(batch);
                            setOutboundQuantity(Math.min(1, batch.remainingQuantity));
                            setErrorMessage('');
                          }
                        }}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all cursor-pointer',
                          selectedBatch?.id === batch.id
                            ? 'border-[#165DFF] bg-[#165DFF]/5 shadow-md'
                            : batch.status === 'warning'
                            ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                          (batch.status === 'locked' || batch.status === 'expired') &&
                            'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white',
                                index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-orange-400' : 'bg-gray-400'
                              )}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-gray-800">
                                  {batch.batchNo}
                                </span>
                                <StatusBadge status={batch.status} />
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {batch.manufacturer}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-800">
                              库存：
                              <span className="font-semibold text-[#165DFF]">
                                {batch.remainingQuantity}
                              </span>{' '}
                              剂
                            </p>
                            <div className="flex items-center gap-1 text-sm mt-1">
                              <Clock className="w-4 h-4" />
                              <span
                                className={cn(
                                  'font-medium',
                                  daysRemaining <= 30 ? 'text-orange-600' : 'text-gray-500'
                                )}
                              >
                                有效期至 {batch.expiryDate}（{daysRemaining}天）
                              </span>
                            </div>
                          </div>
                        </div>
                        {batch.status === 'warning' && (
                          <div className="mt-3 pt-3 border-t border-orange-200 flex items-center gap-2 text-orange-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            该批次临期，请优先出库使用
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">出库登记</h3>

              {showSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">出库成功！</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择批次
                  </label>
                  <div className={cn(
                    'p-3 rounded-lg border-2',
                    selectedBatch ? 'border-[#165DFF] bg-[#165DFF]/5' : 'border-gray-200 bg-gray-50'
                  )}>
                    {selectedBatch ? (
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-800">
                          {selectedBatch.batchNo}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedBatch.vaccineName} · {selectedBatch.manufacturer}
                        </p>
                        <p className="text-xs text-[#165DFF] mt-1">
                          可出库：{selectedBatch.remainingQuantity} 剂
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">请从左侧选择出库批次</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    出库数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedBatch?.remainingQuantity || 1}
                    value={outboundQuantity}
                    onChange={(e) => setOutboundQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                    placeholder="请输入出库数量"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    操作人员 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] bg-white"
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    受种者姓名（可选）
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                    placeholder="请输入受种者姓名"
                  />
                </div>

                <button
                  onClick={handleOutbound}
                  disabled={!selectedBatch}
                  className={cn(
                    'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    selectedBatch
                      ? 'bg-[#165DFF] text-white hover:bg-[#0E42D2] shadow-lg shadow-blue-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <PackageCheck className="w-5 h-5" />
                  确认出库
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    出库时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    疫苗名称
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    批号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    出库数量
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    操作人员
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    受种者
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outboundRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDateTime(record.outboundTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-800">
                        {record.vaccineName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-600">
                        {record.batchNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#165DFF] font-medium">
                        {record.quantity} 剂
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {record.operator}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {record.patientName || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {outboundRecords.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无出库记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
