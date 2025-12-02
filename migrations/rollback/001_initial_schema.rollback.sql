-- Rollback for: 001_initial_schema.sql
-- WARNING: This will drop all tables and data!

-- Drop triggers first (they depend on tables)
DROP TRIGGER IF EXISTS update_users_updated_at;
DROP TRIGGER IF EXISTS update_companies_updated_at;
DROP TRIGGER IF EXISTS update_job_applications_updated_at;
DROP TRIGGER IF EXISTS update_contacts_updated_at;
DROP TRIGGER IF EXISTS update_notes_updated_at;
DROP TRIGGER IF EXISTS update_tasks_updated_at;

-- Drop indexes
DROP INDEX IF EXISTS idx_job_applications_user_id;
DROP INDEX IF EXISTS idx_job_applications_company_id;
DROP INDEX IF EXISTS idx_job_applications_status;
DROP INDEX IF EXISTS idx_job_applications_application_date;
DROP INDEX IF EXISTS idx_contacts_job_application_id;
DROP INDEX IF EXISTS idx_notes_job_application_id;
DROP INDEX IF EXISTS idx_tasks_job_application_id;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_job_application_tags_job_application_id;
DROP INDEX IF EXISTS idx_job_application_tags_tag_id;
DROP INDEX IF EXISTS idx_activity_logs_user_id;
DROP INDEX IF EXISTS idx_activity_logs_job_application_id;
DROP INDEX IF EXISTS idx_activity_logs_created_at;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS job_application_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS job_applications;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;

