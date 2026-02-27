
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { ComplianceFiling, ComplianceStatus, Client } from '../types.ts';
import { COMPLIANCE_TYPES, FILING_FREQUENCIES, MOCK_ACCOUNTANTS } from '../constants.tsx';

const ComplianceList: React.FC = () => {
  const [filings, setFilings] = useState<ComplianceFiling[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFiling, setEditingFiling] = useState<ComplianceFiling | null>(null);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const defaultForm = {
    client_id: 0,
    compliance_type: COMPLIANCE_TYPES[0],
    filing_frequency: 'Monthly',
    period_start: '',
    period_end: '',
    due_date: '',
    status: ComplianceStatus.PENDING,
    filed_date: '',
    filed_by_user_id: 0,
    notes: ''
  };

  const [formData, setFormData] = useState(defaultForm);

  const loadData = async () => {
    const [fData, cData] = await Promise.all([api.getFilings(), api.getClients()]);
    setFilings(fData);
    setClients(cData);
    if (cData.length > 0 && formData.client_id === 0) {
      setFormData(prev => ({ ...prev, client_id: cData[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      filed_by_user_id: formData.filed_by_user_id || undefined,
      filed_date: formData.filed_date || undefined,
    };
    
    if (editingFiling) {
      await api.updateFiling(editingFiling.id, payload);
    } else {
      await api.addFiling(payload);
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this filing task?')) {
      await api.deleteFiling(id);
      loadData();
    }
  };

  const handleExport = () => {
    const headers = "Client,Type,Frequency,Due Date,Status,Filed Date\n";
    const rows = filteredFilings.map(f => 
      `${f.client_name},${f.compliance_type},${f.filing_frequency},${f.due_date},${f.status},${f.filed_date || ''}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Compliance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReminders = async () => {
    setIsProcessing(true);
    const count = await api.sendBatchReminders('compliance');
    setIsProcessing(false);
    alert(`Automation: Sent ${count} compliance status reminders to clients.`);
  };

  const openEditModal = (filing: ComplianceFiling) => {
    setEditingFiling(filing);
    setFormData({
      client_id: filing.client_id,
      compliance_type: filing.compliance_type,
      filing_frequency: filing.filing_frequency,
      period_start: filing.period_start,
      period_end: filing.period_end,
      due_date: filing.due_date,
      status: filing.status,
      filed_date: filing.filed_date || '',
      filed_by_user_id: filing.filed_by_user_id || 0,
      notes: filing.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFiling(null);
    setFormData(defaultForm);
  };

  const handleStatusQuickChange = async (id: number, status: ComplianceStatus) => {
    const update: any = { status };
    if (status === ComplianceStatus.FILED) {
      update.filed_date = new Date().toISOString().split('T')[0];
    }
    await api.updateFiling(id, update);
    loadData();
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    const styles = {
      [ComplianceStatus.FILED]: 'bg-emerald-100 text-emerald-700',
      [ComplianceStatus.PENDING]: 'bg-amber-100 text-amber-700',
      [ComplianceStatus.DOCS_AWAITED]: 'bg-rose-100 text-rose-700',
      [ComplianceStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700',
    };
    return <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${styles[status]}`}>{status}</span>;
  };

  const getUserName = (id?: number) => {
    return MOCK_ACCOUNTANTS.find(u => u.id === id)?.name || 'N/A';
  };

  const checkOverdue = (dateStr: string, status: ComplianceStatus) => {
    if (status === ComplianceStatus.FILED) return false;
    return new Date(dateStr) < new Date();
  };

  const checkDueSoon = (dateStr: string, status: ComplianceStatus) => {
    if (status === ComplianceStatus.FILED) return false;
    const due = new Date(dateStr);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= today && due <= weekFromNow;
  };

  const filteredFilings = filings.filter(f => 
    f.client_name?.toLowerCase().includes(search.toLowerCase()) || 
    f.compliance_type.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Search filings by client or type..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase rounded-lg hover:bg-slate-50 transition-colors tracking-widest shadow-sm"
          >
            Export Ledger
          </button>
          <button 
            onClick={handleReminders}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-black uppercase rounded-lg hover:bg-indigo-100 transition-all tracking-widest disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Send Reminders'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase rounded-lg hover:bg-indigo-700 shadow-lg transition-all tracking-widest"
          >
            + Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client & Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Automation Flag</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFilings.map((filing) => {
                const isOverdue = checkOverdue(filing.due_date, filing.status);
                const isDueSoon = checkDueSoon(filing.due_date, filing.status);
                
                return (
                  <tr key={filing.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">{filing.client_name}</p>
                      <p className="text-[10px] text-indigo-600 font-black uppercase tracking-tight">{filing.compliance_type} • {filing.filing_frequency}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-mono">{filing.period_start}</p>
                      <p className="text-xs text-slate-400">to {filing.period_end}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isOverdue && (
                        <div className="flex flex-col items-center group relative">
                          <div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping mb-1" />
                          <span className="text-[9px] font-black text-rose-600 uppercase">Red Flag</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 p-2 bg-slate-900 text-white text-[9px] rounded shadow-xl w-32 z-50 text-center leading-tight">
                            Automation: Task past CRA deadline. Action required.
                          </div>
                        </div>
                      )}
                      {isDueSoon && (
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mb-1" />
                          <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Due Soon</span>
                        </div>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm font-black ${isOverdue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-slate-600'}`}>
                      {filing.due_date}
                    </td>
                    <td className="px-6 py-4">
                      {filing.status === ComplianceStatus.FILED ? (
                        <div>
                          <p className="text-[9px] text-slate-400 font-black uppercase">Filed by</p>
                          <p className="text-xs font-bold text-slate-800">{getUserName(filing.filed_by_user_id)}</p>
                          <p className="text-[10px] text-emerald-600 font-mono">{filing.filed_date}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-black uppercase italic">Pending Execution</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {getStatusBadge(filing.status)}
                        <select 
                          value={filing.status}
                          onChange={(e) => handleStatusQuickChange(filing.id, e.target.value as ComplianceStatus)}
                          className="text-[10px] bg-white border border-slate-200 text-slate-400 font-black uppercase rounded p-1 cursor-pointer hover:border-indigo-500 outline-none w-28"
                        >
                          {Object.values(ComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openEditModal(filing)} className="p-2 bg-slate-100 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(filing.id)} className="p-2 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFilings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-black uppercase text-xs tracking-widest text-slate-300">No matching records</p>
                      <p className="text-xs italic">Adjust your search parameters to find the compliance filings you're looking for.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{editingFiling ? 'Update Filing Execution' : 'Deploy New Filing Task'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Basic Parameters</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Target Client *</label>
                    <select required value={formData.client_id} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, client_id: Number(e.target.value)})}>
                      <option value={0} disabled>Select client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Filing Type</label>
                      <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.compliance_type} onChange={(e) => setFormData({...formData, compliance_type: e.target.value})}>
                        {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Frequency</label>
                      <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.filing_frequency} onChange={(e) => setFormData({...formData, filing_frequency: e.target.value})}>
                        {FILING_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">CRA Due Date *</label>
                    <input type="date" required value={formData.due_date} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Execution Logic</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Current Status</label>
                    <select value={formData.status} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, status: e.target.value as ComplianceStatus})}>
                      {Object.values(ComplianceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className={`p-4 rounded-xl border transition-all ${formData.status === ComplianceStatus.FILED ? 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wider mb-2">Automated Completion Log</p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Filed Date</label>
                        <input type="date" value={formData.filed_date} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" onChange={(e) => setFormData({...formData, filed_date: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Assigned Filer</label>
                        <select 
                          value={formData.filed_by_user_id} 
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          onChange={(e) => setFormData({...formData, filed_by_user_id: Number(e.target.value)})}
                        >
                          <option value={0}>Unassigned</option>
                          {MOCK_ACCOUNTANTS.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">System Notes</label>
                <textarea 
                  rows={2}
                  value={formData.notes}
                  placeholder="Additional audit trail information..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                  Confirm task execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceList;
