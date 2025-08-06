-- Executive MBA Program Tables

-- EMBA Slot table
CREATE TABLE IF NOT EXISTS iim_emba_slot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_date DATETIME NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    slot_capacity INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- EMBA Slot Student table
CREATE TABLE IF NOT EXISTS iim_emba_slot_student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('pending', 'present', 'absent') DEFAULT 'pending',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES iim_emba_slot(id) ON DELETE CASCADE
);

-- EMBA Registration table
CREATE TABLE IF NOT EXISTS iim_emba_registered (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shortlist_status ENUM('pending', 'shortlisted', 'rejected') DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- EMBA Application table
CREATE TABLE IF NOT EXISTS iim_emba_application (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    specialization_area VARCHAR(100) NOT NULL,
    final_submit BOOLEAN DEFAULT FALSE,
    reopen BOOLEAN DEFAULT FALSE,
    resubmitted BOOLEAN DEFAULT FALSE,
    commitment_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);