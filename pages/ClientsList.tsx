
import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Client, Accountant } from '../types.ts';
import { CLIENT_STATUSES, ENGAGEMENT_TYPES } from '../constants.tsx';

const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  
  const defaultForm = {
    company_name: '',
    business_number: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: 'Software',
    fiscal_year_end: 'Dec 31',
    engagement_type: ENGAGEMENT_TYPES[1], 
    client_status: CLIENT_STATUSES[0], 
    assigned_accountant_id: 1, 
  };

  const [formData, setFormData] = useState(defaultForm);

  const loadData = async () => {
    const [cData, aData] = await Promise.all([api.getClients(), api.getAccountants()]);
    setClients(cData);
    setAccountants(aData);
    if (aData.length > 0 && !formData.assigned_accountant_id) {
       setFormData(prev => ({ ...prev, assigned_accountant_id: aData[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await api.updateClient(editingClient.id, formData);
    } else {
      await api.addClient({ ...formData });
    }
    closeModal();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this client? All related filings and statements will be removed.')) {
      await api.deleteClient(id);
      loadData();
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name,
      business_number: client.business_number,
      contact_person: client.contact_person,
      email: client.email,
      phone: client.phone,
      industry: client.industry,
      fiscal_year_end: client.fiscal_year_end,
      engagement_type: client.engagement_type,
      client_status: client.client_status,
      assigned_accountant_id: client.assigned_accountant_id || (accountants[0]?.id || 1),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData(defaultForm);
  };

  const filtered = clients.filter(c => 
    c.company_name.toLowerCase().includes(search.toLowerCase()) || 
    c.business_number.includes(search)
  );

  const getAccountantName = (id?: number) => {
    return accountants.find(a => a.id === id)?.name || 'Unassigned';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Search by company or BN..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Add New Client
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Company Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Engagement</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Assigned To</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Year End</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{client.company_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{client.business_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium">{client.engagement_type}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{client.industry}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                        {getAccountantName(client.assigned_accountant_id).charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600">{getAccountantName(client.assigned_accountant_id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{client.fiscal_year_end}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      client.client_status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      client.client_status === 'Onboarding' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {client.client_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEditModal(client)} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">Edit</button>
                      <button onClick={() => handleDelete(client.id)} className="text-rose-600 hover:text-rose-800 text-sm font-semibold transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">{editingClient ? 'Edit Client Profile' : 'Register New Client'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Identity</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Company Name *</label>
                    <input required value={formData.company_name} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, company_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Business Number (BN) *</label>
                    <input required value={formData.business_number} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="123456789RT0001" onChange={(e) => setFormData({...formData, business_number: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Industry</label>
                    <input value={formData.industry} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, industry: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Communication</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Contact Person</label>
                    <input value={formData.contact_person} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                    <input type="email" value={formData.email} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Phone</label>
                    <input value={formData.phone} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Operations</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Year End</label>
                    <select value={formData.fiscal_year_end} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, fiscal_year_end: e.target.value})}>
                      <option>Dec 31</option>
                      <option>Mar 31</option>
                      <option>Jun 30</option>
                      <option>Sep 30</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Engagement Type</label>
                    <select value={formData.engagement_type} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, engagement_type: e.target.value})}>
                      {ENGAGEMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Client Status</label>
                    <select value={formData.client_status} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" onChange={(e) => setFormData({...formData, client_status: e.target.value})}>
                      {CLIENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3 space-y-1 pt-2 border-t mt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Assign To (Practitioner)</label>
                  <select 
                    value={formData.assigned_accountant_id} 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    onChange={(e) => setFormData({...formData, assigned_accountant_id: Number(e.target.value)})}
                  >
                    {accountants.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.title})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t mt-8">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95">
                  {editingClient ? 'Apply Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsList;
