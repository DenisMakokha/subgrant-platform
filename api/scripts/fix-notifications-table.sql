-- Fix notifications table to add default UUID generator
ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also ensure we have the uuid extension enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alternative default using uuid-ossp if gen_random_uuid() doesn't work
-- ALTER TABLE notifications ALTER COLUMN id SET DEFAULT uuid_generate_v4();
