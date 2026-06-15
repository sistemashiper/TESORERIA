import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  HelpCircle, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Scale,
  Receipt,
  Banknote,
  Edit3,
  Undo
} from 'lucide-react';
import { Client, Invoice, Advance, Application } from '../types';

interface TesoreriaApprovalViewProps {
  clients: Client[];
  invoices: Invoice[];
  advances: Advance[];
  applications: Application[];
  onRefresh: () => void;
}

export default function TesoreriaApprovalView({ 
  clients, 
  invoices, 
  advances, 
  applications, 
  onRefresh 
}: TesoreriaApprovalViewProps) {
  const [activeTab, setActiveTab] = useState<'validar' | 'aplicar' | 'rechazados'>('validar');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Form states
  const [editingAdvanceId, setEditingAdvanceId] = useState<string | null>(null);
  const [vAmount, setVAmount] = useState('');
  const [vPaymentType, setVPaymentType] = useState('Zelle');
  const [vRateBCV, setVRateBCV] = useState('36.50');
  const [vRef, setVRef] = useState('');
  const [vDesc, setVDesc] = useState('');

  // Application Form states
  const [appClientId, setAppClientId] = useState(clients[0]?.id || '');
  const [appInvoiceId, setAppInvoiceId] = useState('');
  const [appAdvanceId, setAppAdvanceId] = useState('');
  const [appAmount, setAppAmount] = useState('');
  const [appRateBCV, setAppRateBCV] = useState('36.50');

  // Resubmit Form states
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [rAmount, setRAmount] = useState('');
  const [rRateBCV, setRRateBCV] = useState('36.50');

  // Filter lists
  const pendingAdvances = advances.filter(a => a.status === 'PENDIENTE_VALIDACION');
  const availableAdvances = advances.filter(a => a.clientId === appClientId && a.status === 'DISPONIBLE' && a.remainingAmount > 0);
  const pendingInvoices = invoices.filter(i => i.clientId === appClientId && i.status === 'PENDIENTE' && i.remainingAmount > 0);
  const rejectedApps = applications.filter(a => a.status === 'RECHAZADO');

  // Auto-set selects on client change
  useEffect(() => {
    if (pendingInvoices.length > 0) setAppInvoiceId(pendingInvoices[0].id);
    else setAppInvoiceId('');

    if (availableAdvances.length > 0) {
      setAppAdvanceId(availableAdvances[0].id);
      setAppRateBCV(availableAdvances[0].rateBCV.toString());
    } else {
      setAppAdvanceId('');
    }
  }, [appClientId, invoices, advances]);

  const handleOpenVerify = (adv: Advance) => {
    setEditingAdvanceId(adv.id);
    setVAmount(adv.amount.toString());
    setVPaymentType(adv.paymentType);
    setVRateBCV(adv.rateBCV.toString());
    setVRef(adv.reference);
    setVDesc(adv.description);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvanceId) return;

    setIsSubmitting(true);
    const amountNum = parseFloat(vAmount);
    const rateNum = parseFloat(vRateBCV);
    const calculatedBSS = amountNum * rateNum;

    fetch(`/api/transactions/advances/${editingAdvanceId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountNum,
        paymentType: vPaymentType,
        rateBCV: rateNum,
        amountInBSS: calculatedBSS,
        reference: vRef,
        description: vDesc
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al dar de alta anticipo');
        return res.json();
      })
      .then(() => {
        setEditingAdvanceId(null);
        setIsSubmitting(false);
        onRefresh();
      })
      .catch((err) => {
        alert(err.message);
        setIsSubmitting(false);
      });
  };

  const handleRejectAdvance = (id: string) => {
    if (!confirm('¿Está seguro de que desea rechazar este recibo de anticipo?')) return;
    fetch(`/api/transactions/advances/${id}/reject`, { method: 'POST' })
      .then(() => onRefresh())
      .catch(console.error);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appClientId || !appInvoiceId || !appAdvanceId || !appAmount) return;

    setIsSubmitting(true);
    fetch('/api/reconciliation/apply-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: appClientId,
        invoiceId: appInvoiceId,
        advanceId: appAdvanceId,
        amountApplied: parseFloat(appAmount),
        rateBCV: parseFloat(appRateBCV)
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al registrar aplicación');
        return res.json();
      })
      .then(() => {
        setAppAmount('');
        setIsSubmitting(false);
        onRefresh();
        alert('Aplicación guardada. Enviada a Gerencia para auditoría y alta final.');
      })
      .catch((err) => {
        alert(err.message);
        setIsSubmitting(false);
      });
  };

  const handleOpenResubmit = (appRecord: Application) => {
    setEditingAppId(appRecord.id);
    setRAmount(appRecord.amountApplied.toString());
    setRRateBCV(appRecord.rateBCV.toString());
  };

  const handleResubmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId) return;

    setIsSubmitting(true);
    fetch(`/api/transactions/applications/${editingAppId}/resubmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountApplied: parseFloat(rAmount),
        rateBCV: parseFloat(rRateBCV)
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al reenviar aplicación');
        return res.json();
      })
      .then(() => {
        setEditingAppId(null);
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
            <FileCheck className="w-6.5 h-6.5 text-black" />
            Panel de Operaciones de Tesorería
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Valide los abonos informados por Ventas, realice conciliaciones FIFO en bolívares e instrumente correcciones inmediatas.
          </p>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'validar', label: 'Validar Anticipos', badge: pendingAdvances.length },
            { id: 'aplicar', label: 'Aplicar Saldos', badge: 0 },
            { id: 'rechazados', label: 'Rechazos Gerencia', badge: rejectedApps.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-black text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'validar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main verification listing */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-0.5">Anticipos Pendientes de Auditoría de Campo</h3>
            
            {pendingAdvances.length > 0 ? (
              pendingAdvances.map((adv) => (
                <div key={adv.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Atmospheric design accent */}
                  <span className="absolute top-0 left-0 w-2 h-full bg-amber-400"></span>

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                        {adv.clientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono">{adv.reference} • Registrado por: {adv.registeredBy.split('@')[0]}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-100">
                      Ventas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pl-2 font-mono text-[10px] border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Importe Reportado</span>
                      <span className="text-slate-800 font-bold text-sm">${adv.amount.toLocaleString('es-MX')} USD</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Método de Pago</span>
                      <span className="text-slate-800 font-bold text-sm uppercase">{adv.paymentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Factor de Conversión</span>
                      <span className="text-slate-600 font-semibold">{adv.rateBCV.toFixed(2)} BSS</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Equivalente Estimado</span>
                      <span className="text-slate-600 font-semibold">Bs. {adv.amountInBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {adv.description && (
                    <p className="text-[10px] text-slate-500 font-semibold italic pl-2">
                      <strong>Observación:</strong> "{adv.description}"
                    </p>
                  )}

                  {adv.photoUrl && (
                    <div className="pl-2 border border-slate-200 rounded-xl overflow-hidden aspect-video max-w-[240px] bg-slate-50">
                      <img src={adv.photoUrl} alt="Comprobante de Ventas" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex gap-2 pl-2 pt-2">
                    <button
                      onClick={() => handleOpenVerify(adv)}
                      className="px-4 py-2 bg-black text-white hover:bg-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Revisar y Dar de Alta
                    </button>
                    <button
                      onClick={() => handleRejectAdvance(adv.id)}
                      className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                    >
                      Rechazar
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 italic text-xs">
                No hay anticipos pendientes cargados por Ventas en este momento.
              </div>
            )}
          </div>

          {/* Edit / Verify Panel Column - 5 columns */}
          <div className="lg:col-span-5">
            {editingAdvanceId ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-scale-up">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                  Verificación de Datos Contables
                </h3>

                <form onSubmit={handleVerifySubmit} className="space-y-4 font-sans">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Referencia / Folio</label>
                    <input
                      type="text"
                      required
                      value={vRef}
                      onChange={(e) => setVRef(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Monto Real Recibido (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={vAmount}
                      onChange={(e) => setVAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Tipo de Pago Verificado</label>
                    <select
                      value={vPaymentType}
                      onChange={(e) => setVPaymentType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
                    >
                      <option value="Zelle">Zelle (Digital)</option>
                      <option value="Transferencia BSS">Transferencia BSS (Bs.)</option>
                      <option value="Efectivo">Efectivo (USD Físico)</option>
                      <option value="Euro">Euro (€)</option>
                      <option value="Pesos">Pesos (COP)</option>
                      <option value="Binance">Binance USDT</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Tasa Cambiaria Aplicada</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={vRateBCV}
                      onChange={(e) => setVRateBCV(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Descripción de Ajuste</label>
                    <textarea
                      placeholder="Agregue algún comentario aclaratorio..."
                      rows={2}
                      value={vDesc}
                      onChange={(e) => setVDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAdvanceId(null)}
                      className="flex-1 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-black text-white hover:bg-slate-900 rounded-xl text-xs font-bold uppercase shadow-sm"
                    >
                      Dar de Alta
                    </button>
                  </div>

                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                <HelpCircle className="w-8 h-8 text-slate-300" />
                <span>Haga clic en "Revisar y Dar de Alta" para ajustar y habilitar los saldos congelados de Ventas.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'aplicar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form to manual matching application */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Scale className="w-4.5 h-4.5 text-slate-500" />
              Aplicación Cascada de Saldos a Favor (FIFO)
            </h3>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Asignar Cliente</label>
                <select
                  value={appClientId}
                  onChange={(e) => setAppClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 uppercase outline-none focus:ring-4 focus:ring-slate-100"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Saldo Pendiente: ${c.saldoPendiente})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Seleccionar Factura de Deuda</label>
                {pendingInvoices.length > 0 ? (
                  <select
                    value={appInvoiceId}
                    onChange={(e) => setAppInvoiceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800"
                  >
                    {pendingInvoices.map(i => (
                      <option key={i.id} value={i.id}>{i.reference} - Pendiente: ${i.remainingAmount.toLocaleString()} USD ({i.date})</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-500 italic text-center font-semibold">
                    No hay facturas pendientes registradas para este cliente.
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Seleccionar Anticipo Disponible</label>
                {availableAdvances.length > 0 ? (
                  <select
                    value={appAdvanceId}
                    onChange={(e) => {
                      setAppAdvanceId(e.target.value);
                      const adv = availableAdvances.find(a => a.id === e.target.value);
                      if (adv) setAppRateBCV(adv.rateBCV.toString());
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800"
                  >
                    {availableAdvances.map(a => (
                      <option key={a.id} value={a.id}>{a.reference} - Disponible: ${a.remainingAmount.toLocaleString()} USD (Factor: {a.rateBCV.toFixed(2)})</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-500 italic text-center font-semibold">
                    No hay anticipos verificados y disponibles para este cliente.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Monto a Aplicar (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={appAmount}
                    onChange={(e) => setAppAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold font-mono text-slate-800 outline-none focus:ring-4 focus:ring-slate-100"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Factor Cambiario de Aplicación</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={appRateBCV}
                    onChange={(e) => setAppRateBCV(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !appInvoiceId || !appAdvanceId || !appAmount}
                className="w-full bg-black text-white hover:bg-slate-900 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-40"
              >
                Registrar Cruce FIFO
              </button>

            </form>
          </div>

          {/* Quick Stats list - 6 columns */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Información de Conciliación
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Al aplicar un anticipo menor que la factura de deuda, la factura mantendrá el saldo remanente con estatus PENDIENTE de pago. Si el anticipo es mayor, el remanente a favor continuará DISPONIBLE en la ficha del cliente para futuras liquidaciones en cascada contable.
              </p>
              <div className="p-4 bg-white border border-slate-200 rounded-xl leading-relaxed text-[11px] font-medium text-slate-500">
                Las aplicaciones guardadas por Tesorería pasarán a un estatus transitorio de **Pendiente de Auditoría**. Gerencia deberá auditarlas y "Darles de Alta" definitivas para saldar de forma irreversible los libros corporativos.
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'rechazados' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Rejected list */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-0.5">Conciliaciones Rechazadas por Auditoría</h3>

            {rejectedApps.length > 0 ? (
              rejectedApps.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Alert red banner */}
                  <span className="absolute top-0 left-0 w-2 h-full bg-red-500"></span>

                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                        {app.clientName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 font-mono">Código: {app.id} • FIFO: {app.advanceReference} contra {app.invoiceReference}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-100">
                      Rechazado
                    </span>
                  </div>

                  <div className="p-3 bg-red-55/10 border border-red-200 rounded-xl text-xs text-red-700 font-semibold leading-relaxed pl-3 ml-2 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Motivo de Rechazo:</strong>
                      <p className="mt-1 font-medium italic text-[11px] text-red-650">"{app.auditNotes || 'Sin comentarios adicionales.'}"</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pl-2 font-mono text-[9px] border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Importe Aplicado</span>
                      <span className="text-slate-800 font-bold">${app.amountApplied.toLocaleString('es-MX')} USD</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Factor de Cambio</span>
                      <span className="text-slate-800 font-bold">{app.rateBCV.toFixed(2)} Bs.</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-sans font-bold">Total Equivalente</span>
                      <span className="text-slate-800 font-bold">Bs. {app.amountAppliedBSS.toLocaleString('es-VE')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pl-2 pt-2">
                    <button
                      onClick={() => handleOpenResubmit(app)}
                      className="px-4 py-2 bg-black text-white hover:bg-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Undo className="w-3.5 h-3.5" />
                      Editar y Reenviar
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 italic text-xs">
                No hay conciliaciones rechazadas por corregir en este momento.
              </div>
            )}
          </div>

          {/* Resubmit form column - 5 columns */}
          <div className="lg:col-span-5">
            {editingAppId ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-scale-up">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                  Ajustar y Reenviar Registro
                </h3>

                <form onSubmit={handleResubmitSubmit} className="space-y-4 font-sans">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Monto de Aplicación (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={rAmount}
                      onChange={(e) => setRAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Factor Cambiario de Ajuste</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={rRateBCV}
                      onChange={(e) => setRRateBCV(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold font-mono text-slate-800"
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
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-black text-white hover:bg-slate-900 rounded-xl text-xs font-bold uppercase shadow-sm"
                    >
                      Reenviar a Auditoría
                    </button>
                  </div>

                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                <Undo className="w-8 h-8 text-slate-300" />
                <span>Seleccione una aplicación rechazada de la lista para ajustar las cifras y reenviarla al auditor.</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
