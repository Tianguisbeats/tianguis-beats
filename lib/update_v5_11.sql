-- v5.11 Schema Update
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
UPDATE profiles SET is_verified = true WHERE username = 'SonDeMaik';
