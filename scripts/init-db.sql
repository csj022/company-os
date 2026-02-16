-- ============================================================================
-- CompanyOS Database Initialization Script
-- ============================================================================
-- This script runs automatically when PostgreSQL container starts for the
-- first time. It sets up extensions and initial configuration.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable full-text search extensions
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Set timezone
SET timezone = 'UTC';

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'CompanyOS database initialized successfully!';
  RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, pg_trgm, unaccent';
END $$;
