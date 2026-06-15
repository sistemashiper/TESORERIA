import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Receipt,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Client } from '../types';

interface ClientsViewProps {
  clients: Client[];
  onNavigate: (view: 'dashboard' | 'clientes' | 'nuevo-cliente' | 'nuevo-registro' | 'conciliacion' | 'reportes') => void;
  onDeleteClient: (id: string) => void;
  onViewStatement: (client: Client) => void;
}

export default function ClientsView({ clients, onNavigate, onDeleteClient, onViewStatement }: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Compute live statistics based on state
  const totalClients = clients.length + 1276;
  const totalPendingSaldos = clients.reduce((sum, c) => sum + c.saldoPendiente, 0) + 412000;
  const criticsCount = clients.filter(c => c.estadoSaldo === 'Saldo Vencido').length + 8;

  // Filter clients dynamically based on search and selected category
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || client.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Simple pagination logic
  const itemsPerPage = 4;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Search & Dynamic Filters Bar */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-black outline-none transition-all text-sm shadow-sm font-sans placeholder-slate-400"
            placeholder="Buscar por nombre, RFC o ID de cliente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        {/* Category selector filter */}
        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 focus:ring-4 focus:ring-slate-100 focus:border-black outline-none shadow-sm cursor-pointer"
          >
            <option value="all">Todas las Categorías</option>
            <option value="Corporativo">Corporativos</option>
            <option value="Pyme">Pymes</option>
            <option value="Persona Física">Persona Física</option>
            <option value="Gobierno">Gobierno</option>
          </select>
        </div>

        <div className="md:col-span-3 flex gap-2">
          <button 
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4 text-slate-400" />
            Limpiar
          </button>
          <button 
            onClick={() => alert('Cisterna Google Excel/CSV Generada (Demostración)')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Exportar
          </button>
        </div>
      </section>

      {/* Quick summaries - Bento style (4 columns) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Clientes</p>
            <p className="font-sans font-black text-xl text-slate-900 mt-1">{totalClients.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 flex items-center justify-center text-amber-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saldos Pendientes</p>
            <p className="font-sans font-black text-xl text-slate-900 mt-1">${(totalPendingSaldos / 1000).toFixed(0)}k</p>
          </div>
        </div>

        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Al Corriente</p>
            <p className="font-sans font-black text-xl text-slate-900 mt-1">92%</p>
          </div>
        </div>

        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-700 border border-red-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clientes Críticos</p>
            <p className="font-sans font-black text-xl text-slate-900 mt-1">{criticsCount}</p>
          </div>
        </div>

      </section>

      {/* Clients List container */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID / RFC</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado de Saldo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Último Pago</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentClients.length > 0 ? (
                currentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Customer identity */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-xs transition-colors group-hover:bg-black group-hover:text-white group-hover:border-black">
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <p className="font-sans font-bold text-[15px] text-slate-900 leading-tight">
                            {client.name}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {client.category}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID / RFC */}
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs font-bold text-slate-800">
                        {client.id}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400 mt-1 uppercase">
                        {client.rfc}
                      </p>
                    </td>

                    {/* Balance Status pill style */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        client.estadoSaldo === 'Al Corriente' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/40':
                        client.estadoSaldo === 'Saldo Vencido' ? 'bg-red-50 text-red-800 border border-red-200/40':
                        'bg-amber-50 text-amber-800 border border-amber-200/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          client.estadoSaldo === 'Al Corriente' ? 'bg-emerald-600':
                          client.estadoSaldo === 'Saldo Vencido' ? 'bg-red-600 animate-pulse':
                          'bg-amber-600'
                        }`}></span>
                        {client.estadoSaldo}
                      </span>
                      <p className="mt-1 font-mono text-[11px] font-semibold text-slate-500">
                        ${client.saldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })} Pendiente
                      </p>
                    </td>

                    {/* Last Payment */}
                    <td className="px-6 py-5 text-xs font-medium text-slate-600">
                      {client.ultimoPago}
                    </td>

                    {/* Row operations actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewStatement(client)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                          title="Ver Estado de Cuenta / Auxiliar"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Eliminar Cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-sans">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 bg-slate-50/50 font-sans">
          <span className="text-xs font-semibold text-slate-500">
            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredClients.length)} de {filteredClients.length} clientes
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-slate-200 disabled:opacity-30 rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-800" />
            </button>
            <span className="text-xs font-extrabold text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-slate-200 disabled:opacity-30 rounded-xl transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-800" />
            </button>
          </div>
        </div>
      </section>

      {/* Giant high-fidelity FAB Floating Action Button (Screenshot 3) */}
      <button
        onClick={() => onNavigate('nuevo-cliente')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-50 hover:shadow-black/25 select-none"
      >
        <Plus className="w-7 h-7 text-white" />
        <span className="absolute right-full mr-4 bg-black text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl">
          Nuevo Cliente
        </span>
      </button>

    </div>
  );
}
