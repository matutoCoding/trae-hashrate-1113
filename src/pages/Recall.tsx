import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Package,
  Lock,
  Phone,
  User,
  CheckSquare,
  Square,
  Check,
  Clock,
  FileText,
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, calculateDaysRemaining } from '../utils/businessLogic';
import type { VaccineBatch, RecallRecord, Appointment } from '../../shared/types';
import { cn } from '../lib/utils';

export const Recall: React.FC = () => {
  const {
    batches,
    outboundRecords,
    recallRecords,
    getRecalledPatients,
    markAsNotified,
    recallBatch,
    currentUser
  } = useAppStore();

  const [searchBatchNo, setSearchBatchNo] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<VaccineBatch | null>(null);
  const [recallReason, setRecallReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const searchResult = useMemo(() => {
    if (!hasSearched || !searchBatchNo.trim()) return null;

    const batch = batches.find(b => b.batchNo === searchBatchNo.trim());
    if (!batch) return { batch: null, records: [], affectedCount: 0 };

    const outRecords = outboundRecords.filter(o => o.batchNo === batch.batchNo);
    const affectedCount = outRecords.length;

    return { batch, records: outRecords, affectedCount };
  }, [searchBatchNo, hasSearched, batches, outboundRecords]);

  const affectedPatients = useMemo(() => {
    if (!selectedBatch) return [];
    return getRecalledPatients(selectedBatch.batchNo);
  }, [selectedBatch, getRecalledPatients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setSelectedBatch(null);
    setSelectedPatientIds([]);
  };

  const handleInitiateRecall = () => {
    if (!searchResult?.batch || !recallReason.trim()) return;

    const result = recallBatch({
      batchId: searchResult.batch.id,
      reason: recallReason.trim()
    });

    if (result.success) {
      setSelectedBatch(searchResult.batch);
      setSuccessMessage(`召回已启动！${result.message}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSelectAll = () => {
    if (selectedPatientIds.length === affectedPatients.length) {
      setSelectedPatientIds([]);
    } else {
      setSelectedPatientIds(affectedPatients.map(p => p.id));
    }
  };

  const handleTogglePatient = (id: string) => {
    setSelectedPatientIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMarkAsNotified = () => {
    if (!selectedBatch || selectedPatientIds.length === 0) return;

    markAsNotified(selectedPatientIds, selectedBatch.batchNo);
    setSuccessMessage(`已标记 ${selectedPatientIds.length} 位受种者为已通知`);
    setSelectedPatientIds([]);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const PatientRow: React.FC<{ patient: Appointment }> = ({ patient }) => {
    const isSelected = selectedPatientIds.includes(patient.id);
    const isNotified = patient.notified;

    return (
      <tr className={cn(
        'hover:bg-gray-50 transition-colors',
        isNotified && 'bg-green-50',
        isSelected && 'bg-blue-50'
      )}>
        <td className="px-4 py-3">
          {isNotified ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <button
              onClick={() => handleTogglePatient(patient.id)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-800">{patient.patientName}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{patient.patientIdCard}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-800">{patient.phone}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{patient.vaccineType}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {patient.completedAt ? formatDateTime(patient.completedAt) : '-'}
        </td>
        <td className="px-4 py-3">
          {isNotified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <Check className="w-3 h-3" />
              已通知
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              待通知
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-600" />
          疫苗召回管理
        </h1>
        <p className="text-gray-500 mt-1">启动疫苗召回、锁定库存、追踪受种者通知状态</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            查询需召回的疫苗批次
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Package className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchBatchNo}
                onChange={(e) => setSearchBatchNo(e.target.value)}
                placeholder="请输入疫苗批号（精确匹配）"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-200"
            >
              <AlertTriangle className="w-5 h-5" />
              查询并启动召回
            </button>
          </div>
        </form>
      </div>

      {hasSearched && searchResult && (
        <div className="space-y-6">
          {!searchResult.batch ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">未找到该批号</p>
              <p className="text-gray-500 mt-2">请检查批号是否正确</p>
            </div>
          ) : (
            <>
              <div className={cn(
                'rounded-xl border-2 p-6',
                selectedBatch
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-200'
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        'w-16 h-16 rounded-xl flex items-center justify-center',
                        selectedBatch ? 'bg-red-100' : 'bg-orange-100'
                      )}>
                        <Package className={cn('w-8 h-8', selectedBatch ? 'text-red-600' : 'text-orange-600')} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold font-mono text-gray-800">
                            {searchResult.batch.batchNo}
                          </span>
                          {selectedBatch && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                              <Lock className="w-4 h-4" />
                              已召回锁定
                            </span>
                          )}
                        </div>
                        <p className="text-lg text-gray-600 mt-1">
                          {searchResult.batch.vaccineName} · {searchResult.batch.manufacturer}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="text-xs text-gray-500">生产日期</p>
                        <p className="text-base font-medium text-gray-800 mt-1">{searchResult.batch.productionDate}</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="text-xs text-gray-500">有效期至</p>
                        <p className="text-base font-medium text-gray-800 mt-1">{searchResult.batch.expiryDate}</p>
                        <p className="text-xs text-orange-600 mt-0.5">
                          剩余 {calculateDaysRemaining(searchResult.batch.expiryDate)} 天
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="text-xs text-gray-500">剩余库存</p>
                        <p className="text-base font-medium text-gray-800 mt-1">
                          {searchResult.batch.remainingQuantity} / {searchResult.batch.quantity} 剂
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="text-xs text-gray-500">已使用</p>
                        <p className="text-base font-medium text-gray-800 mt-1">
                          {searchResult.affectedCount} 人接种
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {!selectedBatch && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          召回原因 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={recallReason}
                          onChange={(e) => setRecallReason(e.target.value)}
                          placeholder="请输入召回原因，如：质量问题、效期临近、不良反应等"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>启动召回后，该批次剩余库存将被锁定，无法再出库</span>
                        </div>
                        <button
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={!recallReason.trim()}
                          className={cn(
                            'px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
                            recallReason.trim()
                              ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          )}
                        >
                          <ShieldAlert className="w-5 h-5" />
                          确认启动召回
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedBatch && affectedPatients.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      受种者列表
                      <span className="text-sm font-normal text-gray-500">
                        （共 {affectedPatients.length} 人）
                      </span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        {selectedPatientIds.length === affectedPatients.length ? '取消全选' : '全选'}
                      </button>
                      <button
                        onClick={handleMarkAsNotified}
                        disabled={selectedPatientIds.length === 0}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                          selectedPatientIds.length > 0
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <Check className="w-4 h-4" />
                        标记已通知 ({selectedPatientIds.length})
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">身份证号</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">联系电话</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">疫苗类型</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">接种时间</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {affectedPatients.map((patient) => (
                          <PatientRow key={patient.id} patient={patient} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {affectedPatients.filter(p => p.notified).length > 0 && (
                    <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700">
                          已通知 <span className="font-bold">{affectedPatients.filter(p => p.notified).length}</span> / {affectedPatients.length} 位受种者
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {recallRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              历史召回记录
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">批号</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">疫苗</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">召回原因</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作人</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作时间</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">影响人数</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">锁定库存</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recallRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-800">{record.batchNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.vaccineName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{record.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.createdBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(record.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {record.affectedCount} 人
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {record.lockedQuantity} 剂
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasSearched && recallRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">请输入需要召回的疫苗批号</p>
          <p className="text-gray-500 mt-2">输入批号后可查看批次信息、启动召回、追踪受种者</p>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                确认启动疫苗召回
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-medium">⚠️ 此操作不可撤销</p>
                <ul className="text-red-600 text-sm mt-2 space-y-1">
                  <li>• 该批次剩余库存（{searchResult?.batch?.remainingQuantity} 剂）将被锁定</li>
                  <li>• 锁定后该批次无法再进行出库操作</li>
                  <li>• 系统将记录本次召回操作的时间和操作人</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">批号：</span>
                  <span className="font-mono text-gray-800">{searchResult?.batch?.batchNo}</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">疫苗：</span>
                  <span className="text-gray-800">{searchResult?.batch?.vaccineName}</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">召回原因：</span>
                  <span className="text-gray-800">{recallReason}</span>
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleInitiateRecall();
                }}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                确认启动召回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recall;
