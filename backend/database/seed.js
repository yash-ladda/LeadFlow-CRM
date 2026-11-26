require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const seedUsers = async () => {
    const usersToSeed = [
        {
            name: 'System Admin',
            email: 'admin@crm.com',
            password: 'Admin@123',
            role: 'admin',
        },
        {
            name: 'Rahul Sharma',
            email: 'rahul@crm.com',
            password: 'Sales@123',
            role: 'sales_executive',
        },
        {
            name: 'Priya Verma',
            email: 'priya@crm.com',
            password: 'Sales@123',
            role: 'sales_executive',
        },
    ];

    try {
        for (const user of usersToSeed) {
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [user.email]
            );

            if (existing.length > 0) {
                console.log(`user with this email already exists: ${user.email}`);
                continue;
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);

            await pool.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [user.name, user.email, hashedPassword, user.role]
            );

            console.log(`created ${user.role}: ${user.email}`);
        }

        console.log('user seeding completed.');
    } catch (error) {
        console.error('seeding error:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

seedUsers();