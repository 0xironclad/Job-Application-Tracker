-- Rollback for: 002_add_user_id_to_companies.sql
-- Description: Removes user_id column from companies table

-- Drop index
DROP INDEX IF EXISTS idx_companies_user_id;

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- This is a simplified version - in production, you'd need to preserve data
CREATE TABLE companies_temp AS SELECT 
    id, name, website, industry, size, location, description,
    created_at, updated_at
FROM companies;

DROP TABLE companies;

ALTER TABLE companies_temp RENAME TO companies;

-- Recreate indexes and triggers
CREATE INDEX IF NOT EXISTS idx_job_applications_company_id ON job_applications(company_id);

CREATE TRIGGER IF NOT EXISTS update_companies_updated_at
AFTER UPDATE ON companies
FOR EACH ROW
BEGIN
    UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

