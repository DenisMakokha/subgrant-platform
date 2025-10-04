# Phase 3: Admin Activity Log UI Implementation Plan

**Start Date**: October 4, 2025, 5:19 AM  
**Objective**: Build comprehensive admin activity log viewer with real API integration  
**Status**: 🚀 In Progress

---

## 📋 OVERVIEW

Create a full-featured admin activity log interface that connects to real backend endpoints, providing admins with powerful tools to:
- View all admin activities in real-time
- Search and filter by multiple criteria
- Export logs for compliance/auditing
- Analyze activity patterns
- Track specific admin actions

---

## 🎯 GOALS

### Primary Goals:
1. ✅ Create dedicated Admin Activity Log page
2. ✅ Connect to real backend API endpoints (no mocks)
3. ✅ Implement advanced search & filtering
4. ✅ Add export functionality (CSV/JSON)
5. ✅ Build activity analytics dashboard
6. ✅ Real-time activity updates

### Secondary Goals:
7. ⏳ Activity comparison (before/after visualization)
8. ⏳ Admin user activity profiles
9. ⏳ Suspicious activity alerts
10. ⏳ Activity replay functionality

---

## 🏗️ ARCHITECTURE

### Frontend Components:
```
web/src/pages/admin/
├── ActivityLog.tsx              # Main activity log page
└── ActivityLogAnalytics.tsx     # Analytics dashboard

web/src/components/admin/
├── ActivityLogTable.tsx         # Main table component
├── ActivityLogFilters.tsx       # Search & filter controls
├── ActivityLogExport.tsx        # Export functionality
├── ActivityDiffViewer.tsx       # Before/after comparison
├── ActivityTimeline.tsx         # Timeline visualization
└── ActivityMetrics.tsx          # Real-time metrics

web/src/hooks/
├── useActivityLog.ts            # Activity log data hook (REAL API)
├── useActivityFilters.ts        # Filter state management
└── useActivityExport.ts         # Export functionality

web/src/services/
└── activityLogApi.ts            # API client (REAL endpoints)
```

### Backend Enhancements:
```
api/routes/
└── adminActivityLog.js          # Enhanced routes with filters

api/controllers/
└── adminActivityLogController.js # Enhanced controller

api/services/
└── adminActivityLogService.js   # Query & aggregation logic
```

---

## 📊 FEATURES BREAKDOWN

### 1. Main Activity Log Page
**File**: `web/src/pages/admin/ActivityLog.tsx`

**Features**:
- Paginated activity table with real API data
- Advanced search (admin, action, entity type, date range)
- Multi-column sorting
- Quick filters (action type, result, date)
- Expandable rows showing full details
- Real-time updates (WebSocket or polling)

**API Endpoints Used**:
- GET `/api/admin/activity` - Fetch activities with filters
- GET `/api/admin/activity/:id` - Get single activity details
- GET `/api/admin/activity/actions` - Get list of action types
- GET `/api/admin/activity/admins` - Get list of admins

### 2. Advanced Filters Component
**File**: `web/src/components/admin/ActivityLogFilters.tsx`

**Filter Options**:
- Admin user (dropdown from real admin list)
- Action type (dropdown from real action types)
- Entity type (organization, user, role, etc.)
- Result (success/error)
- Date range picker
- IP address
- User agent
- Text search in changes

### 3. Activity Table Component
**File**: `web/src/components/admin/ActivityLogTable.tsx`

**Columns**:
- Timestamp
- Admin (email/name)
- Action
- Entity Type
- Entity ID
- Result (success/error badge)
- IP Address
- Actions (View Details, Compare)

**Row Expansion**:
- Full changes object (before/after)
- User agent
- Error message (if failed)
- Related activities link

### 4. Activity Diff Viewer
**File**: `web/src/components/admin/ActivityDiffViewer.tsx`

**Features**:
- Side-by-side before/after comparison
- Syntax highlighting for JSON
- Highlight changed fields
- Collapsible sections
- Copy to clipboard

### 5. Export Functionality
**File**: `web/src/components/admin/ActivityLogExport.tsx`

**Export Formats**:
- CSV (for Excel/spreadsheets)
- JSON (for technical analysis)
- PDF (for compliance reports)

**Export Options**:
- Current page
- Current filters (all matching records)
- Date range selection
- Custom field selection

**API Endpoint**:
- POST `/api/admin/activity/export` - Generate export file

### 6. Activity Analytics Dashboard
**File**: `web/src/pages/admin/ActivityLogAnalytics.tsx`

**Metrics**:
- Activity count by action type (chart)
- Most active admins (leaderboard)
- Success vs error rates (pie chart)
- Activity timeline (line chart)
- Peak activity hours (heatmap)
- Entity type distribution

**API Endpoints**:
- GET `/api/admin/activity/analytics/summary` - Overall stats
- GET `/api/admin/activity/analytics/by-action` - Group by action
- GET `/api/admin/activity/analytics/by-admin` - Group by admin
- GET `/api/admin/activity/analytics/timeline` - Time series data

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Backend API Enhancement ✅
**File**: `api/routes/adminActivityLog.js`
- [x] Add GET /activity with filters
- [ ] Add GET /activity/:id
- [ ] Add GET /activity/actions
- [ ] Add GET /activity/admins
- [ ] Add POST /activity/export
- [ ] Add GET /activity/analytics/*

### Step 2: Frontend API Client
**File**: `web/src/services/activityLogApi.ts`
- [ ] Create API client with TypeScript types
- [ ] Implement all endpoint functions
- [ ] Add error handling
- [ ] Add request caching

### Step 3: Core Components
- [ ] ActivityLogTable.tsx
- [ ] ActivityLogFilters.tsx
- [ ] ActivityDiffViewer.tsx
- [ ] ActivityLogExport.tsx

### Step 4: Main Pages
- [ ] ActivityLog.tsx (main page)
- [ ] ActivityLogAnalytics.tsx (analytics)

### Step 5: Custom Hooks
- [ ] useActivityLog.ts
- [ ] useActivityFilters.ts
- [ ] useActivityExport.ts

### Step 6: Integration & Testing
- [ ] Add to admin menu
- [ ] Add RBAC permissions check
- [ ] Test with real data
- [ ] Performance optimization

---

## 📡 API ENDPOINTS SPECIFICATION

### GET /api/admin/activity
**Query Parameters**:
```typescript
{
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 50)
  adminId?: number;        // Filter by admin user ID
  action?: string;         // Filter by action type
  entityType?: string;     // Filter by entity type
  result?: 'success'|'error'; // Filter by result
  startDate?: string;      // ISO date string
  endDate?: string;        // ISO date string
  search?: string;         // Text search in changes
  sortBy?: string;         // Column to sort by
  sortOrder?: 'asc'|'desc'; // Sort direction
}
```

**Response**:
```typescript
{
  data: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### GET /api/admin/activity/:id
**Response**:
```typescript
{
  id: number;
  admin_id: number;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: {
    before: object;
    after: object;
  };
  ip_address: string;
  user_agent: string;
  result: 'success' | 'error';
  error_message?: string;
  created_at: string;
}
```

### POST /api/admin/activity/export
**Request Body**:
```typescript
{
  format: 'csv' | 'json' | 'pdf';
  filters: ActivityFilters;
  fields?: string[];
}
```

**Response**:
```typescript
{
  downloadUrl: string;
  expiresAt: string;
}
```

### GET /api/admin/activity/analytics/summary
**Response**:
```typescript
{
  totalActivities: number;
  successRate: number;
  errorRate: number;
  activeAdmins: number;
  topActions: Array<{action: string, count: number}>;
  recentErrors: ActivityLog[];
}
```

---

## 🎨 UI/UX DESIGN

### Color Coding:
- Success: Green badge
- Error: Red badge
- User actions: Blue
- Role actions: Purple
- Organization actions: Orange
- Config actions: Gray

### Layout:
```
┌─────────────────────────────────────────────────────────┐
│  Admin Activity Log                    [Export] [Refresh]│
├─────────────────────────────────────────────────────────┤
│  Filters: [Admin ▼] [Action ▼] [Date Range] [Search...]│
├─────────────────────────────────────────────────────────┤
│  Timestamp  │ Admin      │ Action       │ Entity  │ ✓/✗ │
│  ──────────┼───────────┼─────────────┼────────┼──── │
│  5:15 AM   │ admin@...  │ update_user  │ user:42│  ✓  │
│  5:10 AM   │ super@...  │ delete_role  │ role:5 │  ✓  │
│  5:05 AM   │ admin@...  │ update_org   │ org:10 │  ✗  │
├─────────────────────────────────────────────────────────┤
│  ← Prev    Page 1 of 10    Next →        50 per page ▼ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 SECURITY CONSIDERATIONS

1. **Authorization**:
   - Only admins with specific capability can view logs
   - Row-level security (admins can't see superadmin actions)
   - Rate limiting on export functionality

2. **Data Protection**:
   - Redact sensitive fields in changes
   - Mask PII in export files
   - No password hashes in logs

3. **Audit the Auditors**:
   - Log who views activity logs
   - Track export actions
   - Alert on suspicious patterns

---

## 📈 SUCCESS METRICS

### Performance:
- Page load < 2 seconds
- Filter response < 500ms
- Export generation < 10 seconds
- Real-time updates < 1 second latency

### Usability:
- Search accuracy > 95%
- Export success rate > 99%
- Zero client-side errors

### Adoption:
- Used by 80%+ of admins monthly
- Average 10+ views per admin per month
- Export used for compliance reporting

---

## 🚀 DEPLOYMENT PLAN

### Phase 3A: Core Functionality (This Sprint)
- Main activity log page
- Basic filters
- Table with real API
- View details modal

### Phase 3B: Advanced Features (Next Sprint)
- Export functionality
- Analytics dashboard
- Diff viewer
- Real-time updates

### Phase 3C: Polish & Optimization (Final Sprint)
- Performance optimization
- Advanced filters
- Suspicious activity detection
- Mobile responsive

---

## 📝 NOTES

### Technical Decisions:
- Use React Query for API state management
- Implement virtual scrolling for large datasets
- Use date-fns for date manipulation
- Implement debounced search

### Dependencies to Add:
```json
{
  "react-query": "^3.39.0",
  "react-virtual": "^2.10.4",
  "date-fns": "^2.29.0",
  "file-saver": "^2.0.5",
  "react-json-view": "^1.21.3"
}
```

---

**Next Steps**: Start with backend API enhancement, then build frontend components incrementally.
