import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FolderLock, 
  Check, 
  ChevronRight, 
  HelpCircle 
} from 'lucide-react';
import { ClientCategory } from '../types';

interface NuevoClienteFormProps {
  onCancel: () => void;
  onSave: (clientData: {
    name: string;
    rfc: string;
    category: ClientCategory;
    address: string;
    phone: string;
    email: string;
    cedula: string;
  }) => void;
}

export default function NuevoClienteForm({ onCancel, onSave }: NuevoClienteFormProps) {
  const [name, setName] = useState('');
  const [rfc, setRfc] = useState('');
  const [cedula, setCedula] = useState('');
  const [category, setCategory] = useState<ClientCategory>('Corporativo');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [emailError, setEmailError] = useState('');
  const [rfcError, setRfcError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email syntactic client validator
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !pattern.test(val)) {
      setEmailError('Ingrese un formato de correo válido (ej: contacto@empresa.com)');
    } else {
      setEmailError('');
    }
  };

  // RFC formatting and validator
  const handleRfcChange = (val: string) => {
    const formatted = val.toUpperCase().slice(0, 13).trim();
    setRfc(formatted);

    const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/;
    if (formatted && !rfcRegex.test(formatted)) {
      setRfcError('Formato RFC inválido. Debe constar de 12 o 13 caracteres SAT oficiales.');
    } else {
      setRfcError('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError || rfcError || !name || !cedula) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        name,
        rfc: rfc || cedula,
        category,
        address,
        phone,
        email,
        cedula
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Form Navigation Headers */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-slate-400 mb-2 font-mono text-[10px] font-bold">
            <span className="hover:text-black cursor-pointer uppercase">Clientes</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-black uppercase font-extrabold">Registro</span>
          </nav>
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight">Nuevo Cliente</h2>
          <p className="text-sm text-slate-500 mt-1">Configure la identidad del contribuyente para registrarlo en el padrón corporativo.</p>
        </div>
        
        {/* Actions Button */}
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
            disabled={isSubmitting || !name || !cedula || !!emailError || !!rfcError}
            className="px-5 py-2.5 bg-black text-white hover:bg-slate-900 disabled:opacity-40 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cliente</span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* General Form block - 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento General Fields */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <Building2 className="w-5 h-5 text-slate-800" />
              <h3 className="font-sans font-bold text-sm text-slate-900">Datos Generales</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">Nombre o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Soluciones Integrales S.A. de C.V."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-black rounded-xl p-3.5 text-sm font-sans outline-none text-slate-800 placeholder-slate-400 font-medium transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">Cédula de Identidad (Requerido)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-20123456"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-black rounded-xl p-3.5 text-sm font-sans outline-none text-slate-800 placeholder-slate-400 font-medium transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">RFC / Registro Fiscal</label>
                <input
                  type="text"
                  maxLength={13}
                  value={rfc}
                  onChange={(e) => handleRfcChange(e.target.value)}
                  placeholder="ABCD123456XYZ (Opcional)"
                  className={`w-full bg-slate-50/50 border ${rfcError ? 'border-red-300 focus:ring-red-50': 'border-slate-200 focus:ring-slate-100 focus:border-black'} rounded-xl p-3.5 text-xs font-mono outline-none text-slate-800 placeholder-slate-400 font-bold transition-all uppercase`}
                />
                {rfcError ? (
                  <p className="text-[10px] text-red-600 font-bold px-1">{rfcError}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium px-1">Formato SAT oficial (12 o 13 caracteres de longitud)</p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">Categoría Fiscal</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ClientCategory)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-black rounded-xl p-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 outline-none transition-all cursor-pointer"
                >
                  <option value="Corporativo">Corporativo</option>
                  <option value="Pyme">Pyme</option>
                  <option value="Persona Física">Persona Física</option>
                  <option value="Gobierno">Gobierno</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">Dirección Fiscal</label>
                <textarea
                  placeholder="Calle, Número exterior/interior, Colonia, CP, Ciudad..."
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-black rounded-xl p-3.5 text-sm font-sans outline-none text-slate-800 placeholder-slate-400 font-medium transition-all resize-none"
                />
              </div>

            </div>
          </div>

          {/* Bento Contact Info */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <Phone className="w-5 h-5 text-slate-800" />
              <h3 className="font-sans font-bold text-sm text-slate-900">Información de Contacto</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">Teléfono</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                  <input
                    type="tel"
                    placeholder="+52 000 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-black rounded-xl p-3.5 pl-10 text-sm font-sans outline-none text-slate-800 placeholder-slate-400 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5">Correo Electrónico</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                  <input
                    type="email"
                    required
                    placeholder="contacto@empresa.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full bg-slate-50/50 border ${emailError ? 'border-red-300 focus:ring-red-50': 'border-slate-200 focus:ring-slate-100 focus:border-black'} rounded-xl p-3.5 pl-10 text-sm font-sans outline-none text-slate-800 placeholder-slate-400 font-medium transition-all`}
                  />
                </div>
                {emailError && (
                  <p className="text-[10px] text-red-600 font-bold px-1">{emailError}</p>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Sidebar details - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Fiscal Summary Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden h-fit">
            <div className="relative z-10 space-y-4">
              <h4 className="font-sans font-bold text-base border-b border-slate-800 pb-2.5">Resumen Fiscal</h4>
              <div className="space-y-4 font-sans text-xs">
                <div className="flex justify-between items-center opacity-85">
                  <span className="font-semibold text-slate-400 uppercase tracking-widest text-[9px]">Estado inicial</span>
                  <span className="bg-white text-black font-extrabold px-2.5 py-0.5 rounded-full text-[9px] tracking-wider uppercase">BORRADOR</span>
                </div>
                <div className="flex justify-between items-center opacity-85">
                  <span className="font-semibold text-slate-400 uppercase tracking-widest text-[9px]">Validación SAT</span>
                  <span className="text-amber-300 font-bold uppercase tracking-wider text-[9px]">Pendiente</span>
                </div>
                <div className="mt-5 p-3.5 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[11px] leading-relaxed italic text-slate-300">
                    "Asegúrese de que el RFC coincida exactamente con la Constancia de Situación Fiscal del cliente para evitar desalineación en el timbrado de facturas de aplicación FIFO."
                  </p>
                </div>
              </div>
            </div>
            {/* Background design accents */}
            <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-white/5 rounded-full"></div>
          </div>

          {/* Guide list */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Guía de Registro
            </h4>
            <ul className="space-y-4 font-sans max-h-56 overflow-y-auto">
              <li className="flex gap-3">
                <div className="min-w-[20px] max-w-[20px] h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[9px]">1</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingrese la Razón Social tal cual figura registrada en el SAT.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="min-w-[20px] max-w-[20px] h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[9px]">2</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  El sistema pre-valida el RFC para mitigar rechazos en las pólizas contables automáticas.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="min-w-[20px] max-w-[20px] h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[9px]">3</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  El correo receptor recibirá la notificación de conciliaciones FIFO e informes bancarios.
                </p>
              </li>
            </ul>
          </div>

          {/* Minimalist illustration */}
          <div className="rounded-2xl overflow-hidden shadow-sm aspect-video border border-slate-200">
            <img 
              alt="Corporate Interior Illustration" 
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGg8D0JsnDPbJzVfD4rXF-UYLPE7KLiya1U3iEmmTPb7DWMJWWMm_e9tm_CkbMRLJ4tM81hOSPVmoraqwieSCxrWzxJZOhDEaqQL9nEvhduDOVd7Kwdbu4xGA8dSOGB9kY94aTn-f92R7o5GmqjhZO2kH7l9LvzmbEnFUtceFbav1L9Yc8UOUUEOYJdRwEleCN_uH-KJNn0gBTu0-shYSftOaDWST58xZi1AMu7eF2uuQDGVNT0WjgS75TrqZqLkSUtjEr02b_DdmQ"
            />
          </div>

        </div>

      </form>
    </div>
  );
}
