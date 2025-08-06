const db = require('./config/db');

async function checkTableColumns() {
  try {
    console.log('🔍 Checking table columns...');

    // Check PGP application table
    try {
      const [pgpColumns] = await db.execute('DESCRIBE iim_pgpmci_application');
      console.log('\n📋 iim_pgpmci_application columns:');
      console.table(pgpColumns.map(col => ({ Field: col.Field, Type: col.Type })));
    } catch (e) {
      console.log('❌ iim_pgpmci_application table not found:', e.message);
    }

    // Check PhD application table
    try {
      const [phdColumns] = await db.execute('DESCRIBE iim_phd_application');
      console.log('\n📋 iim_phd_application columns:');
      console.table(phdColumns.map(col => ({ Field: col.Field, Type: col.Type })));
    } catch (e) {
      console.log('❌ iim_phd_application table not found:', e.message);
    }

    // Check verification table
    try {
      const [verificationColumns] = await db.execute('DESCRIBE iim_pgpmci_verification');
      console.log('\n📋 iim_pgpmci_verification columns:');
      console.table(verificationColumns.map(col => ({ Field: col.Field, Type: col.Type })));
    } catch (e) {
      console.log('❌ iim_pgpmci_verification table not found:', e.message);
    }

    // Check slot student table
    try {
      const [slotColumns] = await db.execute('DESCRIBE iim_pgpmci_slot_student');
      console.log('\n📋 iim_pgpmci_slot_student columns:');
      console.table(slotColumns.map(col => ({ Field: col.Field, Type: col.Type })));
    } catch (e) {
      console.log('❌ iim_pgpmci_slot_student table not found:', e.message);
    }

    console.log('\n✅ Table column check completed!');

  } catch (error) {
    console.error('❌ Error checking table columns:', error);
  } finally {
    process.exit(0);
  }
}

checkTableColumns();