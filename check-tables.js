const db = require('./config/db');

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables...');
    
    // Check what tables exist
    const [tables] = await db.execute("SHOW TABLES");
    console.log('📋 Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    // Check for specific tables we need
    const requiredTables = [
      'iim_pgpmci_application',
      'iim_pgpmci_slot',
      'iim_pgpmci_slot_student',
      'iim_pgpmci_registered',
      'iim_phd_slot',
      'iim_phd_slot_student',
      'iim_phd_registered',
      'iim_phd_application',
      'iim_ephd_slot',
      'iim_ephd_slot_student',
      'iim_ephd_registered',
      'iim_ephd_application',
      'iim_emba_slot',
      'iim_emba_slot_student',
      'iim_emba_registered',
      'iim_emba_application',
      'iim_payment',
      'iim_consent_form',
      'iim_pgpmci_verification',
      'iim_pgpmci_withdraw'
    ];
    
    console.log('\n🔍 Checking required tables:');
    const existingTableNames = tables.map(table => Object.values(table)[0]);
    
    for (const tableName of requiredTables) {
      const exists = existingTableNames.includes(tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    process.exit(0);
  }
}

checkTables();