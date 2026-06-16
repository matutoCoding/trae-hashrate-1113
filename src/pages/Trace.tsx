import React, { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  CreditCard,
  Phone,
  Package,
  User,
  Calendar,
  Syringe,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MapPin,
  TrendingUp,
  Activity,
  Heart
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime, calculateDaysRemaining } from '../utils/businessLogic';
import type { TraceRecord, Appointment } from '../../shared/types';
import { cn } from '../lib/utils';

const AppointmentStatusBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
  const styles: Record<Appointment['status'], string> = {
    booked: 'bg-blue-100 text-blue-700',
    screening_passed: 'bg-teal-100 text-teal-700',
    screening_failed: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500'
  };

  const labels: Record<Appointment['status'], string> = {
    booked: '待筛查',
    screening_passed: '筛查通过',
    screening_failed: '筛查未通过',
    completed: '已完成接种',
    cancelled: '已取消'
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
};

const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className={cn(
    'flex items-start gap-3 p-3 rounded-lg',
    highlight ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
  )}>
    <div className={cn(
      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
      highlight ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
    )}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={cn(
        'text-sm font-medium truncate',
        highlight ? 'text-blue-700' : 'text-gray-800'
      )}>{value}</p>
    </div>
  </div>
);

export const Trace: React.FC = () => {
  const { traceRecords } = useAppStore();

  const [searchType, setSearchType] = useState<'idCard' | 'phone' | 'batchNo'>('idCard');
  const [searchValue, setSearchValue] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const results = useMemo(() => {
    if (!hasSearched || !searchValue.trim()) return [];

    const params: { patientIdCard?: string; phone?: string; batchNo?: string } = {};
    if (searchType === 'idCard') params.patientIdCard = searchValue.trim();
    if (searchType === 'phone') params.phone = searchValue.trim();
    if (searchType === 'batchNo') params.batchNo = searchValue.trim();

    return traceRecords(params);
  }, [searchType, searchValue, hasSearched, traceRecords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleReset = () => {
    setSearchValue('');
    setHasSearched(false);
  };

  const stats = useMemo(() => {
    if (!hasSearched) return null;
    return {
      total: results.length,
      completed: results.filter(r => r.appointment.status === 'completed').length,
      hasWarning: results.some(r =>
        r.appointment.status === 'screening_failed' ||
        (r.batch && calculateDaysRemaining(r.batch.expiryDate) <= 30)
      )
    };
  }, [results, hasSearched]);

  const searchTypeOptions = [
    { value: 'idCard' as const, label: '身份证号', icon: CreditCard, placeholder: '请输入身份证号（支持模糊查询）' },
    { value: 'phone' as const, label: '手机号', icon: Phone, placeholder: '请输入手机号（支持模糊查询）' },
    { value: 'batchNo' as const, label: '疫苗批号', icon: Package, placeholder: '请输入疫苗批号（精确匹配）' }
  ];

  const currentOption = searchTypeOptions.find(o => o.value === searchType)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            接种追溯查询
          </h1>
          <p className="text-gray-500 mt-1">按身份证号、手机号或疫苗批号查询接种全流程记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">查询方式</label>
            <div className="flex flex-wrap gap-3">
              {searchTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSearchType(option.value);
                    setSearchValue('');
                    setHasSearched(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all font-medium',
                    searchType === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md shadow-purple-100'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <option.icon className="w-5 h-5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <currentOption.icon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={currentOption.placeholder}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-lg shadow-purple-200"
            >
              <Search className="w-5 h-5" />
              查询
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                重置
              </button>
            )}
          </div>
        </form>
      </div>

      {hasSearched && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-500">相关记录数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
                <p className="text-sm text-gray-500">已完成接种</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                stats.hasWarning ? 'bg-orange-100' : 'bg-blue-100'
              )}>
                {stats.hasWarning ? (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <p className={cn('text-2xl font-bold', stats.hasWarning ? 'text-orange-600' : 'text-gray-800')}>
                  {stats.hasWarning ? '存在' : '无'}
                </p>
                <p className="text-sm text-gray-500">风险提示</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSearched && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">未找到相关记录</p>
              <p className="text-gray-500 mt-2">请检查查询条件是否正确，或尝试其他查询方式</p>
            </div>
          ) : (
            results.map((record, index) => (
              <TraceCard key={record.appointment.id} record={record} index={index} />
            ))
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">请输入查询条件开始追溯</p>
          <p className="text-gray-500 mt-2">支持按身份证号、手机号、疫苗批号查询接种全过程信息</p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-medium text-gray-800">按受种者追溯</p>
              <p className="text-sm text-gray-500 mt-1">查询某人所有接种记录</p>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <p className="font-medium text-gray-800">按手机号追溯</p>
              <p className="text-sm text-gray-500 mt-1">通过联系电话查询</p>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <p className="font-medium text-gray-800">按批号追溯</p>
              <p className="text-sm text-gray-500 mt-1">查询某批次所有接种者（用于召回）</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TraceCard: React.FC<{ record: TraceRecord; index: number }> = ({ record, index }) => {
  const { appointment, slot, station, batch, outboundRecord } = record;
  const batchWarning = batch && calculateDaysRemaining(batch.expiryDate) <= 30;
  const screeningPassed = appointment.screeningResult && !appointment.screeningResult.hasContraindication;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              {appointment.patientName}
              <AppointmentStatusBadge status={appointment.status} />
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              预约时间：{formatDateTime(appointment.createdAt)}
            </p>
          </div>
        </div>
        {batchWarning && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-lg text-orange-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            疫苗批次临期，请注意
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-4 h-4 text-purple-500" />
              受种者信息
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem icon={<User className="w-4 h-4" />} label="姓名" value={appointment.patientName} />
              <InfoItem icon={<Syringe className="w-4 h-4" />} label="疫苗类型" value={appointment.vaccineType} highlight />
              <InfoItem icon={<CreditCard className="w-4 h-4" />} label="身份证号" value={appointment.patientIdCard} />
              <InfoItem icon={<Phone className="w-4 h-4" />} label="联系电话" value={appointment.phone} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Calendar className="w-4 h-4 text-blue-500" />
              预约信息
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem
                icon={<MapPin className="w-4 h-4" />}
                label="接种位"
                value={station?.name || '-'}
              />
              <InfoItem
                icon={<Clock className="w-4 h-4" />}
                label="接种时间"
                value={slot ? `${slot.date} ${slot.startTime}-${slot.endTime}` : '-'}
                highlight
              />
              <InfoItem
                icon={<CheckCircle className="w-4 h-4" />}
                label="当前状态"
                value={<AppointmentStatusBadge status={appointment.status} />}
              />
              {appointment.completedAt && (
                <InfoItem
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="完成时间"
                  value={formatDateTime(appointment.completedAt)}
                />
              )}
            </div>
          </div>
        </div>

        {appointment.healthInfo && appointment.screeningResult && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 pb-3">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              健康筛查结果
              {appointment.screeningTime && (
                <span className="text-xs text-gray-400 font-normal ml-2">
                  筛查时间：{formatDateTime(appointment.screeningTime)}
                </span>
              )}
              <span className="ml-auto">
                {screeningPassed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" /> 筛查通过
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    <XCircle className="w-3 h-3" /> 存在禁忌
                  </span>
                )}
              </span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <InfoItem
                icon={<span className="text-xs">🌡️</span>}
                label="体温"
                value={`${appointment.healthInfo.temperature}°C`}
                highlight={appointment.healthInfo.temperature > 37.5}
              />
              <InfoItem
                icon={<ShieldCheck className="w-4 h-4" />}
                label="过敏史"
                value={appointment.healthInfo.hasVaccineAllergy ? '有（疫苗）' : '无'}
                highlight={appointment.healthInfo.hasVaccineAllergy}
              />
              <InfoItem
                icon={<span className="text-xs">🤰</span>}
                label="妊娠期"
                value={appointment.healthInfo.isPregnant ? '是' : '否'}
                highlight={appointment.healthInfo.isPregnant}
              />
              <InfoItem
                icon={<Activity className="w-4 h-4" />}
                label="急性疾病"
                value={appointment.healthInfo.hasAcuteIllness ? '有' : '无'}
                highlight={appointment.healthInfo.hasAcuteIllness}
              />
              <InfoItem
                icon={<Heart className="w-4 h-4" />}
                label="慢性疾病"
                value={appointment.healthInfo.hasChronicDisease ? '有' : '无'}
                highlight={appointment.healthInfo.hasChronicDisease}
              />
              <InfoItem
                icon={<ShieldCheck className="w-4 h-4" />}
                label="免疫低下"
                value={appointment.healthInfo.isImmunocompromised ? '是' : '否'}
                highlight={appointment.healthInfo.isImmunocompromised}
              />
            </div>
            {appointment.screeningResult.warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">评估结论：</p>
                {appointment.screeningResult.warnings.map((w, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium text-purple-600">{i + 1}.</span> {w}
                    {appointment.screeningResult?.suggestions[i] && (
                      <p className="text-gray-600 mt-1 ml-5">→ {appointment.screeningResult.suggestions[i]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(batch || outboundRecord) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 pb-3">
              <Package className="w-4 h-4 text-orange-500" />
              疫苗批次与出库信息
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batch ? (
                <div className="space-y-3">
                  <div className={cn(
                    'p-4 rounded-xl border-2',
                    batchWarning
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-lg font-bold text-gray-800">{batch.batchNo}</span>
                      {batchWarning && (
                        <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          临期（{calculateDaysRemaining(batch.expiryDate)}天后过期）
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">疫苗：</span>
                        <span className="font-medium text-gray-800">{batch.vaccineName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">厂家：</span>
                        <span className="font-medium text-gray-800">{batch.manufacturer}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">生产：</span>
                        <span className="font-medium text-gray-800">{batch.productionDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">有效期至：</span>
                        <span className={cn(
                          'font-medium',
                          batchWarning ? 'text-orange-600' : 'text-gray-800'
                        )}>{batch.expiryDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                  未关联疫苗批次信息
                </div>
              )}
              {outboundRecord ? (
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-800">出库记录 #{outboundRecord.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-blue-500/70">出库时间：</span>
                      <span className="font-medium text-blue-900">{formatDateTime(outboundRecord.outboundTime)}</span>
                    </div>
                    <div>
                      <span className="text-blue-500/70">操作人：</span>
                      <span className="font-medium text-blue-900">{outboundRecord.operator}</span>
                    </div>
                    <div>
                      <span className="text-blue-500/70">出库数量：</span>
                      <span className="font-medium text-blue-900">{outboundRecord.quantity} 剂</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
                  暂无出库记录
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trace;
