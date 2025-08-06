const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all applicants with filtering and pagination
router.get('/', async (req, res) => {
  try {
    // Start with a simple query first
    const query = `
      SELECT 
        applicant_id,
        name,
        email,
        program_applied_for,
        application_status,
        gender,
        source,
        offer_issued,
        fee_paid,
        applied_date,
        created_at,
        updated_at
      FROM applicants 
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const [applicants] = await db.execute(query);

    // Get total count
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM applicants');
    const totalApplicants = countResult[0].total;

    res.json({
      success: true,
      data: {
        applicants,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(totalApplicants / 20),
          totalApplicants,
          limit: 20
        }
      }
    });

  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applicants',
      error: error.message
    });
  }
});

// Get applicant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Determine if ID is numeric (database id) or string (applicant_id)
    const isNumericId = /^\d+$/.test(id);
    
    let query, params;
    if (isNumericId) {
      query = `SELECT * FROM applicants WHERE id = ?`;
      params = [parseInt(id)];
    } else {
      query = `SELECT * FROM applicants WHERE applicant_id = ?`;
      params = [id];
    }
    
    const [applicants] = await db.execute(query, params);
    
    if (applicants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      data: applicants[0]
    });

  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applicant',
      error: error.message
    });
  }
});

// Update applicant offer status
router.patch('/:id/offer', async (req, res) => {
  try {
    const { id } = req.params;
    const { offer_issued } = req.body;
    
    // Determine if ID is numeric (database id) or string (applicant_id)
    const isNumericId = /^\d+$/.test(id);
    
    let query, params;
    if (isNumericId) {
      query = `
        UPDATE applicants 
        SET offer_issued = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [offer_issued ? 1 : 0, parseInt(id)];
    } else {
      query = `
        UPDATE applicants 
        SET offer_issued = ?, updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `;
      params = [offer_issued ? 1 : 0, id];
    }
    
    const [result] = await db.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer status updated successfully'
    });

  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating offer status',
      error: error.message
    });
  }
});

// Update applicant fee status
router.patch('/:id/fee', async (req, res) => {
  try {
    const { id } = req.params;
    const { fee_paid } = req.body;
    
    // Determine if ID is numeric (database id) or string (applicant_id)
    const isNumericId = /^\d+$/.test(id);
    
    let query, params;
    if (isNumericId) {
      query = `
        UPDATE applicants 
        SET fee_paid = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [fee_paid ? 1 : 0, parseInt(id)];
    } else {
      query = `
        UPDATE applicants 
        SET fee_paid = ?, updated_at = CURRENT_TIMESTAMP
        WHERE applicant_id = ?
      `;
      params = [fee_paid ? 1 : 0, id];
    }
    
    const [result] = await db.execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      message: 'Fee status updated successfully'
    });

  } catch (error) {
    console.error('Error updating fee status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fee status',
      error: error.message
    });
  }
});

// Get applicant statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applicants,
        COUNT(CASE WHEN application_status = 'admitted' THEN 1 END) as admitted,
        COUNT(CASE WHEN application_status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN application_status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN offer_issued = 1 THEN 1 END) as offers_issued,
        COUNT(CASE WHEN fee_paid = 1 THEN 1 END) as fees_paid,
        COUNT(CASE WHEN program_applied_for = 'PGP' THEN 1 END) as pgp_applicants,
        COUNT(CASE WHEN program_applied_for = 'PhD' THEN 1 END) as phd_applicants,
        COUNT(CASE WHEN program_applied_for = 'EPhD' THEN 1 END) as ephd_applicants,
        COUNT(CASE WHEN program_applied_for = 'EMBA' THEN 1 END) as emba_applicants
      FROM applicants
    `;

    const [stats] = await db.execute(statsQuery);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching applicant statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;