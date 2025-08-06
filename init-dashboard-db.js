const db = require('./config/db');

// Extended database schema for dashboard functionality
const dashboardSchema = `
-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create phases table
CREATE TABLE IF NOT EXISTS phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    phase_name VARCHAR(255) NOT NULL,
    phase_order INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_phase (course_id, phase_name)
);

-- Create user enrollments table
CREATE TABLE IF NOT EXISTS user_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id)
);

-- Create user phase progress table
CREATE TABLE IF NOT EXISTS user_phase_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phase_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'verification_pending', 'verified') DEFAULT 'not_started',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_phase (user_id, phase_id)
);

-- Insert default courses
INSERT IGNORE INTO courses (course_code, course_name, description) VALUES
('PGP', 'Post Graduate Program', 'Comprehensive post-graduate business program'),
('PHD', 'Doctor of Philosophy', 'Research-focused doctoral program'),
('EPHD', 'Executive PhD', 'Executive-level doctoral program for working professionals'),
('EMBA', 'Executive MBA', 'Executive Master of Business Administration');

-- Insert phases for PGP
INSERT IGNORE INTO phases (course_id, phase_name, phase_order, description) 
SELECT id, 'Foundation', 1, 'Basic foundation courses' FROM courses WHERE course_code = 'PGP'
UNION ALL
SELECT id, 'Core', 2, 'Core curriculum' FROM courses WHERE course_code = 'PGP'
UNION ALL
SELECT id, 'Specialization', 3, 'Area of specialization' FROM courses WHERE course_code = 'PGP'
UNION ALL
SELECT id, 'Capstone', 4, 'Final project and thesis' FROM courses WHERE course_code = 'PGP';

-- Insert phases for PhD
INSERT IGNORE INTO phases (course_id, phase_name, phase_order, description) 
SELECT id, 'Coursework', 1, 'Required coursework phase' FROM courses WHERE course_code = 'PHD'
UNION ALL
SELECT id, 'Comprehensive Exam', 2, 'Comprehensive examination' FROM courses WHERE course_code = 'PHD'
UNION ALL
SELECT id, 'Research Proposal', 3, 'Research proposal development' FROM courses WHERE course_code = 'PHD'
UNION ALL
SELECT id, 'Dissertation', 4, 'Dissertation research and writing' FROM courses WHERE course_code = 'PHD'
UNION ALL
SELECT id, 'Defense', 5, 'Final dissertation defense' FROM courses WHERE course_code = 'PHD';

-- Insert phases for EPhD
INSERT IGNORE INTO phases (course_id, phase_name, phase_order, description) 
SELECT id, 'Executive Coursework', 1, 'Executive-level coursework' FROM courses WHERE course_code = 'EPHD'
UNION ALL
SELECT id, 'Research Methods', 2, 'Research methodology training' FROM courses WHERE course_code = 'EPHD'
UNION ALL
SELECT id, 'Applied Research', 3, 'Applied research project' FROM courses WHERE course_code = 'EPHD'
UNION ALL
SELECT id, 'Final Project', 4, 'Executive capstone project' FROM courses WHERE course_code = 'EPHD';

-- Insert phases for EMBA
INSERT IGNORE INTO phases (course_id, phase_name, phase_order, description) 
SELECT id, 'Core Modules', 1, 'Core business modules' FROM courses WHERE course_code = 'EMBA'
UNION ALL
SELECT id, 'Leadership', 2, 'Leadership development' FROM courses WHERE course_code = 'EMBA'
UNION ALL
SELECT id, 'Strategy', 3, 'Strategic management' FROM courses WHERE course_code = 'EMBA'
UNION ALL
SELECT id, 'Global Experience', 4, 'International business experience' FROM courses WHERE course_code = 'EMBA'
UNION ALL
SELECT id, 'Capstone Project', 5, 'Final business project' FROM courses WHERE course_code = 'EMBA';
`;

// Function to execute SQL commands using promise-based pool
async function executeSQLCommands(sqlCommands) {
    // Split commands by semicolon and filter out empty ones
    const commands = sqlCommands.split(';').filter(cmd => cmd.trim());
    
    if (commands.length === 0) {
        return;
    }
    
    for (let i = 0; i < commands.length; i++) {
        const trimmedCommand = commands[i].trim();
        if (trimmedCommand) {
            try {
                await db.execute(trimmedCommand);
                console.log(`Command ${i + 1} executed successfully`);
            } catch (err) {
                console.error(`Error executing command ${i + 1}:`, err);
                throw err;
            }
        }
    }
}

// Initialize the database
async function initializeDashboardDB() {
    try {
        console.log('Initializing dashboard database schema...');
        await executeSQLCommands(dashboardSchema);
        console.log('Dashboard database schema initialized successfully!');
        
        // Close the connection
        db.end(() => {
            console.log('Database connection closed.');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error initializing dashboard database:', error);
        db.end(() => {
            process.exit(1);
        });
    }
}

// Run the initialization
initializeDashboardDB();
