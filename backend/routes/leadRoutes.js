const express = require('express');
const {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    updateLeadStatus,
    assignLead,
    deleteLead,
} = require('../controllers/leadController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.patch('/:id/status', updateLeadStatus);

router.post('/', authorizeRoles('admin'), createLead);
router.patch('/:id/assign', authorizeRoles('admin'), assignLead);
router.delete('/:id', authorizeRoles('admin'), deleteLead);

module.exports = router;