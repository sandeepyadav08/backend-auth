const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ Root route
router.get('/', (req, res) => {
  res.send('✅ Dashboard API is running');
});

// 📊 Dashboard overview with commitment_fee
router.get('/overview', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.course_code,
        c.course_name,
        p.phase_name,
        p.phase_order,
        p.commitment_fee,
        COUNT(DISTINCT ue.user_id) as total_enrolled,
        COUNT(CASE WHEN upp.status = 'not_started' THEN 1 END) as not_started_count,
        COUNT(CASE WHEN upp.status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN upp.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN upp.status = 'verification_pending' THEN 1 END) as verification_pending_count,
        COUNT(CASE WHEN upp.status = 'verified' THEN 1 END) as verified_count,
        ROUND(AVG(upp.progress_percentage), 2) as avg_progress_percentage
      FROM courses c
      LEFT JOIN phases p ON c.id = p.course_id
      LEFT JOIN user_enrollments ue ON c.id = ue.course_id AND ue.status = 'active'
      LEFT JOIN user_phase_progress upp ON p.id = upp.phase_id AND ue.user_id = upp.user_id
      GROUP BY c.id, c.course_code, c.course_name, p.id, p.phase_name, p.phase_order
      ORDER BY c.course_code, p.phase_order
    `;

    const [rows] = await db.execute(query);

    const courseData = {};
    rows.forEach(row => {
      if (!courseData[row.course_code]) {
        courseData[row.course_code] = {
          course_code: row.course_code,
          course_name: row.course_name,
          total_enrolled: row.total_enrolled,
          phases: []
        };
      }

      if (row.phase_name) {
        courseData[row.course_code].phases.push({
          phase_name: row.phase_name,
          phase_order: row.phase_order,
          statistics: [
            { metric_name: 'Commitment Fee', value: row.commitment_fee || 0 },
            { metric_name: 'Not Started', value: row.not_started_count },
            { metric_name: 'In Progress', value: row.in_progress_count },
            { metric_name: 'Completed', value: row.completed_count },
            { metric_name: 'Verification Pending', value: row.verification_pending_count },
            { metric_name: 'Verified', value: row.verified_count },
            { metric_name: 'Average Progress %', value: row.avg_progress_percentage || 0 }
          ]
        });
      }
    });
    res.json({
      success: true,
      data: Object.values(courseData)
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// ✅ Custom PGP summary route
router.get('/pgp-summary', async (req, res) => {
  try {
    // 🔸 Fix: Add missing acceptReject query
    const [[acceptReject]] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN commitment_payment = 1 THEN 1 END) AS total_accepted,
        COUNT(CASE WHEN cancellation_request = 1 THEN 1 END) AS total_rejected
      FROM iim_pgpmci_application
    `);

    // ✅ Fee details
    const [[fees]] = await db.execute(`
      SELECT
        SUM(CASE WHEN transaction_payment_type = 'commitment' THEN 1 ELSE 0 END) AS commitment_fee_paid,
        SUM(CASE WHEN transaction_payment_type = 'term' THEN 1 ELSE 0 END) AS term_fee_paid
      FROM iim_payment
    `);

    // ✅ Acceptance form
    const [[acceptanceForms]] = await db.execute(`
      SELECT SUM(CASE WHEN acceptance_form_submitted = 1 THEN 1 ELSE 0 END) AS acceptance_form_submitted
      FROM iim_pgpmci_application
    `);

    // ✅ Withdrawals
    const [[withdrawals]] = await db.execute(`
      SELECT COUNT(*) AS total_withdrawals FROM iim_pgpmci_withdraw
    `);

    // ✅ Slot stats
    const [[slots]] = await db.execute(`
      SELECT COUNT(*) AS today_total_slots FROM iim_pgpmci_slot WHERE DATE(slot_date) = CURDATE()
    `);

    const [[studentsToday]] = await db.execute(`
      SELECT COUNT(*) AS today_total_students FROM iim_pgpmci_slot_student WHERE DATE(added_at) = CURDATE()
    `);

    const [[presentAbsent]] = await db.execute(`
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_students,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_students
      FROM iim_pgpmci_slot_student
      WHERE DATE(added_at) = CURDATE()
    `);

    // ✅ Consent form
    const [[consent]] = await db.execute(`
      SELECT
        SUM(check1 + check2 + check3 + check4) AS total_consent_checks,
        COUNT(*) AS total_consent_requests
      FROM iim_consent_form
    `);

    // ✅ Verification reasons
    const [[verification]] = await db.execute(`
      SELECT
        SUM(CASE WHEN reason = 'reopen' THEN 1 ELSE 0 END) AS reopen,
        SUM(CASE WHEN reason = 'resubmitted' THEN 1 ELSE 0 END) AS resubmitted,
        SUM(CASE WHEN reason = 'auto_submitted' THEN 1 ELSE 0 END) AS auto_submitted
      FROM iim_pgpmci_verification
    `);

    // ✅ Phase 1 application stats
    const [[phase1]] = await db.execute(`
      SELECT
        COUNT(*) AS total_applications,
        SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS form_submitted,
        SUM(CASE WHEN reopen = 1 THEN 1 ELSE 0 END) AS reopened,
        SUM(CASE WHEN resubmitted = 1 THEN 1 ELSE 0 END) AS resubmitted,
        SUM(CASE WHEN resubmitted = 0 THEN 1 ELSE 0 END) AS not_resubmitted
      FROM iim_pgpmci_application
    `);

    // ✅ Registration and Shortlist
    const [[registered]] = await db.execute(`
      SELECT COUNT(*) AS registered_students FROM iim_pgpmci_registered
    `);

    const [[shortlisted]] = await db.execute(`
      SELECT COUNT(*) AS shortlisted_students FROM iim_pgpmci_registered WHERE shortlist_status = 'shortlisted'
    `);

    // ✅ FINAL RESPONSE
    res.json({
      success: true,
      data: {
        phase3: {
          total_accepted: acceptReject.total_accepted,
          total_rejected: acceptReject.total_rejected,
          commitment_fee_paid: fees.commitment_fee_paid,
          term_fee_paid: fees.term_fee_paid,
          acceptance_form_submitted: acceptanceForms.acceptance_form_submitted
        },
        withdrawals: {
          total_withdrawals: withdrawals.total_withdrawals
        },
        phase2b: {
          today_total_slots: slots.today_total_slots,
          today_total_students: studentsToday.today_total_students,
          present_students: presentAbsent.present_students,
          absent_students: presentAbsent.absent_students
        },
        phase2a: {
          total_consent_requests: consent.total_consent_requests,
          total_consent_checks: consent.total_consent_checks
        },
        verificationDetails: {
          reopen: verification.reopen,
          resubmitted: verification.resubmitted,
          auto_submitted: verification.auto_submitted
        },
        phase1: {
          form_submitted: phase1.form_submitted,
          total_applications: phase1.total_applications,
          reopened: phase1.reopened,
          resubmitted: phase1.resubmitted,
          not_resubmitted: phase1.not_resubmitted,
          registered_students: registered.registered_students,
          shortlisted_students: shortlisted.shortlisted_students
        }
      }
    });

  } catch (err) {
    console.error('PGP Summary API Error:', err);
    res.status(500).json({ success: false, message: 'Error fetching PGP dashboard data' });
  }
});

// PhD Summary Route - Fixed for actual table structure
router.get('/phd-summary', async (req, res) => {
  try {
    // Phase 3 - Commitment Fee
    const [[commitmentFee]] = await db.execute(`
      SELECT COUNT(*) AS commitment_fee_paid
      FROM iim_phd_application 
      WHERE commitment_payment = 1
    `);

    // Phase 2 - Slots and attendance (today)
    const [[slots]] = await db.execute(`
      SELECT COUNT(*) AS today_total_slots 
      FROM iim_phd_slot 
      WHERE DATE(slot_date) = CURDATE()
    `);

    const [[studentsToday]] = await db.execute(`
      SELECT COUNT(*) AS today_total_students 
      FROM iim_phd_slot_student pss
      JOIN iim_phd_slot ps ON pss.slot_id = ps.id
      WHERE DATE(ps.slot_date) = CURDATE()
    `);

    const [[presentAbsentToday]] = await db.execute(`
      SELECT
        COUNT(CASE WHEN pss.attendance = 1 THEN 1 END) AS present_students,
        COUNT(CASE WHEN pss.attendance = 0 THEN 1 END) AS absent_students,
        COUNT(CASE WHEN pss.attendance IS NULL THEN 1 END) AS pending_students
      FROM iim_phd_slot_student pss
      JOIN iim_phd_slot ps ON pss.slot_id = ps.id
      WHERE DATE(ps.slot_date) = CURDATE()
    `);

    // Total slots and attendance (all time)
    const [[totalSlots]] = await db.execute(`
      SELECT COUNT(*) AS total_slots FROM iim_phd_slot
    `);

    const [[totalStudents]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_students,
        COUNT(CASE WHEN attendance = 1 THEN 1 END) AS total_present,
        COUNT(CASE WHEN attendance = 0 THEN 1 END) AS total_absent,
        COUNT(CASE WHEN attendance IS NULL THEN 1 END) AS total_pending
      FROM iim_phd_slot_student
    `);

    // Phase 1 - Registration and applications
    const [[registrations]] = await db.execute(`
      SELECT COUNT(*) AS total_registrations FROM iim_phd_registered
    `);

    const [[applications]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_applications,
        SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS submitted_applications
      FROM iim_phd_application
    `);

    // Area-wise applications
    const [areaWiseApplications] = await db.execute(`
      SELECT 
        research_area, 
        COUNT(*) AS application_count 
      FROM iim_phd_application 
      WHERE final_submit = 1 
      GROUP BY research_area
    `);

    res.json({
      success: true,
      data: {
        phase3: {
          commitment_fee_paid: commitmentFee.commitment_fee_paid || 0
        },
        phase2: {
          today_total_slots: slots.today_total_slots || 0,
          today_total_students: studentsToday.today_total_students || 0,
          present_students: presentAbsentToday.present_students || 0,
          absent_students: presentAbsentToday.absent_students || 0,
          pending_students: presentAbsentToday.pending_students || 0,
          total_slots: totalSlots.total_slots || 0,
          total_students: totalStudents.total_students || 0,
          total_present: totalStudents.total_present || 0,
          total_absent: totalStudents.total_absent || 0,
          total_pending: totalStudents.total_pending || 0
        },
        phase1: {
          total_registrations: registrations.total_registrations || 0,
          total_applications: applications.total_applications || 0,
          submitted_applications: applications.submitted_applications || 0,
          area_wise_applications: areaWiseApplications || []
        }
      }
    });
  } catch (err) {
    console.error('PhD Summary API Error:', err);
    res.status(500).json({ success: false, message: 'Error fetching PhD dashboard data', error: err.message });
  }
});

// EPhD Summary Route - Fixed for actual table structure
router.get('/ephd-summary', async (req, res) => {
  try {
    // Phase 3 - Commitment Fee
    const [[commitmentFee]] = await db.execute(`
      SELECT COUNT(*) AS commitment_fee_paid
      FROM iim_ephd_application 
      WHERE commitment_payment = 1
    `);

    // Phase 2 - Slots and attendance (today)
    const [[slots]] = await db.execute(`
      SELECT COUNT(*) AS today_total_slots 
      FROM iim_ephd_slot 
      WHERE DATE(slot_date) = CURDATE()
    `);

    const [[studentsToday]] = await db.execute(`
      SELECT COUNT(*) AS today_total_students 
      FROM iim_ephd_slot_student ess
      JOIN iim_ephd_slot es ON ess.slot_id = es.id
      WHERE DATE(es.slot_date) = CURDATE()
    `);

    const [[presentAbsentToday]] = await db.execute(`
      SELECT
        COUNT(CASE WHEN ess.attendance = 1 THEN 1 END) AS present_students,
        COUNT(CASE WHEN ess.attendance = 0 THEN 1 END) AS absent_students,
        COUNT(CASE WHEN ess.attendance IS NULL THEN 1 END) AS pending_students
      FROM iim_ephd_slot_student ess
      JOIN iim_ephd_slot es ON ess.slot_id = es.id
      WHERE DATE(es.slot_date) = CURDATE()
    `);

    // Total slots and attendance (all time)
    const [[totalSlots]] = await db.execute(`
      SELECT COUNT(*) AS total_slots FROM iim_ephd_slot
    `);

    const [[totalStudents]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_students,
        COUNT(CASE WHEN attendance = 1 THEN 1 END) AS total_present,
        COUNT(CASE WHEN attendance = 0 THEN 1 END) AS total_absent,
        COUNT(CASE WHEN attendance IS NULL THEN 1 END) AS total_pending
      FROM iim_ephd_slot_student
    `);

    // Phase 1 - Registration and applications
    const [[registrations]] = await db.execute(`
      SELECT COUNT(*) AS total_registrations FROM iim_ephd_registered
    `);

    const [[applications]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_applications,
        SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS submitted_applications
      FROM iim_ephd_application
    `);

    // Area-wise applications
    const [areaWiseApplications] = await db.execute(`
      SELECT 
        research_area, 
        COUNT(*) AS application_count 
      FROM iim_ephd_application 
      WHERE final_submit = 1 
      GROUP BY research_area
    `);

    res.json({
      success: true,
      data: {
        phase3: {
          commitment_fee_paid: commitmentFee.commitment_fee_paid || 0
        },
        phase2: {
          today_total_slots: slots.today_total_slots || 0,
          today_total_students: studentsToday.today_total_students || 0,
          present_students: presentAbsentToday.present_students || 0,
          absent_students: presentAbsentToday.absent_students || 0,
          pending_students: presentAbsentToday.pending_students || 0,
          total_slots: totalSlots.total_slots || 0,
          total_students: totalStudents.total_students || 0,
          total_present: totalStudents.total_present || 0,
          total_absent: totalStudents.total_absent || 0,
          total_pending: totalStudents.total_pending || 0
        },
        phase1: {
          total_registrations: registrations.total_registrations || 0,
          total_applications: applications.total_applications || 0,
          submitted_applications: applications.submitted_applications || 0,
          area_wise_applications: areaWiseApplications || []
        }
      }
    });
  } catch (err) {
    console.error('EPhD Summary API Error:', err);
    res.status(500).json({ success: false, message: 'Error fetching EPhD dashboard data', error: err.message });
  }
});

// EMBA Summary Route - This one should work as is since it has the correct structure
router.get('/emba-summary', async (req, res) => {
  try {
    // Phase 3 - Commitment Fee
    const [[commitmentFee]] = await db.execute(`
      SELECT COUNT(*) AS commitment_fee_paid
      FROM iim_emba_application 
      WHERE commitment_payment = 1
    `);

    // Phase 2 - Slots and attendance (today)
    const [[slots]] = await db.execute(`
      SELECT COUNT(*) AS today_total_slots 
      FROM iim_emba_slot 
      WHERE DATE(slot_date) = CURDATE()
    `);

    const [[studentsToday]] = await db.execute(`
      SELECT COUNT(*) AS today_total_students 
      FROM iim_emba_slot_student 
      WHERE DATE(added_at) = CURDATE()
    `);

    const [[presentAbsentToday]] = await db.execute(`
      SELECT
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_students,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_students,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_students
      FROM iim_emba_slot_student
      WHERE DATE(added_at) = CURDATE()
    `);

    // Total slots and attendance (all time)
    const [[totalSlots]] = await db.execute(`
      SELECT COUNT(*) AS total_slots FROM iim_emba_slot
    `);

    const [[totalStudents]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) AS total_present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) AS total_absent,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS total_pending
      FROM iim_emba_slot_student
    `);

    // Phase 1 - Registration and applications
    const [[registrations]] = await db.execute(`
      SELECT COUNT(*) AS total_registrations FROM iim_emba_registered
    `);

    const [[applications]] = await db.execute(`
      SELECT 
        COUNT(*) AS total_applications,
        SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS submitted_applications
      FROM iim_emba_application
    `);

    // Area-wise applications
    const [areaWiseApplications] = await db.execute(`
      SELECT 
        specialization_area, 
        COUNT(*) AS application_count 
      FROM iim_emba_application 
      WHERE final_submit = 1 
      GROUP BY specialization_area
    `);

    res.json({
      success: true,
      data: {
        phase3: {
          commitment_fee_paid: commitmentFee.commitment_fee_paid || 0
        },
        phase2: {
          today_total_slots: slots.today_total_slots || 0,
          today_total_students: studentsToday.today_total_students || 0,
          present_students: presentAbsentToday.present_students || 0,
          absent_students: presentAbsentToday.absent_students || 0,
          pending_students: presentAbsentToday.pending_students || 0,
          total_slots: totalSlots.total_slots || 0,
          total_students: totalStudents.total_students || 0,
          total_present: totalStudents.total_present || 0,
          total_absent: totalStudents.total_absent || 0,
          total_pending: totalStudents.total_pending || 0
        },
        phase1: {
          total_registrations: registrations.total_registrations || 0,
          total_applications: applications.total_applications || 0,
          submitted_applications: applications.submitted_applications || 0,
          area_wise_applications: areaWiseApplications || []
        }
      }
    });
  } catch (err) {
    console.error('EMBA Summary API Error:', err);
    res.status(500).json({ success: false, message: 'Error fetching EMBA dashboard data', error: err.message });
  }
});

// 🔍 Phase progress by courseCode + phaseName
router.get('/phase/:courseCode/:phaseName', async (req, res) => {
  try {
    const { courseCode, phaseName } = req.params;

    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.username,
        upp.status,
        upp.started_at,
        upp.completed_at,
        upp.verified_at,
        upp.progress_percentage,
        upp.notes,
        ue.enrollment_date
      FROM user_phase_progress upp
      JOIN phases p ON upp.phase_id = p.id
      JOIN courses c ON p.course_id = c.id
      JOIN users u ON upp.user_id = u.id
      JOIN user_enrollments ue ON u.id = ue.user_id AND c.id = ue.course_id
      WHERE c.course_code = ? AND p.phase_name = ?
      ORDER BY upp.updated_at DESC
    `;

    const [rows] = await db.execute(query, [courseCode.toUpperCase(), phaseName]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Phase progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching phase progress data',
      error: error.message
    });
  }
});

// 🔎 Phase progress by courseId + phaseId
router.get('/courses/:courseId/phases/:phaseId/progress', async (req, res) => {
  try {
    const { courseId, phaseId } = req.params;

    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.username,
        upp.status,
        upp.started_at,
        upp.completed_at,
        upp.verified_at,
        upp.progress_percentage,
        upp.notes,
        ue.enrollment_date,
        c.course_code,
        c.course_name,
        p.phase_name
      FROM user_phase_progress upp
      JOIN phases p ON upp.phase_id = p.id
      JOIN courses c ON p.course_id = c.id
      JOIN users u ON upp.user_id = u.id
      JOIN user_enrollments ue ON u.id = ue.user_id AND c.id = ue.course_id
      WHERE c.id = ? AND p.id = ?
      ORDER BY upp.updated_at DESC
    `;

    const [rows] = await db.execute(query, [courseId, phaseId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Phase progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching phase progress data',
      error: error.message
    });
  }
});

// 🧪 Sample data insert
router.post('/init-sample-data', async (req, res) => {
  try {
    const sampleEnrollments = [
      { user_id: 1, course_id: 1 },
      { user_id: 2, course_id: 2 },
      { user_id: 3, course_id: 3 },
      { user_id: 4, course_id: 4 }
    ];

    for (const enrollment of sampleEnrollments) {
      await db.execute(
        'INSERT IGNORE INTO user_enrollments (user_id, course_id, status) VALUES (?, ?, ?)',
        [enrollment.user_id, enrollment.course_id, 'active']
      );

      const [phases] = await db.execute(
        'SELECT id FROM phases WHERE course_id = ?',
        [enrollment.course_id]
      );

      for (const phase of phases) {
        const statuses = ['not_started', 'in_progress', 'completed', 'verification_pending', 'verified'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomProgress = Math.floor(Math.random() * 101);

        await db.execute(
          `INSERT IGNORE INTO user_phase_progress 
          (user_id, phase_id, status, progress_percentage, updated_at) 
          VALUES (?, ?, ?, ?, NOW())`,
          [enrollment.user_id, phase.id, randomStatus, randomProgress]
        );
      }
    }

    res.json({
      success: true,
      message: 'Sample data initialized with enrollments and phase progress'
    });
  } catch (error) {
    console.error('Sample data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing data',
      error: error.message
    });
  }
});

// ✅ Export the router
module.exports = router;