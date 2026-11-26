import { useEffect, useState } from 'react';
import api from '../api/axios';
import { STATUS_OPTIONS } from './StatusBadge';

const SOURCE_OPTIONS = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email Campaign', 'Other'];

const INITIAL_FORM = {
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website',
    status: 'new',
    assigned_to: '',
};

const LeadModal = ({ isOpen, onClose, onSaved, lead, employees = [], userRole }) => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isEditMode = Boolean(lead);

    useEffect(() => {
        if (lead) {
            setFormData({
                name: lead.name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                company: lead.company || '',
                source: lead.source || 'Website',
                status: lead.status || 'new',
                assigned_to: lead.assigned_to ? String(lead.assigned_to) : '',
            });
        } else {
            setFormData(INITIAL_FORM);
        }
        setError('');
    }, [lead, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Lead name and email are required.');
            return;
        }

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            company: formData.company.trim() || null,
            source: formData.source,
            status: formData.status,
        };

        if (userRole === 'admin') {
            payload.assigned_to = formData.assigned_to ? Number(formData.assigned_to) : null;
        }

        setSubmitting(true);
        try {
            if (isEditMode) {
                await api.put(`/leads/${lead.id}`, payload);
            } else {
                await api.post('/leads', payload);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save lead.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">
                        {isEditMode ? 'Edit Lead' : 'Add New Lead'}
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="lead-name" className="mb-1 block text-sm font-medium text-slate-700">
                                Full Name *
                            </label>
                            <input
                                id="lead-name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Aarav Mehta"
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="lead-email" className="mb-1 block text-sm font-medium text-slate-700">
                                Email Address *
                            </label>
                            <input
                                id="lead-email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="aarav@company.com"
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="lead-phone" className="mb-1 block text-sm font-medium text-slate-700">
                                Phone
                            </label>
                            <input
                                id="lead-phone"
                                name="phone"
                                type="text"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="9876543210"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label htmlFor="lead-company" className="mb-1 block text-sm font-medium text-slate-700">
                                Company
                            </label>
                            <input
                                id="lead-company"
                                name="company"
                                type="text"
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="Acme Corp"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label htmlFor="lead-source" className="mb-1 block text-sm font-medium text-slate-700">
                                Lead Source
                            </label>
                            <select
                                id="lead-source"
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="input-field"
                            >
                                {SOURCE_OPTIONS.map((src) => (
                                    <option key={src} value={src}>
                                        {src}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="lead-status" className="mb-1 block text-sm font-medium text-slate-700">
                                Status
                            </label>
                            <select
                                id="lead-status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="input-field"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {userRole === 'admin' && (
                        <div>
                            <label htmlFor="lead-assigned" className="mb-1 block text-sm font-medium text-slate-700">
                                Assign To Employee
                            </label>
                            <select
                                id="lead-assigned"
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
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
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary">
                            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadModal;