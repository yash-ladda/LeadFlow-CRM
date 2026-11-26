export const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
];

const STATUS_STYLES = {
    new: 'bg-slate-100 text-slate-700 border-slate-200',
    contacted: 'bg-blue-50 text-blue-700 border-blue-200',
    qualified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    proposal: 'bg-amber-50 text-amber-700 border-amber-200',
    won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    lost: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal',
    won: 'Won',
    lost: 'Lost',
};

const StatusBadge = ({ status }) => {
    const styleClass = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    const label = STATUS_LABELS[status] || status;

    return (
        <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${styleClass}`}
        >
            {label}
        </span>
    );
};

export default StatusBadge;