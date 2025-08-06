const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all events with filtering
router.get('/', async (req, res) => {
  try {
    const {
      date,
      program_id = 'all',
      event_type = 'all',
      start_date,
      end_date
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Filter by specific date
    if (date) {
      whereConditions.push('DATE(date) = ?');
      queryParams.push(date);
    }

    // Filter by date range
    if (start_date && end_date) {
      whereConditions.push('DATE(date) BETWEEN ? AND ?');
      queryParams.push(start_date, end_date);
    }

    // Filter by program
    if (program_id !== 'all') {
      whereConditions.push('program_id = ?');
      queryParams.push(program_id);
    }

    // Filter by event type
    if (event_type !== 'all') {
      whereConditions.push('event_type = ?');
      queryParams.push(event_type);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const query = `
      SELECT 
        id,
        event_title,
        date,
        time,
        location,
        event_type,
        program_id,
        notes,
        created_at,
        updated_at
      FROM schedule_events 
      ${whereClause}
      ORDER BY date ASC, time ASC
    `;

    const [events] = await db.execute(query, queryParams);

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM schedule_events 
      WHERE id = ?
    `;
    
    const [events] = await db.execute(query, [id]);
    
    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: events[0]
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      event_title,
      date,
      time,
      location,
      event_type,
      program_id,
      notes
    } = req.body;

    // Validate required fields
    if (!event_title || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Event title, date, and time are required'
      });
    }

    const query = `
      INSERT INTO schedule_events 
      (event_title, date, time, location, event_type, program_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      event_title,
      date,
      time,
      location || '',
      event_type || 'meeting',
      program_id || 'all',
      notes || ''
    ]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: result.insertId,
        event_title,
        date,
        time,
        location,
        event_type,
        program_id,
        notes
      }
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_title,
      date,
      time,
      location,
      event_type,
      program_id,
      notes
    } = req.body;

    // Validate required fields
    if (!event_title || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Event title, date, and time are required'
      });
    }

    const query = `
      UPDATE schedule_events 
      SET event_title = ?, date = ?, time = ?, location = ?, 
          event_type = ?, program_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      event_title,
      date,
      time,
      location || '',
      event_type || 'meeting',
      program_id || 'all',
      notes || '',
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM schedule_events WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
});

// Get events for a specific date range (calendar view)
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const query = `
      SELECT 
        DATE(date) as event_date,
        COUNT(*) as event_count,
        GROUP_CONCAT(event_title SEPARATOR ', ') as event_titles
      FROM schedule_events 
      WHERE YEAR(date) = ? AND MONTH(date) = ?
      GROUP BY DATE(date)
      ORDER BY date ASC
    `;

    const [events] = await db.execute(query, [year, month]);

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar events',
      error: error.message
    });
  }
});

// Get upcoming events (next 7 days)
router.get('/upcoming/week', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        event_title,
        date,
        time,
        location,
        event_type,
        program_id,
        notes
      FROM schedule_events 
      WHERE date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY date ASC, time ASC
      LIMIT 10
    `;

    const [events] = await db.execute(query);

    res.json({
      success: true,
      data: events
    });

  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: error.message
    });
  }
});

module.exports = router;