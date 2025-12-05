# Design Guidelines: Marvel Driving School Management Dashboard

## Design Approach
**Selected System:** Material Design 3 with Linear-inspired aesthetics

**Rationale:** Administrative dashboard requiring efficiency, clarity, and professional credibility. Material Design 3 provides robust patterns for complex data interfaces while Linear's clean typography ensures modern trustworthiness.

---

## Color Palette

### Primary Colors
- **Teal Primary:** #0891B2 (driving school professionalism, trust)
- **Teal Dark:** #0E7490 (interactive states, emphasis)
- **Teal Light:** #22D3EE (accents, highlights)

### Neutral Foundation
- **Background:** #FAFAFA (off-white, reduces eye strain)
- **Surface:** #FFFFFF (cards, elevated components)
- **Borders:** #E5E7EB (subtle dividers)
- **Text Primary:** #111827 (high contrast body text)
- **Text Secondary:** #6B7280 (labels, metadata)
- **Text Tertiary:** #9CA3AF (placeholders, disabled)

### Semantic Colors
- **Success:** #10B981 (payments confirmed, attendance marked)
- **Warning:** #F59E0B (pending actions, incomplete forms)
- **Error:** #EF4444 (overdue payments, validation errors)
- **Info:** #3B82F6 (informational notices)

### Application
- Sidebar background: Teal Dark with white text/icons
- Primary buttons: Teal Primary with white text
- Active states: Teal Light background with Teal Dark text
- Status badges: Semantic colors with 10% opacity backgrounds

---

## Typography

**Fonts:** Inter (primary), JetBrains Mono (codes/IDs) via Google Fonts CDN

**Scale:**
- Page Titles: text-3xl font-semibold tracking-tight
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body: text-base font-normal
- Labels: text-sm font-medium text-gray-700
- Metadata: text-xs text-gray-500

---

## Layout System

**Spacing:** Use 4, 6, 8, 12, 16, 24 units consistently (p-4, gap-8, py-12, px-16, mb-24)

**Structure:**
- Sidebar: Fixed w-64, Teal Dark background
- Main Content: flex-1 with p-8 breathing room
- Content Containers: max-w-7xl mx-auto
- Form Containers: max-w-2xl for optimal readability
- Card Grids: grid gap-6 (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

---

## Core Components

### Navigation
**Sidebar:**
- Marvel logo at top (height 40px, white treatment)
- Collapsible section groups (Students, Attendance, Payments, Training, Reports)
- Icons (Heroicons) + labels, active state with Teal Light background
- User profile card at bottom with role indicator

**Top Bar:**
- Breadcrumb navigation (text-sm with chevron separators)
- Global search input (rounded, border-gray-300)
- Notification bell icon with badge counter
- User avatar dropdown menu

### Dashboard Cards
**Stat Cards (4 across):**
- White background, rounded-lg, shadow-sm
- Icon circle (Teal Light background, Teal Dark icon)
- Large number: text-3xl font-bold
- Label: text-sm text-gray-600
- Trend indicator: small arrow + percentage (Success/Error color)

**Content Cards:**
- Header: title + optional action menu (three dots)
- Divider line (border-b)
- Content padding: p-6
- Hover state: shadow-md transition

### Data Tables
- Sticky header with background-gray-50
- Alternating row backgrounds (even rows: background-gray-50)
- Row hover: background-teal-50
- Action buttons: small icons (Edit, View, Delete) in row-end
- Status badges: rounded-full px-3 py-1 text-xs font-medium
- Pagination controls at bottom-right
- Filter chips above table (removable with X icon)

### Forms
**Layout:**
- Grouped sections with dividing borders
- Label above input, required asterisk in Error color
- Input fields: border-gray-300, focus:border-teal-500, focus:ring-2 ring-teal-200
- Inline validation: text-sm Error color below input
- Multi-step indicator: numbered circles with connecting lines
- Submit button: full Teal Primary, cancel as outline

**Specialized Inputs:**
- Date picker: calendar icon suffix
- File upload: dashed border dropzone, preview thumbnails below
- Student code lookup: search icon prefix, autocomplete dropdown

### Student Profile
**Header Section:**
- Avatar (80px circle) + Name (text-2xl) + Student Code (JetBrains Mono, text-sm gray)
- Status badge (Active/Suspended/Graduated)
- Quick action buttons: Edit Profile, Generate Receipt

**Tabbed Content:**
- Tab bar with border-b, active tab gets Teal Primary underline
- Tabs: Personal Details, Documents, Attendance History, Payments, Training Progress
- Document gallery: grid of thumbnails with upload button
- Training timeline: vertical line with milestone markers
- Payment table with "Generate Payment Link" action

### Modals
- Overlay: background-black/50 backdrop blur
- Card: max-w-lg centered, rounded-lg, shadow-xl
- Header with title + close X button
- Content section with p-6
- Footer with action buttons (right-aligned)

### Notifications
- Toast position: top-right, fixed
- Auto-dismiss after 5 seconds
- Success/Error/Info variants with matching colors
- Close button included

---

## Key Page Layouts

**Login Page:**
- Centered card (max-w-md) on Background color viewport
- Marvel logo centered above card
- Role selector: segmented button group (Admin, Staff, Student)
- Conditional inputs based on role
- Primary submit button full-width

**Dashboard Home:**
- 4 stat cards row at top
- Two-column below: Recent Activity feed (left, 2/3) + Quick Actions (right, 1/3)
- Upcoming Sessions calendar widget below

**Student Management:**
- Search bar + Add Student button (top, space-between)
- Filter toolbar: Status, Course Type, Instructor dropdowns
- Grid/List toggle icons
- Student cards in grid or table rows
- Bulk select checkboxes when multiple selected

**Attendance Recording:**
- Date picker prominent (left-aligned, large)
- Session type selector (Theory/Practical/Test)
- Student checklist with checkboxes, search filter
- Bulk mark present/absent buttons
- Submit attendance button (Primary, bottom-right)

**Payment Dashboard:**
- Filter tabs: All, Pending, Paid, Overdue
- Payment cards showing: Student name, Amount, Due date, Status
- "Generate Link" button on each card
- Transaction history modal on card click

**Training Logs:**
- Student selector dropdown (searchable)
- Date range filter
- Log entries in timeline format
- Add log entry button (floating, bottom-right)
- Rich text editor modal for detailed notes

---

## Icons
**Library:** Heroicons via CDN

**Usage:** Home, Users, Calendar, CurrencyDollar, DocumentText, Cog, Plus, Pencil, Trash, Download, Upload, Check, XMark, CheckCircle, XCircle, Clock, ExclamationTriangle, ChevronRight, MagnifyingGlass, Bell

---

## Responsive Breakpoints
- **Desktop (lg+):** Full sidebar, 3-4 column grids
- **Tablet (md):** Collapsible sidebar, 2 column grids  
- **Mobile:** Drawer overlay menu, single column, stacked cards, simplified tables (show essential columns only)

---

## Images
**No hero section** (administrative dashboard)

**Application Images:**
- Student avatars: 40px circles in lists, 80px in profiles
- Document thumbnails: 120px squares in grid
- Empty states: illustration placeholders for "No data" scenarios
- Marvel logo: sidebar (white) and login page

---

## Accessibility
- WCAG 2.1 AA contrast ratios enforced
- Keyboard navigation for all interactions
- ARIA labels on icon buttons
- Focus rings on interactive elements
- Screen reader announcements for notifications