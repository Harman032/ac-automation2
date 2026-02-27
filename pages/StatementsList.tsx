
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Statement, ReceivedStatus, Client } from '../types.ts';

const StatementsList: React.FC = () => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatement, setEditingStatement] = useState<Statement | null>(null);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultForm: {
    client_id: number;
    statement_type: 'Bank' | 'Credit Card';
    bank_name: string;
    account_last4: string;
    period_year: number;
    period_month: number;
    expected_date: string;
    received_status: ReceivedStatus;
    received_date: string;
    file_path: string;
    notes: string;
  } = {
    client_id: 0,
    statement_type: 'Bank',
    bank_name: '',
    account_last4: '',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    expected_date: '',
    received_status: ReceivedStatus.PENDING,
    received_date: '',
    file_path: '',
    notes: ''
  };

  const [formData, setFormData] = useState(defaultForm);

  const loadData = async () => {
    const [sData, cData] = await Promise.all([api.getStatements(), api.getClients()]);
    setStatements(sData);
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
    if (editingStatement) {
      await api.updateStatement(editingStatement.id, formData);
    } else {
      await api.addStatement(formData);
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this statement record?')) {
      await api.deleteStatement(id);
      loadData();
    }
  };

  const handleReminders = async () => {
    setIsProcessing(true);
    const count = await api.sendBatchReminders('statements');
    setIsProcessing(false);
    alert(`Automation: Sent ${count} document request reminders to clients.`);
  };

  const openEditModal = (s: Statement) => {
    setEditingStatement(s);
    setFormData({
      client_id: s.client_id,
      statement_type: s.statement_type,
      bank_name: s.bank_name,
      account_last4: s.account_last4,
      period_year: s.period_year,
      period_month: s.period_month,
      expected_date: s.expected_date,
      received_status: s.received_status,
      received_date: s.received_date || '',
      file_path: s.file_path || '',
      notes: s.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStatement(null);
    setFormData(defaultForm);
  };

  const handleStatusQuickChange = async (id: number, status: ReceivedStatus) => {
    const update: any = { received_status: status };
    if (status === ReceivedStatus.RECEIVED) {
      update.received_date = new Date().toISOString().split('T')[0];
    }
    await api.updateStatement(id, update);
    loadData();
  };

  const handleSimulateUpload = () => {
    const fileName = `Statement_${formData.bank_name.replace(/\s+/g, '_') || 'Acct'}_${formData.period_year}_${formData.period_month}.pdf`;
    setFormData({ ...formData, file_path: fileName, received_status: ReceivedStatus.RECEIVED, received_date: new Date().toISOString().split('T')[0] });
  };

  const filteredStatements = statements.filter(s => 
    s.client_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.bank_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Search by client, bank, or last 4..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleReminders}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase rounded-lg hover:bg-slate-50 transition-colors tracking-widest disabled:opacity-50"
          >
            {isProcessing ? 'Working...' : 'Send Reminders'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase rounded-lg hover:bg-indigo-700 shadow-lg transition-all tracking-widest"
          >
            + Tracker
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStatements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{s.client_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {s.file_path ? (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black flex items-center gap-1 uppercase tracking-tighter">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Document Linked
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300 font-bold uppercase italic tracking-tighter">No File</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium">{s.bank_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{s.statement_type} (...{s.account_last4})</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="font-semibold">{new Date(2000, s.period_month - 1).toLocaleString('default', { month: 'short' })}</span> {s.period_year}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <select 
                        value={s.received_status}
                        onChange={(e) => handleStatusQuickChange(s.id, e.target.value as ReceivedStatus)}
                        className={`text-[10px] font-black uppercase rounded-lg border px-2 py-1.5 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none w-32 ${
                          s.received_status === ReceivedStatus.RECEIVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          s.received_status === ReceivedStatus.PENDING ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {Object.values(ReceivedStatus).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                      {s.received_status === ReceivedStatus.RECEIVED && s.received_date && (
                        <p className="text-[10px] text-emerald-600 font-mono pl-1">REC'D: {s.received_date}</p>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm font-black ${new Date(s.expected_date) < new Date() && s.received_status === ReceivedStatus.PENDING ? 'text-rose-600' : 'text-slate-500'}`}>
                    {s.expected_date}
                    {new Date(s.expected_date) < new Date() && s.received_status === ReceivedStatus.PENDING && (
                      <span className="block text-[8px] uppercase tracking-tighter text-rose-400">Past Due</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(s)} className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase tracking-widest">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-rose-600 hover:text-rose-800 text-[10px] font-black uppercase tracking-widest">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStatements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">No tracking records found for your current search.</td>
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
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{editingStatement ? 'Update Document Status' : 'New Tracker Record'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Account Definition</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Target Client *</label>
                    <select required value={formData.client_id} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, client_id: Number(e.target.value)})}>
                      <option value={0} disabled>Select client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Type</label>
                      <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.statement_type} onChange={(e) => setFormData({...formData, statement_type: e.target.value as 'Bank' | 'Credit Card'})}>
                        <option value="Bank">Bank</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Last 4</label>
                      <input required maxLength={4} placeholder="1234" value={formData.account_last4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono" onChange={(e) => setFormData({...formData, account_last4: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Bank / FI Name</label>
                    <input required placeholder="e.g. TD Bank, AMEX" value={formData.bank_name} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, bank_name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Year</label>
                      <input type="number" value={formData.period_year} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" onChange={(e) => setFormData({...formData, period_year: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Month</label>
                      <input type="number" min={1} max={12} value={formData.period_month} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" onChange={(e) => setFormData({...formData, period_month: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Collection Progress</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Collection Status</label>
                    <select value={formData.received_status} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, received_status: e.target.value as ReceivedStatus})}>
                      {Object.values(ReceivedStatus).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${formData.received_status === ReceivedStatus.RECEIVED ? 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-50' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Received Date</label>
                        <input type="date" value={formData.received_date} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold" onChange={(e) => setFormData({...formData, received_date: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Attached File Reference</label>
                        <div className="flex gap-2">
                          <input readOnly value={formData.file_path} placeholder="No file attached" className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] bg-white text-slate-500 font-mono overflow-hidden whitespace-nowrap" />
                          <button type="button" onClick={handleSimulateUpload} className="bg-indigo-600 text-white text-[9px] font-black px-3 rounded-lg hover:bg-indigo-700 uppercase tracking-tighter">Link File</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Expected Date *</label>
                    <input type="date" required value={formData.expected_date} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={(e) => setFormData({...formData, expected_date: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">Automation Notes</label>
                <textarea rows={2} value={formData.notes} placeholder="e.g. Password protected PDF, Waiting on client..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                  Confirm tracker state
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementsList;
