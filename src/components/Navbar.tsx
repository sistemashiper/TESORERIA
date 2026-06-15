import React from 'react';
import { Menu, Bell, User as UserIcon, Sparkles } from 'lucide-react';
import { ViewType } from '../types';

interface NavbarProps {
  currentView: ViewType;
  onMobileMenuToggle: () => void;
  titleOverride?: string;
  onNavigate: (view: ViewType) => void;
  userName: string;
}

export default function Navbar({ currentView, onMobileMenuToggle, titleOverride, onNavigate, userName }: NavbarProps) {
  // Returns appropriate title based on current visible view
  const getHeaderTitle = () => {
    if (titleOverride) return titleOverride;
    switch (currentView) {
      case 'dashboard':
        return 'Panel de Administración';
      case 'clientes':
      case 'nuevo-cliente':
        return 'Gestión de Clientes';
      case 'nuevo-registro':
        return 'Nuevo Registro Financiero';
      case 'conciliacion':
        return 'Conciliación FIFO';
      case 'reportes':
        return 'Centro de Reportes';
      case 'usuarios':
        return 'Control de Usuarios';
      case 'caja':
        return 'Control de Caja y Turnos';
      case 'aprobaciones':
        return 'Aprobaciones de Tesorería';
      case 'auditoria':
        return 'Auditoría de Gerencia';
      default:
        return 'Contabilidad Pro';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-10 py-4 flex justify-between items-center w-full lg:ml-72 lg:w-[calc(100%-18rem)] transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100/80 rounded-xl transition-colors active:scale-95"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>
        <h1 className="font-sans font-bold text-lg md:text-xl text-slate-900 tracking-tight leading-none uppercase">
          {getHeaderTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Sync Status - desktop only */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Global Sync</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2 py-0.5 rounded-full font-extrabold uppercase mt-1 tracking-widest animate-pulse">
            Cloud Online
          </span>
        </div>

        {/* Floating suggestion notification trigger button */}
        <button
          onClick={() => onNavigate('dashboard')}
          title="Ver Sugerencias AI"
          className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-amber-600 relative group"
        >
          <Sparkles className="w-5 h-5 animate-bounce-subtle" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
        </button>

        {/* Notifications */}
        <button className="p-2 hover:bg-slate-100/80 rounded-xl transition-colors text-slate-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200/80"></div>

        {/* Exec Profile Circle */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-100 pr-3.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 overflow-hidden shadow-inner group-hover:scale-95 transition-transform">
            <UserIcon className="w-4 h-4 text-slate-700" />
          </div>
          <span className="hidden md:block text-xs font-bold text-slate-800 tracking-tight">{userName}</span>
        </div>
      </div>
    </header>
  );
}
