import React, { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  CalendarCheck,
  Users,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { formatDateTime } from '../utils/businessLogic';
import type { DashboardStats } from '../../shared/types';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: string;
}> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {trend && (
          <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { getDashboardStats, refreshBatchStatuses } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    refreshBatchStatuses();
    setStats(getDashboardStats());
  }, [refreshBatchStatuses, getDashboardStats]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="库存总量"
          value={stats.totalInventory.toLocaleString()}
          icon={Package}
          color="text-[#165DFF]"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="临期预警"
          value={stats.warningBatches}
          icon={AlertTriangle}
          color="text-[#FF7D00]"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="今日预约"
          value={stats.todayAppointments}
          icon={CalendarCheck}
          color="text-[#00B42A]"
          bgColor="bg-green-50"
        />
        <StatCard
          title="今日完成"
          value={stats.todayCompleted}
          icon={Users}
          color="text-[#722ED1]"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">近7日接种趋势</h3>
            <span className="text-sm text-gray-500">单位：人次</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#165DFF"
                  strokeWidth={3}
                  dot={{ fill: '#165DFF', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#colorCount)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">最近出库记录</h3>
            <span className="text-xs text-[#165DFF] cursor-pointer hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="space-y-4">
            {stats.recentOutbounds.map((record, index) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 bg-[#165DFF]/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#165DFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {record.vaccineName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.batchNo} · 出库 {record.quantity} 剂
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatDateTime(record.outboundTime).split(' ')[1]}
                  </p>
                  <p className="text-xs text-gray-400">
                    {record.operator}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#FF7D00] to-[#FF9A2E] rounded-xl p-6 text-white shadow-lg shadow-orange-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                临期预警提醒
              </h3>
              <p className="text-white/80 text-sm mb-4">
                以下批次将在30天内过期，请优先安排出库使用
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">{stats.warningBatches}</span>
                <span className="text-sm">个批次需要关注</span>
              </div>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 opacity-50" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#165DFF] to-[#367BFF] rounded-xl p-6 text-white shadow-lg shadow-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                今日接种安排
              </h3>
              <p className="text-white/80 text-sm mb-4">
                今日已有 {stats.todayAppointments} 人预约，已完成 {stats.todayCompleted} 人接种
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.todayAppointments > 0 ? (stats.todayCompleted / stats.todayAppointments) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.todayAppointments > 0
                    ? Math.round((stats.todayCompleted / stats.todayAppointments) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <CalendarCheck className="w-10 h-10 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
