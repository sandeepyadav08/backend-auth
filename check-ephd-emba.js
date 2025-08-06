const db = require('./config/db');

async function checkTableStructures() {
  try {
    console.log('🔍 Checking table structures...');
    
    // Check PhD tables
    console.log('\n📊 PhD Application table structure:');
    const [phdAppCols] = await db.execute("DESCRIBE iim_phd_application");
    phdAppCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    console.log('\n📊 EPhD Application table structure:');
    const [ephdAppCols] = await db.execute("DESCRIBE iim_ephd_application");
    ephdAppCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    console.log('\n📊 EMBA Application table structure:');
    const [embaAppCols] = await db.execute("DESCRIBE iim_emba_application");
    embaAppCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    // Check slot student tables
    console.log('\n📊 PhD Slot Student table structure:');
    const [phdSlotCols] = await db.execute("DESCRIBE iim_phd_slot_student");
    phdSlotCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    console.log('\n📊 EPhD Slot Student table structure:');
    const [ephdSlotCols] = await db.execute("DESCRIBE iim_ephd_slot_student");
    ephdSlotCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    console.log('\n📊 EMBA Slot Student table structure:');
    const [embaSlotCols] = await db.execute("DESCRIBE iim_emba_slot_student");
    embaSlotCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    // Check payment table
    console.log('\n📊 Payment table structure:');
    const [paymentCols] = await db.execute("DESCRIBE iim_payment");
    paymentCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
  } catch (error) {
    console.error('❌ Error checking table structures:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructures();