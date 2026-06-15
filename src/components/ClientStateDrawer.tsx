import React from 'react';
import { X, Receipt, Banknote, Scale, CheckCircle2, History } from 'lucide-react';
import { Client, Invoice, Advance, Application } from '../types';

interface ClientStateDrawerProps {
  client: Client;
  onClose: () => void;
  invoices: Invoice[];
  advances: Advance[];
  applications: Application[];
}

export default function ClientStateDrawer({ client, onClose, invoices, advances, applications }: ClientStateDrawerProps) {
  
  // Outstanding filter records for specific client
  const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
  const clientAdvances = advances.filter(adv => adv.clientId === client.id);
  const clientApplications = applications.filter(app => app.clientName === client.name);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-all animate-fade-in font-sans">
      
      {/* Off-canvas close trigger overlay */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* Main Slide out container */}
      <section className="relative z-10 w-full max-w-[560px] bg-white h-screen shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col animate-slide-left p-6 md:p-8 gap-6">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] bg-slate-100 text-slate-800 font-extrabold uppercase px-2.5 py-1 rounded-full">{client.id}</span>
            <h2 className="font-sans font-black text-xl text-slate-900 mt-2 leading-none uppercase">{client.name}</h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">RFC: {client.rfc} • {client.category}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact/Fiscal sidebar */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">TELÉFONO</span>
            <p className="font-semibold text-slate-800 mt-0.5">{client.phone || 'No registrado'}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">DIRECCIÓN</span>
            <p className="font-semibold text-slate-800 mt-0.5 truncate">{client.address || 'No declarada'}</p>
          </div>
        </div>

        {/* Dynamic ledgers lists split */}
        <div className="space-y-6 flex-1">
          
          {/* Outstanding Invoice table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-400" />
              Facturas Cargadas ({clientInvoices.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Folio</th>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider">Resto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {clientInvoices.length > 0 ? (
                    clientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-slate-800 font-bold">{inv.reference}</td>
                        <td className="px-4 py-2.5 text-slate-550">{inv.date}</td>
                        <td className="px-4 py-2.5 text-right text-slate-550">${inv.amount.toLocaleString('es-MX')}</td>
                        <td className={`px-4 py-2.5 text-center font-mono font-bold ${inv.status === 'PAGADO' ? 'text-emerald-600':'text-red-500'}`}>
                          {inv.status === 'PAGADO' ? 'Pagado' : `$${inv.remainingAmount.toLocaleString('es-MX')}`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">Sin facturas emitidas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advances Ledger */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-slate-400" />
              Anticipos Registrados ({clientAdvances.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Anticipo</th>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Original</th>
                    <th className="px-4 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider">Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {clientAdvances.length > 0 ? (
                    clientAdvances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-slate-800 font-bold">{adv.reference}</td>
                        <td className="px-4 py-2.5 text-slate-550">{adv.date}</td>
                        <td className="px-4 py-2.5 text-right text-slate-550">${adv.amount.toLocaleString('es-MX')}</td>
                        <td className={`px-4 py-2.5 text-center font-mono font-bold ${adv.remainingAmount === 0 ? 'text-slate-405':'text-emerald-600'}`}>
                          {adv.remainingAmount === 0 ? 'Aplicado' : `$${adv.remainingAmount.toLocaleString('es-MX')}`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">Sin anticipos ingresados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Previous Applications list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              Historial de Conciliaciones FIFO ({clientApplications.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Aplicación</th>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Factura</th>
                    <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Anticipo</th>
                    <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Aplicado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px] text-slate-700">
                  {clientApplications.length > 0 ? (
                    clientApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-semibold">{app.id}</td>
                        <td className="px-4 py-2.5 font-bold text-red-500">{app.invoiceReference}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-650">{app.advanceReference}</td>
                        <td className="px-4 py-2.5 text-right font-sans font-bold text-slate-900">${app.amountApplied.toLocaleString('es-MX')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 font-sans text-xs">Aún no se han ejecutado conciliaciones FIFO.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-150 pt-4 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">
          Contabilidad Pro • Auditoría Auxiliar
        </div>

      </section>

    </div>
  );
}
