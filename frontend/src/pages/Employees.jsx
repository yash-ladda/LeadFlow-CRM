import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const INITIAL_FORM = {
    name: '',
    email: '',
    password: '',
    role: 'sales_executive',
};

const Employees = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data.users);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name.trim() || !formData.email.trim() || formData.password.length < 6) {
            setFormError('Name, email, and a password of at least 6 characters are required.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/users', {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
            });
            setFormData(INITIAL_FORM);
            fetchUsers();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create employee.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (emp) => {
        if (!window.confirm(`Remove employee "${emp.name}"? Their assigned leads will become unassigned.`)) {
            return;
        }
        try {
            await api.delete(`/users/${emp.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== emp.id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete employee.');
        }
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-slate-900">Sales Employees</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                    Add team members and monitor assigned lead counts.
                </p>
            </div>

            {/* Add Employee Form */}
            <form
                onSubmit={handleCreateUser}
                className="mb-6 rounded-md border border-slate-200 bg-slate-50/60 p-4"
            >
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Add New Employee</h2>

                {formError && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {formError}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full name"
                        className="input-field"
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Work email"
                        className="input-field"
                        required
                    />
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password (min 6 chars)"
                        className="input-field"
                        required
                    />
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="input-field"
                    >
                        <option value="sales_executive">Sales Executive</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? 'Adding...' : '+ Add Employee'}
                    </button>
                </div>
            </form>

            {/* Employees Table */}
            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="table-th">Name</th>
                            <th className="table-th">Email</th>
                            <th className="table-th">Role</th>
                            <th className="table-th">Assigned Leads</th>
                            <th className="table-th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    Loading employees...
                                </td>
                            </tr>
                        ) : (
                            users.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50/70">
                                    <td className="table-td font-medium text-slate-900">{emp.name}</td>
                                    <td className="table-td">{emp.email}</td>
                                    <td className="table-td">
                                        <span className="inline-flex rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                            {emp.role === 'admin' ? 'Admin' : 'Sales Executive'}
                                        </span>
                                    </td>
                                    <td className="table-td">{emp.assigned_leads_count}</td>
                                    <td className="table-td text-right">
                                        {emp.id === currentUser?.id ? (
                                            <span className="text-xs text-slate-400">You</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(emp)}
                                                className="text-xs font-medium text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default Employees;