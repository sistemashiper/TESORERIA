import React from 'react';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Scale,
  BarChart3,
  LogOut,
  Sparkles,
  Coins
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  userPermissions: string[];
  userName: string;
  userRole: string;
}

export default function Sidebar({ 
  currentView, 
  onNavigate, 
  onLogout,
  userPermissions,
  userName,
  userRole
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: '' },
    { id: 'clientes', label: 'Clientes', icon: Users, perm: 'canRegisterClients' },
    { id: 'nuevo-registro', label: 'Registros', icon: Banknote, perm: 'canRegisterAdvances' },
    { id: 'aprobaciones', label: 'Verificaciones', icon: Scale, perm: 'canVerifyAdvances' },
    { id: 'caja', label: 'Control de Caja', icon: Coins, perm: 'canManageCaja' },
    { id: 'auditoria', label: 'Auditoría', icon: Scale, perm: 'canAuditApplications' },
    { id: 'usuarios', label: 'Usuarios', icon: Users, perm: 'canManageUsers' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, perm: '' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.perm) return true;
    if (item.id === 'aprobaciones') {
      return userPermissions.includes('canVerifyAdvances') || userPermissions.includes('canApplyAdvances');
    }
    if (item.id === 'auditoria') {
      return userPermissions.includes('canAuditApplications') || userPermissions.includes('canAuditCaja');
    }
    return userPermissions.includes(item.perm);
  });

  return (
    <aside className="hidden lg:flex flex-col h-screen w-72 fixed left-0 top-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl z-50 p-6 gap-6">
      {/* Brand logo */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-xl">🏛️</span>
        </div>
        <div className="flex flex-col">
          <span className="font-sans font-extrabold text-base tracking-tight text-slate-900 leading-none">Contabilidad Pro</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 opacity-80">Enterprise OS</span>
        </div>
      </div>

      {/* Navigation options */}
      <nav className="flex flex-col gap-1.5 flex-grow font-sans font-medium text-sm">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'clientes' && currentView === 'nuevo-cliente');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewType)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-black text-white shadow-md font-bold'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-black'}`} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile area & Meta Info */}
      <div className="mt-auto pt-6 border-t border-slate-200/60 flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              alt="Admin Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_6pkVMZjzTLYI7n13Upg_NxcOOIBnDP4Gru0x6a19Q61e8V8o9hC-qiN7g4LcR50aqZGGort2a_nNxPnYaNKtvv1YLdFCnY3D2TbgeP_zatpbmHLC1j5P3VCaTnmshOQUhMhfGtDnkODloxNBm-bJYIfSp3jNoFpa-sXHlewnBPSIHKzlJl3ac1kCx572gi7Mf6Ot5poKk1oMEgoWvpoTpITIEitPOyqQH4-DJ29XsnqULcydwb--_4PyVjB-UequKQ1moZ_-ezS"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sans font-bold text-slate-800 text-sm leading-tight truncate">{userName}</span>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">{userRole}</span>
          </div>
        </div>

        {/* Logout action */}
        <button
          onClick={onLogout}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest opacity-60">System Version 1.2.0</p>
        </div>
      </div>
    </aside>
  );
}
