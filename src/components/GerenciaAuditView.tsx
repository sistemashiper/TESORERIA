import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FolderLock,
  ArrowRight,
  TrendingDown,
  Coins,
  History
} from 'lucide-react';
import { Client, Invoice, Advance, Application, CajaSession, CajaTransaction, CajaClosure } from '../types';

interface GerenciaAuditViewProps {
  applications: Application[];
  onRefresh: () => void;
}

export default function GerenciaAuditView({ applications, onRefresh }: GerenciaAuditViewProps) {
  const [activeTab, setActiveTab] = useState<'contable' | 'cajas'>('contable');
  
  // Caja history state
  const [sessions, setSessions] = useState<CajaSession[]>([]);
  const [transactions, setTransactions] = useState<CajaTransaction[]>([]);
  const [closures, setClosures] = useState<CajaClosure[]>([]);
  const [isCajaLoading, setIsCajaLoading] = useState(false);

  // Audit form states
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingApps = applications.filter(a => a.status === 'PENDIENTE_AUDITORIA');

  const fetchCajaHistory = () => {
    setIsCajaLoading(true);
    fetch('/api/caja/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setTransactions(data.transactions || []);
        setClosures(data.closures || []);
        setIsCajaLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsCajaLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'cajas') {
      fetchCajaHistory();
    }
  }, [activeTab]);

  const handleApproveApp = (id: string) => {
    if (!confirm('¿Está seguro de que desea aprobar y dar de alta contable final a este cruce FIFO?')) return;
    
    setIsSubmitting(true);
    fetch(`/api/transactions/applications/${id}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APROBADO', auditNotes: 'Aprobado por Gerencia' })
    })
      .then(() => {
        setIsSubmitting(false);
        onRefresh();
      })
      .catch((err) => {
        alert(err.message);
        setIsSubmitting(false);
      });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId || !auditNotes) return;

    setIsSubmitting(true);
    fetch(`/api/transactions/applications/${editingAppId}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECHAZADO', auditNotes })
    })
      .then(() => {
        setEditingAppId(null);
        setAuditNotes('');
        setIsSubmitting(false);
        onRefresh();
      })
      .catch((err) => {
        alert(err.message);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6.5 h-6.5 text-black" />
            Panel de Auditoría de Gerencia
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supervise la integridad contable de las aplicaciones FIFO de Tesorería y audite arqueos de caja con cierres Z.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('contable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'contable' 
                ? 'bg-black text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Auditar Conciliaciones
            {pendingApps.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black">{pendingApps.length}</span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('cajas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'cajas' 
                ? 'bg-black text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Supervisar Cierres Caja
          </button>
        </div>
      </div>

      {activeTab === 'contable' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main list of pending applications */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-0.5">Conciliaciones Pendientes de Aprobación Final</h3>

            {pendingApps.length > 0 ? (
              pendingApps.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Left accent bar */}
                  <span className="absolute top-0 left-0 w-2 h-full bg-slate-900"></span>

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                        {app.clientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono">Código: {app.id} • FIFO: {app.advanceReference} contra {app.invoiceReference}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-700 border border-slate-250">
                      Tesorería
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pl-2 font-mono text-[10px] border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold text-[8px]">Monto Aplicado</span>
                      <span className="text-slate-800 font-bold text-sm">${app.amountApplied.toLocaleString('es-MX')} USD</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold text-[8px]">Factor Cambiario</span>
                      <span className="text-slate-800 font-bold text-sm">{app.rateBCV.toFixed(2)} Bs.</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold text-[8px]">Equivalente en BSS</span>
                      <span className="text-slate-800 font-bold text-sm">Bs. {app.amountAppliedBSS.toLocaleString('es-VE')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pl-2 pt-2">
                    <button
                      onClick={() => handleApproveApp(app.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-black text-white hover:bg-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Aprobar (Dar de Alta)
                    </button>
                    <button
                      onClick={() => {
                        setEditingAppId(app.id);
                        setAuditNotes('');
                      }}
                      className="px-4 py-2.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      Rechazar con Nota
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 italic text-xs">
                No hay conciliaciones pendientes de auditoría en este momento.
              </div>
            )}
          </div>

          {/* Reject notes form column - 5 columns */}
          <div className="lg:col-span-5">
            {editingAppId ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-scale-up">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1">
                  <XCircle className="w-4.5 h-4.5 text-red-500" />
                  Observaciones de Rechazo Contable
                </h3>

                <form onSubmit={handleRejectSubmit} className="space-y-4 font-sans">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Describa la inconsistencia o error detectado</label>
                    <textarea
                      required
                      placeholder="Ej. El factor BCV utilizado no coincide con la tasa reportada el día de la transacción..."
                      rows={3}
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all resize-none text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAppId(null)}
                      className="flex-1 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !auditNotes}
                      className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase shadow-sm"
                    >
                      Confirmar Rechazo
                    </button>
                  </div>

                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                <HelpCircle className="w-8 h-8 text-slate-300" />
                <span>Supervise y apruebe las pólizas de amortización. Si encuentra alguna discrepancia, presione "Rechazar con Nota" para devolverla a Tesorería.</span>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Caja closes history review tab */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 leading-none">
              <History className="w-4.5 h-4.5 text-slate-500" />
              Auditoría y Arqueo de Cierres Z
            </h3>
            <button 
              onClick={fetchCajaHistory}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors bg-white shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isCajaLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {sessions.length > 0 ? (
              sessions.map((sess) => {
                const closure = closures.find(c => c.sessionId === sess.id);
                return (
                  <div key={sess.id} className="p-6 hover:bg-slate-50/20 transition-colors font-sans">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex flex-col justify-center items-center font-bold text-slate-700">
                          <span className="text-[9px] leading-none text-slate-400 uppercase">Caja</span>
                          <span className="text-sm font-black font-mono">#{sess.id}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span>Turno Cerrado por {sess.openedBy.split('@')[0]}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              sess.status === 'ABIERTA' 
                                ? 'bg-blue-50 text-blue-800 border border-blue-100'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              {sess.status}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-none">
                            Apertura: {new Date(sess.openedAt).toLocaleString()} • Cierre: {sess.closedAt ? new Date(sess.closedAt).toLocaleString() : 'En curso'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Fondo Inicial</span>
                          <span className="font-mono text-xs font-bold text-slate-800">Bs. {sess.initialBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {closure && (
                          <>
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Monto en Libros</span>
                              <span className="font-mono text-xs font-bold text-slate-800">Bs. {closure.calculatedBalanceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Arqueo Declarado</span>
                              <span className="font-mono text-xs font-bold text-slate-800">Bs. {closure.realBalanceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Faltante/Sobrante</span>
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
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 font-semibold leading-relaxed flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <strong>Notas de Cierre Z:</strong>
                          <p className="mt-0.5 italic">"{closure.notes}"</p>
                        </div>
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

    </div>
  );
}
