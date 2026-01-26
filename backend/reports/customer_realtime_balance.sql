-- Customer Real-time Balance
-- Get current balance from CI_FT table for a customer
-- Parameters: :saId (SA_ID from customer)

SELECT
    NVL(SUM(TOT_AMT), 0) AS CURRENT_BALANCE
FROM CI_FT
WHERE SA_ID = :saId
