import React from 'react';
import { 
  BarChart3, 
  Download, 
  Eye, 
  Lightbulb, 
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus
} from 'lucide-react';

export default function ReportsView() {
  
  // Visual dummy progress bars matching Screenshot 6 aging debt
  const agingDebt = [
    { title: 'Al Corriente (0-30 días)', amount: 420000, percentage: 65, color: 'bg-black' },
    { title: 'Vencido (31-60 días)', amount: 125000, percentage: 25, color: 'bg-slate-400' },
    { title: 'Mora (61-90 días)', amount: 45000, percentage: 10, color: 'bg-blue-300' },
    { title: 'Crítico (+90 días)', amount: 12000, percentage: 5, color: 'bg-red-500', isCritical: true },
  ];

  // List of downloadable files exactly matching Screenshot 6
  const downloadableReports = [
    {
      title: 'Estado de Cuenta General',
      desc: 'Actualizado hoy, 09:45 AM • Formatos: PDF, XLSX',
      colorBadge: 'bg-slate-100 text-slate-800'
    },
    {
      title: 'Reporte de Conciliación',
      desc: 'Cierre de mes anterior • Formatos: PDF, CSV',
      colorBadge: 'bg-blue-50 text-blue-800 border-blue-100'
    },
    {
      title: 'Resumen Fiscal',
      desc: 'Periodo anual 2023 • Formatos: PDF',
      colorBadge: 'bg-red-50 text-red-800 border-red-100'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* KPI Header Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white/90 border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Ingresos Totales (Q3)</p>
          <div className="flex items-end justify-between">
            <span className="font-sans font-black text-3xl text-slate-900">$2,450,000</span>
            <span className="text-emerald-700 text-xs font-bold flex items-center bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12%
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="bg-white/90 border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Egresos Operativos</p>
          <div className="flex items-end justify-between">
            <span className="font-sans font-black text-3xl text-slate-900">$1,120,400</span>
            <span className="text-slate-500 text-xs font-bold flex items-center bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -2%
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-500 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>

        <div className="bg-white/90 border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Margen Neto</p>
          <div className="flex items-end justify-between">
            <span className="font-sans font-black text-3xl text-slate-900">54.2%</span>
            <span className="text-emerald-700 text-xs font-bold flex items-center bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +4%
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: '54%' }}></div>
          </div>
        </div>

      </section>

      {/* Main Charts area */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly comparative bars - 8 columns */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-55 pb-4">
            <div>
              <h2 className="font-sans font-bold text-base text-slate-900">Ingresos vs Egresos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Comparativa mensual del ejercicio fiscal corriente</p>
            </div>
            
            <div className="flex gap-4 font-sans text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-black"></span>
                <span className="text-slate-600 font-medium">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                <span className="text-slate-600 font-medium">Egresos</span>
              </div>
            </div>
          </div>

          {/* Premium pure HTML/CSS Bar Group chart */}
          <div className="flex-grow flex items-end justify-between gap-4 h-[240px] pt-4 border-b border-slate-200 font-sans">
            
            <div className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1 h-3/4">
                <div className="w-4 bg-black rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '60%' }}></div>
                <div className="w-4 bg-slate-500 rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '40%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ENE</span>
            </div>

            <div className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1 h-3/4">
                <div className="w-4 bg-black rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '75%' }}></div>
                <div className="w-4 bg-slate-500 rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '35%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">FEB</span>
            </div>

            <div className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1 h-3/4">
                <div className="w-4 bg-black rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '90%' }}></div>
                <div className="w-4 bg-slate-500 rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '50%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">MAR</span>
            </div>

            <div className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1 h-3/4">
                <div className="w-4 bg-black rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '65%' }}></div>
                <div className="w-4 bg-slate-500 rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '45%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ABR</span>
            </div>

            <div className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1 h-3/4">
                <div className="w-4 bg-black rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '80%' }}></div>
                <div className="w-4 bg-slate-500 rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '30%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">MAY</span>
            </div>

            <div className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1 h-3/4">
                <div className="w-4 bg-black rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '100%' }}></div>
                <div className="w-4 bg-slate-500 rounded-t-sm hover:opacity-85 transition-opacity" style={{ height: '55%' }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">JUN</span>
            </div>

          </div>
        </div>

        {/* Debt Age slider bars - 4 columns */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="font-sans font-bold text-base text-slate-900">Saldos por Antigüedad</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-6">Distribución de saldos vencidos acumulados</p>

          <div className="space-y-5 font-sans">
            {agingDebt.map((age, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">{age.title}</span>
                  <span className={`font-bold ${age.isCritical ? 'text-red-500' : 'text-slate-900'}`}>
                    ${age.amount.toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${age.color} rounded-full`} style={{ width: `${age.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={() => alert('Detalle de cartera auditada exportado con éxito (Demostración)')}
            className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-slate-50 transition-colors"
          >
            Ver Detalle de Cartera
          </button>
        </div>

      </section>

      {/* Downloadable Reports lists (Screenshot 6 template structure) */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center bg-slate-50">
          <h2 className="font-sans font-bold text-base text-slate-900">Reportes Disponibles</h2>
          <button 
            onClick={() => alert('Nuevos reportes agendados exitosamente (Demostración)')}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors bg-white shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 font-sans">
          {downloadableReports.map((report, idx) => (
            <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center text-slate-800">
                  🏛️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-none">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium leading-none">
                    {report.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex gap-2">
                <button 
                  onClick={() => alert(`Iniciando descarga: ${report.title}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
                <button 
                  onClick={() => alert(`Previsualizando archivo: ${report.title}`)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* Automated scheduling options */}
      <section className="flex flex-col md:flex-row gap-6 font-sans">
        
        <div className="flex-1 bg-white border border-slate-200 p-6 rounded-2xl flex gap-4 items-start shadow-sm border-l-4 border-l-black">
          <div className="p-2.5 bg-black/5 rounded-xl">
            <Lightbulb className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-sm text-slate-900">Insight de Liquidez Colectiva</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-1">
              Se observa una tendencia de mejora en los tiempos de cobro (DSO). Los clientes del sector corporativo han reducido su mora en un 15% este mes gracias a las ejecuciones automáticas de conciliación FIFO.
            </p>
          </div>
        </div>

        <div className="w-full md:w-80 bg-black text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-sans font-bold text-sm text-amber-200 mb-2">Programar Envío</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Recibe estos reportes consolidados directamente en tu correo cada lunes.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => alert('Frecuencia de informes automáticos configurada para cada lunes.')}
            className="w-full mt-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors animate-pulse-subtle shadow-md"
          >
            Configurar
          </button>
        </div>

      </section>

    </div>
  );
}
