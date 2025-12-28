-- Create the reporting database if it doesn't exist
CREATE DATABASE calculator;

-- Connect to your reporting database:
\c calculator

-- Create the reporting user if it doesn't exist (adjust as needed)
CREATE USER calculator WITH PASSWORD 'calculator';

-- Create a dedicated schema owned by calculator
CREATE SCHEMA calculator AUTHORIZATION calculator;

-- Grant reporting all privileges on the schema
GRANT ALL ON SCHEMA calculator TO calculator;
GRANT CREATE ON DATABASE calculator TO calculator;

-- Grant reporting all privileges on all existing tables and sequences in that schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA calculator TO calculator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA calculator TO calculator;

-- For Alembic
GRANT USAGE ON SCHEMA public TO calculator;
GRANT CREATE ON SCHEMA public TO calculator;

-- Set default privileges for future tables and sequences created by calculator
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO calculator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO calculator;

