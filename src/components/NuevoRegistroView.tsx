import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Banknote, 
  Users, 
  Calendar, 
  Receipt, 
  Info, 
  Check, 
  TrendingUp, 
  AlertTriangle,
  Camera,
  Upload
} from 'lucide-react';
import { Client, TransactionType, PaymentMethodType, RateType } from '../types';

interface NuevoRegistroViewProps {
  clients: Client[];
  onCancel: () => void;
  onSave: (transactionData: {
    type: TransactionType;
    clientId: string;
    amount: number;
    date: string;
    reference: string;
    description: string;
    isUrgente: boolean;
    paymentType: PaymentMethodType;
    rateType: RateType;
    rateBCV: number;
    amountInBSS: number;
    photoUrl?: string;
  }) => void;
}

export default function NuevoRegistroView({ clients, onCancel, onSave }: NuevoRegistroViewProps) {
  const [type, setType] = useState<TransactionType>('factura');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // folios
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgente, setIsUrgente] = useState(false);

  // Multicurrency
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('Zelle');
  const [rateType, setRateType] = useState<RateType>('BCV');
  const [customRate, setCustomRate] = useState('36.50');
  const [rates, setRates] = useState<Record<string, number>>({
    BCV: 36.50,
    EUR: 39.20,
    Binance: 37.10,
    Peso: 0.0090,
    Personal: 38.00
  });

  // Photo
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load exchange rates dynamically on mount
  useEffect(() => {
    fetch('/api/rates/bcv')
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setCustomRate(data.BCV.toString());
      })
      .catch(console.error);
  }, []);

  // Update rates on selector change
  const handleRateTypeChange = (selectedRate: RateType) => {
    setRateType(selectedRate);
    if (selectedRate === 'BCV') setCustomRate(rates.BCV.toString());
    else if (selectedRate === 'EUR') setCustomRate(rates.EUR.toString());
    else if (selectedRate === 'Binance') setCustomRate(rates.Binance.toString());
    else if (selectedRate === 'Peso') setCustomRate(rates.Peso.toString());
    else if (selectedRate === 'Personal') setCustomRate(rates.Personal.toString());
  };

  // Set nice default folios on toggle
  const handleTypeToggle = (selectedType: TransactionType) => {
    setType(selectedType);
    if (selectedType === 'factura') {
      setReference(`F-2024-${Math.floor(100 + Math.random() * 900)}`);
    } else {
      setReference(`ANT-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Initialize folio
  useEffect(() => {
    handleTypeToggle(type);
  }, []);

  // Compress file capture / camera conversion to base64 via HTML5 Canvas
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setPhotoUrl(dataUrl);
          } else {
            setPhotoUrl(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const calculatedRate = parseFloat(customRate) || 1.0;
  const numAmount = parseFloat(amount) || 0;
  const totalBSS = numAmount * calculatedRate;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !amount || !reference) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        type,
        clientId,
        amount: numAmount,
        date,
        reference,
        description,
        isUrgente: type === 'factura' ? isUrgente : false,
        paymentType,
        rateType,
        rateBCV: calculatedRate,
        amountInBSS: totalBSS,
        photoUrl
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight">Nuevo Registro Financiero</h2>
          <p className="text-sm text-slate-500 mt-1">Cargue pólizas de cobros recibidos (anticipos) o cargos emitidos (facturas) al sistema.</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleFormSubmit}
            disabled={isSubmitting || !amount || !reference || !clientId}
            className="px-5 py-2.5 bg-black text-white hover:bg-slate-900 disabled:opacity-40 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Registrando...</span>
              </>
            ) : (
              <span>Guardar Registro</span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main form grid - 8 columns */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            
            {/* Toggle switch selectors between Factura and Anticipo */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Tipo de Registro</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeToggle('factura')}
                  className={`py-4 rounded-xl border flex items-center justify-center gap-2.5 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                    type === 'factura' 
                      ? 'bg-black text-white border-black shadow-md' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <FileText className="w-4.5 h-4.5" />
                  Factura de Cargo
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeToggle('anticipo')}
                  className={`py-4 rounded-xl border flex items-center justify-center gap-2.5 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                    type === 'anticipo' 
                      ? 'bg-black text-white border-black shadow-md' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <Banknote className="w-4.5 h-4.5" />
                  Anticipo Recibido
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Asignar Cliente</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 uppercase tracking-wider outline-none focus:ring-4 focus:ring-slate-100 focus:border-black cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id} - Cédula: {c.cedula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Folio / Referencia</label>
                <input
                  type="text"
                  required
                  placeholder={type === 'factura' ? 'F-2024-XXX' : 'ANT-XXXX'}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold font-mono text-slate-800 outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all"
                />
              </div>

              {type === 'anticipo' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Método de Pago</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as PaymentMethodType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="Zelle">Zelle</option>
                      <option value="Transferencia BSS">Transferencia BSS</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Euro">Euro</option>
                      <option value="Pesos">Pesos</option>
                      <option value="Binance">Binance</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Tasa a Aplicar</label>
                    <select
                      value={rateType}
                      onChange={(e) => handleRateTypeChange(e.target.value as RateType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="BCV">Tasa Oficial BCV ({rates.BCV})</option>
                      <option value="EUR">Tasa Euro EUR ({rates.EUR})</option>
                      <option value="Binance">Tasa Binance P2P ({rates.Binance})</option>
                      <option value="Peso">Tasa Peso COP ({rates.Peso})</option>
                      <option value="Personal">Tasa Ajustada/Personal ({rates.Personal})</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Factor Cambiario Ajustable</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Monto (Moneda Origen)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-extrabold text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-8 text-sm font-bold font-mono text-slate-800 outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Fecha de Emisión</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-bold uppercase transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Concepto / Descripción</label>
                <textarea
                  placeholder="Descripción detallada de la operación o flete..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all resize-none text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>

            </div>

            {/* Voucher photo upload / Camera capture */}
            {type === 'anticipo' && (
              <div className="pt-4 border-t border-slate-100 font-sans space-y-3">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-tight block">Adjuntar Foto del Comprobante / Tomar Captura</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Photo picker */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/60 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-[11px] font-bold text-slate-600 text-center uppercase tracking-wide">Abrir Cámara / Cargar Imagen</span>
                    <span className="text-[9px] text-slate-400 mt-1">Soporta JPG, PNG de recibos</span>
                  </div>

                  {/* Photo Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center relative aspect-video md:aspect-auto">
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt="Comprobante Capturado" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-lg p-1.5 hover:bg-black text-[9px] font-bold uppercase"
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Vista previa del comprobante</span>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Invoices-only specialized options */}
            {type === 'factura' && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between font-sans">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-tight">Marcar como urgente o vencido</label>
                  <p className="text-[11px] text-slate-400 font-medium">Asigna prioridad visual crítica en tableros y auditoría AI.</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="urgent-toggle"
                    className="sr-only peer"
                    checked={isUrgente}
                    onChange={(e) => setIsUrgente(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Advisory Sidebar info - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-100/70 border border-slate-200 p-6 rounded-2xl shadow-inner text-slate-700 h-fit space-y-4">
            <h4 className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5 leading-none">
              <Info className="w-4 h-4 text-slate-400" />
              Equivalente en Bolívares
            </h4>
            
            <div className="space-y-4 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">TIPO DE CAMBIO</span>
                <span className="text-slate-900 font-extrabold uppercase font-mono">{rateType} ({calculatedRate.toFixed(4)})</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">TOTAL ESTIMADO</span>
                <span className="text-slate-900 font-black font-mono text-sm">Bs. {totalBSS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl leading-relaxed text-[11px] font-medium text-slate-500">
                {type === 'factura' ? (
                  'Las facturas pendientes aumentarán el saldo bruto por cobrar del cliente de inmediato. Se ordenarán por antigüedad en la secuencia de conciliación automática.'
                ) : (
                  'Los anticipos registrados quedarán congelados con el estado PENDIENTE DE VALIDACIÓN en tesorería. No sumarán de inmediato al saldo de cuenta del cliente hasta ser auditados.'
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-sm aspect-video border border-slate-200">
            <img 
              alt="Register Visualizer Graphic" 
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXWvVnSjT7V-R-1lIs0Z6N8S3g4M6nLzZ6X6S7g4U6P7R8D-yR7V7L7Z8"
            />
          </div>

        </div>

      </form>
    </div>
  );
}
