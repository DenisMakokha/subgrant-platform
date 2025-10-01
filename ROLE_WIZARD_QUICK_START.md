# 🚀 ROLE & DASHBOARD WIZARD - QUICK START GUIDE

## 📋 5-MINUTE SETUP GUIDE

**Last Updated**: 2025-10-01  
**Status**: Production Ready  
**Difficulty**: Easy

---

## 🎯 WHAT YOU'LL LEARN

In 5 minutes, you'll be able to:
- ✅ Access the Role & Dashboard Wizard
- ✅ Create your first custom role
- ✅ Configure capabilities and scopes
- ✅ Build a custom dashboard
- ✅ Manage existing roles

---

## 🚀 STEP 1: ACCESS THE WIZARD (30 seconds)

### Navigate to the Wizard
```
1. Log in as an administrator
2. Go to: http://localhost:3001/admin/wizard
   OR
   Click "Admin" → "Role Wizard" in the menu
```

### What You'll See
- Modern gradient header (indigo-to-purple)
- 2-step progress indicator
- Role definition form

---

## 🎨 STEP 2: CREATE A ROLE (2 minutes)

### Fill in Basic Information
```
Role ID: project_coordinator
Role Label: Project Coordinator
Description: Manages project activities and coordinates with partners
```

### Select Capabilities (1 minute)
```
1. Click on category accordion (e.g., "Projects")
2. Check capabilities you want:
   ✅ projects.view
   ✅ projects.update
   ✅ reports.view
   ✅ reports.submit
   
3. Search for specific capabilities:
   - Type "budget" to find budget-related capabilities
   - Type "approve" to find approval capabilities
   
4. See selected count in footer
```

**Pro Tip**: Dependencies are auto-selected!
- If you select `budgets.submit`, it automatically selects `budgets.view`

### Configure Scopes (1 minute)
```
1. Project Access: Select "Assigned Projects"
2. Tenant Access: Select "Current Tenant"
3. Data Access: Select "Read & Write"
4. User Access: Select "Team Members"
```

**What This Means**:
- User can only access projects assigned to them
- User can only see data in their tenant
- User can read and modify data
- User can see team members only

### Click "Next: Configure Dashboard"

---

## 📊 STEP 3: BUILD DASHBOARD (1.5 minutes)

### Select Menu Items (1 minute)
```
Available Items (left panel):
- Dashboard
- Projects
- Reports
- Documents
- Budgets

Selected Items (right panel):
1. Click items from left to add them
2. Drag to reorder
3. Click X to remove
```

**Example Menu**:
```
✅ Dashboard
✅ Projects
✅ Reports
✅ Documents
```

### Configure Pages (Optional)
```
Leave default: []
(Advanced users can customize page layouts)
```

### Set Active Status
```
✅ Active Dashboard (checked)
```

### Click "Create Dashboard"

---

## ✅ STEP 4: VERIFY YOUR ROLE (30 seconds)

### Success!
```
✅ Toast notification: "Role created successfully"
✅ Toast notification: "Dashboard created successfully"
✅ Redirected to Admin Dashboard
```

### View Your Role
```
1. Navigate to: /admin/role-management
2. Find your role in the list
3. See:
   - Role icon and name
   - Description
   - Capabilities count
   - Scope summary
   - User count (0 for new role)
```

---

## 🎓 STEP 5: MANAGE ROLES (1 minute)

### Available Actions

**Search Roles**:
```
Type in search box to filter by:
- Role name
- Role ID
- Description
```

**Filter Roles**:
```
Click filter buttons:
- All (show all roles)
- Active (show active only)
- Inactive (show inactive only)
```

**Edit Role**:
```
1. Click "Edit" button on role card
2. Wizard opens with pre-filled data
3. Make changes
4. Save
```

**Clone Role**:
```
1. Click "Clone" button
2. System creates copy with "_copy" suffix
3. Edit the clone as needed
```

**Delete Role**:
```
1. Click "Delete" button
2. Click "Confirm" in dialog
3. Role is removed

⚠️ Note: Cannot delete roles with assigned users
```

**Toggle Status**:
```
1. Click Active/Inactive badge
2. Status toggles immediately
3. Toast notification confirms
```

---

## 💡 COMMON USE CASES

### Use Case 1: Partner User Role
```
Role ID: partner_user
Capabilities:
  ✅ projects.view
  ✅ projects.update
  ✅ budgets.create
  ✅ budgets.submit
  ✅ reports.submit
  ✅ documents.upload

Scopes:
  - Project: Organization
  - Tenant: Current
  - Data: Write
  - Users: Self

Dashboard:
  - Dashboard
  - Projects
  - Budgets
  - Reports
  - Documents
```

### Use Case 2: Finance Manager Role
```
Role ID: finance_manager
Capabilities:
  ✅ budgets.view
  ✅ budgets.approve_final
  ✅ disbursements.view
  ✅ disbursements.approve
  ✅ reports.view
  ✅ analytics.view

Scopes:
  - Project: All
  - Tenant: All
  - Data: Write
  - Users: Organization

Dashboard:
  - Dashboard
  - Budgets
  - Disbursements
  - Reports
  - Analytics
```

### Use Case 3: Program Officer Role
```
Role ID: program_officer
Capabilities:
  ✅ projects.view
  ✅ reports.review
  ✅ compliance.review
  ✅ budgets.approve_level1
  ✅ documents.review

Scopes:
  - Project: Assigned
  - Tenant: Current
  - Data: Write
  - Users: Team

Dashboard:
  - Dashboard
  - Projects
  - Reports
  - Compliance
  - Documents
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Failed to load roles"
**Solution**:
```
1. Check if API server is running
2. Check if you're logged in as admin
3. Check browser console for errors
4. System will use mock data as fallback
```

### Issue: "Cannot delete role"
**Solution**:
```
Role has assigned users. You must:
1. Reassign users to different role
2. Or deactivate the role instead
```

### Issue: "Role not appearing in list"
**Solution**:
```
1. Refresh the page
2. Clear search/filter
3. Check if role is inactive (use "All" filter)
```

### Issue: "Wizard not loading"
**Solution**:
```
1. Check if you have admin role
2. Clear browser cache
3. Check browser console for errors
4. Verify route: /admin/wizard
```

---

## 📚 ADVANCED FEATURES

### Capability Dependencies
```
Some capabilities require others:
- budgets.submit requires budgets.view
- budgets.approve_final requires budgets.approve_level1
- contracts.docusign requires contracts.update

✅ Dependencies are auto-selected!
```

### Scope Presets
```
Coming soon:
- Partner Template
- Admin Template
- Manager Template
- Auditor Template
```

### Bulk Operations
```
Coming soon:
- Bulk activate/deactivate
- Bulk delete
- Bulk role assignment
```

### Role Analytics
```
Coming soon:
- Usage statistics
- Permission heat map
- Role comparison
- Audit trail
```

---

## 🎯 BEST PRACTICES

### Naming Conventions
```
✅ Good:
- project_manager
- finance_officer
- program_coordinator

❌ Bad:
- role1
- test
- temp_role
```

### Role Descriptions
```
✅ Good:
"Manages project activities, coordinates with partners, and submits reports"

❌ Bad:
"Project role"
```

### Capability Selection
```
✅ Start with minimum required capabilities
✅ Add more as needed
✅ Review regularly
✅ Remove unused capabilities

❌ Don't give all capabilities to everyone
❌ Don't create duplicate roles
```

### Scope Configuration
```
✅ Use most restrictive scope that works
✅ Test with real user before deploying
✅ Document scope decisions

❌ Don't use "All" unless necessary
❌ Don't give admin access by default
```

---

## 📞 SUPPORT

### Documentation
- **Full Guide**: `ROLE_WIZARD_CAPABILITIES.md`
- **Testing Guide**: `ROLE_WIZARD_TESTING_INTEGRATION.md`
- **API Docs**: `ROLE_WIZARD_FINAL_SUMMARY.md`

### Quick Links
- **Wizard**: `/admin/wizard`
- **Role Management**: `/admin/role-management`
- **User Management**: `/admin/users`
- **Audit Logs**: `/admin/audit`

### Help
```
If you need help:
1. Check documentation files
2. Review this quick start guide
3. Check browser console for errors
4. Contact system administrator
```

---

## ✅ CHECKLIST

Before going live, ensure:
- [ ] Created at least one custom role
- [ ] Tested role with real user
- [ ] Verified capabilities work correctly
- [ ] Verified scopes restrict access properly
- [ ] Dashboard menu displays correctly
- [ ] Role can be edited and cloned
- [ ] Role can be activated/deactivated
- [ ] Audit logs are being created

---

## 🎉 YOU'RE READY!

Congratulations! You now know how to:
- ✅ Create custom roles
- ✅ Configure capabilities and scopes
- ✅ Build custom dashboards
- ✅ Manage existing roles
- ✅ Troubleshoot common issues

**Start creating roles for your team!** 🚀

---

**Quick Start Guide Version**: 1.0  
**Last Updated**: 2025-10-01  
**Status**: Production Ready  

**Need more help?** Check the full documentation in `ROLE_WIZARD_CAPABILITIES.md`
