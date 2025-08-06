-- Extended schema for course and phase tracking dashboard
-- This extends the existing auth_db schema

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Phases table
CREATE TABLE IF NOT EXISTS phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    phase_name VARCHAR(100) NOT NULL,
    phase_order INT NOT NULL,
    commitment_fee DECIMAL(10,2) DEFAULT 0.00, -- 💰 Add this line
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_phase (course_id, phase_name)
);

-- User enrollments table
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

-- User phase progress table
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
INSERT INTO courses (course_code, course_name, description) VALUES
('PGP', 'Post Graduate Program', 'Comprehensive post-graduate level program'),
('PHD', 'Doctor of Philosophy', 'Advanced research-based doctoral program'),
('EPHD', 'Executive PhD', 'Executive-level doctoral program for working professionals'),
('EMBA', 'Executive MBA', 'Executive Master of Business Administration')
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name);

-- Insert default phases for each course
-- PGP Phases
INSERT INTO phases (course_id, phase_name, phase_order, description) VALUES
((SELECT id FROM courses WHERE course_code = 'PGP'), 'Phase 1', 1, 'Foundation and Core Concepts'),
((SELECT id FROM courses WHERE course_code = 'PGP'), 'Phase 2A', 2, 'Intermediate Specialization Track A'),
((SELECT id FROM courses WHERE course_code = 'PGP'), 'Phase 2B', 3, 'Intermediate Specialization Track B'),
((SELECT id FROM courses WHERE course_code = 'PGP'), 'Phase 3', 4, 'Advanced Applications and Capstone'),
((SELECT id FROM courses WHERE course_code = 'PGP'), 'Verification Details', 5, 'Final Verification and Certification')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- PhD Phases
INSERT INTO phases (course_id, phase_name, phase_order, description) VALUES
((SELECT id FROM courses WHERE course_code = 'PHD'), 'Phase 1', 1, 'Coursework and Research Methods'),
((SELECT id FROM courses WHERE course_code = 'PHD'), 'Phase 2A', 2, 'Comprehensive Examinations'),
((SELECT id FROM courses WHERE course_code = 'PHD'), 'Phase 2B', 3, 'Dissertation Proposal'),
((SELECT id FROM courses WHERE course_code = 'PHD'), 'Phase 3', 4, 'Research and Dissertation Writing'),
((SELECT id FROM courses WHERE course_code = 'PHD'), 'Verification Details', 5, 'Defense and Final Approval')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- EPhD Phases
INSERT INTO phases (course_id, phase_name, phase_order, description) VALUES
((SELECT id FROM courses WHERE course_code = 'EPHD'), 'Phase 1', 1, 'Executive Coursework Foundation'),
((SELECT id FROM courses WHERE course_code = 'EPHD'), 'Phase 2A', 2, 'Applied Research Methods'),
((SELECT id FROM courses WHERE course_code = 'EPHD'), 'Phase 2B', 3, 'Industry-Focused Research'),
((SELECT id FROM courses WHERE course_code = 'EPHD'), 'Phase 3', 4, 'Executive Dissertation'),
((SELECT id FROM courses WHERE course_code = 'EPHD'), 'Verification Details', 5, 'Professional Validation and Certification')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- EMBA Phases
INSERT INTO phases (course_id, phase_name, phase_order, description) VALUES
((SELECT id FROM courses WHERE course_code = 'EMBA'), 'Phase 1', 1, 'Core Business Foundations'),
((SELECT id FROM courses WHERE course_code = 'EMBA'), 'Phase 2A', 2, 'Strategic Management Track'),
((SELECT id FROM courses WHERE course_code = 'EMBA'), 'Phase 2B', 3, 'Leadership and Innovation Track'),
((SELECT id FROM courses WHERE course_code = 'EMBA'), 'Phase 3', 4, 'Executive Capstone Project'),
((SELECT id FROM courses WHERE course_code = 'EMBA'), 'Verification Details', 5, 'Final Assessment and Certification')
ON DUPLICATE KEY UPDATE description = VALUES(description);
