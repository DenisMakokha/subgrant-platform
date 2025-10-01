-- Add partner_budget_id column to disbursements table
-- This column links disbursements to partner budgets (SSOT)

ALTER TABLE disbursements 
ADD COLUMN IF NOT EXISTS partner_budget_id UUID REFERENCES partner_budgets(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_disbursements_partner_budget_id 
ON disbursements(partner_budget_id);

-- Update existing records to use partner_budget_id if budget_id exists
UPDATE disbursements d
SET partner_budget_id = b.id
FROM partner_budgets b
WHERE d.budget_id = b.id
  AND d.partner_budget_id IS NULL;

SELECT 'Column partner_budget_id added to disbursements table' AS status;
