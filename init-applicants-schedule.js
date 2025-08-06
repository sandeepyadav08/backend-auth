const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function initApplicantsSchedule() {
  try {
    console.log('🚀 Initializing Applicants and Schedule tables...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'database', 'applicants_schedule_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await db.execute(statement);
        console.log('✅ Executed statement successfully');
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
          console.log('⚠️  Table/Entry already exists, skipping...');
        } else {
          console.error('❌ Error executing statement:', error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('🎉 Applicants and Schedule database initialization completed!');

    // Verify tables were created
    const [tables] = await db.execute("SHOW TABLES LIKE 'applicants'");
    const [scheduleTable] = await db.execute("SHOW TABLES LIKE 'schedule_events'");
    
    if (tables.length > 0) {
      console.log('✅ Applicants table created successfully');
      
      // Check applicants count
      const [applicantCount] = await db.execute('SELECT COUNT(*) as count FROM applicants');
      console.log(`📊 Total applicants: ${applicantCount[0].count}`);
    }

    if (scheduleTable.length > 0) {
      console.log('✅ Schedule events table created successfully');
      
      // Check events count
      const [eventCount] = await db.execute('SELECT COUNT(*) as count FROM schedule_events');
      console.log(`📅 Total events: ${eventCount[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error initializing applicants and schedule database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initApplicantsSchedule();