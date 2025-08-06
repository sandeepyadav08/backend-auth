const mysql = require('mysql2/promise');

async function verifyDatabase() {
    try {
        // Create connection using the same config as your app
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'sandeep',
            database: 'auth_db'
        });

        console.log('Connected to database successfully!');

        // Check if tables exist
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\nTables in auth_db:');
        tables.forEach(table => {
            console.log(`- ${Object.values(table)[0]}`);
        });

        // Check courses data
        const [courses] = await connection.execute('SELECT * FROM courses');
        console.log('\nCourses:');
        courses.forEach(course => {
            console.log(`- ${course.course_name} (${course.course_code})`);
        });

        // Check course phases data
        const [phases] = await connection.execute('SELECT * FROM phases ORDER BY course_id, phase_order');
        console.log('\nCourse Phases:');
        phases.forEach(phase => {
            console.log(`- Course ID ${phase.course_id}: ${phase.phase_name} (Order: ${phase.phase_order})`);
        });

        // Check user enrollments
        const [enrollments] = await connection.execute('SELECT COUNT(*) as count FROM user_enrollments');
        console.log(`\nUser Enrollments: ${enrollments[0].count}`);

        // Check user phase progress
        const [progress] = await connection.execute('SELECT COUNT(*) as count FROM user_phase_progress');
        console.log(`User Phase Progress records: ${progress[0].count}`);

        await connection.end();
        console.log('\nDatabase verification completed successfully!');

    } catch (error) {
        console.error('Error verifying database:', error);
    }
}

verifyDatabase();
