import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ChevronRight,
  Syringe,
  Filter,
  X,
  User,
  Phone,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime } from '../utils/businessLogic';
import type { VaccinationStats, Appointment } from '../../shared/types';
import { cn } from '../lib/utils';

export const Statistics: React.FC = () => {
  const { getVaccinationStats, appointments, batches } = useAppStore();

  const [selectedVaccineType, setSelectedVaccineType] = useState<string | undefined>(undefined);
  const [detailModal, setDetailModal] = useState<{
    type: 'monthly' | 'screening';
    vaccineType: string;
  } | null>(null);

  const stats = useMemo(() => {
    return getVaccinationStats(selectedVaccineType ? { vaccineType: selectedVaccineType } : undefined);
  }, [selectedVaccineType, getVaccinationStats]);

  const allVaccineTypes = useMemo(() => {
    const types = new Set(appointments.map(a => a.vaccineType));
    return Array.from(types);
  }, [appointments]);

  const getDetailsForVaccine = (vaccineType: string, type: 'monthly' | 'screening') => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return appointments.filter(a => {
      if (a.vaccineType !== vaccineType) return false;
      const aptDate = a.completedAt ? new Date(a.completedAt) : new Date(a.createdAt);
      if (aptDate.getMonth() !== currentMonth || aptDate.getFullYear() !== currentYear) return false;

      if (type === 'monthly') {
        return a.status === 'completed';
      } else {
        return a.status === 'screening_failed';
      }
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    unit?: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    onClick?: () => void;
    trend?: string;
    highlight?: boolean;
  }> = ({ title, value, unit, icon: Icon, color, bgColor, onClick, trend, highlight }) => (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border transition-all',
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : 'border-gray-200',
        highlight ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 flex items-baseline gap-1">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500">{unit}</span>}
          </p>
          {trend && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-6 h-6', color)} />
        </div>
      </div>
      {onClick && (
        <div className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-medium">
          点击查看明细 <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );

  const DetailModal: React.FC<{
    title: string;
    data: Appointment[];
    type: 'monthly' | 'screening';
  }> = ({ title, data, type }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={() => setDetailModal(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((apt) => (
                <div key={apt.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{apt.patientName}</p>
                          <p className="text-xs text-gray-500 font-mono">{apt.patientIdCard}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm ml-13">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {apt.phone}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Syringe className="w-4 h-4 text-gray-400" />
                          {apt.vaccineType}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {apt.completedAt ? formatDateTime(apt.completedAt) : formatDateTime(apt.createdAt)}
                        </div>
                        <div>
                          {type === 'screening' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              <XCircle className="w-3 h-3" />
                              筛查未通过
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              已完成接种
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {apt.batchNo && (
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">接种批号</p>
                        <p className="font-mono text-sm text-gray-800">{apt.batchNo}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
          共 {data.length} 条记录
        </div>
      </div>
    </div>
  );

  const monthlyTotal = stats.byVaccineType.reduce((sum, v) => sum + v.monthlyCompleted, 0);
  const avgScreeningFailRate = stats.byVaccineType.length > 0
    ? Math.round(stats.byVaccineType.reduce((sum, v) => sum + v.screeningFailedRate, 0) / stats.byVaccineType.length)
    : 0;
  const totalWarningUsed = stats.byVaccineType.reduce((sum, v) => sum + v.warningBatchUsed, 0);

  const screeningDetail = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (selectedVaccineType) {
      const filtered = appointments.filter(a => {
        if (a.vaccineType !== selectedVaccineType) return false;
        const aptDate = a.completedAt ? new Date(a.completedAt) : new Date(a.createdAt);
        if (aptDate.getMonth() !== currentMonth || aptDate.getFullYear() !== currentYear) return false;
        return a.status === 'screening_passed' || a.status === 'screening_failed' || a.status === 'completed';
      });
      const failed = filtered.filter(a => a.status === 'screening_failed').length;
      return { failed, total: filtered.length, showDetail: true };
    }

    return { failed: 0, total: 0, showDetail: false };
  }, [selectedVaccineType, appointments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            接种统计看板
          </h1>
          <p className="text-gray-500 mt-1">按疫苗类型统计本月接种数据，支持下钻查看明细</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedVaccineType || ''}
            onChange={(e) => setSelectedVaccineType(e.target.value || undefined)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">全部疫苗类型</option>
            {allVaccineTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="本月接种总数"
          value={monthlyTotal}
          unit="人"
          icon={Users}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
          highlight
        />
        {screeningDetail.showDetail ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">筛查未通过 / 总筛查</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${screeningDetail.failed > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    {screeningDetail.failed}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-2xl font-semibold text-gray-600">{screeningDetail.total}</span>
                  <span className="text-sm text-gray-500 ml-1">人</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  未通过率：{screeningDetail.total > 0 ? Math.round(screeningDetail.failed / screeningDetail.total * 100) : 0}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${screeningDetail.failed > 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
                <XCircle className={`w-6 h-6 ${screeningDetail.failed > 0 ? 'text-red-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </div>
        ) : (
          <StatCard
            title="平均筛查未通过率"
            value={avgScreeningFailRate}
            unit="%"
            icon={XCircle}
            color={avgScreeningFailRate > 10 ? 'text-red-600' : 'text-orange-600'}
            bgColor={avgScreeningFailRate > 10 ? 'bg-red-50' : 'bg-orange-50'}
          />
        )}
        <StatCard
          title="临期批次消化"
          value={totalWarningUsed}
          unit="剂"
          icon={AlertTriangle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="疫苗类型数"
          value={stats.byVaccineType.length}
          unit="种"
          icon={Syringe}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Syringe className="w-5 h-5 text-blue-600" />
            按疫苗类型统计
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">疫苗类型</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">本月接种</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">筛查未通过率</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">临期批次使用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.byVaccineType.map((stat) => (
                <tr key={stat.vaccineName} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{stat.vaccineName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDetailModal({ type: 'monthly', vaccineType: stat.vaccineName })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      {stat.monthlyCompleted} 人
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setDetailModal({ type: 'screening', vaccineType: stat.vaccineName })}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity',
                        stat.screeningFailedRate > 10
                          ? 'bg-red-100 text-red-700'
                          : stat.screeningFailedRate > 5
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      )}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {stat.screeningFailedRate}%
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium',
                      stat.warningBatchUsed > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      <AlertTriangle className="w-4 h-4" />
                      {stat.warningBatchUsed} 剂
                    </span>
                  </td>
                </tr>
              ))}
              {stats.byVaccineType.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>本月暂无接种数据</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            接种位效率排名（本月）
          </h3>
        </div>
        <div className="p-6">
          {stats.topStations.length > 0 ? (
            <div className="space-y-4">
              {stats.topStations.map((station, index) => {
                const maxCount = stats.topStations[0].completedCount;
                const percentage = Math.round((station.completedCount / maxCount) * 100);
                const colors = [
                  'bg-gradient-to-r from-yellow-400 to-yellow-500',
                  'bg-gradient-to-r from-gray-300 to-gray-400',
                  'bg-gradient-to-r from-orange-400 to-orange-500',
                  'bg-gradient-to-r from-blue-400 to-blue-500'
                ];

                return (
                  <div key={station.stationId} className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-base flex-shrink-0',
                      colors[index] || 'bg-gradient-to-r from-gray-400 to-gray-500'
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800">{station.stationName}</span>
                        <span className="text-sm text-gray-500">{station.completedCount} 次接种</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            colors[index] || 'bg-gradient-to-r from-gray-400 to-gray-500'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>本月暂无接种数据</p>
            </div>
          )}
        </div>
      </div>

      {detailModal && (
        <DetailModal
          title={detailModal.type === 'monthly'
            ? `${detailModal.vaccineType} - 本月接种明细`
            : `${detailModal.vaccineType} - 筛查未通过明细`
          }
          data={getDetailsForVaccine(detailModal.vaccineType, detailModal.type)}
          type={detailModal.type}
        />
      )}
    </div>
  );
};

export default Statistics;
