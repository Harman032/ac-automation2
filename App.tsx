import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Icons } from './constants.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ClientsList from './pages/ClientsList.tsx';
import ComplianceList from './pages/ComplianceList.tsx';
import StatementsList from './pages/StatementsList.tsx';
import Login from './pages/Login.tsx';
import { api } from './services/api.ts';
import { SystemAlert } from './types.ts';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isAlertPanelOpen, setAlertPanelOpen] = useState(false);

  useEffect(() => {
    const fetchAlerts = () => api.getSystemAlerts().then(setAlerts);
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Icons.Dashboard },
    { path: '/clients', label: 'Client Master', icon: Icons.Clients },
    { path: '/compliance', label: 'Compliance Tracker', icon: Icons.Compliance },
    { path: '/statements', label: 'Statement Tracker', icon: Icons.Statements },
  ];

  const handleLogout = () => {
    localStorage.removeItem('is_auth');
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-indigo-950 text-white transition-all duration-300 flex flex-col z-30 shadow-2xl`}>
        <div className="p-6 flex items-center gap-3 border-b border-indigo-900/50">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-indigo-500/20">C</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">CanAccount</span>}
        </div>
        
        <nav className="flex-1 mt-8 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/20 font-bold' 
                    : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon />
                {isSidebarOpen && <span>{item.label}</span>}
                {!isSidebarOpen && isActive && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-indigo-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-900/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-indigo-300 hover:text-white hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all"
          >
            <Icons.Logout />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-none">
                {navItems.find(n => n.path === location.pathname)?.label || 'Page'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium hidden sm:block">Automated Accounting Platform • Phase 1 MVP</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setAlertPanelOpen(!isAlertPanelOpen)}
                className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-all group"
              >
                <Icons.Alert />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-bounce ring-4 ring-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {isAlertPanelOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Priority Actions</h3>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{alerts.length} Active alerts</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-sm font-bold text-slate-600">All systems green</p>
                        <p className="text-xs mt-1">No violations currently detected.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {alerts.map((alert) => (
                          <Link 
                            key={alert.id}
                            to={alert.link}
                            onClick={() => setAlertPanelOpen(false)}
                            className="block p-5 hover:bg-indigo-50/50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${alert.severity === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                              <div>
                                <p className="text-sm font-bold text-slate-800 leading-snug">{alert.message}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{alert.type.replace('_', ' ')}</span>
                                  <span className="text-slate-200">•</span>
                                  <span className="text-[9px] text-indigo-500 font-bold uppercase">{alert.timestamp}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-slate-50 text-center bg-slate-50/30">
                    <button onClick={() => setAlertPanelOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Dismiss Notifications</button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">Senior Admin</p>
                <p className="text-[10px] text-indigo-600 uppercase font-black tracking-tighter mt-1">Practice Manager</p>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-slate-100 shadow-sm">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full object-cover" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = localStorage.getItem('is_auth') === 'true';
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><ClientsList /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><ComplianceList /></ProtectedRoute>} />
        <Route path="/statements" element={<ProtectedRoute><StatementsList /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;