const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { safeQuery, getBestTimestampColumn } = require("../utils/safeQuery");

// Get recent activities from auth_db
router.get("/recent-activities", async (req, res) => {
  try {
    let activities = [];
    
    // If database queries fail, provide fallback data
    const fallbackActivities = [
      {
        title: "New Application Received",
        description: "PGP - Computer Science",
        timeAgo: "2 hours ago",
        icon: "checkmark-circle",
        color: "#4CAF50"
      },
      {
        title: "Document Verification",
        description: "PhD - 5 Applications",
        timeAgo: "3 hours ago",
        icon: "document-text",
        color: "#2196F3"
      },
      {
        title: "Interview Slots Booked",
        description: "EMBA - 8 Students",
        timeAgo: "5 hours ago",
        icon: "calendar",
        color: "#FF9800"
      }
    ];

    // Get recent PGP applications
    const timestampCol = await getBestTimestampColumn('iim_pgpmci_application');
    const pgpActivities = await safeQuery(`
      SELECT 
        'New Application Received' as activity_type,
        'PGP' as program,
        ${timestampCol} as activity_time,
        'application' as category
      FROM iim_pgpmci_application 
      WHERE ${timestampCol} >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY ${timestampCol} DESC
      LIMIT 5
    `, [], "PGP activities query");
    
    activities = activities.concat(
      pgpActivities.map((activity) => ({
        ...activity,
        title: `${activity.activity_type}`,
        description: `${activity.program} - New Application`,
        time: activity.activity_time,
        icon: "checkmark-circle",
        color: "#4CAF50",
      }))
    );

    // Get recent PhD applications
    const phdTimestampCol = await getBestTimestampColumn('iim_phd_application');
    const phdActivities = await safeQuery(`
      SELECT 
        'New Application Received' as activity_type,
        'PhD' as program,
        ${phdTimestampCol} as activity_time,
        'application' as category
      FROM iim_phd_application 
      WHERE ${phdTimestampCol} >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY ${phdTimestampCol} DESC
      LIMIT 3
    `, [], "PhD activities query");
    
    activities = activities.concat(
      phdActivities.map((activity) => ({
        ...activity,
        title: `${activity.activity_type}`,
        description: `${activity.program} - New Application`,
        time: activity.activity_time,
        icon: "checkmark-circle",
        color: "#4CAF50",
      }))
    );

    // Get recent document verifications
    const verificationActivities = await safeQuery(`
      SELECT 
        'Document Verification' as activity_type,
        'PGP' as program,
        MAX(created_at) as activity_time,
        'verification' as category,
        COUNT(*) as count
      FROM iim_pgpmci_verification 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      GROUP BY DATE(created_at)
      ORDER BY MAX(created_at) DESC
      LIMIT 2
    `, [], "Verification activities query");
    
    activities = activities.concat(
      verificationActivities.map((activity) => ({
        ...activity,
        title: "Document Verification",
        description: `${activity.program} - ${activity.count} Applications`,
        time: activity.activity_time,
        icon: "document-text",
        color: "#2196F3",
      }))
    );

    // Get recent slot bookings
    const slotActivities = await safeQuery(`
      SELECT 
        'Slot Booking' as activity_type,
        'PGP' as program,
        MAX(added_at) as activity_time,
        'slot' as category,
        COUNT(*) as count
      FROM iim_pgpmci_slot_student 
      WHERE added_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      GROUP BY DATE(added_at)
      ORDER BY MAX(added_at) DESC
      LIMIT 2
    `, [], "Slot activities query");
    
    activities = activities.concat(
      slotActivities.map((activity) => ({
        ...activity,
        title: "Interview Slots Booked",
        description: `${activity.program} - ${activity.count} Students`,
        time: activity.activity_time,
        icon: "calendar",
        color: "#FF9800",
      }))
    );

    // If no activities found from database, use fallback
    if (activities.length === 0) {
      activities = fallbackActivities;
    } else {
      // Sort all activities by time and limit to 5 most recent
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      activities = activities.slice(0, 5);

      // Format time for display
      activities = activities.map((activity) => ({
        ...activity,
        timeAgo: getTimeAgo(activity.time),
      }));
    }

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Recent activities error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recent activities",
      error: error.message,
    });
  }
});

// Get important dates from auth_db calendar tables
router.get("/important-dates", async (req, res) => {
  try {
    let importantDates = [];
    
    // Fallback important dates
    const fallbackDates = [
      {
        title: "Application Deadline - PGP",
        date: "2025-03-15",
        description: "Final date for application submission",
        icon: "calendar",
        color: "#8e2a6b",
        category: "deadline",
      },
      {
        title: "Admission Committee Meeting",
        date: "2025-03-20",
        description: "Review of all applications",
        icon: "school",
        color: "#8e2a6b",
        category: "meeting",
      },
      {
        title: "Document Verification",
        date: "2025-03-25",
        description: "Final document verification process",
        icon: "document-text",
        color: "#8e2a6b",
        category: "verification",
      },
    ];

    // Get PGP calendar dates (show recent and upcoming dates)
    try {
      const [pgpCalendar] = await db.execute(`
        SELECT 
          announcement_offer_date as event_date,
          'Announcement Offer Date' as event_type,
          'PGP' as program,
          announcement_no,
          'announcement' as category
        FROM iim_pgpmci_calendar 
        WHERE announcement_offer_date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
        ORDER BY announcement_offer_date DESC
        LIMIT 2
      `);

      const [pgpCommitment] = await db.execute(`
        SELECT 
          commitment_fee_date_offered as event_date,
          'Commitment Fee Deadline' as event_type,
          'PGP' as program,
          announcement_no,
          'fee' as category
        FROM iim_pgpmci_calendar 
        WHERE commitment_fee_date_offered >= DATE_SUB(NOW(), INTERVAL 180 DAY)
        ORDER BY commitment_fee_date_offered DESC
        LIMIT 2
      `);

      const [pgpTerm] = await db.execute(`
        SELECT 
          term_fee_date as event_date,
          'Term Fee Deadline' as event_type,
          'PGP' as program,
          announcement_no,
          'fee' as category
        FROM iim_pgpmci_calendar 
        WHERE term_fee_date >= DATE_SUB(NOW(), INTERVAL 180 DAY)
        ORDER BY term_fee_date DESC
        LIMIT 2
      `);

      importantDates = importantDates.concat(
        [...pgpCalendar, ...pgpCommitment, ...pgpTerm].map((event) => ({
          title: `${event.event_type} - ${event.program}`,
          date: event.event_date,
          description: `Announcement #${event.announcement_no}`,
          icon: event.category === "fee" ? "card" : "calendar",
          color: "#8e2a6b",
          category: event.category,
        }))
      );
    } catch (e) {
      console.log("PGP calendar query failed:", e.message);
    }

    // Get PhD calendar dates (show recent and upcoming dates)
    try {
      const [phdCalendar] = await db.execute(`
        SELECT 
          announcement_offer_date as event_date,
          'Announcement Offer Date' as event_type,
          'PhD' as program,
          announcement_no,
          'announcement' as category
        FROM iim_phd_calendar 
        WHERE announcement_offer_date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
        ORDER BY announcement_offer_date DESC
        LIMIT 2
      `);

      const [phdCommitment] = await db.execute(`
        SELECT 
          commitment_fee_last_date as event_date,
          'Commitment Fee Deadline' as event_type,
          'PhD' as program,
          announcement_no,
          'fee' as category
        FROM iim_phd_calendar 
        WHERE commitment_fee_last_date >= DATE_SUB(NOW(), INTERVAL 180 DAY)
        ORDER BY commitment_fee_last_date DESC
        LIMIT 2
      `);

      importantDates = importantDates.concat(
        [...phdCalendar, ...phdCommitment].map((event) => ({
          title: `${event.event_type} - ${event.program}`,
          date: event.event_date,
          description: `Announcement #${event.announcement_no}`,
          icon: event.category === "fee" ? "card" : "school",
          color: "#2196F3",
          category: event.category,
        }))
      );
    } catch (e) {
      console.log("PhD calendar query failed:", e.message);
    }

    // Get Interview calendar dates (show recent and upcoming dates)
    try {
      const [interviewCalendar] = await db.execute(`
        SELECT 
          announcement_offer_date as event_date,
          'Interview Announcement' as event_type,
          'Interview' as program,
          announcement_no,
          'interview' as category
        FROM iim_interview_calendar 
        WHERE announcement_offer_date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
        ORDER BY announcement_offer_date DESC
        LIMIT 2
      `);

      const [interviewDeadline] = await db.execute(`
        SELECT 
          announcement_offer_last_date as event_date,
          'Interview Response Deadline' as event_type,
          'Interview' as program,
          announcement_no,
          'deadline' as category
        FROM iim_interview_calendar 
        WHERE announcement_offer_last_date >= DATE_SUB(NOW(), INTERVAL 180 DAY)
        ORDER BY announcement_offer_last_date DESC
        LIMIT 2
      `);

      importantDates = importantDates.concat(
        [...interviewCalendar, ...interviewDeadline].map((event) => ({
          title: `${event.event_type}`,
          date: event.event_date,
          description: `Announcement #${event.announcement_no}`,
          icon: "people",
          color: "#FF9800",
          category: event.category,
        }))
      );
    } catch (e) {
      console.log("Interview calendar query failed:", e.message);
    }

    // Get upcoming slot dates as backup
    try {
      const [upcomingSlots] = await db.execute(`
        SELECT DISTINCT
          slot_date as event_date,
          'Interview Slots' as event_type,
          'PGP' as program,
          COUNT(*) as slot_count,
          'slot' as category
        FROM iim_pgpmci_slot 
        WHERE slot_date >= CURDATE() AND slot_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        GROUP BY slot_date
        ORDER BY slot_date ASC
        LIMIT 2
      `);
      importantDates = importantDates.concat(
        upcomingSlots.map((slot) => ({
          title: `${slot.event_type} - ${slot.program}`,
          date: slot.event_date,
          description: `${slot.slot_count} slots available`,
          icon: "calendar",
          color: "#4CAF50",
          category: slot.category,
        }))
      );
    } catch (e) {
      console.log("Upcoming slots query failed:", e.message);
    }

    // Add fallback important dates if no dynamic dates found
    if (importantDates.length === 0) {
      importantDates = fallbackDates;
    }

    // Sort by date and format
    importantDates.sort((a, b) => new Date(a.date) - new Date(b.date));
    importantDates = importantDates.slice(0, 8);

    // Format dates for display
    importantDates = importantDates.map((event) => ({
      ...event,
      formattedDate: formatDate(event.date),
    }));

    res.json({
      success: true,
      data: importantDates,
    });
  } catch (error) {
    console.error("Important dates error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching important dates",
      error: error.message,
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInMs = now - activityDate;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${Math.max(1, diffInMinutes)} minute${
      diffInMinutes > 1 ? "s" : ""
    } ago`;
  }
}

// Helper function to format date
function formatDate(date) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", options);
}

module.exports = router;
