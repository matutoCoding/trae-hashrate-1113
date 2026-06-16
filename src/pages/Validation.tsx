import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Thermometer,
  Baby,
  Heart,
  Activity,
  Syringe,
  RefreshCw,
  Search,
  AlertCircle,
  CheckSquare,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { checkTimeConflict, formatDate, formatDateTime } from '../utils/businessLogic';
import type { HealthInfo, TimeSlot, Appointment } from '../../shared/types';
import { cn } from '../lib/utils';

const initialHealthInfo: HealthInfo = {
  temperature: 36.5,
  hasVaccineAllergy: false,
  isPregnant: false,
  hasAcuteIllness: false,
  hasChronicDisease: false,
  isImmunocompromised: false,
  recentVaccinationDate: ''
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
    )}
  >
    {icon}
    {label}
  </button>
);

const ResultCard: React.FC<{
  type: 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  suggestion?: string;
}> = ({ type, title, message, suggestion }) => {
  const styles = {
    success: 'border-green-200 bg-green-50',
    warning: 'border-orange-200 bg-orange-50',
    danger: 'border-red-200 bg-red-50'
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-orange-600" />,
    danger: <XCircle className="w-6 h-6 text-red-600" />
  };

  return (
    <div className={cn('border rounded-lg p-4 space-y-2', styles[type])}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <p className="text-gray-700 text-sm ml-9">{message}</p>
      {suggestion && (
        <p className="text-gray-600 text-sm ml-9 bg-white/50 px-3 py-2 rounded">
          <span className="font-medium">建议：</span>{suggestion}
        </p>
      )}
    </div>
  );
};

export const Validation: React.FC = () => {
  const {
    stations,
    slots,
    appointments,
    checkConflict,
    performScreening,
    performScreeningForAppointment
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'conflict' | 'release' | 'screening'>('conflict');

  const [conflictStationId, setConflictStationId] = useState(stations[0]?.id || '');
  const [conflictDate, setConflictDate] = useState(formatDate(new Date()));
  const [conflictStartTime, setConflictStartTime] = useState('08:00');
  const [conflictEndTime, setConflictEndTime] = useState('08:30');
  const [conflictResult, setConflictResult] = useState<{
    hasConflict: boolean;
    conflicts: TimeSlot[];
    isValidTimeRange: boolean;
    timeRangeMessage: string;
  } | null>(null);

  const [healthInfo, setHealthInfo] = useState<HealthInfo>(initialHealthInfo);
  const [screeningResult, setScreeningResult] = useState<ReturnType<typeof performScreening> | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);

  const cancelledAppointments = useMemo(() => {
    return appointments
      .filter(a => a.status === 'cancelled')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [appointments]);

  const releasedSlots = useMemo(() => {
    const cancelledSlotIds = cancelledAppointments.map(a => a.slotId);
    return slots.filter(s => cancelledSlotIds.includes(s.id) && s.status === 'available');
  }, [slots, cancelledAppointments]);

  const screenableAppointments = useMemo(() => {
    return appointments
      .filter(a => a.status === 'booked' || a.status === 'screening_passed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appointments]);

  const selectedAppointment = useMemo(() => {
    return appointments.find(a => a.id === selectedAppointmentId) || null;
  }, [appointments, selectedAppointmentId]);

  const statusText: Record<string, string> = {
    booked: '待筛查',
    screening_passed: '筛查通过'
  };

  const handleConflictCheck = () => {
    const result = checkConflict(conflictStationId, conflictDate, conflictStartTime, conflictEndTime);
    setConflictResult(result);
  };

  const handleAppointmentChange = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setScreeningResult(null);
    setSuccessMessage('');

    if (appointmentId) {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointment?.healthInfo) {
        setHealthInfo(appointment.healthInfo);
      } else {
        setHealthInfo(initialHealthInfo);
      }
      if (appointment?.screeningResult) {
        setScreeningResult(appointment.screeningResult);
      }
    } else {
      setHealthInfo(initialHealthInfo);
    }
  };

  const handleScreening = () => {
    if (selectedAppointmentId) {
      const result = performScreeningForAppointment({
        appointmentId: selectedAppointmentId,
        healthInfo
      });
      setScreeningResult(result.result);
      setSuccessMessage('筛查完成！筛查结果已保存到预约记录，接种排期页面可见');
    } else {
      const result = performScreening(healthInfo);
      setScreeningResult(result);
      setSuccessMessage('筛查完成！');
    }
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const resetScreening = () => {
    setSelectedAppointmentId('');
    setHealthInfo(initialHealthInfo);
    setScreeningResult(null);
    setSuccessMessage('');
  };

  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 8; hour < 17; hour++) {
      if (hour === 12) continue;
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 11 && minute >= 30) continue;
        options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return options;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            冲突校验中心
          </h1>
          <p className="text-gray-500 mt-1">时段冲突检测、退订释放管理、接种禁忌筛查</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <TabButton
          active={activeTab === 'conflict'}
          onClick={() => setActiveTab('conflict')}
          icon={<AlertTriangle className="w-5 h-5" />}
          label="时段重叠校验"
        />
        <TabButton
          active={activeTab === 'release'}
          onClick={() => setActiveTab('release')}
          icon={<RefreshCw className="w-5 h-5" />}
          label="退订时段释放"
        />
        <TabButton
          active={activeTab === 'screening'}
          onClick={() => setActiveTab('screening')}
          icon={<UserCheck className="w-5 h-5" />}
          label="接种禁忌筛查"
        />
      </div>

      {activeTab === 'conflict' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              冲突检测
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">接种位</label>
                <select
                  value={conflictStationId}
                  onChange={(e) => setConflictStationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {stations.filter(s => s.status === 'active').map(station => (
                    <option key={station.id} value={station.id}>{station.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">检测日期</label>
                <input
                  type="date"
                  value={conflictDate}
                  onChange={(e) => setConflictDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <select
                    value={conflictStartTime}
                    onChange={(e) => setConflictStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <select
                    value={conflictEndTime}
                    onChange={(e) => setConflictEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleConflictCheck}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                检测时段冲突
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              检测结果
            </h2>
            {conflictResult === null ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>请填写检测条件并点击检测按钮</p>
              </div>
            ) : !conflictResult.isValidTimeRange ? (
              <ResultCard
                type="warning"
                title="时间范围不合法"
                message={conflictResult.timeRangeMessage}
                suggestion="请重新选择合法的时间范围（结束时间必须晚于开始时间）"
              />
            ) : conflictResult.hasConflict ? (
              <div className="space-y-4">
                <ResultCard
                  type="danger"
                  title="存在时段冲突"
                  message={`检测到 ${conflictResult.conflicts.length} 个时段冲突`}
                  suggestion="请选择其他时段或联系管理员调整预约"
                />
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">冲突时段详情：</h4>
                  {conflictResult.conflicts.map((slot, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <p className="text-sm text-red-600 mt-1 ml-6">
                        该时段已被预约，不可重复预约
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ResultCard
                type="success"
                title="时段可用"
                message="该时段未检测到冲突，可以正常预约"
                suggestion="请前往接种排期页面进行预约登记"
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'release' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{releasedSlots.length}</p>
                  <p className="text-sm text-gray-500">已释放时段</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{cancelledAppointments.length}</p>
                  <p className="text-sm text-gray-500">退订记录</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">100%</p>
                  <p className="text-sm text-gray-500">释放成功率</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                最近退订释放记录
              </h3>
            </div>
            {cancelledAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无退订记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">接种人</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">疫苗类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">接种位</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时段</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退订时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cancelledAppointments.map((apt) => {
                      const slot = slots.find(s => s.id === apt.slotId);
                      const station = stations.find(s => s.id === slot?.stationId);
                      const isReleased = slot?.status === 'available';
                      return (
                        <tr key={apt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-800">{apt.patientName}</div>
                            <div className="text-sm text-gray-500">{apt.patientIdCard}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{apt.vaccineType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{station?.name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-700">{slot?.date}</div>
                            <div className="text-sm text-gray-500">{slot?.startTime} - {slot?.endTime}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {formatDateTime(apt.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                              isReleased
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            )}>
                              {isReleased ? (
                                <><CheckCircle className="w-3 h-3" /> 已释放</>
                              ) : (
                                <><Clock className="w-3 h-3" /> 释放中</>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'screening' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                健康信息采集
              </h2>
              <button
                onClick={resetScreening}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                重置
              </button>
            </div>
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 mb-4">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  选择预约（可选）
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => handleAppointmentChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- 不选择预约，仅做筛查演示 --</option>
                    {screenableAppointments.map(apt => (
                      <option key={apt.id} value={apt.id}>
                        {apt.patientName} - {apt.patientIdCard.slice(-6)} - {apt.vaccineType} - {statusText[apt.status]}
                      </option>
                    ))}
                  </select>
                  {selectedAppointment?.screeningResult && (
                    <button
                      onClick={() => setShowResultModal(true)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      title="查看筛查结果"
                    >
                      <Eye className="w-4 h-4" />
                      查看结果
                    </button>
                  )}
                </div>
                {selectedAppointment?.screeningResult && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">该预约已做过筛查，可重新筛查覆盖</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">选择预约后筛查结果将保存到预约记录中</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  体温 (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={healthInfo.temperature}
                  onChange={(e) => setHealthInfo({ ...healthInfo, temperature: parseFloat(e.target.value) || 36.5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">正常范围：36.0°C - 37.5°C</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">健康状况</label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={healthInfo.hasVaccineAllergy}
                    onChange={(e) => setHealthInfo({ ...healthInfo, hasVaccineAllergy: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">有疫苗过敏史</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={healthInfo.isPregnant}
                    onChange={(e) => setHealthInfo({ ...healthInfo, isPregnant: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-pink-500" />
                    <span className="text-gray-700">处于妊娠期</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={healthInfo.hasAcuteIllness}
                    onChange={(e) => setHealthInfo({ ...healthInfo, hasAcuteIllness: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-gray-700">患有急性疾病</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={healthInfo.hasChronicDisease}
                    onChange={(e) => setHealthInfo({ ...healthInfo, hasChronicDisease: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700">患有慢性疾病</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={healthInfo.isImmunocompromised}
                    onChange={(e) => setHealthInfo({ ...healthInfo, isImmunocompromised: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-700">免疫功能低下</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-blue-500" />
                  近期接种日期（如有）
                </label>
                <input
                  type="date"
                  value={healthInfo.recentVaccinationDate}
                  onChange={(e) => setHealthInfo({ ...healthInfo, recentVaccinationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">与其他疫苗需间隔至少14天</p>
              </div>

              <button
                onClick={handleScreening}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                执行禁忌筛查
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              筛查结果
            </h2>
            {screeningResult === null ? (
              <div className="text-center py-12 text-gray-400">
                <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>请填写健康信息并点击筛查按钮</p>
              </div>
            ) : (
              <div className="space-y-4">
                {screeningResult.hasContraindication ? (
                  <ResultCard
                    type="danger"
                    title="存在接种禁忌"
                    message="检测到明确的接种禁忌，不建议接种"
                    suggestion="请咨询医生，待身体状况恢复后再进行接种"
                  />
                ) : screeningResult.warnings.length > 0 && screeningResult.warnings[0] !== '未发现明显接种禁忌' ? (
                  <ResultCard
                    type="warning"
                    title="存在注意事项"
                    message="检测到一些需要关注的健康情况"
                    suggestion="建议经医生评估后决定是否接种"
                  />
                ) : (
                  <ResultCard
                    type="success"
                    title="筛查通过"
                    message="未发现明显接种禁忌"
                    suggestion="可以正常接种，接种后请留观30分钟"
                  />
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">详细评估：</h4>
                  {screeningResult.warnings.map((warning, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700 text-sm">
                        <span className="font-medium text-blue-600">{index + 1}.</span> {warning}
                      </p>
                      {screeningResult.suggestions[index] && (
                        <p className="text-gray-600 text-sm mt-1 ml-5">
                          → {screeningResult.suggestions[index]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    接种须知
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 接种后请在现场留观30分钟</li>
                    <li>• 接种部位24小时内保持干燥</li>
                    <li>• 多喝水，避免剧烈运动</li>
                    <li>• 如有不适请及时就医</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showResultModal && selectedAppointment?.screeningResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                历史筛查结果
              </h3>
              <button
                onClick={() => setShowResultModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">受种者：</span>
                    <span className="font-medium text-gray-800">{selectedAppointment.patientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">疫苗类型：</span>
                    <span className="font-medium text-gray-800">{selectedAppointment.vaccineType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">筛查时间：</span>
                    <span className="font-medium text-gray-800">{selectedAppointment.screeningTime ? formatDateTime(selectedAppointment.screeningTime) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">筛查状态：</span>
                    <span className={cn(
                      'font-medium',
                      selectedAppointment.status === 'screening_passed' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {selectedAppointment.status === 'screening_passed' ? '筛查通过' : '筛查未通过'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedAppointment.screeningResult.hasContraindication ? (
                <ResultCard
                  type="danger"
                  title="存在接种禁忌"
                  message="检测到明确的接种禁忌，不建议接种"
                  suggestion="请咨询医生，待身体状况恢复后再进行接种"
                />
              ) : selectedAppointment.screeningResult.warnings.length > 0 && selectedAppointment.screeningResult.warnings[0] !== '未发现明显接种禁忌' ? (
                <ResultCard
                  type="warning"
                  title="存在注意事项"
                  message="检测到一些需要关注的健康情况"
                  suggestion="建议经医生评估后决定是否接种"
                />
              ) : (
                <ResultCard
                  type="success"
                  title="筛查通过"
                  message="未发现明显接种禁忌"
                  suggestion="可以正常接种，接种后请留观30分钟"
                />
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">详细评估：</h4>
                {selectedAppointment.screeningResult.warnings.map((warning, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium text-blue-600">{index + 1}.</span> {warning}
                    </p>
                    {selectedAppointment.screeningResult?.suggestions[index] && (
                      <p className="text-gray-600 text-sm mt-1 ml-5">
                        → {selectedAppointment.screeningResult.suggestions[index]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowResultModal(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Validation;
