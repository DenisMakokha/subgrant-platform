# Mandatory Onboarding System - Test Plan

## Test Scenarios

### 1. New Partner User (No Organization)
**Expected Flow:**
1. User logs in → redirected to `/partner/onboarding/landing`
2. Sees "Organization Setup Required" message
3. Clicks "Create Organization Profile" → organization created
4. Automatically proceeds to onboarding steps

**Test Steps:**
- [ ] Login as partner user without organization
- [ ] Verify redirect to onboarding landing
- [ ] Verify organization creation works
- [ ] Verify automatic progression to step A

### 2. Partner User with Incomplete Onboarding
**Expected Flow:**
1. User logs in → sees onboarding landing with progress
2. All sidebar links redirect to onboarding landing
3. Home page CTAs show "Requires onboarding" messages
4. API calls return 423 Locked responses

**Test Steps:**
- [ ] Login as partner with `organization.status !== 'finalized'`
- [ ] Try clicking sidebar "Applications" → redirects to onboarding
- [ ] Try clicking home "New Application" → redirects to onboarding  
- [ ] Verify lock banner appears on all pages
- [ ] Make API call to `/partner/applications` → expect 423 Locked

### 3. Complete Onboarding Flow
**Expected Flow:**
1. Section A → saves data, unlocks Section B
2. Section B → saves data, unlocks Section C  
3. Section C → saves data, unlocks Review
4. Review & Submit → sets `organization.status = 'finalized'`
5. All features unlock automatically

**Test Steps:**
- [ ] Complete Section A → verify progress updates
- [ ] Complete Section B → verify progress updates
- [ ] Complete Section C → verify progress updates
- [ ] Submit application → verify status becomes 'finalized'
- [ ] Verify all sidebar links work normally
- [ ] Verify home page CTAs work normally
- [ ] Verify lock banner disappears

### 4. Completed Partner User
**Expected Flow:**
1. User with `organization.status = 'finalized'` has full access
2. No redirects or lock banners
3. All API endpoints work normally

**Test Steps:**
- [ ] Login as partner with completed onboarding
- [ ] Verify no lock banner appears
- [ ] Verify all sidebar links work
- [ ] Verify all home page CTAs work
- [ ] Make API calls → expect normal responses

### 5. API Auto-Redirect
**Expected Flow:**
1. Frontend makes API call to locked endpoint
2. Backend returns 423 Locked with redirect info
3. Frontend automatically redirects to onboarding landing

**Test Steps:**
- [ ] Make API call while onboarding incomplete
- [ ] Verify 423 response with correct JSON structure
- [ ] Verify automatic redirect to onboarding landing

## Visual Verification Checklist

### Onboarding Landing Page
- [ ] Progress bar shows correct completion percentage
- [ ] Completed steps show green checkmarks
- [ ] Available steps show blue styling
- [ ] Locked steps show gray styling and "Locked" button
- [ ] "Start/Continue" button goes to correct next step

### Lock Banner
- [ ] Appears on all pages when onboarding incomplete
- [ ] Shows amber/yellow warning styling
- [ ] Contains "Complete Onboarding" link
- [ ] Disappears when onboarding complete

### Sidebar Navigation
- [ ] Locked items show 50% opacity
- [ ] Locked items redirect to onboarding landing
- [ ] Onboarding item always accessible
- [ ] Normal styling when onboarding complete

### Home Page
- [ ] Quick action cards show lock indicators
- [ ] Locked cards redirect to onboarding landing
- [ ] "Requires onboarding" messages appear
- [ ] Normal functionality when complete

## Browser Console Verification
- [ ] No JavaScript errors during onboarding flow
- [ ] API calls show correct request/response logging
- [ ] 423 Locked responses logged with redirect info
- [ ] Session refresh updates onboarding status

## Mobile Responsiveness
- [ ] Onboarding landing works on mobile
- [ ] Lock banner displays properly on mobile
- [ ] Progress indicators work on small screens
- [ ] Navigation remains functional

## Accessibility
- [ ] Screen readers announce lock status
- [ ] Keyboard navigation works throughout flow
- [ ] Color contrast meets WCAG standards
- [ ] ARIA attributes properly set

## Performance
- [ ] Page loads quickly even with progress calculations
- [ ] No unnecessary API calls during navigation
- [ ] Smooth transitions between onboarding steps
- [ ] Efficient re-renders when status changes

## Edge Cases
- [ ] User manually navigates to locked URLs
- [ ] Session expires during onboarding
- [ ] Network errors during organization creation
- [ ] Multiple browser tabs with same user
- [ ] Browser refresh during onboarding process

## Success Criteria
✅ **All partner users must complete onboarding before accessing other features**
✅ **Clear visual feedback about what's locked and why**  
✅ **Smooth, guided experience through onboarding steps**
✅ **Automatic unlocking when onboarding complete**
✅ **No way to bypass the onboarding requirement**
