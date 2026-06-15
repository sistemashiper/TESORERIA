import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { User } from '../types';

export default function UserConfigPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  // Form states for new user
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Ventas');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const permissionKeys = [
    { key: 'canRegisterClients', label: 'Registrar Clientes', desc: 'Permite dar de alta clientes con Cédula' },
    { key: 'canRegisterAdvances', label: 'Cargar Anticipos', desc: 'Permite registrar anticipos crudos en espera de validación' },
    { key: 'canVerifyAdvances', label: 'Validar Anticipos', desc: 'Permite verificar, corregir y dar de alta anticipos de Ventas' },
    { key: 'canApplyAdvances', label: 'Aplicar Anticipos', desc: 'Permite cruzar y liquidar anticipos contra facturas' },
    { key: 'canAuditApplications', label: 'Auditar Conciliaciones', desc: 'Permite aprobar o rechazar aplicaciones de Tesorería' },
    { key: 'canManageCaja', label: 'Operar Caja', desc: 'Permite abrir sesión, registrar cobros y ejecutar cierres Z' },
    { key: 'canAuditCaja', label: 'Supervisar Caja', desc: 'Permite auditar cierres de caja y discrepancias' },
    { key: 'canManageUsers', label: 'Gestionar Permisos', desc: 'Permite agregar usuarios y editar capacidades granulares' }
  ];

  const fetchUsers = () => {
    setIsLoading(true);
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleTemplateSelect = (role: string) => {
    setNewRole(role);
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    setErrorMsg('');
    setSuccessMsg('');

    // Assign default template permissions
    let initialPermissions: string[] = [];
    if (newRole === 'Ventas') {
      initialPermissions = ['canRegisterClients', 'canRegisterAdvances'];
    } else if (newRole === 'Tesoreria') {
      initialPermissions = ['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canManageCaja'];
    } else if (newRole === 'Gerencia' || newRole === 'Administrador') {
      initialPermissions = ['canRegisterClients', 'canRegisterAdvances', 'canVerifyAdvances', 'canApplyAdvances', 'canAuditApplications', 'canManageCaja', 'canAuditCaja', 'canManageUsers'];
    }

    fetch('/api/auth/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        name: newName,
        role: newRole,
        permissions: initialPermissions
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
        return data;
      })
      .then(() => {
        setSuccessMsg('Usuario creado exitosamente con la plantilla del rol.');
        setNewEmail('');
        setNewName('');
        fetchUsers();
      })
      .catch((err) => {
        setErrorMsg(err.message);
      });
  };

  const handleTogglePermission = (userEmail: string, permKey: string) => {
    const user = users.find(u => u.email === userEmail);
    if (!user) return;

    let updatedPerms = [...user.permissions];
    if (updatedPerms.includes(permKey)) {
      updatedPerms = updatedPerms.filter(p => p !== permKey);
    } else {
      updatedPerms.push(permKey);
    }

    // Call update API
    fetch('/api/auth/update-user-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, permissions: updatedPerms })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al actualizar permisos');
        return res.json();
      })
      .then(() => {
        fetchUsers();
      })
      .catch((err) => alert(err.message));
  };

  const selectedUser = users.find(u => u.email === selectedUserEmail);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-black" />
            Configuración de Usuarios y Permisos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestione las capacidades del personal de manera granular para habilitar flujos de trabajo escalables.
          </p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* User registers and template creator */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* New user creation form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-slate-500" />
              Alta de Nuevo Usuario
            </h3>

            {errorMsg && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-semibold text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 font-semibold text-center">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@corporativo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-slate-100 focus:border-black transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Plantilla de Rol Base</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ventas', 'Tesoreria', 'Gerencia'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleTemplateSelect(role)}
                      className={`py-3.5 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all ${
                        newRole === role 
                          ? 'bg-black text-white border-black shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/60'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 px-0.5 italic mt-1.5 leading-relaxed">
                  * Al crearse, el usuario recibirá los permisos estándar del rol, los cuales podrán ampliarse o recortarse posteriormente.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-black text-white hover:bg-slate-900 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                Registrar e Inicializar
              </button>
            </form>
          </div>

          {/* Active users list */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Personal Registrado y Plantilla
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div 
                  key={user.email} 
                  onClick={() => setSelectedUserEmail(user.email)}
                  className={`p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors cursor-pointer ${
                    selectedUserEmail === user.email ? 'bg-slate-50 border-l-4 border-l-black pl-3' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center font-bold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{user.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 border border-slate-200 text-slate-800">
                      {user.role}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {user.permissions.length} Permisos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* User permissions editor */}
        <section className="lg:col-span-5">
          {selectedUser ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-scale-up">
              
              <div className="border-b border-slate-100 pb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Personalización Granular</p>
                <h3 className="font-bold text-sm text-slate-900 leading-none">{selectedUser.name}</h3>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{selectedUser.email}</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-0.5 leading-none">Habilitación de Módulos</p>
                
                <div className="space-y-2">
                  {permissionKeys.map((perm) => {
                    const isChecked = selectedUser.permissions.includes(perm.key);
                    return (
                      <div 
                        key={perm.key}
                        onClick={() => handleTogglePermission(selectedUser.email, perm.key)}
                        className={`p-3 border rounded-xl flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50/50 ${
                          isChecked 
                            ? 'bg-slate-55/10 border-slate-250' 
                            : 'border-slate-100 opacity-60'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked ? 'bg-black border-black text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[4]" />}
                        </div>
                        <div>
                          <h5 className="text-[11px] font-extrabold text-slate-800 leading-none uppercase tracking-wide">
                            {perm.label}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">
                            {perm.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-500 font-medium leading-relaxed flex gap-2.5 items-start">
                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Los cambios de permisos se guardan y aplican de forma inmediata. Si el usuario está activo, verá los nuevos módulos reflejados al recargar el sistema.
                </span>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="w-8 h-8 text-slate-300" />
              <span>Seleccione un usuario de la lista para auditar o personalizar sus permisos individuales.</span>
            </div>
          )}
        </section>

      </div>

    </div>
  );
}
