const db = require("./config/db");

async function checkSlotColumns() {
  try {
    console.log("PhD Slot table columns:");
    const [phdCols] = await db.execute("DESCRIBE iim_phd_slot");
    phdCols.forEach((col) => console.log(`  - ${col.Field} (${col.Type})`));

    console.log("\nEPhD Slot table columns:");
    const [ephdCols] = await db.execute("DESCRIBE iim_ephd_slot");
    ephdCols.forEach((col) => console.log(`  - ${col.Field} (${col.Type})`));

    console.log("\nEMBA Slot table columns:");
    const [embaCols] = await db.execute("DESCRIBE iim_emba_slot");
    embaCols.forEach((col) => console.log(`  - ${col.Field} (${col.Type})`));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSlotColumns();
