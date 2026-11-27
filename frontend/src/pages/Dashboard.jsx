import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import StatusBadge, { STATUS_OPTIONS } from '../components/StatusBadge';
import LeadModal from '../components/LeadModal';
import AssignModal from '../components/AssignModal';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [leadModal, setLeadModal] = useState({ open: false, lead: null });
    const [assignModal, setAssignModal] = useState({ open: false, lead: null });

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if(user?.role === 'lead') {
                setLoading('false');
                return;
            }
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (statusFilter !== 'all') params.status = statusFilter;
            const { data } = await api.get('/leads', { params });
            setLeads(data.leads);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leads.');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(fetchLeads, 250);
        return () => clearTimeout(timer);
    }, [fetchLeads]);

    useEffect(() => {
        if (!isAdmin) return;
        api
            .get('/users', { params: { role: 'sales_executive' } })
            .then((res) => setEmployees(res.data.users))
            .catch((err) => console.error('Failed to load employees:', err));
    }, [isAdmin]);

    const handleStatusChange = async (leadId, status) => {
        try {
            const { data } = await api.patch(`/leads/${leadId}/status`, { status });
            setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleDelete = async (lead) => {
        if (!window.confirm(`Delete lead "${lead.name}"?`)) return;
        try {
            await api.delete(`/leads/${lead.id}`);
            setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete lead.');
        }
    };

    const stats = [
        { label: 'Visible Leads', value: leads.length },
        { label: 'New', value: leads.filter((l) => l.status === 'new').length },
        { label: 'Qualified', value: leads.filter((l) => l.status === 'qualified').length },
        { label: 'Won', value: leads.filter((l) => l.status === 'won').length },
    ];

    return (
        <Layout>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        {isAdmin ? 'All Leads' : 'My Assigned Leads'}
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {isAdmin ? 'Manage leads' : 'View and update your assigned leads'}
                    </p>
                </div>
                {isAdmin && (
                    <button type="button" onClick={() => setLeadModal({ open: true, lead: null })} className="btn-primary">
                        + Add Lead
                    </button>
                )}
            </div>

            <div className="mb-6 grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-md border border-slate-200 bg-slate-50/60 sm:grid-cols-4 sm:divide-y-0">
                {stats.map((item) => (
                    <div key={item.label} className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">{item.label}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, company, phone..."
                    className="input-field sm:max-w-xs"
                />
                <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field w-auto"
                >
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="table-th">Lead</th>
                            <th className="table-th">Company</th>
                            <th className="table-th">Phone</th>
                            <th className="table-th">Status</th>
                            {isAdmin && <th className="table-th">Assigned To</th>}
                            <th className="table-th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-500">Loading leads...</td></tr>
                        ) : leads.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-500">No leads found.</td></tr>
                        ) : (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50/70">
                                    <td className="table-td">
                                        <Link to={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">
                                            {lead.name}
                                        </Link>
                                        <p className="text-xs text-slate-500">{lead.email}</p>
                                    </td>
                                    <td className="table-td">{lead.company || '—'}</td>
                                    <td className="table-td">{lead.phone || '—'}</td>
                                    <td className="table-td">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={lead.status} />
                                            <select
                                                aria-label={`Change status for ${lead.name}`}
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 focus:outline-none"
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td className="table-td">
                                            {lead.assigned_to_name || <span className="text-slate-400">Unassigned</span>}
                                        </td>
                                    )}
                                    <td className="table-td text-right">
                                        <div className="inline-flex items-center gap-2 text-xs font-medium">
                                            <Link to={`/leads/${lead.id}`} className="text-slate-600 hover:text-slate-900">View</Link>
                                            <button type="button" onClick={() => setLeadModal({ open: true, lead })} className="text-slate-600 hover:text-slate-900">Edit</button>
                                            {isAdmin && (
                                                <>
                                                    <button type="button" onClick={() => setAssignModal({ open: true, lead })} className="text-slate-600 hover:text-slate-900">Assign</button>
                                                    <button type="button" onClick={() => handleDelete(lead)} className="text-red-600 hover:text-red-700">Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <LeadModal
                isOpen={leadModal.open}
                onClose={() => setLeadModal({ open: false, lead: null })}
                onSaved={fetchLeads}
                lead={leadModal.lead}
                employees={employees}
                userRole={user?.role}
            />

            {isAdmin && (
                <AssignModal
                    isOpen={assignModal.open}
                    onClose={() => setAssignModal({ open: false, lead: null })}
                    onAssigned={fetchLeads}
                    lead={assignModal.lead}
                    employees={employees}
                />
            )}
        </Layout>
    );
};

export default Dashboard;