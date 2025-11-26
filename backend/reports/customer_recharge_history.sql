-- Customer Recharge History with Calculated Breakdown
-- Parameter: :saId
-- The amount in ci_ft is the base amount (before VAT)
-- Formula: Total Recharge = (Energy Cost + Rebate) + VAT

WITH payment_data AS (
    SELECT
        ft.ft_id,
        ABS(ft.cur_amt) AS AMOUNT_BEFORE_VAT,
        ft.accounting_dt AS RECHARGE_DATE,
        ft.ft_type_flg
    FROM ci_ft ft
    WHERE ft.sa_id = :saId
        AND ft.ft_type_flg IN ('PS', 'AD')
        AND ft.cur_amt < 0
),
calculated_breakdown AS (
    SELECT
        ft_id,
        AMOUNT_BEFORE_VAT,
        RECHARGE_DATE,
        ft_type_flg,
        -- Energy Cost = Amount before VAT / 0.995
        ROUND(AMOUNT_BEFORE_VAT / 0.995, 2) AS ENERGY_COST,
        -- Rebate = Amount before VAT - Energy Cost (negative value)
        ROUND(AMOUNT_BEFORE_VAT - (AMOUNT_BEFORE_VAT / 0.995), 2) AS REBATE_AMOUNT,
        -- VAT = Amount before VAT × 5%
        ROUND(AMOUNT_BEFORE_VAT * 0.05, 2) AS VAT_AMOUNT
    FROM payment_data
)
SELECT
    TO_CHAR(ft_id) AS PAYMENT_EVENT_ID,
    -- Total Recharge Amount = Amount before VAT + VAT
    ROUND(AMOUNT_BEFORE_VAT + VAT_AMOUNT, 2) AS RECHARGE_AMOUNT,
    RECHARGE_DATE,
    REBATE_AMOUNT,
    ENERGY_COST,
    VAT_AMOUNT,
    CASE ft_type_flg
        WHEN 'PS' THEN 'Payment Segment'
        WHEN 'AD' THEN 'Adjustment'
        WHEN 'PX' THEN 'Payment Cancellation'
        WHEN 'AX' THEN 'Adjustment Cancellation'
        ELSE ft_type_flg
    END AS RECHARGED_BY
FROM calculated_breakdown
ORDER BY RECHARGE_DATE DESC
