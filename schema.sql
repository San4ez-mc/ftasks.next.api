-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tg_user_id VARCHAR(255) NOT NULL UNIQUE,
  tg_username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  photo_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  status ENUM('active','vacation','inactive') DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_company (user_id, company_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Task Management Tables
CREATE TABLE IF NOT EXISTS results (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(100),
  completed BOOLEAN DEFAULT FALSE,
  deadline DATE,
  assignee_id CHAR(36),
  reporter_id CHAR(36),
  expected_result TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (assignee_id) REFERENCES employees(id),
  FOREIGN KEY (reporter_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS sub_results (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  result_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  `order` INT,
  FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  result_id CHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status ENUM('todo','done') DEFAULT 'todo',
  type ENUM('important-urgent','important-not-urgent','not-important-urgent','not-important-not-urgent'),
  expected_time INT,
  actual_time INT,
  expected_result TEXT,
  actual_result TEXT,
  assignee_id CHAR(36),
  reporter_id CHAR(36),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (result_id) REFERENCES results(id),
  FOREIGN KEY (assignee_id) REFERENCES employees(id),
  FOREIGN KEY (reporter_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  repeatability VARCHAR(255),
  task_details JSON,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Organisational Structure Tables
CREATE TABLE IF NOT EXISTS divisions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  `order` INT,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  division_id CHAR(36) NOT NULL,
  manager_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  ckp TEXT,
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS department_employees (
  department_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  PRIMARY KEY (department_id, employee_id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Content & Process Tables
CREATE TABLE IF NOT EXISTS processes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data JSON,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS instructions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  department_id CHAR(36),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS instruction_access (
  instruction_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  access_level ENUM('view','edit') NOT NULL,
  PRIMARY KEY (instruction_id, user_id),
  FOREIGN KEY (instruction_id) REFERENCES instructions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Integration Tables
CREATE TABLE IF NOT EXISTS telegram_groups (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  tg_group_id VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS telegram_members (
  tg_user_id VARCHAR(255) PRIMARY KEY,
  tg_group_id VARCHAR(255) NOT NULL,
  employee_id CHAR(36),
  tg_username VARCHAR(255),
  tg_first_name VARCHAR(255),
  tg_last_name VARCHAR(255),
  FOREIGN KEY (tg_group_id) REFERENCES telegram_groups(tg_group_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
