import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Banknote, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { Client, Invoice, Advance, Application } from '../types';

interface DashboardViewProps {
  clients: Client[];
  invoices: Invoice[];
  advances: Advance[];
  applications: Application[];
  onNavigate: (view: any) => void;
}

export default function DashboardView({ 
  clients, 
  invoices, 
  advances, 
  applications,
  onNavigate 
}: DashboardViewProps) {
  
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Compute live metrics dynamically from database state
  const totalClientsCount = clients.length;
  
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDIENTE');
  const pendingInvoicesCount = pendingInvoices.length;
  const pendingInvoicesAmount = pendingInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  
  // Total available advances (USD or original currency)
  const availableAdvances = advances.filter(a => a.status === 'DISPONIBLE');
  const totalAdvancesAmount = availableAdvances.reduce((sum, adv) => sum + adv.remainingAmount, 0);

  // Total in BSS (from verified advances and applications)
  const totalBSSAmount = availableAdvances.reduce((sum, adv) => sum + adv.remainingAmount * adv.rateBCV, 0);

  // Method payments distribution calculation
  const paymentMethodsList = ['Zelle', 'Transferencia BSS', 'Efectivo', 'Euro', 'Pesos', 'Binance'];
  const methodDist = paymentMethodsList.map(method => {
    const totalVal = advances
      .filter(a => a.paymentType === method && a.status === 'DISPONIBLE')
      .reduce((sum, a) => sum + a.remainingAmount, 0);
    return { name: method, value: totalVal };
  });
  
  const totalMethodsSum = methodDist.reduce((sum, m) => sum + m.value, 0) || 1;

  // Helper to fetch smart suggestions from Gemini
  const fetchAiSuggestions = () => {
    setIsAiLoading(true);
    fetch('/api/ai/suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((res) => res.json())
      .then((data) => {
        setAiSuggestion(data.suggestion);
        setIsAiLoading(false);
      })
      .catch(() => {
        setAiSuggestion('No se pudo establecer conexión con el auditor fiscal Gemini. Inténtelo de nuevo.');
        setIsAiLoading(false);
      });
  };

  useEffect(() => {
    fetchAiSuggestions();
  }, []);

  // Super robust Markdown renderer inside component for bulleted summaries
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="font-sans font-bold text-base text-slate-900 mt-4 mb-2">{trimmed.replace('###', '')}</h4>;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        let content = trimmed.substring(1).trim();
        let parts = content.split('**');
        return (
          <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-700 leading-relaxed list-none mt-2">
            <span className="text-amber-500 font-bold mt-1 text-sm">•</span>
            <span className="flex-1">
              {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-slate-950">{p}</strong> : p)}
            </span>
          </li>
        );
      }
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mt-1.5">{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Bento Grid Metrics Indicator */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1: Total Clientes */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-black/15 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 rounded-xl text-black">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-emerald-700 font-sans text-xs font-bold bg-emerald-50 border border-emerald-100/60 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Activo
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Clientes Totales</h3>
          <p className="font-sans font-black text-4xl text-slate-900 mt-2 tracking-tight">
            {totalClientsCount.toLocaleString()}
          </p>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Metric Card 2: Facturas Pendientes */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-black/15 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-red-700 text-xs font-bold bg-red-50 border border-red-100/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
              En Cartera
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Facturas Pendientes</h3>
          <p className="font-sans font-black text-4xl text-slate-900 mt-2 tracking-tight">
            {pendingInvoicesCount}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Monto: <span className="font-extrabold text-slate-900 font-mono">${pendingInvoicesAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} USD</span>
          </p>
        </div>

        {/* Metric Card 3: Anticipos Totales */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-black/15 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-blue-800 text-xs font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              FIFO Listo
            </span>
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Anticipos Disponibles</h3>
          <p className="font-sans font-black text-4xl text-slate-900 mt-2 tracking-tight">
            ${totalAdvancesAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Cambio: <span className="font-extrabold text-slate-900 font-mono">Bs. {totalBSSAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} BSS</span>
          </p>
        </div>
      </section>

      {/* Main Layout Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Activities (List) - 8 columns */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[480px]">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-sans font-bold text-base text-slate-900">Historial y Cobros de Clientes</h2>
              <p className="text-xs text-slate-500 mt-0.5">Listado general de facturas registradas en la cartera contable</p>
            </div>
            <button 
              onClick={() => onNavigate('clientes')}
              className="px-4 py-2 border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Ver Clientes
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.length > 0 ? (
                  invoices.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-800">
                        {row.clientName}
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-mono font-bold text-xs">
                        {row.reference}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-slate-950">
                        ${row.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          row.status === 'PAGADO' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                            : 'bg-red-50 text-red-700 border border-red-150'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">No hay registros de facturas disponibles.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Chart and AI Advice - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Payment Methods split */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-sans font-bold text-sm text-slate-900 mb-1">Métodos de Cobro</h3>
            <p className="text-xs text-slate-500 mb-4">Distribución del saldo a favor de anticipos verificados</p>
            
            <div className="space-y-4 font-sans text-xs">
              {methodDist.map((m) => {
                const pct = Math.round((m.value / totalMethodsSum) * 100) || 0;
                return (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-700 text-[10px] uppercase">
                      <span>{m.name}</span>
                      <span>${m.value.toLocaleString('es-MX')} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                      <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Suggestion box */}
          <div className="bg-black text-white rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
            {/* Ambient gold glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl"></div>

            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h4 className="font-sans font-bold text-sm text-amber-200">Sugerencia AI Auditor</h4>
              </div>
              <button 
                onClick={fetchAiSuggestions}
                disabled={isAiLoading}
                title="Actualizar análisis Gemini"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin': ''}`} />
              </button>
            </div>

            {isAiLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-[10px] text-amber-300 uppercase tracking-widest font-bold">Consultando a Gemini...</p>
              </div>
            ) : (
              <div className="space-y-1 bg-white/5 rounded-xl p-4 border border-white/10 max-h-[290px] overflow-y-auto font-medium">
                {renderMarkdown(aiSuggestion)}
              </div>
            )}

            <button 
              onClick={() => onNavigate('aprobaciones')}
              className="w-full mt-5 py-3 bg-amber-400 hover:bg-amber-300 text-black font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              Auditar Saldos de Tesorería
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}
