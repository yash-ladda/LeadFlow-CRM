import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClass = ({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm font-medium ${isActive
            ? 'bg-slate-200/70 text-slate-900'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

    const roleLabel = user?.role === 'admin' ? 'Admin' : 'Sales Executive';

    return (
        <div className="flex min-h-screen flex-col bg-white md:flex-row">
            {/* Mobile Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 md:hidden">
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                    LeadFlow CRM
                </span>
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                    {mobileMenuOpen ? 'Close' : 'Menu'}
                </button>
            </header>

            {/* Subtle Neutral Sidebar */}
            <aside
                className={`${mobileMenuOpen ? 'flex' : 'hidden'
                    } w-full flex-col justify-between border-b border-slate-200 bg-slate-50 md:flex md:w-60 md:shrink-0 md:border-b-0 md:border-r`}
            >
                <div>
                    <div className="hidden border-b border-slate-200 px-5 py-4 md:block">
                        <p className="text-sm font-semibold tracking-tight text-slate-900">
                            LeadFlow CRM
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">Sales Workspace</p>
                    </div>

                    <nav className="space-y-1 p-3">
                        <NavLink
                            to="/"
                            end
                            className={navLinkClass}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Leads
                        </NavLink>

                        {user?.role === 'admin' && (
                            <NavLink
                                to="/employees"
                                className={navLinkClass}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sales Employees
                            </NavLink>
                        )}
                    </nav>
                </div>

                {/* User Info & Logout */}
                <div className="border-t border-slate-200 p-4">
                    <div className="mb-3">
                        <p className="truncate text-sm font-medium text-slate-900">
                            {user?.name}
                        </p>
                        <p className="text-xs text-slate-500">{roleLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="btn-secondary w-full"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-white">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;