# Dashboard Wireframes

## 1. Overview

This document provides conceptual wireframes for the key dashboards in the Sub-Grant Management Platform. These wireframes align with the requirements specified in the Zizi Afrique – ALiVE Partners Subgrants Management System document.

## 2. Admin Dashboard

### 2.1 Layout Structure

```
+---------------------------------------------------------------+
|  Header: Logo, User Menu, Notifications (3)                   |
+-----------+---------------------------------------------------+
|  Sidebar  |  Main Content Area                                |
|           |                                                   |
| - Home    |  +---------------------------------------------+ |
| - Projects|  |  KPI Cards                                  | |
| - Budgets |  |  [Active Projects: 24] [Pending Budgets: 7] | |
| - Reports |  |  [Pending Reports: 12] [Disbursements: $1.2M]| |
| - Users   |  +---------------------------------------------+ |
| - Settings|                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Budgets Approved vs Pending                | |
|           |  |  [     Chart Visualization                ] | |
|           |  |  [     Chart Visualization                ] | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Task Tracker                               | |
|           |  |  Reports Due This Week                      | |
|           |  |  • Community Health Q2 Report (Due: 2 days) | |
|           |  |  • Education Initiative (Due: 3 days)       | |
|           |  |  • Water Project (Overdue: 1 day)           | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Recent Notifications                       | |
|           |  |  • New budget submitted (30 mins ago)       | |
|           |  |  • Contract signed (2 hours ago)            | |
|           |  |  • Disbursement processed (1 day ago)       | |
|           |  +---------------------------------------------+ |
+-----------+---------------------------------------------------+
```

### 2.2 Component Details

#### 2.2.1 Header
- Organization logo
- User profile menu (name, role, settings, logout)
- Notification bell icon with count
- Quick search bar

#### 2.2.2 Sidebar Navigation
- Main navigation menu with icons
- Collapsible sections
- Active state highlighting
- Quick access to frequently used features

#### 2.2.3 KPI Cards
- **Active Projects**: Large number with trend indicator
- **Pending Budgets**: Number with percentage change
- **Pending Reports**: Count with overdue indicator
- **Disbursements**: Currency value with time period

#### 2.2.4 Budgets Approved vs Pending Chart
- Horizontal bar chart comparing approved vs pending budgets
- Color-coded segments (green for approved, orange for pending)
- Percentage breakdown
- Time period selector (week, month, quarter)

#### 2.2.5 Task Tracker
- Section title with "Reports Due This Week"
- List of upcoming deadlines
- Color-coded status indicators (green = on track, yellow = due soon, red = overdue)
- Days remaining or overdue indicator
- Quick action buttons (view, remind, extend)

#### 2.2.6 Recent Notifications
- Section title with "Recent Notifications"
- Timestamped list of system notifications
- Actionable items with links
- Clear all and view all notifications options

## 3. Partner Dashboard

### 3.1 Layout Structure

```
+---------------------------------------------------------------+
|  Header: Logo, User Menu, Notifications (1)                   |
+-----------+---------------------------------------------------+
|  Sidebar  |  Main Content Area                                |
|           |                                                   |
| - Home    |  +---------------------------------------------+ |
| - Projects|  |  [!!] Monthly Report Deadline: June 30      | |
| - Budgets |  +---------------------------------------------+ |
| - Reports |                                                   |
| - Docs    |  +---------------------------------------------+ |
| - Settings|  |  Project Status Overview                    | |
|           |  |  Community Health Initiative              | |
|           |  |  • Budget Status: [Approved]              | |
|           |  |  • Contract Status: [Signed]              | |
|           |  |  • Funds Disbursed: [2 of 3 tranches]     | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  [Submit Monthly Report]                    | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Past Reports                               | |
|           |  |  Period        | Status     | Comments     | |
|           |  |  May 2023      | Approved   | Good progress| |
|           |  |  Apr 2023      | Approved   | On track     | |
|           |  |  Mar 2023      | Corrections| Data needed  | |
|           |  |  Feb 2023      | Approved   | Satisfactory | |
|           |  +---------------------------------------------+ |
+-----------+---------------------------------------------------+
```

### 3.2 Component Details

#### 3.2.1 Header
- Organization logo
- User profile menu
- Notification bell icon with count
- Quick access to organization profile

#### 3.2.2 Sidebar Navigation
- Simplified navigation for partner users
- Project-specific sections
- Document management
- Report submission history

#### 3.2.3 Deadline Banner
- Prominent banner with exclamation icons
- Clear deadline date
- Time remaining indicator
- Quick link to report submission

#### 3.2.4 Project Status Overview
- Project name header
- Status indicators for:
  - Budget Status (Draft, Submitted, Approved, Rejected)
  - Contract Status (Pending, Sent, Signed, Filed)
  - Funds Disbursed (X of Y tranches released)
- Progress bars for visual indication

#### 3.2.5 Submit Monthly Report Button
- Large, prominent call-to-action button
- Status indicator (available, in progress, submitted)
- Quick access to current reporting period

#### 3.2.6 Past Reports Table
- Sortable table with columns:
  - Period (Month/Year)
  - Status (Draft, Submitted, Corrections, Approved)
  - Comments/Feedback from reviewers
- Action buttons for each row (view, edit if applicable)
- Pagination for long report histories

## 4. Donor Dashboard

### 4.1 Layout Structure

```
+---------------------------------------------------------------+
|  Header: Logo, User Menu                                    |
+-----------+---------------------------------------------------+
|  Sidebar  |  Main Content Area                                |
|           |                                                   |
| - Home    |  +---------------------------------------------+ |
| - Reports |  |  Program Overview                           | |
| - Settings|  |  • Total Funding: $2.5M                     | |
|           |  |  • Active Projects: 18                      | |
|           |  |  • Beneficiaries Reached: 12,500            | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Financial Transparency                     | |
|           |  |  [     Fund Utilization Chart           ]    | |
|           |  |  Disbursement Timeline                      | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Compliance Status                          | |
|           |  |  • Reporting Compliance: 94%              | |
|           |  |  • Risk Assessment: Low                   | |
|           |  |  • Audit Readiness: Complete              | |
|           |  +---------------------------------------------+ |
|           |                                                   |
|           |  +---------------------------------------------+ |
|           |  |  Available Reports                          | |
|           |  |  [Download Standard Reports]                | |
|           |  |  Quarterly Reports    |  Annual Reports   | |
|           |  |  • Q1 2023 (PDF)      |  • 2022 (PDF)     | |
|           |  |  • Q2 2023 (PDF)      |  • 2022 (Excel)   | |
|           |  +---------------------------------------------+ |
+-----------+---------------------------------------------------+
```

### 4.2 Component Details

#### 4.2.1 Header
- Organization logo
- User profile menu with donor-specific options
- No notification system (read-only access)

#### 4.2.2 Sidebar Navigation
- Limited navigation options
- Reports section with filtering
- Settings for report preferences

#### 4.2.3 Program Overview
- High-level program metrics
- Funding and reach statistics
- Key performance indicators
- Time period selector

#### 4.2.4 Financial Transparency
- Fund utilization visualization
- Disbursement timeline
- Budget vs. actual comparisons
- Currency display options

#### 4.2.5 Compliance Status
- Reporting compliance rates
- Risk assessment indicators
- Audit readiness status
- Exception tracking (limited view)

#### 4.2.6 Available Reports
- Organized report library
- Download buttons for approved reports
- Format options (PDF, Excel)
- Date and version information

## 5. Responsive Design Considerations

### 5.1 Mobile Viewports
- Stacked layout for small screens
- Collapsible navigation menus
- Touch-friendly button sizes
- Simplified data visualizations

### 5.2 Tablet Viewports
- Two-column layout where appropriate
- Condensed navigation
- Optimized chart sizing
- Touch-friendly interactions

### 5.3 Desktop Viewports
- Full dashboard layouts
- Multi-column arrangements
- Detailed data visualizations
- Keyboard navigation support

## 6. Accessibility Features

### 6.1 Visual Design
- High contrast color schemes
- Clear typography hierarchy
- Consistent iconography
- Alternative text for images

### 6.2 Navigation
- Keyboard-only navigation
- Screen reader compatibility
- Skip navigation links
- Focus indicators

### 6.3 Content
- Semantic HTML structure
- ARIA labels for interactive elements
- Descriptive link text
- Form field labeling

## 7. Implementation Notes

### 7.1 Technology Stack
- React.js with TypeScript for frontend components
- Chart.js or D3.js for data visualizations
- CSS Grid and Flexbox for responsive layouts
- Material-UI or similar component library

### 7.2 Data Integration
- Real-time data updates through WebSocket connections
- API integration for dashboard metrics
- Caching strategies for performance optimization
- Error handling for data retrieval failures

### 7.3 User Experience
- Loading states for data retrieval
- Empty state illustrations
- Error state messaging
- Success feedback for user actions

## 8. Future Enhancements

### 8.1 Personalization
- Customizable dashboard layouts
- User preference settings
- Bookmarking important views
- Notification filtering

### 8.2 Advanced Analytics
- Predictive modeling visualizations
- Comparative analysis tools
- Export customization options
- Interactive drill-down capabilities

These wireframes provide a conceptual foundation for the dashboard implementation that aligns with the requirements while maintaining flexibility for future enhancements.