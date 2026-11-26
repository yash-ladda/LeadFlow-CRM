const { pool } = require('../config/db');

const ALLOWED_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const LEAD_SELECT_QUERY = `
  SELECT l.*,
         assignee.name AS assigned_to_name,
         assignee.email AS assigned_to_email,
         creator.name AS created_by_name
  FROM leads l
  LEFT JOIN users assignee ON l.assigned_to = assignee.id
  LEFT JOIN users creator ON l.created_by = creator.id
`;

const fetchLeadById = async (leadId) => {
    const [rows] = await pool.execute(`${LEAD_SELECT_QUERY} WHERE l.id = ?`, [leadId]);
    return rows[0] || null;
};

const getLeads = async (req, res) => {
    try {
        const { search, status } = req.query;
        const conditions = [];
        const params = [];

        if (req.user.role === 'sales_executive') {
            conditions.push('l.assigned_to = ?');
            params.push(req.user.id);
        }

        if (status && status !== 'all') {
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({ message: 'Invalid status filter' });
            }
            conditions.push('l.status = ?');
            params.push(status);
        }

        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push('(l.name LIKE ? OR l.email LIKE ? OR l.company LIKE ? OR l.phone LIKE ?)');
            params.push(term, term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [leads] = await pool.execute(
            `${LEAD_SELECT_QUERY} ${whereClause} ORDER BY l.updated_at DESC, l.id DESC`,
            params
        );

        return res.status(200).json({ leads });
    } catch (error) {
        console.error('Get leads error:', error);
        return res.status(500).json({ message: 'Failed to fetch leads' });
    }
};

const getLeadById = async (req, res) => {
    try {
        const leadId = Number(req.params.id);
        if (!Number.isInteger(leadId) || leadId <= 0) {
            return res.status(400).json({ message: 'Invalid lead ID' });
        }

        const lead = await fetchLeadById(leadId);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        if (req.user.role === 'sales_executive' && lead.assigned_to !== req.user.id) {
            return res.status(403).json({ message: 'Access denied to this lead' });
        }

        return res.status(200).json({ lead });
    } catch (error) {
        console.error('Get lead by ID error:', error);
        return res.status(500).json({ message: 'Failed to fetch lead' });
    }
};

const createLead = async (req, res) => {
    try {
        const {
            name,
            email,
            phone = null,
            company = null,
            source = 'Website',
            status = 'new',
            assigned_to = null,
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Lead name and email are required' });
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid lead status' });
        }

        let assigneeId = null;
        if (assigned_to !== null && assigned_to !== '') {
            assigneeId = Number(assigned_to);
            if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
                return res.status(400).json({ message: 'Invalid assignee user ID' });
            }
            const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [assigneeId]);
            if (users.length === 0) {
                return res.status(400).json({ message: 'Assigned employee does not exist' });
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO leads (name, email, phone, company, source, status, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                phone ? phone.trim() : null,
                company ? company.trim() : null,
                source ? source.trim() : 'Website',
                status,
                assigneeId,
                req.user.id,
            ]
        );

        const createdLead = await fetchLeadById(result.insertId);
        return res.status(201).json({
            message: 'Lead created successfully',
            lead: createdLead,
        });
    } catch (error) {
        console.error('Create lead error:', error);
        return res.status(500).json({ message: 'Failed to create lead' });
    }
};

const updateLead = async (req, res) => {
    try {
        const leadId = Number(req.params.id);
        if (!Number.isInteger(leadId) || leadId <= 0) {
            return res.status(400).json({ message: 'Invalid lead ID' });
        }

        const existingLead = await fetchLeadById(leadId);
        if (!existingLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        if (req.user.role === 'sales_executive' && existingLead.assigned_to !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit leads assigned to you' });
        }

        const { name, email, phone, company, source, status, assigned_to } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Lead name and email are required' });
        }

        const nextStatus = status !== undefined ? status : existingLead.status;
        if (!ALLOWED_STATUSES.includes(nextStatus)) {
            return res.status(400).json({ message: 'Invalid lead status' });
        }

        let nextAssignedTo = existingLead.assigned_to;
        if (req.user.role === 'admin' && assigned_to !== undefined) {
            if (assigned_to === null || assigned_to === '') {
                nextAssignedTo = null;
            } else {
                const parsedId = Number(assigned_to);
                const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [parsedId]);
                if (users.length === 0) {
                    return res.status(400).json({ message: 'Assigned employee does not exist' });
                }
                nextAssignedTo = parsedId;
            }
        }

        await pool.execute(
            `UPDATE leads
       SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, assigned_to = ?
       WHERE id = ?`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                phone ? phone.trim() : null,
                company ? company.trim() : null,
                source ? source.trim() : 'Website',
                nextStatus,
                nextAssignedTo,
                leadId,
            ]
        );

        const updatedLead = await fetchLeadById(leadId);
        return res.status(200).json({
            message: 'Lead updated successfully',
            lead: updatedLead,
        });
    } catch (error) {
        console.error('Update lead error:', error);
        return res.status(500).json({ message: 'Failed to update lead' });
    }
};

const updateLeadStatus = async (req, res) => {
    try {
        const leadId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(leadId) || leadId <= 0) {
            return res.status(400).json({ message: 'Invalid lead ID' });
        }

        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
            });
        }

        const existingLead = await fetchLeadById(leadId);
        if (!existingLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        if (req.user.role === 'sales_executive' && existingLead.assigned_to !== req.user.id) {
            return res.status(403).json({
                message: 'You can only update the status of leads assigned to you',
            });
        }

        await pool.execute('UPDATE leads SET status = ? WHERE id = ?', [status, leadId]);

        const updatedLead = await fetchLeadById(leadId);
        return res.status(200).json({
            message: 'Lead status updated',
            lead: updatedLead,
        });
    } catch (error) {
        console.error('Update status error:', error);
        return res.status(500).json({ message: 'Failed to update lead status' });
    }
};

const assignLead = async (req, res) => {
    try {
        const leadId = Number(req.params.id);
        const { assigned_to } = req.body;

        if (!Number.isInteger(leadId) || leadId <= 0) {
            return res.status(400).json({ message: 'Invalid lead ID' });
        }

        const existingLead = await fetchLeadById(leadId);
        if (!existingLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        let assigneeId = null;
        if (assigned_to !== null && assigned_to !== '' && assigned_to !== undefined) {
            assigneeId = Number(assigned_to);
            if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
                return res.status(400).json({ message: 'Invalid employee ID' });
            }
            const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [assigneeId]);
            if (users.length === 0) {
                return res.status(400).json({ message: 'Selected employee does not exist' });
            }
        }

        await pool.execute('UPDATE leads SET assigned_to = ? WHERE id = ?', [assigneeId, leadId]);

        const updatedLead = await fetchLeadById(leadId);
        return res.status(200).json({
            message: assigneeId ? 'Lead assigned successfully' : 'Lead unassigned',
            lead: updatedLead,
        });
    } catch (error) {
        console.error('Assign lead error:', error);
        return res.status(500).json({ message: 'Failed to assign lead' });
    }
};

const deleteLead = async (req, res) => {
    try {
        const leadId = Number(req.params.id);
        if (!Number.isInteger(leadId) || leadId <= 0) {
            return res.status(400).json({ message: 'Invalid lead ID' });
        }

        const [result] = await pool.execute('DELETE FROM leads WHERE id = ?', [leadId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        return res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        return res.status(500).json({ message: 'Failed to delete lead' });
    }
};

module.exports = {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    updateLeadStatus,
    assignLead,
    deleteLead,
};