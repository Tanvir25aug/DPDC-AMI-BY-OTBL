-- Customer Recharge History
-- Parameter: :saId
-- Simplified to use financial transactions directly

SELECT
    ft.accounting_dt AS PAYMENT_DATE,
    ABS(ft.cur_amt) AS PAYMENT_AMOUNT,
    ft.ft_type_flg AS PAYMENT_TYPE,
    CASE ft.ft_type_flg
        WHEN 'PS' THEN 'Payment'
        WHEN 'PX' THEN 'Payment Cancellation'
        WHEN 'AD' THEN 'Adjustment'
        WHEN 'AX' THEN 'Adjustment Cancellation'
        ELSE 'Other Transaction'
    END AS PAYMENT_SUMMARY,
    ft.sibling_id AS PAYMENT_REF,
    NULL AS EXTERNAL_REF
FROM ci_ft ft
WHERE ft.sa_id = :saId
    AND ft.ft_type_flg IN ('PS', 'AD')
    AND ft.cur_amt < 0
ORDER BY ft.accounting_dt DESC
