import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Layers, 
  LayoutDashboard, 
  Users, 
  Banknote, 
  Scale, 
  BarChart3, 
  LogOut,
  Coins
} from 'lucide-react';

import { Client, Invoice, Advance, Application, ViewType, User } from './types';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import NuevoClienteForm from './components/NuevoClienteForm';
import ConciliacionView from './components/ConciliacionView';
import ReportsView from './components/ReportsView';
import NuevoRegistroView from './components/NuevoRegistroView';
import ClientStateDrawer from './components/ClientStateDrawer';

// New components
import UserConfigPanel from './components/UserConfigPanel';
import CajaModuleView from './components/CajaModuleView';
import TesoreriaApprovalView from './components/TesoreriaApprovalView';
import GerenciaAuditView from './components/GerenciaAuditView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Database States
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Selected client state for Statement drawer
  const [selectedDrawerClient, setSelectedDrawerClient] = useState<Client | null>(null);

  // Synchronize database state from Express backend
  const fetchDatabase = () => {
    fetch('/api/database')
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
        setInvoices(data.invoices || []);
        setAdvances(data.advances || []);
        setApplications(data.applications || []);
      })
      .catch((err) => console.error('Error fetching database:', err));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDatabase();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  // Adds a client dynamically via Express API
  const handleAddNewClient = (clientData: any) => {
    fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al registrar cliente');
        return res.json();
      })
      .then(() => {
        fetchDatabase();
        setCurrentView('clientes');
      })
      .catch((err) => alert(err.message));
  };

  // Adds a Ledger register (invoice/advance) via Express API
  const handleAddNewTransaction = (txData: any) => {
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txData, registeredBy: currentUser?.email })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al emitir registro');
        return res.json();
      })
      .then(() => {
        fetchDatabase();
        setCurrentView('dashboard');
      })
      .catch((err) => alert(err.message));
  };

  // Triggers FIFO Reconciliation simulation execute on Express backend
  const handleExecuteReconciliation = async (clientId: string) => {
    const res = await fetch('/api/reconciliation/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
    });
    if (!res.ok) throw new Error('Falló la conciliación');
    const data = await res.json();
    fetchDatabase(); // reload data
    return data;
  };

  // Deletes client locally from React state view
  const handleDeleteClient = (clientId: string) => {
    if (confirm('¿Está seguro de que desea retirar este cliente del padrón? Se mantendrán sus pólizas registradas.')) {
      setClients(prev => prev.filter(c => c.id !== clientId));
    }
  };

  // Switch display views inside container with smooth motions
  const renderContentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            clients={clients}
            invoices={invoices}
            advances={advances}
            applications={applications}
            onNavigate={setCurrentView}
          />
        );
      case 'clientes':
        return (
          <ClientsView
            clients={clients}
            onNavigate={setCurrentView}
            onDeleteClient={handleDeleteClient}
            onViewStatement={setSelectedDrawerClient}
          />
        );
      case 'nuevo-cliente':
        return (
          <NuevoClienteForm
            onCancel={() => setCurrentView('clientes')}
            onSave={handleAddNewClient}
          />
        );
      case 'nuevo-registro':
        return (
          <NuevoRegistroView
            clients={clients}
            onCancel={() => setCurrentView('dashboard')}
            onSave={handleAddNewTransaction}
          />
        );
      case 'conciliacion':
        return (
          <ConciliacionView
            clients={clients}
            invoices={invoices}
            advances={advances}
            onExecuteReconciliation={handleExecuteReconciliation}
          />
        );
      case 'usuarios':
        return <UserConfigPanel />;
      case 'caja':
        return <CajaModuleView currentUserEmail={currentUser?.email || ''} />;
      case 'aprobaciones':
        return (
          <TesoreriaApprovalView 
            clients={clients}
            invoices={invoices}
            advances={advances}
            applications={applications}
            onRefresh={fetchDatabase}
          />
        );
      case 'auditoria':
        return (
          <GerenciaAuditView 
            applications={applications}
            onRefresh={fetchDatabase}
          />
        );
      case 'reportes':
        return <ReportsView />;
      default:
        return <div>Vista no implementada</div>;
    }
  };

  const userPerms = currentUser?.permissions || [];

  // View fallback loader until database is synchronised
  if (clients.length === 0 && isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-50 gap-4 font-sans text-sm font-semibold">
        <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="uppercase tracking-widest text-[10px] text-slate-400 font-black animate-pulse">Sincronizando Base de Datos...</span>
      </div>
    );
  }

  // Filter mobile menu items by comparing permissions
  const mobileMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: '' },
    { id: 'clientes', label: 'Clientes', icon: Users, perm: 'canRegisterClients' },
    { id: 'nuevo-registro', label: 'Registros', icon: Banknote, perm: 'canRegisterAdvances' },
    { id: 'aprobaciones', label: 'Verificaciones', icon: Scale, perm: 'canVerifyAdvances' },
    { id: 'caja', label: 'Control de Caja', icon: Coins, perm: 'canManageCaja' },
    { id: 'auditoria', label: 'Auditoría', icon: Scale, perm: 'canAuditApplications' },
    { id: 'usuarios', label: 'Usuarios', icon: Users, perm: 'canManageUsers' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, perm: '' },
  ].filter(item => {
    if (!item.perm) return true;
    if (item.id === 'aprobaciones') {
      return userPerms.includes('canVerifyAdvances') || userPerms.includes('canApplyAdvances');
    }
    if (item.id === 'auditoria') {
      return userPerms.includes('canAuditApplications') || userPerms.includes('canAuditCaja');
    }
    return userPerms.includes(item.perm);
  });

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 scroll-smooth antialiased selection:bg-black selection:text-white">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* Authentication Login Screen Frame */
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="min-h-screen w-full flex items-center justify-center bg-slate-100 relative overflow-hidden"
          >
            <LoginView onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          /* Core Dashboard App Shell Area */
          <motion.div
            key="appshell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-screen"
          >
            {/* Nav sidebar drawer - desktop static */}
            <Sidebar 
              currentView={currentView}
              onNavigate={setCurrentView}
              onLogout={handleLogout}
              userPermissions={userPerms}
              userName={currentUser?.name || ''}
              userRole={currentUser?.role || ''}
            />

            {/* Mobile Sidebar overlay dialog panel */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black z-50 lg:hidden"
                  />
                  
                  {/* Drawer Menu */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-50 p-6 flex flex-col gap-6 lg:hidden shadow-2xl"
                  >
                    <div className="flex justify-between items-center bg-slate-50 -mx-6 -mt-6 p-6 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏛️</span>
                        <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900">MENÚ DE CONTROL</span>
                      </div>
                      <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1.5 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <nav className="flex flex-col gap-1 flex-grow mt-4">
                      {mobileMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isSelected = currentView === item.id || (item.id === 'clientes' && currentView === 'nuevo-cliente');
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentView(item.id as ViewType);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-left text-sm font-bold uppercase tracking-wider ${
                              isSelected ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>

                    <div className="mt-auto border-t border-slate-200 pt-6">
                      <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-red-50 text-red-700 font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Core page layouts columns right side */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* Dynamic Header Navbar */}
              <Navbar 
                currentView={currentView}
                onMobileMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
                onNavigate={setCurrentView}
                userName={currentUser?.name || ''}
              />

              {/* Central main page viewport containers wrapper */}
              <main className="flex-1 overflow-y-auto px-4 md:px-10 py-8 lg:ml-72 transition-all">
                <div className="max-w-6xl mx-auto">
                  {renderContentView()}
                </div>
              </main>

            </div>

            {/* Ledger Auxiliary account drawer slide out */}
            <AnimatePresence>
              {selectedDrawerClient && (
                <ClientStateDrawer
                  client={selectedDrawerClient}
                  onClose={() => setSelectedDrawerClient(null)}
                  invoices={invoices}
                  advances={advances}
                  applications={applications}
                />
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
