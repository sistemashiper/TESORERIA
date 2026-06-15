import React, { useState } from 'react';
import { 
  Scale, 
  Receipt, 
  Banknote, 
  HelpCircle, 
  ArrowRight,
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Client, Invoice, Advance, Application } from '../types';

interface ConciliacionViewProps {
  clients: Client[];
  invoices: Invoice[];
  advances: Advance[];
  onExecuteReconciliation: (clientId: string) => Promise<{
    amountApplied: number;
    applications: Application[];
  }>;
}

export default function ConciliacionView({ 
  clients, 
  invoices, 
  advances,
  onExecuteReconciliation 
}: ConciliacionViewProps) {
  
  // Set default client to C-40912 (Global Logistics S.A.) to perfectly align with screenshots
  const [selectedClientId, setSelectedClientId] = useState('C-40912');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reconciledResult, setReconciledResult] = useState({
    amountApplied: 0,
    appsCount: 0,
    clientName: ''
  });

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  // Outstanding invoices for the selected client (unpaid amount > 0, status PENDIENTE)
  const clientInvoices = invoices
    .filter(inv => inv.clientId === selectedClientId && inv.status === 'PENDIENTE' && inv.remainingAmount > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Available advances for the selected client (unapplied amount > 0, status DISPONIBLE)
  const clientAdvances = advances
    .filter(adv => adv.clientId === selectedClientId && adv.status === 'DISPONIBLE' && adv.remainingAmount > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculates FIFO matching potential client-side for immediate stats feedback
  const calculateFifoPotential = () => {
    let invoiceQueue = clientInvoices.map(inv => inv.remainingAmount);
    let advanceQueue = clientAdvances.map(adv => adv.remainingAmount);
    
    let potential = 0;
    let invIdx = 0;
    let advIdx = 0;

    while (invIdx < invoiceQueue.length && advIdx < advanceQueue.length) {
      const matched = Math.min(invoiceQueue[invIdx], advanceQueue[advIdx]);
      potential += matched;
      invoiceQueue[invIdx] -= matched;
      advanceQueue[advIdx] -= matched;

      if (invoiceQueue[invIdx] === 0) invIdx++;
      if (advanceQueue[advIdx] === 0) advIdx++;
    }
    return potential;
  };

  const potentialApplied = calculateFifoPotential();

  // Outstanding totals for metrics
  const totalInvoicesSum = clientInvoices.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalAdvancesSum = clientAdvances.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const handleExecute = () => {
    if (potentialApplied <= 0) {
      alert('No hay saldos o anticipos aplicables para conciliar para este cliente.');
      return;
    }

    setIsProcessing(true);
    
    onExecuteReconciliation(selectedClientId)
      .then((res) => {
        setTimeout(() => {
          setIsProcessing(false);
          setReconciledResult({
            amountApplied: res.amountApplied,
            appsCount: res.applications.length,
            clientName: selectedClient.name
          });
          setShowSuccessModal(true);
        }, 1500); // realistic premium feeling lag
      })
      .catch((err) => {
        setIsProcessing(false);
        alert('Ocurrió un error al procesar la conciliación.');
      });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Client selector filter options header */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 dark:border-slate-200">
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase leading-none">Módulo de Tesorería</p>
          <h2 className="font-sans font-bold text-lg text-slate-900 leading-none">Procesamiento de Conciliación Automática</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1">CLIENTE SELECCIONADO</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-bold text-slate-800 uppercase tracking-wide outline-none focus:ring-4 focus:ring-slate-100 focus:border-black cursor-pointer shadow-inner w-56"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExecute}
            disabled={isProcessing || potentialApplied <= 0}
            className="sm:mt-4 px-6 py-3.5 bg-black hover:bg-slate-900 text-white disabled:opacity-30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 group transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin': 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {isProcessing ? 'Procesando...' : 'Ejecutar Conciliación'}
          </button>
        </div>
      </section>

      {/* Metrics indicator banner of client matching fields */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Facturas Pendientes</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 text-slate-900">
            <span className="font-sans font-black text-2xl">${totalInvoicesSum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className="text-red-600 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100/50 uppercase tracking-widest">{clientInvoices.length} items</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anticipos no Aplicados</span>
            <Banknote className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 text-slate-900">
            <span className="font-sans font-black text-2xl">${totalAdvancesSum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className="text-emerald-700 text-[10px] font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50 uppercase tracking-widest">{clientAdvances.length} items</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Potencial de Conciliación</span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 text-slate-900">
            <span className="font-sans font-black text-2xl">${potentialApplied.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span className="text-blue-800 text-[10px] font-extrabold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/50 uppercase tracking-widest">Máx. FIFO</span>
          </div>
        </div>

      </section>

      {/* Main Split View Ledger Lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Outstanding Invoices List - Left Column */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[480px]">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <span className="font-sans font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Facturas Pendientes
            </span>
            <span className="bg-slate-200/90 px-3 py-1 rounded-full text-[9px] font-extrabold text-slate-600 tracking-wider uppercase">Por Fecha Asc.</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3.5">Factura</th>
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5 text-right">Remanente</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientInvoices.length > 0 ? (
                  clientInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800 font-mono text-xs">{inv.reference}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs font-medium">{inv.date}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">${inv.remainingAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          inv.isUrgente ? 'bg-red-50 text-red-700 border border-red-100': 'bg-slate-100 text-slate-600'
                        }`}>
                          {inv.isUrgente ? 'VENCIDA' : 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">No hay facturas pendientes registradas para este cliente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Advances List - Right Column */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[480px]">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <span className="font-sans font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Anticipos Disponibles
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase">LIQUIDEZ ALTA</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3.5">Ref. Pago</th>
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5 text-right">Disponible</th>
                  <th className="px-5 py-3.5 text-center">Prioridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientAdvances.length > 0 ? (
                  clientAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800 font-mono text-xs">{adv.reference}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs font-medium">{adv.date}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">${adv.remainingAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mx-auto border border-slate-200"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">No hay anticipos inactivos o disponibles para este cliente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* Flowchart Diagram visual simulation card */}
      <section className="bg-slate-50 border border-slate-200 p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-slate-200/50 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-3">
            <h5 className="font-sans font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              Simulación FIFO Inteligente
            </h5>
            {potentialApplied > 0 && clientInvoices.length > 0 && clientAdvances.length > 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                El algoritmo aplicará automáticamente el anticipo{' '}
                <strong className="text-black font-extrabold">{clientAdvances[0].reference} (${clientAdvances[0].remainingAmount.toLocaleString('es-MX')})</strong>{' '}
                contra la factura{' '}
                <strong className="text-black font-extrabold">{clientInvoices[0].reference} (${clientInvoices[0].remainingAmount.toLocaleString('es-MX')})</strong>{' '}
                saldándola en orden cronológico directo. Los sobrantes por aplicar se distribuirán en cascada de antigüedad.
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No hay suficientes saldos complementarios activos para simular una secuencia FIFO.</p>
            )}
            
            <div className="flex gap-4 font-sans text-[10px] font-bold uppercase tracking-wider bg-white p-2.5 rounded-xl border border-slate-100/50 w-fit">
              <div className="flex items-center gap-1 text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
                Precisión: 100%
              </div>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-1 text-slate-500">
                <RefreshCw className="w-3.5 h-3.5" />
                Doble Validación
              </div>
            </div>
          </div>

          {/* Graphical diagram nodes */}
          <div className="w-full md:w-auto">
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 flex items-center gap-8 shadow-sm">
              <div className="text-center font-sans">
                <p className="text-[9px] font-bold text-slate-400 mb-1">ORIGEN</p>
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-md">
                  <Banknote className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              
              <div className="flex-1 flex items-center select-none">
                <div className="h-0.5 w-16 bg-gradient-to-r from-black to-slate-200 relative">
                  <span className="absolute -top-1 left-1/2 w-2.5 h-2.5 bg-black rounded-full animate-ping"></span>
                </div>
              </div>

              <div className="text-center font-sans">
                <p className="text-[9px] font-bold text-slate-400 mb-1">DESTINO</p>
                <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-400">
                  <Receipt className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal Dialogue panel (Screenshot 4 overlay) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 transform transition-transform animate-scale-up text-center">
            
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileCheck className="w-8 h-8" />
            </div>

            <h3 className="font-sans font-black text-xl text-slate-900 mb-2">Conciliación Exitosa</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
              Se han conciliado <span className="font-bold text-black">{reconciledResult.appsCount} registros</span> para la cuenta{' '}
              <strong className="text-black font-extrabold">{reconciledResult.clientName}</strong>. El saldo total aplicado por prioridad FIFO es de{' '}
              <span className="text-emerald-700 font-extrabold font-mono">${reconciledResult.amountApplied.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full mt-6 bg-black text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition-colors shadow-md active:scale-95"
            >
              Cerrar y Actualizar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
