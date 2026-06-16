import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  User,
  Phone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Settings,
  CalendarCheck,
  Clock,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../utils/businessLogic';
import { vaccineTypes } from '../utils/mockData';
import type { TimeSlot, Appointment, VaccinationStation } from '../../shared/types';
import { cn } from '../lib/utils';

const SlotStatusBadge: React.FC<{ status: TimeSlot['status'] }> = ({ status }) => {
  const styles: Record<TimeSlot['status'], string> = {
    available: 'bg-green-100 text-green-700 border-green-200',
    booked: 'bg-blue-100 text-blue-700 border-blue-200',
    locked: 'bg-gray-100 text-gray-500 border-gray-200'
  };

  const labels: Record<TimeSlot['status'], string> = {
    available: '可预约',
    booked: '已预约',
    locked: '已锁定'
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', styles[status])}>
      {labels[status]}
    </span>
  );
};

const AppointmentStatusBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
  const styles: Record<Appointment['status'], string> = {
    booked: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500'
  };

  const labels: Record<Appointment['status'], string> = {
    booked: '已预约',
    completed: '已完成',
    cancelled: '已取消'
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
};

export const Schedule: React.FC = () => {
  const {
    stations,
    appointments,
    selectedDate,
    selectedStationId,
    setSelectedDate,
    setSelectedStationId,
    addStation,
    updateStation,
    deleteStation,
    getSlotsForDate,
    createAppointment,
    cancelAppointment,
    completeAppointment,
    checkConflict
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'schedule' | 'stations' | 'appointments'>('schedule');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<VaccinationStation | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null);
  const [stationName, setStationName] = useState('');
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    patientIdCard: '',
    phone: '',
    vaccineType: vaccineTypes[0]
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dateOffset, setDateOffset] = useState(0);

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + dateOffset);
  const displayDate = formatDate(currentDate);

  useEffect(() => {
    if (selectedStationId) {
      setSlots(getSlotsForDate(selectedStationId, displayDate));
    }
  }, [selectedStationId, displayDate, getSlotsForDate]);

  useEffect(() => {
    setSelectedDate(displayDate);
  }, [displayDate, setSelectedDate]);

  useEffect(() => {
    if (stations.length > 0 && !selectedStationId) {
      const activeStation = stations.find((s) => s.status === 'active');
      if (activeStation) {
        setSelectedStationId(activeStation.id);
      }
    }
  }, [stations, selectedStationId, setSelectedStationId]);

  const activeStations = stations.filter((s) => s.status === 'active');

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
      setShowBookingModal(true);
      setBookingForm({
        patientName: '',
        patientIdCard: '',
        phone: '',
        vaccineType: vaccineTypes[0]
      });
      setErrorMessage('');
    }
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) return;

    const conflictResult = checkConflict(
      selectedSlot.stationId,
      selectedSlot.date,
      selectedSlot.startTime,
      selectedSlot.endTime
    );

    if (conflictResult.hasConflict) {
      setErrorMessage('该时段存在冲突，请选择其他时段');
      return;
    }

    const result = createAppointment({
      slotId: selectedSlot.id,
      ...bookingForm
    });

    if (result.success) {
      setSuccessMessage('预约成功！');
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSlots(getSlotsForDate(selectedStationId!, displayDate));

      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStation) {
      updateStation(editingStation.id, { name: stationName });
    } else {
      addStation(stationName);
    }

    setShowStationModal(false);
    setEditingStation(null);
    setStationName('');
  };

  const handleEditStation = (station: VaccinationStation) => {
    setEditingStation(station);
    setStationName(station.name);
    setShowStationModal(true);
  };

  const handleConfirmCancel = () => {
    if (confirmCancel) {
      cancelAppointment(confirmCancel.id);
      setConfirmCancel(null);
      setSlots(getSlotsForDate(selectedStationId!, displayDate));
      setSuccessMessage('退约成功，时段已释放');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getAppointmentForSlot = (slotId: string) => {
    return appointments.find((a) => a.slotId === slotId && a.status !== 'cancelled');
  };

  const todayAppointments = appointments.filter((a) => {
    const slot = slots.find((s) => s.id === a.slotId);
    return slot?.date === displayDate && a.status !== 'cancelled';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">接种排期管理</h2>
          <p className="text-gray-500 mt-1">管理接种位、时段预约和退约处理</p>
        </div>
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'schedule'
                ? 'bg-[#165DFF] text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            <CalendarDays className="w-4 h-4" />
            预约排期
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'appointments'
                ? 'bg-[#165DFF] text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            <CalendarCheck className="w-4 h-4" />
            预约记录
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
              {todayAppointments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'stations'
                ? 'bg-[#165DFF] text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            <Settings className="w-4 h-4" />
            接种位配置
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">选择接种位</h3>
              <div className="space-y-2">
                {activeStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left',
                      selectedStationId === station.id
                        ? 'border-[#165DFF] bg-[#165DFF]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className={cn(
                      'font-medium',
                      selectedStationId === station.id ? 'text-[#165DFF]' : 'text-gray-800'
                    )}>
                      {station.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">运行中</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setDateOffset(dateOffset - 1)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {currentDate.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </h3>
                    <button
                      onClick={() => setDateOffset(dateOffset + 1)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setDateOffset(0)}
                      className="px-3 py-1.5 text-sm bg-[#165DFF]/10 text-[#165DFF] rounded-lg hover:bg-[#165DFF]/20 transition-colors"
                    >
                      今天
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-600">可预约</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600">已预约</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-gray-600">已锁定</span>
                    </div>
                  </div>
                </div>

                {!selectedStationId ? (
                  <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">请先选择接种位</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {slots.map((slot) => {
                      const appointment = getAppointmentForSlot(slot.id);
                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all relative group',
                            slot.status === 'available' &&
                              'border-gray-200 hover:border-[#165DFF] hover:bg-[#165DFF]/5 cursor-pointer',
                            slot.status === 'booked' && 'border-blue-200 bg-blue-50/50',
                            slot.status === 'locked' && 'border-gray-200 bg-gray-50 opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Clock className={cn(
                              'w-4 h-4',
                              slot.status === 'available' ? 'text-gray-400' :
                              slot.status === 'booked' ? 'text-blue-500' : 'text-gray-400'
                            )} />
                            <SlotStatusBadge status={slot.status} />
                          </div>
                          <p className={cn(
                            'text-lg font-semibold',
                            slot.status === 'booked' ? 'text-blue-700' : 'text-gray-800'
                          )}>
                            {slot.startTime}
                          </p>
                          <p className="text-sm text-gray-500">- {slot.endTime}</p>
                          {appointment && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="text-xs font-medium text-blue-700 truncate">
                                {appointment.patientName}
                              </p>
                              <p className="text-xs text-blue-600/70">
                                {appointment.vaccineType}
                              </p>
                              <div className="flex gap-1 mt-2">
                                {appointment.status === 'booked' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        completeAppointment(appointment.id);
                                        setSlots(getSlotsForDate(selectedStationId!, displayDate));
                                        setSuccessMessage('接种已完成');
                                        setTimeout(() => setSuccessMessage(''), 3000);
                                      }}
                                      className="flex-1 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                    >
                                      完成
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmCancel(appointment);
                                      }}
                                      className="flex-1 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                    >
                                      退约
                                    </button>
                                  </>
                                )}
                                {appointment.status === 'completed' && (
                                  <span className="text-xs text-green-600 font-medium">✓ 已完成</span>
                                )}
                              </div>
                            </div>
                          )}
                          {slot.vaccineType && slot.status === 'booked' && !appointment && (
                            <p className="text-xs text-blue-600 mt-2">
                              {slot.vaccineType}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              {displayDate} 预约记录
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    时段
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    接种位
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    受种者
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    身份证号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    联系电话
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    疫苗类型
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
                {todayAppointments.map((appointment) => {
                  const slot = slots.find((s) => s.id === appointment.slotId);
                  const station = stations.find((s) => s.id === slot?.stationId);
                  return (
                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-800">
                          {slot?.startTime} - {slot?.endTime}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{station?.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-800">
                          {appointment.patientName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-mono">
                          {appointment.patientIdCard}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{appointment.phone}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#165DFF]">{appointment.vaccineType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AppointmentStatusBadge status={appointment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {appointment.status === 'booked' && (
                            <>
                              <button
                                onClick={() => completeAppointment(appointment.id)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="标记完成"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmCancel(appointment)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="取消预约"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {todayAppointments.length === 0 && (
            <div className="text-center py-12">
              <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">当日暂无预约记录</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">接种位配置</h3>
            <button
              onClick={() => {
                setEditingStation(null);
                setStationName('');
                setShowStationModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E42D2] transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增接种位
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="p-5 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">{station.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          station.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        <span className="text-xs text-gray-500">
                          {station.status === 'active' ? '运行中' : '已停用'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditStation(station)}
                        className="p-2 text-gray-400 hover:text-[#165DFF] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStation(station.id, {
                          status: station.status === 'active' ? 'inactive' : 'active'
                        })}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          station.status === 'active'
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        )}
                      >
                        {station.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteStation(station.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    今日预约：{appointments.filter((a) => {
                      const slot = slots.find((s) => s.id === a.slotId);
                      return slot?.stationId === station.id && slot?.date === displayDate && a.status !== 'cancelled';
                    }).length} 人
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">预约登记</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSlot.date} {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleBooking} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  受种者姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookingForm.patientName}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                  placeholder="请输入受种者姓名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  身份证号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookingForm.patientIdCard}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientIdCard: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] font-mono"
                  placeholder="请输入身份证号"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                  placeholder="请输入联系电话"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  疫苗类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={bookingForm.vaccineType}
                  onChange={(e) => setBookingForm({ ...bookingForm, vaccineType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF] bg-white"
                  required
                >
                  {vaccineTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedSlot(null);
                  }}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E42D2] transition-colors"
                >
                  确认预约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingStation ? '编辑接种位' : '新增接种位'}
              </h3>
              <button
                onClick={() => {
                  setShowStationModal(false);
                  setEditingStation(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddStation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  接种位名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]"
                  placeholder="如：接种位 A"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStationModal(false);
                    setEditingStation(null);
                  }}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E42D2] transition-colors"
                >
                  {editingStation ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">确认退约</h3>
                <p className="text-sm text-gray-500">退约后该时段将重新开放预约</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                受种者：<span className="font-medium">{confirmCancel.patientName}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                疫苗类型：<span className="font-medium">{confirmCancel.vaccineType}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                预约时段：<span className="font-medium">{selectedDate}</span>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认退约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
