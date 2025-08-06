const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Root route
router.get("/", (req, res) => {
  res.send("✅ Dashboard API is running");
});

// 📊 Dashboard overview with commitment_fee
router.get("/overview", async (req, res) => {
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
    rows.forEach((row) => {
      if (!courseData[row.course_code]) {
        courseData[row.course_code] = {
          course_code: row.course_code,
          course_name: row.course_name,
          total_enrolled: row.total_enrolled,
          phases: [],
        };
      }

      if (row.phase_name) {
        courseData[row.course_code].phases.push({
          phase_name: row.phase_name,
          phase_order: row.phase_order,
          statistics: [
            { metric_name: "Commitment Fee", value: row.commitment_fee || 0 },
            { metric_name: "Not Started", value: row.not_started_count },
            { metric_name: "In Progress", value: row.in_progress_count },
            { metric_name: "Completed", value: row.completed_count },
            {
              metric_name: "Verification Pending",
              value: row.verification_pending_count,
            },
            { metric_name: "Verified", value: row.verified_count },
            {
              metric_name: "Average Progress %",
              value: row.avg_progress_percentage || 0,
            },
          ],
        });
      }
    });
    res.json({
      success: true,
      data: Object.values(courseData),
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
});

// ✅ Custom PGP summary route
router.get("/pgp-summary", async (req, res) => {
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
          acceptance_form_submitted: acceptanceForms.acceptance_form_submitted,
        },
        withdrawals: {
          total_withdrawals: withdrawals.total_withdrawals,
        },
        phase2b: {
          today_total_slots: slots.today_total_slots,
          today_total_students: studentsToday.today_total_students,
          present_students: presentAbsent.present_students,
          absent_students: presentAbsent.absent_students,
        },
        phase2a: {
          total_consent_requests: consent.total_consent_requests,
          total_consent_checks: consent.total_consent_checks,
        },
        verificationDetails: {
          reopen: verification.reopen,
          resubmitted: verification.resubmitted,
          auto_submitted: verification.auto_submitted,
        },
        phase1: {
          form_submitted: phase1.form_submitted,
          total_applications: phase1.total_applications,
          reopened: phase1.reopened,
          resubmitted: phase1.resubmitted,
          not_resubmitted: phase1.not_resubmitted,
          registered_students: registered.registered_students,
          shortlisted_students: shortlisted.shortlisted_students,
        },
      },
    });
  } catch (err) {
    console.error("PGP Summary API Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching PGP dashboard data" });
  }
});

// PhD Summary Route - Simplified with error handling
router.get("/phd-summary", async (req, res) => {
  try {
    let data = {
      phase3: { commitment_fee_paid: 0 },
      phase2: {
        today_total_slots: 0,
        today_total_students: 0,
        present_students: 0,
        absent_students: 0,
        pending_students: 0,
        total_slots: 0,
        total_students: 0,
        total_present: 0,
        total_absent: 0,
        total_pending: 0,
      },
      phase1: {
        total_registrations: 0,
        total_applications: 0,
        submitted_applications: 0,
        area_wise_applications: [],
      },
    };

    // Try each query individually with error handling
    try {
      const [[commitmentFee]] = await db.execute(`
        SELECT COUNT(*) AS commitment_fee_paid
        FROM iim_phd_application 
        WHERE commitment_payment = 1
      `);
      data.phase3.commitment_fee_paid = commitmentFee.commitment_fee_paid || 0;
    } catch (e) {
      console.log("PhD commitment fee query failed:", e.message);
    }

    try {
      const [[slots]] = await db.execute(`
        SELECT COUNT(*) AS today_total_slots 
        FROM iim_phd_slot 
        WHERE DATE(date) = CURDATE()
      `);
      data.phase2.today_total_slots = slots.today_total_slots || 0;
    } catch (e) {
      console.log("PhD slots query failed:", e.message);
    }

    try {
      const [[totalSlots]] = await db.execute(`
        SELECT COUNT(*) AS total_slots FROM iim_phd_slot
      `);
      data.phase2.total_slots = totalSlots.total_slots || 0;
    } catch (e) {
      console.log("PhD total slots query failed:", e.message);
    }

    try {
      const [[totalStudents]] = await db.execute(`
        SELECT COUNT(*) AS total_students FROM iim_phd_slot_student
      `);
      data.phase2.total_students = totalStudents.total_students || 0;
    } catch (e) {
      console.log("PhD total students query failed:", e.message);
    }

    try {
      const [[registrations]] = await db.execute(`
        SELECT COUNT(*) AS total_registrations FROM iim_phd_registered
      `);
      data.phase1.total_registrations = registrations.total_registrations || 0;
    } catch (e) {
      console.log("PhD registrations query failed:", e.message);
    }

    try {
      const [[applications]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS submitted_applications
        FROM iim_phd_application
      `);
      data.phase1.total_applications = applications.total_applications || 0;
      data.phase1.submitted_applications =
        applications.submitted_applications || 0;
    } catch (e) {
      console.log("PhD applications query failed:", e.message);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("PhD Summary API Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching PhD dashboard data",
      error: err.message,
    });
  }
});

// EPhD Summary Route - Simplified with error handling
router.get("/ephd-summary", async (req, res) => {
  try {
    let data = {
      phase3: { commitment_fee_paid: 0 },
      phase2: {
        today_total_slots: 0,
        today_total_students: 0,
        present_students: 0,
        absent_students: 0,
        pending_students: 0,
        total_slots: 0,
        total_students: 0,
        total_present: 0,
        total_absent: 0,
        total_pending: 0,
      },
      phase1: {
        total_registrations: 0,
        total_applications: 0,
        submitted_applications: 0,
        area_wise_applications: [],
      },
    };

    // Try each query individually with error handling
    try {
      const [[commitmentFee]] = await db.execute(`
        SELECT COUNT(*) AS commitment_fee_paid
        FROM iim_ephd_application 
        WHERE commitment_payment = 1
      `);
      data.phase3.commitment_fee_paid = commitmentFee.commitment_fee_paid || 0;
    } catch (e) {
      console.log("EPhD commitment fee query failed:", e.message);
    }

    try {
      const [[slots]] = await db.execute(`
        SELECT COUNT(*) AS today_total_slots 
        FROM iim_ephd_slot 
        WHERE DATE(date) = CURDATE()
      `);
      data.phase2.today_total_slots = slots.today_total_slots || 0;
    } catch (e) {
      console.log("EPhD slots query failed:", e.message);
    }

    try {
      const [[totalSlots]] = await db.execute(`
        SELECT COUNT(*) AS total_slots FROM iim_ephd_slot
      `);
      data.phase2.total_slots = totalSlots.total_slots || 0;
    } catch (e) {
      console.log("EPhD total slots query failed:", e.message);
    }

    try {
      const [[totalStudents]] = await db.execute(`
        SELECT COUNT(*) AS total_students FROM iim_ephd_slot_student
      `);
      data.phase2.total_students = totalStudents.total_students || 0;
    } catch (e) {
      console.log("EPhD total students query failed:", e.message);
    }

    try {
      const [[registrations]] = await db.execute(`
        SELECT COUNT(*) AS total_registrations FROM iim_ephd_registered
      `);
      data.phase1.total_registrations = registrations.total_registrations || 0;
    } catch (e) {
      console.log("EPhD registrations query failed:", e.message);
    }

    try {
      const [[applications]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS submitted_applications
        FROM iim_ephd_application
      `);
      data.phase1.total_applications = applications.total_applications || 0;
      data.phase1.submitted_applications =
        applications.submitted_applications || 0;
    } catch (e) {
      console.log("EPhD applications query failed:", e.message);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("EPhD Summary API Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching EPhD dashboard data",
      error: err.message,
    });
  }
});

// EMBA Summary Route - Simplified with error handling
router.get("/emba-summary", async (req, res) => {
  try {
    let data = {
      phase3: { commitment_fee_paid: 0 },
      phase2: {
        today_total_slots: 0,
        today_total_students: 0,
        present_students: 0,
        absent_students: 0,
        pending_students: 0,
        total_slots: 0,
        total_students: 0,
        total_present: 0,
        total_absent: 0,
        total_pending: 0,
      },
      phase1: {
        total_registrations: 0,
        total_applications: 0,
        submitted_applications: 0,
        area_wise_applications: [],
      },
    };

    // Try each query individually with error handling
    try {
      const [[commitmentFee]] = await db.execute(`
        SELECT COUNT(*) AS commitment_fee_paid
        FROM iim_emba_application 
        WHERE commitment_payment = 1
      `);
      data.phase3.commitment_fee_paid = commitmentFee.commitment_fee_paid || 0;
    } catch (e) {
      console.log("EMBA commitment fee query failed:", e.message);
    }

    try {
      const [[slots]] = await db.execute(`
        SELECT COUNT(*) AS today_total_slots 
        FROM iim_emba_slot 
        WHERE DATE(slot_date) = CURDATE()
      `);
      data.phase2.today_total_slots = slots.today_total_slots || 0;
    } catch (e) {
      console.log("EMBA slots query failed:", e.message);
    }

    try {
      const [[totalSlots]] = await db.execute(`
        SELECT COUNT(*) AS total_slots FROM iim_emba_slot
      `);
      data.phase2.total_slots = totalSlots.total_slots || 0;
    } catch (e) {
      console.log("EMBA total slots query failed:", e.message);
    }

    try {
      const [[studentsToday]] = await db.execute(`
        SELECT COUNT(*) AS today_total_students 
        FROM iim_emba_slot_student 
        WHERE DATE(added_at) = CURDATE()
      `);
      data.phase2.today_total_students =
        studentsToday.today_total_students || 0;
    } catch (e) {
      console.log("EMBA today students query failed:", e.message);
    }

    try {
      const [[totalStudents]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_students,
          COUNT(CASE WHEN status = 'present' THEN 1 END) AS total_present,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) AS total_absent,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) AS total_pending
        FROM iim_emba_slot_student
      `);
      data.phase2.total_students = totalStudents.total_students || 0;
      data.phase2.total_present = totalStudents.total_present || 0;
      data.phase2.total_absent = totalStudents.total_absent || 0;
      data.phase2.total_pending = totalStudents.total_pending || 0;
    } catch (e) {
      console.log("EMBA total students query failed:", e.message);
    }

    try {
      const [[registrations]] = await db.execute(`
        SELECT COUNT(*) AS total_registrations FROM iim_emba_registered
      `);
      data.phase1.total_registrations = registrations.total_registrations || 0;
    } catch (e) {
      console.log("EMBA registrations query failed:", e.message);
    }

    try {
      const [[applications]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          SUM(CASE WHEN final_submit = 1 THEN 1 ELSE 0 END) AS submitted_applications
        FROM iim_emba_application
      `);
      data.phase1.total_applications = applications.total_applications || 0;
      data.phase1.submitted_applications =
        applications.submitted_applications || 0;
    } catch (e) {
      console.log("EMBA applications query failed:", e.message);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("EMBA Summary API Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching EMBA dashboard data",
      error: err.message,
    });
  }
});

// 🔍 Phase progress by courseCode + phaseName
router.get("/phase/:courseCode/:phaseName", async (req, res) => {
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

    const [rows] = await db.execute(query, [
      courseCode.toUpperCase(),
      phaseName,
    ]);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Phase progress error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching phase progress data",
      error: error.message,
    });
  }
});

// 🔎 Phase progress by courseId + phaseId
router.get("/courses/:courseId/phases/:phaseId/progress", async (req, res) => {
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
      data: rows,
    });
  } catch (error) {
    console.error("Phase progress error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching phase progress data",
      error: error.message,
    });
  }
});

// 🧪 Sample data insert
router.post("/init-sample-data", async (req, res) => {
  try {
    const sampleEnrollments = [
      { user_id: 1, course_id: 1 },
      { user_id: 2, course_id: 2 },
      { user_id: 3, course_id: 3 },
      { user_id: 4, course_id: 4 },
    ];

    for (const enrollment of sampleEnrollments) {
      await db.execute(
        "INSERT IGNORE INTO user_enrollments (user_id, course_id, status) VALUES (?, ?, ?)",
        [enrollment.user_id, enrollment.course_id, "active"]
      );

      const [phases] = await db.execute(
        "SELECT id FROM phases WHERE course_id = ?",
        [enrollment.course_id]
      );

      for (const phase of phases) {
        const statuses = [
          "not_started",
          "in_progress",
          "completed",
          "verification_pending",
          "verified",
        ];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];
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
      message: "Sample data initialized with enrollments and phase progress",
    });
  } catch (error) {
    console.error("Sample data error:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing data",
      error: error.message,
    });
  }
});

// Home Dashboard Summary - Aggregated data from all programs
router.get("/home-summary", async (req, res) => {
  try {
    let totalApplications = 0;
    let totalAdmitted = 0;
    let totalUnderReview = 0;
    let programStats = [];

    // Get PGP data
    try {
      const [[pgpApps]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          COUNT(CASE WHEN commitment_payment = 1 THEN 1 END) AS admitted,
          COUNT(CASE WHEN final_submit = 1 AND commitment_payment = 0 THEN 1 END) AS under_review
        FROM iim_pgpmci_application
      `);
      totalApplications += pgpApps.total_applications || 0;
      totalAdmitted += pgpApps.admitted || 0;
      totalUnderReview += pgpApps.under_review || 0;
      programStats.push({
        program: "PGP",
        applications: pgpApps.total_applications || 0,
        admitted: pgpApps.admitted || 0,
        under_review: pgpApps.under_review || 0,
      });
    } catch (e) {
      console.log("PGP home summary query failed:", e.message);
    }

    // Get PhD data
    try {
      const [[phdApps]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          COUNT(CASE WHEN commitment_payment = 1 THEN 1 END) AS admitted,
          COUNT(CASE WHEN final_submit = 1 AND commitment_payment = 0 THEN 1 END) AS under_review
        FROM iim_phd_application
      `);
      totalApplications += phdApps.total_applications || 0;
      totalAdmitted += phdApps.admitted || 0;
      totalUnderReview += phdApps.under_review || 0;
      programStats.push({
        program: "PhD",
        applications: phdApps.total_applications || 0,
        admitted: phdApps.admitted || 0,
        under_review: phdApps.under_review || 0,
      });
    } catch (e) {
      console.log("PhD home summary query failed:", e.message);
    }

    // Get EPhD data
    try {
      const [[ephdApps]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          COUNT(CASE WHEN commitment_payment = 1 THEN 1 END) AS admitted,
          COUNT(CASE WHEN final_submit = 1 AND commitment_payment = 0 THEN 1 END) AS under_review
        FROM iim_ephd_application
      `);
      totalApplications += ephdApps.total_applications || 0;
      totalAdmitted += ephdApps.admitted || 0;
      totalUnderReview += ephdApps.under_review || 0;
      programStats.push({
        program: "EPhD",
        applications: ephdApps.total_applications || 0,
        admitted: ephdApps.admitted || 0,
        under_review: ephdApps.under_review || 0,
      });
    } catch (e) {
      console.log("EPhD home summary query failed:", e.message);
    }

    // Get EMBA data
    try {
      const [[embaApps]] = await db.execute(`
        SELECT 
          COUNT(*) AS total_applications,
          COUNT(CASE WHEN commitment_payment = 1 THEN 1 END) AS admitted,
          COUNT(CASE WHEN final_submit = 1 AND commitment_payment = 0 THEN 1 END) AS under_review
        FROM iim_emba_application
      `);
      totalApplications += embaApps.total_applications || 0;
      totalAdmitted += embaApps.admitted || 0;
      totalUnderReview += embaApps.under_review || 0;
      programStats.push({
        program: "EMBA",
        applications: embaApps.total_applications || 0,
        admitted: embaApps.admitted || 0,
        under_review: embaApps.under_review || 0,
      });
    } catch (e) {
      console.log("EMBA home summary query failed:", e.message);
    }

    // Calculate percentages for program-wise data
    const programStatsWithPercentage = programStats.map((program) => ({
      ...program,
      percentage:
        totalApplications > 0
          ? Math.round((program.applications / totalApplications) * 100)
          : 0,
    }));

    res.json({
      success: true,
      data: {
        quickStats: {
          totalApplications,
          totalAdmitted,
          totalUnderReview,
        },
        programStats: programStatsWithPercentage,
      },
    });
  } catch (err) {
    console.error("Home Summary API Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching home dashboard data",
      error: err.message,
    });
  }
});

// ✅ Export the router
module.exports = router;
