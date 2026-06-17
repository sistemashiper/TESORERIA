import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('admin@corporativo.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleRecover = async () => {
    if (!email) {
      setInfoMessage('Ingrese su correo para recuperar la contraseña');
      return;
    }
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setInfoMessage(`Token de recuperación: ${data.token}`);
      } else {
        setInfoMessage(data.error || 'Error al recuperar la contraseña');
      }
    } catch (e) {
      setInfoMessage('Error de red al intentar recuperar la contraseña');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Fetch call to server API auth
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Credenciales incorrectas');
        }
        return res.json();
      })
      .then((data) => {
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(data.user);
        }, 1200);
      })
      .catch((err) => {
        setIsLoading(false);
        setError('El correo o contraseña no son correctos.');
      });
  };

  return (
    <div className="relative w-full max-w-[440px] px-4">
      {/* Dynamic atmospheric blurs */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl"></div>

      <main className="bg-white/85 backdrop-blur-xl border border-slate-200/80 relative z-10 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Header decoration */}
        <div className="flex flex-col items-center mb-8 text-center animate-fade-in">
          <div className="w-12 h-12 bg-black flex items-center justify-center rounded-xl mb-4 shadow-md">
            <span className="text-white font-extrabold text-[24px]">🏛️</span>
          </div>
          <h1 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">Contabilidad Pro</h1>
          <p className="font-sans text-xs text-slate-500 mt-1 uppercase tracking-widest font-medium">Accede a tu panel corporativo</p>
        </div>

        {/* Login form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center font-medium">
              {error}
            </div>
          )}
          {infoMessage && (
            <div className="p-3 bg-blue-50 text-blue-600 text-xs rounded-lg border border-blue-100 text-center font-medium mt-2">
              {infoMessage}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase px-0.5" htmlFor="email">
              CORREO ELECTRÓNICO
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                className="block w-full pl-9 pr-3 py-3 bg-slate-50/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-black transition-all text-sm outline-none font-sans text-slate-800 placeholder-slate-400 font-medium"
                placeholder="admin@corporativo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-0.5">
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase" htmlFor="password">
                CONTRASEÑA
              </label>
              <button type="button" onClick={handleRecover} className="text-[10px] text-slate-500 hover:text-black hover:underline transition-all font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="block w-full pl-9 pr-9 py-3 bg-slate-50/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-black transition-all text-sm outline-none font-sans text-slate-800 placeholder-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-black transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember option */}
          <div className="flex items-center gap-2 px-0.5 pt-1">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 text-black bg-slate-50 border-slate-200 rounded focus:ring-black focus:ring-offset-0"
              defaultChecked
            />
            <label className="text-xs text-slate-500 select-none" htmlFor="remember">
              Mantener sesión iniciada
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white hover:bg-slate-900 active:scale-[0.98] transition-all duration-200 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-6 pt-5 border-t border-slate-200/50 text-center">
          <p className="text-xs text-slate-500 font-medium">
            ¿No tienes una cuenta?{' '}
            <a href="#" className="text-black font-semibold hover:underline">
              Contactar a soporte
            </a>
          </p>
        </div>
      </main>

      {/* Footer system details */}
      <footer className="mt-6 text-center space-y-1 opacity-50">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
          Contabilidad Pro Enterprise v1.2.0
        </p>
        <p className="text-[9px] text-slate-400 font-medium uppercase leading-none">
          © 2026 Corporativo. Todos los derechos reservados. Sistema cifrado.
        </p>
      </footer>
    </div>
  );
}
