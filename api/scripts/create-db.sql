-- Create database and user for Sub-Grant Management Platform

-- Connect to PostgreSQL as superuser (postgres) before running this script

-- Create the database
CREATE DATABASE subgrant_platform;

-- Create the user
CREATE USER subgrant_user WITH PASSWORD 'subgrant_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE subgrant_platform TO subgrant_user;

-- Connect to the database
\c subgrant_platform;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage on uuid-ossp extension to the user
GRANT USAGE ON SCHEMA public TO subgrant_user;