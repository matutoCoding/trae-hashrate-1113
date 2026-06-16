import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Syringe,
  PackageCheck,
  CalendarDays,
  AlertTriangle,
  LogOut,
  User,
  Search,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: '首页仪表盘', icon: LayoutDashboard },
  { path: '/vaccine-batches', label: '疫苗批次管理', icon: Syringe },
  { path: '/outbound', label: '效期出库管理', icon: PackageCheck },
  { path: '/schedule', label: '接种排期管理', icon: CalendarDays },
  { path: '/validation', label: '冲突校验中心', icon: AlertTriangle },
  { path: '/trace', label: '接种追溯查询', icon: Search },
  { path: '/recall', label: '疫苗召回管理', icon: ShieldAlert },
  { path: '/statistics', label: '接种统计看板', icon: BarChart3 }
];

export const Layout: React.FC = () => {
  const { currentUser, logout } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-[#165DFF] flex items-center gap-2">
            <Syringe className="w-6 h-6" />
            疫苗接种管理
          </h1>
          <p className="text-xs text-gray-500 mt-1">社区接种点管理系统</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#165DFF] text-white shadow-md shadow-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#165DFF]'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-[#165DFF] rounded-full flex items-center justify-center text-white font-medium">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">
                {currentUser.role === 'admin'
                  ? '管理员'
                  : currentUser.role === 'doctor'
                  ? '接种医护'
                  : '前台登记'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find((n) => n.path === window.location.pathname)?.label || '系统'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
