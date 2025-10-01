# ⚡ QUICK FIX: Run Approval Migration

## 🎯 ONE COMMAND TO FIX EVERYTHING

**IMPORTANT**: Make sure you're in the `api` directory!

```bash
# From the root of the project
cd api

# Then run the migration
npm run migrate:approvals
```

**OR** if you're already in the api directory:

```bash
npm run migrate:approvals
```

That's it! ✅

---

## 📋 What This Does

1. ✅ Creates 6 approval system tables
2. ✅ Adds performance indexes
3. ✅ Seeds 3 default workflows
4. ✅ Verifies everything works
5. ✅ Shows success summary

**Time**: ~5 seconds  
**Impact**: Fixes "Failed to load workflows" error

---

## 🎉 Expected Output

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

## ✅ After Running

1. ✅ Refresh your browser
2. ✅ Navigate to Approval Workflow Builder
3. ✅ No more error messages
4. ✅ Can create workflows
5. ✅ Full approval system operational

---

## 🔧 Alternative Methods

### Method 1: Direct Node.js
```bash
cd api
node scripts/run-approval-migration.js
```

### Method 2: Manual SQL
```bash
psql -U postgres -d subgrant_platform -f api/scripts/migrations/create-approval-tables.sql
```

---

## 🆘 Troubleshooting

### "Cannot find module 'pg'"
```bash
cd api
npm install
```

### "Connection refused"
- Check PostgreSQL is running
- Verify `.env` database settings

### "Permission denied"
- Use database admin credentials
- Check user has CREATE TABLE permission

---

## 📝 Files Involved

1. **Migration Script**: `api/scripts/run-approval-migration.js`
2. **SQL File**: `api/scripts/migrations/create-approval-tables.sql`
3. **NPM Script**: Added to `api/package.json`

---

## 🎊 SUCCESS!

Once complete, your approval system is fully operational! 🚀

**Status**: Ready to run  
**Difficulty**: Easy (one command)  
**Time**: 5 seconds
