SELECT id, username, email, subscription_tier, user_num_prem FROM profiles WHERE subscription_tier IS NOT NULL LIMIT 20;
SELECT DISTINCT subscription_tier FROM profiles;
