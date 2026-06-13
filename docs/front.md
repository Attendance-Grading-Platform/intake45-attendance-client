# ITI Attendance & Grading Platform
### Complete UI/UX Design System Specification
### Version 2.0 — Updated to match final agreed palette

---

## 1. TYPOGRAPHY (The Core Personality)

> **Design Rule:** NEVER use system UI fonts, Inter, Roboto, or Helvetica.
> DM Serif Display is strictly for page titles, key headings, and grand totals.
> DM Sans is used everywhere else.

| Hierarchy | Font Family | Size | Weight | Additional Styling |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | DM Serif Display | 36px | Normal | Page titles, editorial |
| **H2** | DM Serif Display | 26px | Normal | Section headings |
| **H3** | DM Sans | 18px | 500 | Sub-section headings |
| **Labels** | DM Sans | 11px | Normal | Letter-spacing 1.5px, ALL CAPS, `#888888` |
| **Body** | DM Sans | 14px | 400 | Line-height 1.8 |
| **Numbers / Data** | DM Sans | Base | 500 | `font-variant-numeric: tabular-nums` |
| **Grand Total** | DM Serif Display | 52px | Normal | Student grade total only |
| **Metric Numbers** | DM Sans | 32px | 500 | Dashboard metric cards |

---

## 2. COLOR SYSTEM — STRICT (Final Agreed Palette)

> ⚠️ ONE palette for ALL 22 screens. No split between screens 1–14 and 15–22.
> The old `#F6E9C7` and `#000000` palette was replaced. These are the final colors.

### Final Palette — Applied to All Screens

| Token | Value | Usage |
| :--- | :--- | :--- |
| **Page background** | `#E6DDD4` | All page backgrounds (warm rose-beige canvas) |
| **Card surface** | `#FFFFFF` | All card and modal surfaces |
| **Primary** | `#940002` | Buttons, top bar, active nav, progress bars, key accents |
| **Primary hover** | `#7a0002` | Button hover state (8% darker) |
| **Primary pressed** | `#600001` | Button pressed state (12% darker) |
| **Borders / Dividers** | `#C9BDB8` | All card borders, input outlines, table dividers |
| **Active / Hover BG** | `#F5EDEA` | Sidebar active item, table row hover |
| **Text primary** | `#1A0000` | All primary text (deep warm black) |
| **Text secondary** | `#666666` | Secondary text, descriptions |
| **Text tertiary** | `#888888` | Uppercase labels, placeholders |
| **Placeholder** | `#AEAEAE` | Input placeholder text |

### Semantic Status Colors (Use Sparingly — Semantic Only)

| Token | Value | Usage |
| :--- | :--- | :--- |
| **Success** | `#2D6A4F` | Present, passed, approved |
| **Success light** | `#D1FAE5` | Success background tint |
| **Warning** | `#92400E` | At-risk, pending |
| **Warning light** | `#FEF3C7` | Warning background tint |
| **Danger** | `#991B1B` | Absent, failed, rejected |
| **Danger light** | `#FEE2E2` | Danger background tint |
| **Info** | `#1E3A5F` | Informational |
| **Info light** | `#DBEAFE` | Info background tint |

### Key Color Rules
- Primary button: `#940002` background, `#E6DDD4` text
- Top bar: `#940002` background, `#E6DDD4` logo and text
- Active sidebar item: `border-l-2 #940002`, text `#940002`, bg `#F5EDEA`
- Progress bar fill: `#940002`, track: `#E6DDD4`
- Grand total number: `#940002`
- **NO gradients. NO shadows on cards. NO colored card backgrounds.**

---

## 3. DESIGN LANGUAGE & HUMAN TOUCH

**Aesthetic Goal:** Institutional but warm. Typographically led, spare, and trustworthy.
Whitespace is structure, not empty space. Feels like a senior human designer who studied
editorial design and then built tools for educators.

### Three-Part Page Header (Every Page — No Exceptions)
```
UPPERCASE LABEL       ← DM Sans, 11px, #888888, tracking 1.5px
Page Title Here       ← DM Serif Display, 36px
────────────────      ← 1px horizontal rule, #C9BDB8
```

### Cards
- 1px border: `#C9BDB8`
- Border radius: exactly `10px`
- Internal padding: `24px`
- Background: `#FFFFFF`
- **No box shadows**

### Tables
- No outer border
- Row bottom border: 1px `#C9BDB8`
- Row hover background: `#F5EDEA`
- Header: uppercase label style (11px, tracking 1.5px)

### Buttons
- Border radius: `6px` — never pill-shaped
- Height: `38px` default, `34px` small, `30px` extra small
- Primary: `#940002` background, `#E6DDD4` text
- Secondary: white background, `#940002` border, `#940002` text
- Danger: white background, `#991B1B` border, `#991B1B` text
- Disabled: 50% opacity

### Form Inputs
- Background: white
- Border: 1px `#C9BDB8`
- Border radius: `6px`
- Height: `40px`
- Focus: border becomes `#940002`, **no glow, no ring**
- Error: border becomes `#991B1B`
- Placeholder: `#AEAEAE`

### Sidebar Navigation
- Background: white (`#FFFFFF`)
- Width: `240px`
- Nav item: 14px DM Sans, `#666666`
- Active: `border-l-2 solid #940002`, text `#940002`, bg `#F5EDEA`
- Hover: bg `#F5EDEA`, text `#1A0000`
- Version label at bottom: uppercase label style

### Top Navigation Bar
- Height: `56px`
- Background: `#940002`
- Logo "ITI": DM Serif Display, 20px, `#E6DDD4`
- System name: DM Sans, 14px, `#E6DDD4` at 70% opacity
- Role badge pill: border `#E6DDD4` at 30% opacity, text `#E6DDD4` at 80%
- Notification count: white circle, `#940002` text
- Avatar initials: white/15 background, `#E6DDD4` text

---

## 4. ALL 22 SCREENS

### Screen 1 — Login Page
- **Background:** Full page `#E6DDD4`
- **Layout:** Single white card, 420px wide, centered, 40px padding
- **Content:** "ITI" (32px DM Serif, `#940002`) → thin rule → "Sign in to your account"
  (16px DM Sans, `#666666`) → Email field → Password field → Primary button full width
- **Footer note:** "Access is provisioned by your branch administrator." — DM Sans 12px, `#888888`
- No registration link, no social login, no decorative illustration

### Screen 2 — Branch Manager Dashboard
- **Header:** "Branch overview" label → "Good morning, Dr. Hassan"
- **Metrics row (4 cards):** Active Tracks / Enrolled Students / At-Risk Students
  (number in `#92400E`) / Pending Billing Hours
- **Body split (60/40):**
  - Left "Track performance": minimal horizontal bar chart, bars in `#940002` tint
  - Right "Students at risk": borderless table, amber dot indicator per row
- **Bottom full-width:** Billing rollup table — Internal badge (filled `#940002`) /
  External badge (outlined). Bold totals row. "Export to Accounting" secondary button top-right

### Screen 3 — Track Admin Dashboard
- **Header:** "Web Development · Intake 45" label → "Cohort overview"
- **Metrics row (4 cards):** Enrolled / Sessions This Week / Ungraded Submissions / At-Risk Count
- **Three equal columns:**
  - Col 1 "Grade distribution": bar chart 4 buckets (0–59 danger, 60–74, 75–89, 90–100).
    Bars `#940002` fill, floating (no card background behind bars)
  - Col 2 "Attendance this week": 5×3 grid squares. Black = attended, `#E6DDD4` = missed, light gray = no session
  - Col 3 "Grader consistency": 3 horizontal bars (Group 1, 2, 3 averages).
    If one bar is 8+ pts below others → amber flag label "Review"

### Screen 4 — Cohort Roster Table
- **Header:** "Students" label → "Web Dev — Intake 45 roster"
- **Toolbar:** Search input (left) + filter row (Lab Group, Status) + "Export CSV" text link (right)
- **Table columns:** Name / Lab Group pill (G1/G2/G3, `#940002` bg, white text) /
  Attendance (80px progress bar, `#940002` fill, `#E6DDD4` track) / Grade / Tags / Status pill
- **Row click:** Opens 440px right-side drawer. Overlay `#111111` at 30% opacity

### Screen 5 — Student Detail Drawer
- **Header:** × close button (top-right). Student name (DM Serif 24px). Group/cohort label. Rule.
- **Three tabs (plain text):** Overview · Attendance · Grades
  Active tab: 2px bottom border `#940002`
- **Overview tab:** Tag pills + chronological note feed (author, course context, date, body).
  "Add note" textarea + button at bottom
- **Attendance tab:** Borderless table — Date / Session type badge / Status dot+word /
  Scan-in / Scan-out. Absent rows: `border-l-2 #991B1B`
- **Grades tab:** Accordion per course. Sub-table: Component / Raw / Max / Weight / Earned.
  Grand total: DM Serif 22px `#940002` at bottom of drawer

### Screen 6 — Engagement Scheduling Page
- **Header:** "Scheduling" label → "Engagements & sessions"
- **Layout:** Left (week calendar) / Right (220px upcoming list)
- **Calendar:** 7 columns Mon–Sun, time rows 08:00–18:00. Engagement blocks:
  - Lecture: `#940002` fill, white text
  - Lab: `#E6DDD4` fill, `#940002` text, 1px `#940002` border
  - Business session: white fill, dashed 1px `#C9BDB8` border, `#1A0000` text
- **"+ Add engagement" button (primary)** opens 520px modal.
  Fields: Type (radio buttons — all 3 visible), Instructor (searchable select),
  Date range, Session hours, Lab group (checkbox list)

### Screen 7 — Attendance Scanner
- **Background:** Full page `#000000` — completely black, no sidebar, no top nav
- **Center:** 280×280px white QR frame (L-bracket corners only, no fill)
- **Below frame:** "Scan student card" — DM Sans 16px `#E6DDD4`
- **Post-scan state:** Student name in DM Serif 40px `#E6DDD4`.
  "Checked in · 09:14" — DM Sans 18px `#E6DDD4` at 70% opacity
- **Bottom-right:** Small "Exit" text link, `#E6DDD4` at 40% opacity
- This screen must feel like a moment, not a form. Nothing else on screen.

### Screen 8 — Instructor Dashboard
- **Header:** "Lab Group 2 · Web Dev" label → "My sessions"
- **Top card:** "Today's session" — session type, time, rule, then "Start attendance"
  primary button (`#940002`). Extra padding 32px for importance
- **Body two columns:**
  - Left "My students": compact 15-row table — Name / Last attendance dot / Last grade
  - Right "Pending grading": list — student name, deliverable, submitted date,
    days-since chip (amber if 2+ days, red if 5+ days). "Grade" text link right

### Screen 9 — Grade Entry Modal
- **Width:** 480px modal, white surface
- **Header:** Student name (DM Serif 22px) → course + component subtitle
- **Submission link:** Styled anchor, truncated URL, external link icon
- **Input:** Centered 72px DM Sans number input. "out of 70" uppercase label below.
  Live preview: "= 38.3 / 40 course points" updates as user types, DM Sans 14px `#666666`
- **Footer:** Optional note textarea (3 rows) → "Save grade" primary + "Cancel" secondary

### Screen 10 — Student Portal Home
- **Header:** "Welcome back" label → student name (DM Serif H1)
- **Layout split (wider-left / narrower-right):**
  - Left "My announcements": image card with category label + date + DM Serif title +
    body preview + "Read more →" link. Cards are white on `#E6DDD4` background
  - Right top "Attendance Ledger": large number (DM Serif 48px `#940002`) + "/ 250 pts" +
    thin `#940002` progress bar + unexcused absence warning
  - Right bottom "Upcoming Deadlines": compact list with date, assignment name, location

### Screen 11 — Student Grades Page
- **Header:** "Academic record" label → "My grades"
- **Accordion list:** Course name / inline progress bar (80px) / score "74.3 / 100" / status pill
- **Expanded course:** Sub-table — Component / Raw / Max / Weight / Earned. Bold totals row.
- **Page bottom (outside all cards):** horizontal rule → "Grand total" uppercase label →
  "289.3 pts" DM Serif 52px `#940002` → small text "Attendance Ledger 215 pts · Course scores 74.3 pts"

### Screen 12 — Excuse Request Page
- **Header:** "Absences" label → "Excuse requests"
- **Filter tabs:** All · Pending · Approved · Rejected — plain text, active has 2px bottom `#940002`
- **Table:** Date / Session type badge / Status pill / Submitted on
  - Rejected rows: `border-l-2 #991B1B`
  - Approved rows: `border-l-2 #2D6A4F`
- **"+ New Excuse Request"** opens modal. Fields: session selector, reason textarea,
  drag-drop file zone (dashed 1px `#C9BDB8`, "Drop PDF or image here · max 1 MB")

### Screen 13 — Announcements Feed
- **Header:** "Notices" label → "Announcements"
- **Layout:** Vertical stack of articles separated by thin rules. No card borders.
- **Each post:** Avatar initials circle (36px, `#940002` bg, `#E6DDD4` text) / author name /
  role uppercase label / date right-aligned / DM Serif 20px title / 2-line body preview /
  "Read full post →" link. 32px margin between posts
- This looks like a publication, not a list

### Screen 14 — Account Management (Branch Manager)
- **Header:** "Administration" label → "User accounts"
- **Toolbar:** Search / Role filter / Status toggle (Active/Expired)
- **Table columns:** Name / Role badge (monochrome variants) / Track / Expiry Date / Status toggle
  - Branch Manager: filled `#940002` background
  - Track Admin: outlined `#940002` border
  - Instructor: outlined gray border
  - Student: light gray fill
- **"Provision account"** primary button opens modal. Fields: Full name, Email, Role (radio),
  Track assignment (conditional on role), Expiry date

### Screen 15 — Cohort Setup (Branch Manager)
- **Header:** "Administration" label → "Create new cohort"
- **Form (600px centered white card):** Track name / Cohort name (e.g. "Web — Intake 45") /
  Start + End date pickers (side by side) / Track Admin searchable dropdown /
  Info note: "Students and instructors will be added after cohort creation."
  Primary button full width "Create cohort"
- **Below form:** Table of existing cohorts — Track / Cohort Name / Start / End /
  Track Admin / Status badge (Active/Closed) / "View" text link

### Screen 16 — Course Management (Track Admin)
- **Header:** "Web Dev · Intake 45" label → "Courses & grade weights"
- **Table:** Course Name / Lab Weight % / Final Exam Weight % /
  Total (always 100% — validation) / Edit + Delete text links
- **Note below table:** uppercase label style "Weights must sum to 100% per course"
- **"+ Add course"** opens modal. Fields: Course name / Lab weight % / Final exam % /
  Live validator: shows "Must equal 100%" in `#991B1B` or "✓ 100%" in `#2D6A4F`
  Save button disabled until weights are valid

### Screen 17 — Lab Groups Management (Track Admin)
- **Header:** "Web Dev · Intake 45" label → "Lab groups"
- **Three equal column cards** (Group 1, Group 2, Group 3)
- **Card header:** Group name (DM Serif 20px) / Instructor name or "No instructor assigned"
  (`#AEAEAE`) / student count badge
- **Card body:** Scrollable student name list with drag handle icon left
- **Card footer:** "Assign instructor" searchable dropdown
- **Above columns:** note "Drag students between groups to reassign. Changes save automatically."
  + "Auto-distribute" secondary button

### Screen 18 — Excuse Review Page (Track Admin)
- **Header:** "Attendance" label → "Excuse requests"
- **Filter tabs:** All · Pending · Approved · Rejected — active has 2px bottom `#940002`
- **Table:** Student name / Lab Group badge / Session date / Session type badge /
  Reason (1-line truncated with hover tooltip) / Attachment ("View file" link or "—") /
  Status badge / Actions
  - Pending: "Approve" (small outlined `#2D6A4F`) + "Reject" (small outlined `#991B1B`)
  - Resolved: "Override" text link only
- Pending rows: `border-l-2 #92400E`
- "View file" opens lightbox overlay showing the attachment

### Screen 19 — Submission Review (Track Admin / Instructor)
- **Header:** "Grading" label → "Submission tracker"
- **Toolbar:** Course selector / Lab Group selector / Status filter
  (All / Submitted / Missing / Late / Graded)
- **Summary chips top-right:** "12 ungraded" (amber) / "3 missing" (red)
- **Table:** Student name / Lab Group badge / Course / Deliverable / Submitted on /
  Days since (chip: amber 2+ days, red 5+ days) / Submission type icon / Grade / "Grade" link
- Clicking "Grade" opens Screen 9 Grade Entry Modal

### Screen 20 — Billing Detail Page (Branch Manager)
- **Header:** "Finance" label → "Billing & delivered hours"
- **Toolbar:** Cohort selector / Date range / Type toggle (All / Internal / External)
- **Table:** Instructor name / Type badge / Track / Engagement type / Sessions delivered /
  Hours per session / Total hours / Rate / Total amount. Bold totals footer row.
- **Two summary cards (side by side):**
  - Left: "Internal instructors" — total hours + total cost
  - Right: "External instructors" — total hours + total cost
- **Bottom:** "Export to central accounting" full-width primary button.
  Note below: "Exported on: [date/time of last export]"

### Screen 21 — Announcements Editor (Track Admin / Instructor)
- **Header:** "Communications" label → "Post announcement"
- **Editor card:**
  - Title input: large DM Serif style, 24px placeholder "Announcement title..."
  - Body: minimal rich-text area — only B / I / list icon buttons. Nothing else.
  - Audience note (read-only info box): "This will be posted to: Web Dev — Intake 45 students."
    Instructors see: "Visible during your engagement window only."
  - "Post announcement" primary button
- **Below editor:** Table of past announcements — Title / Posted on / Views / Draft badge /
  Edit + Delete actions

### Screen 22 — Student Progress Page (Student)
- **Header:** "My journey" label → "Progress over time"
- **Top section "Score over time":** Line chart — X axis = course name, Y axis = 0–100.
  Line `#940002`, filled circles on data points.
  Dashed horizontal line at 60 labeled "Pass threshold" (uppercase label style)
- **Middle section (two cards side by side):**
  - Left "Attendance trend": bar chart — X = weeks. Black fill = attended, `#E6DDD4` = missed
  - Right "Ledger history": step-line chart starting at 250, steps down on deductions.
    `#940002` line. Dashed threshold line at 150 labeled "At-risk threshold"
- **Bottom section "Course breakdown":** Horizontal bar list.
  Course name left / thin `#940002` progress bar / score right.
  Final row: "Attendance Ledger" bar out of 250.
- **Page footer (outside cards):** "Grand total to date" uppercase label →
  Grand total in DM Serif 52px `#940002`

---

## 5. COMPONENT LIBRARY

### Buttons

| Variant | Background | Text | Border |
| :--- | :--- | :--- | :--- |
| Primary | `#940002` | `#E6DDD4` | none |
| Secondary | `#FFFFFF` | `#940002` | 1px `#940002` |
| Danger | `#FFFFFF` | `#991B1B` | 1px `#991B1B` |
| Disabled | any at 50% opacity | — | — |

Heights: `38px` default / `34px` small / `30px` extra small. Radius: `6px`.

### Status Badge Pills

| Label | Background | Text |
| :--- | :--- | :--- |
| Present | `#D1FAE5` | `#2D6A4F` |
| Absent | `#FEE2E2` | `#991B1B` |
| Excused | `#FEF3C7` | `#92400E` |
| Pending | `#DBEAFE` | `#1E3A5F` |
| At-Risk | `#FEF3C7` | `#92400E` + warning icon |

### Role Badges

| Role | Style |
| :--- | :--- |
| Branch Manager | `#940002` fill, `#E6DDD4` text |
| Track Admin | outlined `#940002` border, `#940002` text |
| Instructor | outlined `#888888` border, `#666666` text |
| Student | `#F5EDEA` fill, `#666666` text |

### Progress Bar
- Fill: `#940002`
- Track: `#E6DDD4`
- Height: `6px`, fully rounded
- Threshold: fill changes to `#92400E` when below 50%

### Attendance Ledger Card States

| State | Balance | Bar Color |
| :--- | :--- | :--- |
| Healthy | 200–250 | `#940002` |
| Warning | 150–199 | `#92400E` |
| Critical | below 150 | `#991B1B` |

### Empty State
- Centered layout
- Title: DM Serif 20px
- Description: DM Sans 14px `#666666`
- Optional primary button below

### Toast Notifications (bottom-right, 320px)
- Success: `#2D6A4F` left border
- Error: `#991B1B` left border
- Info: `#1E3A5F` left border
- Duration: 3 seconds then fade

### Sidebar Nav Item States

| State | Text | Background | Left border |
| :--- | :--- | :--- | :--- |
| Default | `#666666` | transparent | 2px transparent |
| Hover | `#1A0000` | `#F5EDEA` | 2px transparent |
| Active | `#940002` | `#F5EDEA` | 2px `#940002` |

---

## 6. LAYOUT SYSTEM

| Token | Value | Usage |
| :--- | :--- | :--- |
| Top bar height | `56px` | Fixed top navigation |
| Sidebar width | `240px` | Left navigation |
| Drawer width | `440px` | Student detail drawer |
| Content max-width | `1100px` | Main content area |
| Card padding | `24px` | All cards |
| Card radius | `10px` | All cards and modals |
| Input height | `40px` | All form fields |
| Button height | `38px` | Default button |

---

## 7. FINAL DESIGN PRINCIPLES (Non-Negotiable)

1. If it looks like a Tailwind UI template, redesign it.
2. The three-part header (label + DM Serif title + rule) exists on every page. No exceptions.
3. White cards on `#E6DDD4` background is the only surface pattern.
4. Whitespace is a design element. Do not fill space because it is empty.
5. DM Serif Display must appear on every screen. If it does not, the screen has no identity.
6. The scanner screen (Screen 7) must be completely black. It is intentionally opposite to all other screens.
7. Buttons are never rounded beyond 6px. No pill-shaped buttons anywhere.
8. No gradients. No shadows. No blur. No decoration that does not carry information.
9. When in doubt, add more vertical space between elements, not less.
10. The grand total on the student grades page must be the most visually impressive element in the entire application.
