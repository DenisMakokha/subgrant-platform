# 🚀 RUN APPROVAL SYSTEM MIGRATION

## Quick Start

### **Option 1: Run with Node.js (Recommended)**

```bash
# From the api directory
cd api
node scripts/run-approval-migration.js
```

### **Option 2: Run with npm script**

```bash
# From the api directory
cd api
npm run migrate:approvals
```

---

## 📋 What This Does

The migration script will:
1. ✅ Create 6 approval system tables
2. ✅ Add all necessary indexes
3. ✅ Seed 3 default workflows
4. ✅ Verify everything was created
5. ✅ Show summary of created tables

---

## 🎯 Expected Output

```
🚀 Starting Approval System Migration...

📝 Creating approval system tables...
✅ Migration completed successfully!

🔍 Verifying tables created...

📊 Tables Created:
   ✓ approval_actions (9 columns)
   ✓ approval_delegations (8 columns)
   ✓ approval_requests (11 columns)
   ✓ approval_steps (13 columns)
   ✓ approval_workflow_audit (6 columns)
   ✓ approval_workflows (11 columns)

📋 Workflows Created:
   ✓ Default Budget Approval (budget) - 0 steps
   ✓ Default Contract Approval (contract) - 0 steps
   ✓ Default Disbursement Approval (disbursement) - 0 steps

🎉 Approval System is ready to use!
```

---

## ⚙️ Configuration

The script uses your `.env` file settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subgrant_platform
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'pg'"
```bash
cd api
npm install pg
```

### Error: "Cannot find module 'dotenv'"
```bash
cd api
npm install dotenv
```

### Error: "Connection refused"
- Check if PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists

### Error: "Permission denied"
- Check database user has CREATE TABLE permission
- Try running with database admin user

---

## 📝 Manual Alternative

If the script doesn't work, run the SQL directly:

```bash
# Using psql
psql -U postgres -d subgrant_platform -f api/scripts/migrations/create-approval-tables.sql

# Or copy-paste the SQL into your database client
```

---

## ✅ Verification

After running, verify tables exist:

```sql
-- Check tables
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE 'approval_%' 
ORDER BY tablename;

-- Check workflows
SELECT name, entity_type, is_active 
FROM approval_workflows;
```

---

## 🎉 Success!

Once migration completes:
- ✅ Approval Workflow Builder will load
- ✅ No more "Failed to load workflows" error
- ✅ Can create custom workflows
- ✅ Full approval system operational

---

**Status**: Ready to run  
**Time**: ~5 seconds  
**Impact**: Creates approval system infrastructure
