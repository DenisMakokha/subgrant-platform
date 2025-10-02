# Universal Dashboard System - Complete Documentation

## Overview
The Universal Dashboard System is a comprehensive, capability-aware dashboard framework that automatically adapts to any user role—whether admin, partner, or custom roles created via the Role Wizard. **NO MORE ROLE CONFUSION** - the system checks capabilities, not role names.

## Architecture

### Core Principles
1. **Capability-Based** - All widgets check capabilities, not roles
2. **Universal** - Works for ANY role (built-in or custom)
3. **Customizable** - Users can personalize their dashboard
4. **Responsive** - Mobile-first design
5. **Modular** - Easy to add new widgets
6. **Performance** - Optimized data fetching

## Component Structure

### 1. Shell Components (`/components/dashboard/shells/`)

#### DashboardShell
Main container providing:
- Responsive layout
- Sidebar management
- Header integration
- Footer
- Mobile overlay

**Usage:**
```typescript
<DashboardShell>
  {children}
</DashboardShell>
```

#### HeaderShell
Top navigation featuring:
- Global search
- Quick actions (capability-aware)
- Notifications
- Theme toggle
- User menu

**Features:**
- Auto-generates quick actions based on capabilities
- Responsive search (desktop/mobile)
- Dropdown menus with click-outside handling

#### SidebarShell
Navigation sidebar with:
- Capability-aware menu items
- Collapsible sections
- Active state tracking
- Mobile support
- Tooltips in collapsed mode

**Features:**
- Auto-generates menu from capabilities
- Grouped by functional areas
- Badge support for counts

### 2. Layout Components (`/components/dashboard/layouts/`)

#### PageLayout
Standard page wrapper:
```typescript
<PageLayout
  title="Page Title"
  subtitle="Description"
  breadcrumbs={[{ label: 'Home', path: '/' }]}
  actions={<Button />}
>
  {content}
</PageLayout>
```

#### GridLayout
Responsive grid system:
```typescript
<GridLayout columns={3} gap={6}>
  {widgets}
</GridLayout>
```

**Responsive Breakpoints:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

#### SplitLayout
Master-detail layout:
```typescript
<SplitLayout
  master={<List />}
  detail={<Detail />}
  masterWidth="medium"
/>
```

### 3. Base Widgets (`/components/dashboard/widgets/base/`)

#### Widget
Base wrapper for all widgets:
```typescript
<Widget
  title="Widget Title"
  subtitle="Description"
  capability="budgets.view"
  loading={false}
  error={null}
  actions={<RefreshButton />}
>
  {content}
</Widget>
```

**Features:**
- Capability checking
- Loading states
- Error handling
- Action buttons
- Consistent styling

#### KPIWidget
Key performance indicator display:
```typescript
<KPIWidget
  title="Total Budget"
  value="$2.5M"
  change="+12%"
  trend="up"
  icon={<DollarIcon />}
  color="blue"
  capability="budgets.view"
/>
```

**Features:**
- Large value display
- Trend indicators
- Color variants
- Icon support
- Click handling

#### ChartWidget
Chart visualization:
```typescript
<ChartWidget
  title="Budget Trend"
  type="line"
  data={chartData}
  capability="budgets.view"
  height={300}
/>
```

**Note:** Placeholder for chart library integration (Chart.js, Recharts, etc.)

#### ListWidget
List display with items:
```typescript
<ListWidget
  title="Recent Items"
  items={listItems}
  capability="items.view"
  maxItems={5}
  showViewAll={true}
  onViewAll={() => navigate('/items')}
/>
```

### 4. Specific Widgets (`/components/dashboard/widgets/specific/`)

#### BudgetSummaryWidget
Displays budget utilization:
- Total budget
- Spent amount
- Remaining amount
- Utilization percentage
- Progress bar

**API:** `GET /api/partner/budgets/summary`

#### ProjectTimelineWidget
Shows active projects:
- Project list
- Progress bars
- Status badges
- Due dates

**API:** `GET /api/partner/projects?limit=5`

#### ApprovalQueueWidget
Pending approvals:
- Approval list
- Priority badges
- Requester info
- Click to view

**API:** `GET /api/approvals/pending?limit=5`

#### ComplianceStatusWidget
Compliance overview:
- Compliance rate (circular progress)
- Compliant count
- Pending count
- Overdue count

**API:** `GET /api/partner/compliance/status`

#### RecentIssuesWidget
Recent reported issues:
- Issue list
- Status badges
- Priority indicators
- Creation dates

**API:** `GET /api/reported-issues?limit=5`

#### UpcomingReportsWidget
Due M&E reports:
- Report list
- Due dates
- Urgency indicators
- Days until due

**API:** `GET /api/partner/me/due?limit=5`

## Configuration System

### Dashboard Templates (`/config/dashboards/templates.ts`)

Pre-built templates for different user types:

#### Executive Dashboard
- High-level KPIs
- Trend charts
- Strategic metrics
- Approval queue

#### Finance Dashboard
- Budget summary
- Disbursements
- Monthly spending
- Financial reports

#### Operations Dashboard
- Project timeline
- Compliance status
- Upcoming reports
- Recent issues

#### Partner Dashboard
- Budget summary
- Project timeline
- Compliance status
- Upcoming reports

#### Admin Dashboard
- User statistics
- Organization count
- System health
- Approval queue

### Smart Dashboard Generator (`/config/dashboards/generator.ts`)

Automatically generates dashboards based on capabilities:

```typescript
const dashboard = generateDashboardFromCapabilities(
  capabilities,
  userId,
  userName
);
```

**Logic:**
1. Analyzes user capabilities
2. Adds relevant KPI widgets
3. Adds detailed widgets
4. Optimizes layout
5. Returns complete configuration

## Hooks

### useDashboard
Main dashboard management hook:

```typescript
const {
  dashboard,
  preferences,
  loading,
  error,
  refreshDashboard,
  updatePreferences,
  resetToDefault
} = useDashboard();
```

**Features:**
- Loads dashboard configuration
- Manages user preferences
- Handles template selection
- Provides refresh functionality

### useWidgets
Widget data management:

```typescript
const {
  data,
  loading,
  error,
  refresh,
  updateData
} = useWidgets(widgetIds, refreshInterval);
```

**Features:**
- Fetches widget data
- Auto-refresh support
- Individual widget refresh
- Data caching

### useCapabilities
Capability checking:

```typescript
const {
  hasCapability,
  hasAnyCapability,
  hasAllCapabilities,
  capabilities,
  isAdmin
} = useCapabilities();
```

## Pages

### UniversalDashboard
Main dashboard page:
- Auto-generates from capabilities
- Renders widgets dynamically
- Handles loading/error states
- Provides refresh functionality

**Route:** `/dashboard`

### DashboardCustomizer
Customization interface:
- Template selection
- Widget management
- Layout customization
- Save/reset functionality

**Route:** `/dashboard/customize`

## API Endpoints

### Dashboard Configuration
```
GET    /api/dashboard/preferences       - Get user preferences
PUT    /api/dashboard/preferences       - Update preferences
DELETE /api/dashboard/preferences       - Reset to default
GET    /api/dashboard/config/:id        - Get dashboard config
```

### Widget Data
```
GET    /api/dashboard/widgets/:id/data  - Get widget data
```

### Specific Widget APIs
```
GET    /api/partner/budgets/summary     - Budget summary
GET    /api/partner/projects             - Projects
GET    /api/approvals/pending            - Pending approvals
GET    /api/partner/compliance/status    - Compliance status
GET    /api/reported-issues              - Recent issues
GET    /api/partner/me/due               - Upcoming reports
```

## Capability Requirements

### Widget Capabilities
- `budgets.view` - Budget widgets
- `projects.view` - Project widgets
- `approvals.view` - Approval widgets
- `compliance.view` - Compliance widgets
- `issues.view` - Issue widgets
- `me_reports.view` - Report widgets
- `users.view` - User management widgets
- `organizations.view` - Organization widgets
- `audit_logs.view` - Audit log widgets

## Customization

### Adding New Widgets

1. **Create Widget Component:**
```typescript
// /components/dashboard/widgets/specific/MyWidget.tsx
export default function MyWidget() {
  // Widget implementation
}
```

2. **Add to Widget Map:**
```typescript
// UniversalDashboard.tsx
const widgetComponents = {
  ...existing,
  MyWidget
};
```

3. **Add to Template:**
```typescript
// templates.ts
{
  id: 'my-widget',
  type: 'custom',
  component: 'MyWidget',
  position: { row: 0, col: 0, span: 2 },
  capability: 'my.capability',
  props: {}
}
```

### Creating Custom Templates

```typescript
// templates.ts
export const myTemplate: DashboardTemplate = {
  id: 'my-template',
  name: 'My Dashboard',
  description: 'Custom dashboard for specific needs',
  category: 'custom',
  requiredCapabilities: ['capability1', 'capability2'],
  config: {
    id: 'my-dashboard',
    name: 'My Dashboard',
    layout: 'grid',
    columns: 3,
    widgets: [
      // Widget configurations
    ]
  }
};
```

## Responsive Design

### Breakpoints
- **Mobile:** < 768px (1 column)
- **Tablet:** 768px - 1280px (2 columns)
- **Desktop:** > 1280px (3-4 columns)

### Mobile Features
- Collapsible sidebar
- Mobile search
- Touch-friendly buttons
- Optimized layouts

## Dark Mode

All components support dark mode:
- Automatic theme detection
- Manual toggle
- Consistent color schemes
- Proper contrast ratios

## Performance Optimization

### Data Fetching
- Lazy loading
- Conditional fetching
- Auto-refresh intervals
- Caching strategies

### Rendering
- Component memoization
- Virtual scrolling for lists
- Skeleton loading states
- Progressive enhancement

## Security

### Capability Enforcement
- Server-side validation
- Client-side hiding
- API endpoint protection
- Data filtering

### Data Isolation
- Organization-based filtering
- User-specific data
- Role-based access
- Audit logging

## Testing

### Unit Tests
```typescript
describe('useDashboard', () => {
  it('should load dashboard configuration', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('UniversalDashboard', () => {
  it('should render widgets based on capabilities', () => {
    // Test implementation
  });
});
```

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
```
REACT_APP_API_URL=http://localhost:3000
```

## Troubleshooting

### Dashboard Not Loading
1. Check user capabilities
2. Verify API endpoints
3. Check console for errors
4. Verify authentication

### Widgets Not Showing
1. Check capability requirements
2. Verify API responses
3. Check widget component mapping
4. Verify data format

### Performance Issues
1. Reduce refresh intervals
2. Limit widget count
3. Optimize API queries
4. Enable caching

## Future Enhancements

### Planned Features
- Drag-and-drop widget arrangement
- Custom widget creation
- Widget resizing
- Export dashboards
- Share dashboards
- Real-time updates (WebSocket)
- Advanced filtering
- Custom themes

## Support

For issues or questions:
1. Check this documentation
2. Review component code
3. Check API documentation
4. Contact development team

## Summary

The Universal Dashboard System provides:
✅ **Capability-based access control**
✅ **Automatic dashboard generation**
✅ **Custom role support**
✅ **Responsive design**
✅ **Dark mode**
✅ **Customizable layouts**
✅ **Modular widgets**
✅ **Performance optimized**
✅ **Production-ready**

**NO MORE ROLE CONFUSION - Every dashboard adapts to user capabilities!**
