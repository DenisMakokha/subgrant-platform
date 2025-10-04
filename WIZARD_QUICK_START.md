# 🚀 Role & Dashboard Wizard - Quick Start Guide

**Get started in 5 minutes!**

---

## 📋 Prerequisites

- ✅ PostgreSQL database running
- ✅ Node.js backend server
- ✅ React frontend server
- ✅ Admin user account with `wizard.admin` capability

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Run Database Migration

```bash
cd api
node scripts/run-wizard-migration.js
```

**Expected Output:**
```
🚀 Starting Role & Dashboard Wizard schema migration...
✅ Migration completed successfully!
📊 Verifying schema...
✓ Roles table: 5 total, 5 active
✓ Dashboards table: 5 total, 5 active
✓ Dashboard templates table: 0 total, 0 system templates
```

### Step 2: Verify API Routes

```bash
# Test role validation endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/wizard/validate-role-id/test_role

# Expected: {"success":true,"data":{"roleId":"test_role","available":true,"exists":false}}
```

### Step 3: Access the Wizard

1. **Login** as admin user
2. **Navigate** to: `http://localhost:3001/admin/wizard`
3. **Start creating** your first role!

---

## 🎯 Create Your First Role (5 Minutes)

### Example: Project Manager Role

**Step 1: Role Definition (2 min)**
```
Role ID: project_manager
Label: Project Manager
Description: Manages projects and budgets

Capabilities (select):
✓ projects.view
✓ projects.create
✓ projects.update
✓ budgets.view
✓ budgets.create
✓ reports.view

Scopes:
- Project: assigned
- Organization: own
- Data: write
- Users: team
```

**Step 2: Menu & Pages (1 min)**
```
Menus (select):
✓ Dashboard
✓ Projects
✓ Budget
✓ Reports

Pages (select):
✓ Dashboard Home
✓ Projects List
✓ Budget Management
✓ M&E Reports
```

**Step 3: Dashboard Widgets (1 min)**
```
Widgets (select):
✓ Active Projects (KPI)
✓ Budget Summary (Custom)
✓ Project Timeline (Chart)
✓ Upcoming Reports (List)
```

**Step 4: Preview & Publish (1 min)**
```
✓ Review configuration
✓ Save as template: "Project Manager Template"
✓ Click "Publish"
```

**Done! 🎉** Your role is now live and ready to assign to users.

---

## 📚 Common Use Cases

### Use Case 1: Create Finance Manager Role

```javascript
{
  id: "finance_manager",
  label: "Finance Manager",
  capabilities: [
    "budgets.view",
    "budgets.approve",
    "disbursements.view",
    "disbursements.approve",
    "payments.view",
    "reconciliation.view"
  ],
  scopes: {
    project: "all",
    organization: "all",
    data: "write",
    users: "organization"
  }
}
```

### Use Case 2: Clone Existing Role

```bash
# Via API
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newRoleId":"senior_project_manager","newLabel":"Senior Project Manager"}' \
  http://localhost:3000/api/admin/wizard/role/project_manager/clone

# Via UI
1. Go to Role Management
2. Find "Project Manager"
3. Click "Clone"
4. Enter new ID and label
5. Click "Create Clone"
```

### Use Case 3: Edit Existing Role

```bash
# Via UI
1. Go to Role Management
2. Find role to edit
3. Click "Edit"
4. Wizard loads with existing data
5. Make changes
6. Click "Save Changes"
```

---

## 🔧 Troubleshooting

### Issue: "Role ID already exists"
**Solution:** Choose a different role ID or edit the existing role.

### Issue: "Failed to load capabilities"
**Solution:** Ensure backend server is running and API is accessible.

### Issue: "Permission denied"
**Solution:** Verify your user has `wizard.admin` capability.

### Issue: "Database connection error"
**Solution:** Check PostgreSQL is running and connection string is correct.

---

## 📖 API Quick Reference

### Validate Role ID
```http
GET /api/admin/wizard/validate-role-id/:roleId
```

### Create Role & Dashboard
```http
POST /api/admin/wizard/complete
Body: { role, dashboard, saveAsTemplate, templateName }
```

### Get All Roles
```http
GET /api/admin/wizard/roles
```

### Clone Role
```http
POST /api/admin/wizard/role/:roleId/clone
Body: { newRoleId, newLabel }
```

### Toggle Active Status
```http
PUT /api/admin/wizard/role/:roleId/toggle
Body: { active: true/false }
```

### Delete Role
```http
DELETE /api/admin/wizard/role/:roleId
```

---

## 🎨 UI Tips

### Real-time Validation
- Role ID shows ✓ (green) when available
- Role ID shows ✗ (red) when taken
- Validation happens automatically as you type

### Progress Indicators
- Completed steps show green checkmark
- Current step shows indigo highlight
- Future steps show gray

### Drag and Drop
- Reorder menu items by dragging
- Reorder widgets by dragging
- Changes save automatically

### Save as Template
- Check "Save as Template" in Step 4
- Enter template name
- Template available for future use

---

## 🚀 Next Steps

1. **Create more roles** for your organization
2. **Assign roles** to users
3. **Clone and customize** existing roles
4. **Save templates** for common configurations
5. **Monitor usage** in Role Management

---

## 📞 Support

- **Documentation:** `ROLE_DASHBOARD_WIZARD_COMPLETE.md`
- **API Reference:** See "API Endpoints" section
- **UI Guide:** See "UI/UX Features" section

---

**🎉 You're ready to create amazing roles and dashboards!**

**Last Updated:** 2025-10-03 14:30 EAT
