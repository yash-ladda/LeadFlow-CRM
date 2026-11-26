import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import StatusBadge, { STATUS_OPTIONS } from '../components/StatusBadge';
import LeadModal from '../components/LeadModal';
import AssignModal from '../components/AssignModal';
import { useAuth } from '../context/AuthContext';

const LeadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [lead, setLead] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);

    const fetchLead = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/leads/${id}`);
            setLead(data.lead);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load lead details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLead();
    }, [fetchLead]);

    useEffect(() => {
        if (!isAdmin) return;
        api
            .get('/users', { params: { role: 'sales_executive' } })
            .then((res) => setEmployees(res.data.users))
            .catch((err) => console.error('Failed to load employees:', err));
    }, [isAdmin]);

    const handleStatusChange = async (newStatus) => {
        try {
            const { data } = await api.patch(`/leads/${id}/status`, { status: newStatus });
            setLead(data.lead);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete lead "${lead.name}"?`)) return;
        try {
            await api.delete(`/leads/${id}`);
            navigate('/', { replace: true });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete lead.');
        }
    };

    return (
        <Layout>
            <div className="mb-4">
                <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                    ← Back to Leads
                </Link>
            </div>

            {loading ? (
                <p className="text-sm text-slate-500">Loading lead details...</p>
            ) : error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            ) : lead ? (
                <div className="rounded-md border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-lg font-semibold text-slate-900">{lead.name}</h1>
                                <StatusBadge status={lead.status} />
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">{lead.company || 'No company listed'}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => setEditOpen(true)} className="btn-secondary">
                                Edit
                            </button>
                            {isAdmin && (
                                <>
                                    <button type="button" onClick={() => setAssignOpen(true)} className="btn-secondary">
                                        Assign
                                    </button>
                                    <button type="button" onClick={handleDelete} className="btn-danger">
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Email</p>
                            <p className="mt-1 text-sm text-slate-900">{lead.email}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Phone</p>
                            <p className="mt-1 text-sm text-slate-900">{lead.phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Source</p>
                            <p className="mt-1 text-sm text-slate-900">{lead.source || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Pipeline Status</p>
                            <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="input-field mt-1 w-auto"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Assigned To</p>
                            <p className="mt-1 text-sm text-slate-900">{lead.assigned_to_name || 'Unassigned'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Created By</p>
                            <p className="mt-1 text-sm text-slate-900">{lead.created_by_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Created At</p>
                            <p className="mt-1 text-sm text-slate-900">
                                {new Date(lead.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">Last Updated</p>
                            <p className="mt-1 text-sm text-slate-900">
                                {new Date(lead.updated_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <LeadModal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                onSaved={fetchLead}
                lead={lead}
                employees={employees}
                userRole={user?.role}
            />

            {isAdmin && (
                <AssignModal
                    isOpen={assignOpen}
                    onClose={() => setAssignOpen(false)}
                    onAssigned={fetchLead}
                    lead={lead}
                    employees={employees}
                />
            )}
        </Layout>
    );
};

export default LeadDetail;