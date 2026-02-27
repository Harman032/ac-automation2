
CREATE DATABASE IF NOT EXISTS canadian_accountant;
USE canadian_accountant;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('admin', 'accountant') DEFAULT 'accountant',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accountants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  max_capacity INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  business_number VARCHAR(15) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  industry VARCHAR(100),
  fiscal_year_end VARCHAR(20),
  assigned_accountant_id INT,
  client_status VARCHAR(20) DEFAULT 'Active',
  engagement_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_accountant_id) REFERENCES accountants(id) ON DELETE SET NULL
);

CREATE TABLE compliance_filings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  compliance_type VARCHAR(50) NOT NULL,
  filing_frequency VARCHAR(20),
  period_start DATE,
  period_end DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  filed_date DATE,
  filed_by_user_id INT,
  reminder_sent_at DATE,
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE statements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  statement_type ENUM('Bank', 'Credit Card') NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_last4 VARCHAR(4),
  period_year INT,
  period_month INT,
  expected_date DATE,
  received_status VARCHAR(20) DEFAULT 'Pending',
  received_date DATE,
  reminder_sent_at DATE,
  file_path VARCHAR(255),
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Initial Seed Data
INSERT INTO users (username, password, full_name, role) 
VALUES ('admin', 'password', 'System Admin', 'admin');

INSERT INTO accountants (name, title, max_capacity) VALUES 
('John Accountant', 'Senior Partner', 12),
('Jane Senior', 'CPA, Senior Manager', 15),
('Bob Junior', 'Staff Accountant', 8);
