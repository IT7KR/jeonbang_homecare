-- docker/init-db.sql - PostgreSQL initialization script
-- This script runs when the database container is first created

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- For fuzzy text search

-- Set timezone
SET timezone = 'Asia/Seoul';

-- Create enum types
DO $$ BEGIN
    -- User roles
    CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Service status
    CREATE TYPE service_status AS ENUM (
        'PENDING',      -- 대기중
        'CONFIRMED',    -- 확정
        'IN_PROGRESS',  -- 진행중
        'COMPLETED',    -- 완료
        'CANCELLED'     -- 취소
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Partner status
    CREATE TYPE partner_status AS ENUM (
        'PENDING',      -- 승인대기
        'APPROVED',     -- 승인완료
        'REJECTED',     -- 승인거부
        'SUSPENDED'     -- 활동정지
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    -- Partner type
    CREATE TYPE partner_type AS ENUM (
        'INDIVIDUAL',   -- 개인사업자
        'CORPORATE'     -- 법인사업자
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant all privileges to the application user
-- Note: The database and user are created by Docker environment variables

-- Create indexes function for common patterns
-- (Actual indexes will be created by SQLAlchemy migrations)

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed at %', NOW();
END $$;
