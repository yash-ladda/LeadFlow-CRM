const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const ALLOWED_ROLES = ['admin', 'sales_executive'];

const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const params = [];
        let whereClause = '';

        if (role) {
            if (!ALLOWED_ROLES.includes(role)) {
                return res.status(400).json({ message: 'Invalid role filter' });
            }
            whereClause = 'WHERE u.role = ?';
            params.push(role);
        }

        const [users] = await pool.execute(
              `SELECT u.id, u.name, u.email, u.role, u.created_at,
                COUNT(l.id) AS assigned_leads_count
                FROM users u
                LEFT JOIN leads l ON l.assigned_to = u.id
                ${whereClause}
                GROUP BY u.id
                ORDER BY u.created_at DESC`,
            params
        );

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, role = 'sales_executive' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
            });
        }

        if (!ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({
                message: 'Role must be either admin or sales_executive',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'A user with this email already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword, role]
        );

        return res.status(201).json({
            message: 'Employee created successfully',
            user: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail,
                role,
            },
        });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Failed to create user' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        if (userId === req.user.id) {
            return res.status(400).json({
                message: 'You cannot delete your own account',
            });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Failed to delete user' });
    }
};

module.exports = { getUsers, createUser, deleteUser };