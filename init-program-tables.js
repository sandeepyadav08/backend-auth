const db = require('./config/db');

async function initProgramTables() {
  try {
    console.log('🔄 Initializing program tables...');
    
    // Create PhD tables
    console.log('📊 Creating PhD tables...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_phd_slot (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_date DATETIME NOT NULL,
        slot_time VARCHAR(50) NOT NULL,
        slot_capacity INT NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_phd_slot_student (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('pending', 'present', 'absent') DEFAULT 'pending',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slot_id (slot_id),
        INDEX idx_user_id (user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_phd_registered (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shortlist_status ENUM('pending', 'shortlisted', 'rejected') DEFAULT 'pending',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_phd_application (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        research_area VARCHAR(100) NOT NULL,
        final_submit BOOLEAN DEFAULT FALSE,
        reopen BOOLEAN DEFAULT FALSE,
        resubmitted BOOLEAN DEFAULT FALSE,
        commitment_payment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // Create EPhD tables
    console.log('📊 Creating Executive PhD tables...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_ephd_slot (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_date DATETIME NOT NULL,
        slot_time VARCHAR(50) NOT NULL,
        slot_capacity INT NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_ephd_slot_student (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('pending', 'present', 'absent') DEFAULT 'pending',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slot_id (slot_id),
        INDEX idx_user_id (user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_ephd_registered (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shortlist_status ENUM('pending', 'shortlisted', 'rejected') DEFAULT 'pending',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_ephd_application (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        research_area VARCHAR(100) NOT NULL,
        final_submit BOOLEAN DEFAULT FALSE,
        reopen BOOLEAN DEFAULT FALSE,
        resubmitted BOOLEAN DEFAULT FALSE,
        commitment_payment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // Create EMBA tables
    console.log('📊 Creating EMBA tables...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_emba_slot (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_date DATETIME NOT NULL,
        slot_time VARCHAR(50) NOT NULL,
        slot_capacity INT NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_emba_slot_student (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('pending', 'present', 'absent') DEFAULT 'pending',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slot_id (slot_id),
        INDEX idx_user_id (user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_emba_registered (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        shortlist_status ENUM('pending', 'shortlisted', 'rejected') DEFAULT 'pending',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS iim_emba_application (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        specialization_area VARCHAR(100) NOT NULL,
        final_submit BOOLEAN DEFAULT FALSE,
        reopen BOOLEAN DEFAULT FALSE,
        resubmitted BOOLEAN DEFAULT FALSE,
        commitment_payment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // Insert sample data
    console.log('📊 Inserting sample data...');
    
    // Check if the table has the expected columns before inserting
    try {
      const [columns] = await db.execute(`SHOW COLUMNS FROM iim_phd_slot`);
      const columnNames = columns.map(col => col.Field);
      
      if (columnNames.includes('slot_date') && columnNames.includes('slot_time') && columnNames.includes('slot_capacity')) {
        await db.execute(`
          INSERT IGNORE INTO iim_phd_slot (slot_date, slot_time, slot_capacity) VALUES
          (CURDATE(), '10:00 AM', 10),
          (CURDATE(), '2:00 PM', 15),
          (DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00 AM', 12)
        `);
      } else {
        console.log('iim_phd_slot table does not have the expected columns, skipping insert');
      }
    } catch (error) {
      console.log('Error checking columns or inserting into iim_phd_slot:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_phd_slot_student (slot_id, user_id, status) VALUES
        (1, 1, 'present'),
        (1, 2, 'absent'),
        (2, 1, 'pending')
      `);
    } catch (error) {
      console.log('Error inserting into iim_phd_slot_student:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_phd_registered (user_id, shortlist_status) VALUES
        (1, 'shortlisted'),
        (2, 'shortlisted'),
        (3, 'pending')
      `);
    } catch (error) {
      console.log('Error inserting into iim_phd_registered:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_phd_application (user_id, research_area, final_submit) VALUES
        (1, 'Computer Science', TRUE),
        (2, 'Finance', TRUE),
        (3, 'Marketing', FALSE)
      `);
    } catch (error) {
      console.log('Error inserting into iim_phd_application:', error.message);
    }

    // EPhD sample data
    try {
      const [columns] = await db.execute(`SHOW COLUMNS FROM iim_ephd_slot`);
      const columnNames = columns.map(col => col.Field);
      
      if (columnNames.includes('slot_date') && columnNames.includes('slot_time') && columnNames.includes('slot_capacity')) {
        await db.execute(`
          INSERT IGNORE INTO iim_ephd_slot (slot_date, slot_time, slot_capacity) VALUES
          (CURDATE(), '9:00 AM', 8),
          (CURDATE(), '3:00 PM', 10),
          (DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00 AM', 12)
        `);
      } else {
        console.log('iim_ephd_slot table does not have the expected columns, skipping insert');
      }
    } catch (error) {
      console.log('Error checking columns or inserting into iim_ephd_slot:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_ephd_slot_student (slot_id, user_id, status) VALUES
        (1, 1, 'present'),
        (1, 2, 'absent'),
        (2, 1, 'pending')
      `);
    } catch (error) {
      console.log('Error inserting into iim_ephd_slot_student:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_ephd_registered (user_id, shortlist_status) VALUES
        (1, 'shortlisted'),
        (2, 'shortlisted'),
        (3, 'pending')
      `);
    } catch (error) {
      console.log('Error inserting into iim_ephd_registered:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_ephd_application (user_id, research_area, final_submit) VALUES
        (1, 'Business Analytics', TRUE),
        (2, 'Organizational Behavior', TRUE),
        (3, 'Strategic Management', FALSE)
      `);
    } catch (error) {
      console.log('Error inserting into iim_ephd_application:', error.message);
    }

    // EMBA sample data
    try {
      const [columns] = await db.execute(`SHOW COLUMNS FROM iim_emba_slot`);
      const columnNames = columns.map(col => col.Field);
      
      if (columnNames.includes('slot_date') && columnNames.includes('slot_time') && columnNames.includes('slot_capacity')) {
        await db.execute(`
          INSERT IGNORE INTO iim_emba_slot (slot_date, slot_time, slot_capacity) VALUES
          (CURDATE(), '11:00 AM', 15),
          (CURDATE(), '4:00 PM', 12),
          (DATE_ADD(CURDATE(), INTERVAL 1 DAY), '9:30 AM', 10)
        `);
      } else {
        console.log('iim_emba_slot table does not have the expected columns, skipping insert');
      }
    } catch (error) {
      console.log('Error checking columns or inserting into iim_emba_slot:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_emba_slot_student (slot_id, user_id, status) VALUES
        (1, 1, 'present'),
        (1, 2, 'absent'),
        (2, 1, 'pending')
      `);
    } catch (error) {
      console.log('Error inserting into iim_emba_slot_student:', error.message);
    }

    try {
      await db.execute(`
        INSERT IGNORE INTO iim_emba_registered (user_id, shortlist_status) VALUES
        (1, 'shortlisted'),
        (2, 'shortlisted'),
        (3, 'pending')
      `);
    } catch (error) {
      console.log('Error inserting into iim_emba_registered:', error.message);
    }

    await db.execute(`
      INSERT IGNORE INTO iim_emba_application (user_id, specialization_area, final_submit) VALUES
      (1, 'Finance', TRUE),
      (2, 'Marketing', TRUE),
      (3, 'Operations', FALSE)
    `);
    
    console.log('✅ All program tables initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing program tables:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  initProgramTables()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = initProgramTables;