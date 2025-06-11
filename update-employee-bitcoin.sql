-- Update employee with Lightning address for testing
UPDATE users 
SET btc_address = 'test@getalby.com', 
    withdrawal_method = 'bitcoin' 
WHERE id = 2 AND role = 'employee';

-- Check the update
SELECT id, username, email, first_name, last_name, btc_address, withdrawal_method 
FROM users 
WHERE id = 2;