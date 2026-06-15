import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Unlock, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  PlusCircle, 
  History, 
  Scale, 
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Coins
} from 'lucide-react';
import { CajaSession, CajaTransaction, CajaClosure } from '../types';

interface CajaModuleViewProps {
  currentUserEmail: string;
}

export default function CajaModuleView({ currentUserEmail }: CajaModuleViewProps) {
  const [activeSession, setActiveSession] = useState<CajaSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CajaSession[]>([]);
  const [transactions, setTransactions] = useState<CajaTransaction[]>([]);
  const [closures, setClosures] = useState<CajaClosure[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Opening form
  const [initialBalance, setInitialBalance] = useState('');
  
  // Transaction form
  const [txType, setTxType] = useState<'Ingreso' | 'Egreso'>('Ingreso');
  const [paymentMethod, setPaymentMethod] = useState<'Punto de Venta' | 'Efectivo' | 'Caja Chica' | 'Vueltos' | 'Zelle' | 'Otro'>('Efectivo');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [rateBCV, setRateBCV] = useState('36.50');
  const [txDesc, setTxDesc] = useState('');

  // Closure Form (Arqueo)
  const [realBalanceBSS, setRealBalanceBSS] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [showClosureModal, setShowClosureModal] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'movimientos' | 'historial'>('movimientos');

  const fetchCajaData = () => {
    setIsLoading(true);
    // Fetch active session
    fetch('/api/caja/session/current')
      .then((res) => res.json())
      .then((data) => {
        if (data.active) {
          setActiveSession(data.session);
        } else {
          setActiveSession(null);
        }
      })
      .catch(console.error);

    // Fetch lists
    fetch('/api/caja/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessionHistory(data.sessions || []);
        setTransactions(data.transactions || []);
        setClosures(data.closures || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    // Fetch daily exchange rates to prefill
    fetch('/api/rates/bcv')
      .then((res) => res.json())
      .then((data) => {
        setRateBCV(data.BCV.toString());
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCajaData();
  }, []);

  const handleOpenCaja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialBalance) return;
    
    fetch('/api/caja/session/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openedBy: currentUserEmail,
        initialBalance: parseFloat(initialBalance)
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al abrir caja');
        return res.json();
      })
      .then((session) => {
        setActiveSession(session);
        setInitialBalance('');
        fetchCajaData();
      })
      .catch((err) => alert(err.message));
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !amount) return;

    fetch('/api/caja/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: activeSession.id,
        type: txType,
        paymentMethod,
        currency,
        amount: parseFloat(amount),
        rateBCV: parseFloat(rateBCV) || 36.50,
        description: txDesc
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al guardar movimiento');
        return res.json();
      })
      .then(() => {
        setAmount('');
        setTxDesc('');
        fetchCajaData();
      })
      .catch((err) => alert(err.message));
  };

  const handleCloseCaja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !realBalanceBSS) return;

    fetch('/api/caja/session/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: activeSession.id,
        realBalanceBSS: parseFloat(realBalanceBSS),
        notes: closureNotes
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cerrar caja');
        return res.json();
      })
      .then(() => {
        setRealBalanceBSS('');
        setClosureNotes('');
        setShowClosureModal(false);
        setActiveSession(null);
        fetchCajaData();
      })
      .catch((err) => alert(err.message));
  };

  // Calculate session active stats
  const activeTxs = activeSession ? transactions.filter(t => t.sessionId === activeSession.id) : [];
  let computedBalanceBSS = activeSession ? activeSession.initialBalance : 0;
  activeTxs.forEach(t => {
    const valBSS = t.amount * t.rateBCV;
    if (t.type === 'Ingreso') {
      computedBalanceBSS += valBSS;
    } else {
      computedBalanceBSS -= valBSS;
    }
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-6.5 h-6.5 text-black" />
            Módulo de Caja y Tesorería
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Controle los ingresos físicos, Zelle, vueltos y cuadre de puntos de venta evitando discrepancias en el arqueo diario.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'movimientos' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Terminal Activo
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'historial' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Historial de Turnos
          </button>
        </div>
      </div>

      {activeTab === 'movimientos' ? (
        <>
          {!activeSession ? (
            /* Open session card */
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center space-y-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-600 border border-slate-200 shadow-inner">
                <FolderLock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">Turno Cerrado</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Debe abrir una sesión de caja para registrar egresos de caja chica, cobros, puntos de venta o vueltos de hoy.
                </p>
              </div>

              <form onSubmit={handleOpenCaja} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Fondo Inicial de Apertura (BSS)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Bs.</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0.00"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-sm font-bold font-mono text-slate-800 outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-slate-900 py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                >
                  <Unlock className="w-4 h-4" />
                  Abrir Turno de Caja
                </button>
              </form>
            </div>
          ) : (
            /* Active session area */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Dashboard and Transactions - 8 columns */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Stats cards row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Apertura de Turno</p>
                    <p className="font-sans font-black text-lg text-slate-800 mt-2 font-mono">
                      Bs. {activeSession.initialBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">Abierto por: {activeSession.openedBy.split('@')[0]}</p>
                  </div>
                  
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Monto Calculado (Libro)</p>
                    <p className="font-sans font-black text-lg text-slate-800 mt-2 font-mono">
                      Bs. {computedBalanceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-emerald-700 font-extrabold mt-1 uppercase bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                      {activeTxs.length} Movimientos
                    </p>
                  </div>

                  <div className="bg-black text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Finalizar Operaciones</p>
                      <p className="text-[10px] text-slate-400 mt-1">Proceda a contar los valores en caja y emitir el reporte Z.</p>
                    </div>
                    <button
                      onClick={() => setShowClosureModal(true)}
                      className="w-full mt-4 bg-white text-black hover:bg-slate-100 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-sm"
                    >
                      Realizar Arqueo Z
                    </button>
                  </div>
                </div>

                {/* Form to add transaction */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <PlusCircle className="w-4.5 h-4.5 text-slate-500" />
                    Registrar Movimiento de Caja
                  </h3>

                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Operación</label>
                        <select
                          value={txType}
                          onChange={(e) => setTxType(e.target.value as 'Ingreso' | 'Egreso')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
                        >
                          <option value="Ingreso">Ingreso (+)</option>
                          <option value="Egreso">Egreso (-)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Método de Cobro</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Punto de Venta">Punto de Venta</option>
                          <option value="Caja Chica">Caja Chica</option>
                          <option value="Vueltos">Vueltos</option>
                          <option value="Zelle">Zelle</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Moneda</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="BSS">BSS (Bs.)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="Pesos">Pesos (COP)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Factor Cambiario</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={rateBCV}
                          onChange={(e) => setRateBCV(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold font-mono text-slate-800"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Monto en Divisa</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currency === 'BSS' ? 'Bs.' : '$'}</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-8 text-xs font-bold font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Concepto / Referencia</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Ingreso de venta de flete - POS Banesco..."
                          value={txDesc}
                          onChange={(e) => setTxDesc(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-black text-white hover:bg-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-98 transition-all"
                    >
                      Guardar Movimiento
                    </button>
                  </form>
                </div>

                {/* Movements list table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[340px]">
                  <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Flujo de Caja del Turno Activo
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-5 py-3">Movimiento</th>
                          <th className="px-5 py-3">Método</th>
                          <th className="px-5 py-3 text-right">Importe Origen</th>
                          <th className="px-5 py-3 text-right">Factor BCV</th>
                          <th className="px-5 py-3 text-right">Equivalente BSS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {activeTxs.length > 0 ? (
                          activeTxs.map((tx) => {
                            const totalBSS = tx.amount * tx.rateBCV;
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    {tx.type === 'Ingreso' ? (
                                      <span className="p-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full">
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <span className="p-1 bg-red-50 text-red-800 border border-red-100 rounded-full">
                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                      </span>
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900">{tx.description}</p>
                                      <p className="text-[9px] text-slate-400 font-semibold">{new Date(tx.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-600">{tx.paymentMethod}</td>
                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">
                                  {tx.amount.toLocaleString('es-MX')} {tx.currency}
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-slate-500">{tx.rateBCV.toFixed(2)}</td>
                                <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                                  {tx.type === 'Ingreso' ? '+' : '-'} Bs. {totalBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">No hay movimientos registrados en este turno aún.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Sidebar Info Audit - 4 columns */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Method summaries panel */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                    Resumen por Métodos de Pago
                  </h4>

                  <div className="space-y-3 font-sans text-xs">
                    {['Efectivo', 'Punto de Venta', 'Caja Chica', 'Vueltos', 'Zelle'].map((method) => {
                      const methodTxs = activeTxs.filter(t => t.paymentMethod === method);
                      let methodSumBSS = 0;
                      methodTxs.forEach(t => {
                        const valBSS = t.amount * t.rateBCV;
                        if (t.type === 'Ingreso') {
                          methodSumBSS += valBSS;
                        } else {
                          methodSumBSS -= valBSS;
                        }
                      });

                      return (
                        <div key={method} className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">{method}</span>
                          <span className={`font-mono font-bold ${methodSumBSS >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                            Bs. {methodSumBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl shadow-inner text-slate-600 space-y-3">
                  <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none">
                    <Scale className="w-4 h-4 text-slate-400" />
                    Regla de Arqueo y Control
                  </h4>
                  <p className="text-[11px] font-medium leading-relaxed">
                    Las discrepancias en caja chica o puntos de venta que no sean debidamente sustentadas y auditadas por Gerencia afectarán los cierres contables mensuales. Asegúrese de realizar conteos manuales dobles.
                  </p>
                </div>

              </div>

            </div>
          )}
        </>
      ) : (
        /* History of closed turns tab */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 leading-none">
              <History className="w-4.5 h-4.5 text-slate-500" />
              Auditoría de Historial de Cajas
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {sessionHistory.length > 0 ? (
              sessionHistory.map((sess) => {
                const closure = closures.find(c => c.sessionId === sess.id);
                return (
                  <div key={sess.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex flex-col justify-center items-center font-bold text-slate-700">
                          <span className="text-[9px] leading-none text-slate-400 uppercase">Caja</span>
                          <span className="text-sm font-black font-mono">#{sess.id}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                            Turno Cerrado por {sess.openedBy.split('@')[0]}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-none">
                            Apertura: {new Date(sess.openedAt).toLocaleString()} • Cierre: {sess.closedAt ? new Date(sess.closedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6 text-right">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none block mb-1">Monto en Apertura</span>
                          <span className="font-mono text-xs font-bold text-slate-800">Bs. {sess.initialBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        {closure && (
                          <>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none block mb-1">Arqueo Declarado</span>
                              <span className="font-mono text-xs font-bold text-slate-800">Bs. {closure.realBalanceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none block mb-1">Discrepancia</span>
                              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-full ${
                                closure.discrepancyBSS === 0 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/50' 
                                  : 'bg-red-50 text-red-700 border border-red-100/50'
                              }`}>
                                {closure.discrepancyBSS > 0 ? '+' : ''}Bs. {closure.discrepancyBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                    </div>

                    {closure && closure.notes && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 font-semibold leading-relaxed">
                        <strong>Notas de Arqueo:</strong> {closure.notes}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-slate-400 italic text-xs">No hay historial de turnos de caja cerrados registrados aún.</div>
            )}
          </div>
        </div>
      )}

      {/* Arqueo y Cierre Z Dialog Modal */}
      {showClosureModal && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 transform transition-transform animate-scale-up text-left">
            
            <div className="w-12 h-12 bg-amber-100 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-center mb-6">
              <FolderLock className="w-6 h-6" />
            </div>

            <h3 className="font-sans font-black text-xl text-slate-900 mb-1">Arqueo de Valores y Cierre Z</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium mb-6">
              Por favor, ingrese el conteo real físico sumando bolívares, Zelle y divisas al factor BCV para verificar el arqueo.
            </p>

            <form onSubmit={handleCloseCaja} className="space-y-4 font-sans">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Balance Computado (Libro):</span>
                  <span className="font-mono font-bold text-slate-900">Bs. {computedBalanceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Saldo Real en Caja Física (BSS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={realBalanceBSS}
                    onChange={(e) => setRealBalanceBSS(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-10 text-sm font-bold font-mono text-slate-800 outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Comentarios u Observaciones de Cierre</label>
                <textarea
                  placeholder="Detalle si hubo descuadres en POS, billetes rotos o faltantes..."
                  rows={2}
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all resize-none text-slate-800 font-medium"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-center hover:bg-slate-50 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-black text-white hover:bg-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider text-center shadow-md active:scale-95"
                >
                  Finalizar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
