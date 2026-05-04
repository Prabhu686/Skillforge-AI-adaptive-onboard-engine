-- Run this once in psql before starting the Spring Boot server
-- psql -U postgres -f init.sql

CREATE DATABASE skillforge;

\c skillforge;

-- Tables are auto-created by Hibernate (ddl-auto=update)
-- This file is for reference only
