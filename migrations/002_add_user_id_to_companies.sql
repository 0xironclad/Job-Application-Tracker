-- Migration: 002_add_user_id_to_companies.sql
-- Description: Adds user_id column to companies table to enable user-scoped company management
-- Author: System
-- Date: 2024-12-02

-- Add user_id column to companies table
ALTER TABLE companies ADD COLUMN user_id INTEGER;

-- Create index for the new user_id column for performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);

-- Update existing companies to have user_id = 1 (for testing purposes)
-- In production, this would need a proper data migration strategy
UPDATE companies SET user_id = 1 WHERE user_id IS NULL;

