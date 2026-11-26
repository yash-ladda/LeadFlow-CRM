import { useEffect, useState } from 'react';
import api from '../api/axios';

const AssignModal = ({ isOpen, onClose, onAssigned, lead, employees = [] }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (lead) {
            setSelectedUserId(lead.assigned_to ? String(lead.assigned_to) : '');
        }
        setError('');
    }, [lead, isOpen]);

    if (!isOpen || !lead) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await api.patch(`/leads/${lead.id}/assign`, {
                assigned_to: selectedUserId ? Number(selectedUserId) : null,
            });
            onAssigned();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign lead.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">
                        Assign Lead
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                        Close
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-500">
                            {lead.company ? `${lead.company} · ` : ''}
                            {lead.email}
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="assign-employee"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Sales Executive
                        </label>
                        <select
                            id="assign-employee"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary">
                            {submitting ? 'Saving...' : 'Update Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignModal;