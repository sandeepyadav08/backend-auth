-- Applicants and Schedule Management Schema
-- This extends the existing database with applicant and schedule management

-- Applicants table
CREATE TABLE IF NOT EXISTS applicants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    program_applied_for ENUM('PGP', 'PhD', 'EPhD', 'EMBA') NOT NULL,
    application_status ENUM('submitted', 'under_review', 'admitted', 'rejected', 'waitlisted') DEFAULT 'submitted',
    gender ENUM('male', 'female', 'other') NOT NULL,
    source ENUM('online', 'offline', 'referral', 'agent') DEFAULT 'online',
    offer_issued BOOLEAN DEFAULT FALSE,
    fee_paid BOOLEAN DEFAULT FALSE,
    applied_date DATE NOT NULL,
    admission_date DATE NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_program (program_applied_for),
    INDEX idx_status (application_status),
    INDEX idx_applied_date (applied_date)
);

-- Schedule Events table
CREATE TABLE IF NOT EXISTS schedule_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255),
    event_type ENUM('interview', 'meeting', 'presentation', 'workshop', 'exam', 'orientation') DEFAULT 'meeting',
    program_id ENUM('all', 'PGP', 'PhD', 'EPhD', 'EMBA') DEFAULT 'all',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_program (program_id),
    INDEX idx_event_type (event_type)
);

-- Insert sample applicants data
INSERT INTO applicants (applicant_id, name, email, phone, program_applied_for, application_status, gender, source, offer_issued, fee_paid, applied_date) VALUES
-- PGP Applicants
('PGP-2025-001', 'Rajesh Kumar', 'rajesh.kumar@email.com', '+91-9876543210', 'PGP', 'admitted', 'male', 'online', TRUE, TRUE, '2025-01-15'),
('PGP-2025-002', 'Priya Sharma', 'priya.sharma@email.com', '+91-9876543211', 'PGP', 'admitted', 'female', 'offline', TRUE, TRUE, '2025-01-16'),
('PGP-2025-003', 'Amit Singh', 'amit.singh@email.com', '+91-9876543212', 'PGP', 'under_review', 'male', 'referral', FALSE, FALSE, '2025-01-17'),
('PGP-2025-004', 'Sneha Patel', 'sneha.patel@email.com', '+91-9876543213', 'PGP', 'under_review', 'female', 'online', FALSE, FALSE, '2025-01-18'),
('PGP-2025-005', 'Vikram Gupta', 'vikram.gupta@email.com', '+91-9876543214', 'PGP', 'submitted', 'male', 'agent', FALSE, FALSE, '2025-01-19'),

-- PhD Applicants
('PHD-2025-001', 'Dr. Anita Verma', 'anita.verma@email.com', '+91-9876543215', 'PhD', 'admitted', 'female', 'online', TRUE, FALSE, '2025-01-10'),
('PHD-2025-002', 'Suresh Reddy', 'suresh.reddy@email.com', '+91-9876543216', 'PhD', 'under_review', 'male', 'referral', FALSE, FALSE, '2025-01-11'),
('PHD-2025-003', 'Kavita Joshi', 'kavita.joshi@email.com', '+91-9876543217', 'PhD', 'submitted', 'female', 'online', FALSE, FALSE, '2025-01-12'),

-- EPhD Applicants
('EPHD-2025-001', 'Ravi Agarwal', 'ravi.agarwal@email.com', '+91-9876543218', 'EPhD', 'admitted', 'male', 'offline', TRUE, TRUE, '2025-01-08'),
('EPHD-2025-002', 'Meera Nair', 'meera.nair@email.com', '+91-9876543219', 'EPhD', 'under_review', 'female', 'referral', FALSE, FALSE, '2025-01-09'),

-- EMBA Applicants
('EMBA-2025-001', 'Arjun Malhotra', 'arjun.malhotra@email.com', '+91-9876543220', 'EMBA', 'admitted', 'male', 'agent', TRUE, TRUE, '2025-01-05'),
('EMBA-2025-002', 'Deepika Rao', 'deepika.rao@email.com', '+91-9876543221', 'EMBA', 'under_review', 'female', 'online', FALSE, FALSE, '2025-01-06'),
('EMBA-2025-003', 'Sanjay Khanna', 'sanjay.khanna@email.com', '+91-9876543222', 'EMBA', 'submitted', 'male', 'offline', FALSE, FALSE, '2025-01-07')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample schedule events
INSERT INTO schedule_events (event_title, date, time, location, event_type, program_id, notes) VALUES
-- Today's events
('PGP Interview Round 1', CURDATE(), '09:00:00', 'Conference Room A', 'interview', 'PGP', 'First round interviews for PGP candidates'),
('PhD Research Presentation', CURDATE(), '11:00:00', 'Auditorium', 'presentation', 'PhD', 'Research proposal presentations'),
('EMBA Orientation Meeting', CURDATE(), '14:00:00', 'Room 101', 'meeting', 'EMBA', 'Orientation for new EMBA students'),

-- Tomorrow's events
('EPhD Workshop', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'Workshop Hall', 'workshop', 'EPhD', 'Research methodology workshop'),
('PGP Final Exam', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', 'Exam Hall', 'exam', 'PGP', 'Final examination for Phase 1'),

-- Next week events
('All Programs Meeting', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:30:00', 'Main Conference Room', 'meeting', 'all', 'Monthly review meeting for all programs'),
('PhD Comprehensive Exam', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 'Exam Center', 'exam', 'PhD', 'Comprehensive examination'),
('EMBA Case Study Presentation', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '13:00:00', 'Presentation Hall', 'presentation', 'EMBA', 'Final case study presentations'),

-- Future events
('PGP Interview Round 2', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '09:00:00', 'Conference Room B', 'interview', 'PGP', 'Second round interviews'),
('EPhD Thesis Defense', DATE_ADD(CURDATE(), INTERVAL 15 DAY), '11:00:00', 'Defense Room', 'presentation', 'EPhD', 'Thesis defense sessions')
ON DUPLICATE KEY UPDATE event_title = VALUES(event_title);