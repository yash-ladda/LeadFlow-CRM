const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [rows] = await pool.execute(
            'SELECT id, name, email, password, role FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password',
            });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password',
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: 'Failed to log in',
        });
    }
};

const getMe = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        return res.status(200).json({
            user: rows[0],
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            message: 'Failed to fetch user profile',
        });
    }
};

module.exports = { login, getMe };