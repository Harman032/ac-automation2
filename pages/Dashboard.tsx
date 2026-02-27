
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { DashboardStats, SystemAlert } from '../types.ts';
import { Icons } from '../constants.tsx';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [remediating, setRemediating] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    const [statsData, alertsData] = await Promise.all([
      api.getStats(),
      api.getSystemAlerts()
    ]);
    setStats(statsData);
    setAlerts(alertsData);
    setIsDemo(api.isDemoMode());
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleExecuteRemediation = async () => {
    setRemediating(true);
    try {
      const count = await api.sendBatchReminders('compliance');
      if (api.isDemoMode()) {
        alert(`DEMO MODE: ${count} simulated compliance reminders would be sent. Connect the Node.js backend to send real SMTP emails.`);
      } else {
        alert(`LIVE SYSTEM: ${count} automated reminders sent successfully to client emails.`);
      }
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      alert("Error executing remediation. Check backend console.");
    } finally {
      setRemediating(false);
    }
  };

  const handleExportCapacity = () => {
    if (!stats) return;
    const headers = "Accountant,Client Count,Max Capacity,Capacity %\n";
    const rows = stats.workloadData.map(w => `${w.name},${w.count},${w.maxCapacity},${(w.count / w.maxCapacity) * 100}%`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Capacity_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading || !stats) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Initialising Automation Core...</p>
    </div>
  );

  const cards = [
    { title: 'Red Flags', value: stats.overdueFilings, color: 'border-rose-500', text: 'text-rose-600', sub: 'Action required', path: '/compliance' },
    { title: 'Upcoming Deadlines', value: stats.pendingFilings, color: 'border-amber-500', text: 'text-amber-600', sub: '7-day outlook', path: '/compliance' },
    { title: 'Missing Documents', value: stats.missingStatements, color: 'border-indigo-500', text: 'text-indigo-600', sub: 'Past due docs', path: '/statements' },
    { title: 'Active Portfolio', value: stats.activeClients, color: 'border-emerald-500', text: 'text-emerald-600', sub: 'Managed entities', path: '/clients' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isDemo ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            System Status: {isDemo ? 'Demo Mode (Local Storage Only)' : 'Live (Connected to Backend)'}
          </span>
        </div>
        {isDemo && (
          <span className="text-[9px] text-slate-400 italic">Run 'npm run dev' in /backend to enable SMTP & MySQL features.</span>
        )}
      </div>

      {(stats.overdueFilings > 0 || stats.missingStatements > 0) && (
        <div className="bg-white border-2 border-rose-100 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center animate-bounce shadow-lg shadow-rose-100">
              <Icons.Alert />
            </div>
            <div>
              <p className="text-slate-900 font-black uppercase text-sm tracking-tight">System Notice: Priority Compliance Breach</p>
              <p className="text-slate-500 text-xs font-medium">Auto-detection identified {stats.overdueFilings} overdue filings and {stats.missingStatements} missing statements.</p>
            </div>
          </div>
          <button 
            onClick={handleExecuteRemediation}
            disabled={remediating}
            className={`px-6 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-rose-700 transition-all shadow-md flex items-center gap-2 ${remediating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {remediating ? 'Sending Emails...' : 'Execute Remediation'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <button 
            key={idx} 
            onClick={() => navigate(card.path)}
            className={`bg-white p-6 text-left rounded-2xl border-t-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group ${card.color}`}
          >
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">{card.title}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${card.text}`}>{card.value}</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase">{card.sub}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 opacity-50" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 border-b pb-4">Accountant Capacity</h3>
          <div className="space-y-6 flex-1">
            {stats.workloadData.map((item, idx) => {
              const isOverCapacity = item.count >= item.maxCapacity;
              const percentage = Math.min((item.count / item.maxCapacity) * 100, 100);
              return (
                <div key={idx} className="relative group cursor-default">
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-slate-600 font-bold flex items-center gap-1">
                      {item.name}
                      {isOverCapacity && (
                        <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full animate-pulse uppercase">At Capacity</span>
                      )}
                    </span>
                    <span className={`font-black ${isOverCapacity ? 'text-rose-600' : 'text-slate-900'}`}>{item.count} / {item.maxCapacity} CLIENTS</span>
                  </div>
                  <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ${isOverCapacity ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            onClick={handleExportCapacity}
            className="mt-10 w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"
          >
            Export Capacity Report (.CSV)
          </button>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Automation Priority Queue</h3>
            <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg uppercase tracking-tighter shadow-sm shadow-rose-100">Immediate Attention</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Entity & Task</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Violation</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">System Deadline</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert) => (
                    <tr key={alert.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => navigate(alert.link)}>
                      <td className="py-5">
                        <p className="text-xs font-bold text-slate-900">{alert.message.split(': ')[1]}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black">{alert.message.split(': ')[0]}</p>
                      </td>
                      <td className="py-5">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                          alert.type === 'overdue' ? 'bg-rose-100 text-rose-700' :
                          alert.type === 'missing_doc' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-5 text-xs font-black ${alert.severity === 'high' ? 'text-rose-600' : 'text-slate-500'}`}>
                        {alert.timestamp}
                      </td>
                      <td className="py-5 text-right">
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Resolve</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-400 font-medium italic">
                      No violations detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;