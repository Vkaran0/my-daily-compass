# My Daily Compass

Build a modern, responsive full-stack **Personal Productivity & Daily Task Tracker Web App**.

The app should be designed for a college student who follows a strict daily schedule and wants to track tasks, reminders, notes, productivity, and performance over daily, weekly, monthly, and yearly periods.

## 1. Overall UI/UX

Create a premium, clean, modern productivity-dashboard interface.

Design requirements:
- Responsive on desktop, tablet, and mobile
- Sidebar navigation on desktop
- Bottom navigation or collapsible sidebar on mobile
- Light/Dark mode
- Smooth animations and transitions
- Clean cards, charts, progress indicators and calendar views
- Avoid unnecessary visual clutter
- The interface should feel like a real production SaaS productivity application, not an AI-generated demo

Main navigation:

1. Dashboard
2. Tasks
3. Calendar
4. Analytics
5. Notes
6. Settings

---

## 2. Dashboard

Create a dashboard showing today's productivity.

At the top:

- Current date
- Greeting
- Today's overall completion percentage
- Current productivity streak

Example:

"Thursday, October 8"
"Good evening!"
"Today's Progress: 78%"

Show summary cards:

- Total Tasks
- Completed
- Pending
- Missed
- Completion Rate
- Total Planned Time
- Total Completed Time

Add a circular progress indicator for today's completion percentage.

Add a "Today's Schedule" timeline showing:

- Task name
- Category
- Start time
- End time
- Status
- Priority
- Reminder

Use different visual states for:
- Completed
- In Progress
- Upcoming
- Missed

Also show:

### Next Task

Display the next scheduled task with:
- Task name
- Start time
- Countdown
- Category
- Priority

### Today's Notes

Show today's recently added notes with an option to add a new note.

---

## 3. Task Management

Create a complete task management system.

Users should be able to:

- Create task
- Edit task
- Delete task
- Duplicate task
- Mark complete
- Mark incomplete
- Skip task
- Reschedule task

Task fields:

- Task title
- Description
- Date
- Start time
- End time
- Category
- Priority
- Reminder
- Repeat schedule
- Notes
- Status

Categories should include:

- DSA
- Academics
- Web Development
- Projects
- Internship
- AI / AI Agents
- Exercise
- Personal
- Other

Priority:

- Low
- Medium
- High

Status:

- Upcoming
- In Progress
- Completed
- Missed
- Skipped

---

## 4. Recurring Tasks

Allow users to create recurring tasks.

Options:

- Every day
- Weekdays
- Weekends
- Specific days
- Weekly
- Monthly
- Custom recurrence

Example:

"DSA Practice"
Monday–Friday
5:15 PM – 8:15 PM

The system should automatically generate the task for each applicable date.

---

## 5. Reminder & Notification System

Implement browser notifications/reminders.

Users should be able to choose:

- 5 minutes before
- 10 minutes before
- 15 minutes before
- 30 minutes before
- Custom reminder time

Notifications should include:

### Before task

"DSA Practice starts in 15 minutes."

### At task start

"Your DSA Practice session has started."

### Near task end

"Your DSA Practice session ends in 15 minutes."

### After missed task

"You missed your DSA Practice task. What would you like to do?"

Provide actions:

- Complete
- Reschedule
- Skip

Ask for browser notification permission only when necessary and provide a clear Settings option to enable/disable notifications.

---

## 6. Automatic Task Completion Analysis

At the end of every day, calculate:

Completion Rate = Completed Tasks / Planned Tasks × 100

Also calculate time-based completion:

Completed Planned Minutes / Total Planned Minutes × 100

Show both metrics separately.

Example:

Tasks:
8 / 10 completed
Completion Rate: 80%

Time:
420 / 510 minutes
Time Completion: 82.3%

Do NOT simply count skipped tasks as completed.

---

## 7. Daily Analytics

Create a Daily Analytics section showing:

- Completion percentage
- Planned tasks
- Completed tasks
- Missed tasks
- Skipped tasks
- Planned time
- Actual/completed time
- Category-wise performance
- Most productive category
- Least productive category

Example:

DSA — 92%
Academics — 81%
Projects — 74%
Exercise — 65%

Add a short automatic insight:

"You completed 90% of your DSA tasks today, but missed one project session."

---

## 8. Weekly Analytics

Create a weekly analytics dashboard.

Show a graph for:

Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday

Each day should display its completion percentage.

Example:

Mon — 80%
Tue — 65%
Wed — 90%
Thu — 75%
Fri — 100%
Sat — 82%
Sun — 70%

Also show:

- Weekly average
- Total completed tasks
- Total missed tasks
- Total planned hours
- Total completed hours
- Best day
- Worst day
- Most productive category
- Productivity streak

Use attractive interactive charts.

---

## 9. Monthly Analytics

Create monthly analytics.

Show:

- Monthly average completion percentage
- Daily performance chart
- Calendar heatmap
- Category performance
- Total tasks
- Completed tasks
- Missed tasks
- Total productive hours
- Best day
- Worst day
- Longest streak

Allow users to select any month and view its data.

---

## 10. Yearly Analytics

Create a yearly productivity dashboard.

Show January–December performance.

For each month display:

- Completion percentage
- Completed tasks
- Missed tasks
- Productive hours

Add:

- Yearly average
- Best month
- Worst month
- Total completed tasks
- Total productive hours
- Longest streak

Use a clean yearly bar/line chart.

---

## 11. Calendar

Create a full calendar view.

Allow:

- Month view
- Week view
- Day view

Tasks should appear directly on the calendar.

Use different visual indicators for:
- Completed
- Pending
- Missed
- High priority

Clicking a task should open its details/edit modal.

---

## 12. Notes System

Create a dedicated Notes section.

Users can:

- Create notes
- Edit notes
- Delete notes
- Search notes
- Pin important notes
- Add notes to specific tasks
- Add daily notes

Each note can contain:

- Title
- Content
- Date
- Category
- Related task

Example:

Title:
"DSA Revision"

Content:
"Binary Search में lower_bound और upper_bound revise करना है."

---

## 13. Productivity Streak

Implement streak tracking.

Show:

🔥 Current Streak: 12 Days

🏆 Best Streak: 27 Days

Create achievements such as:

- 7-day streak
- 30-day streak
- 100 completed tasks
- 90%+ weekly performance
- 100% day

---

## 14. Planned vs Actual Time

This is an important feature.

For every task compare:

Planned:
5:15 PM – 8:15 PM

Actual:
5:30 PM – 7:50 PM

Show:

Planned Duration: 180 min
Actual Duration: 140 min
Time Efficiency: 77.8%

Use this data in analytics.

---

## 15. Daily Schedule Templates

Allow users to save a daily routine/template.

Example:

### Weekday Template

5:30 AM — Wake Up
5:45 AM — Exercise
6:15 AM — Academic Subject
8:45 AM — College
4:45 PM — Return to Room
5:15 PM — DSA
8:15 PM — Dinner
9:30 PM — Academic Subject
11:00 PM — Web Development / Internship
12:00 AM — Sleep

Users should be able to create, edit and apply templates.

---

## 16. Search & Filters

Tasks should be searchable.

Filters:

- Date
- Category
- Priority
- Status
- Completed
- Missed
- Recurring

Notes should also have search functionality.

---

## 17. Settings

Include:

- Profile
- Theme
- Notification settings
- Default reminder
- Time format: 12/24 hour
- Week starting day
- Categories
- Data export
- Data import
- Reset data

Add confirmation dialogs before destructive actions.

---

## 18. Data Persistence

Do NOT use only local component state.

Persist all important data in a database.

Recommended stack:

Frontend:
React + TypeScript

Styling:
Tailwind CSS

Backend:
Node.js + Express

Database:
PostgreSQL / Supabase

Charts:
Recharts or Chart.js

Authentication:
Email/password authentication

The database should store:

- Users
- Tasks
- Recurring tasks
- Task completion history
- Notifications
- Notes
- Daily statistics
- Categories
- Productivity streaks
- User settings

---

## 19. Database Design

Create proper relational tables.

Suggested structure:

users
tasks
task_completions
recurring_tasks
notes
categories
daily_statistics
notifications
user_settings

Use foreign keys and timestamps.

A completed task should retain its historical completion data even if the task is later edited.

---

## 20. Important Analytics Rule

Never overwrite historical productivity data.

For example, if a user completes a task today, save today's completion record separately.

This allows:

Daily → Weekly → Monthly → Yearly analytics

to remain accurate even when recurring tasks are edited later.

---

## 21. Dashboard Automatic Insights

Generate useful insights from the user's actual data.

Examples:

"You completed 86% of your planned tasks this week."

"Your most productive day was Wednesday with 94% completion."

"You frequently miss tasks scheduled after 11 PM."

"Your DSA completion rate increased by 12% compared with last week."

Do not generate fake insights when insufficient data exists.

---

## 22. Empty States

Create useful empty states.

Example:

"No tasks scheduled for today."

"No analytics available yet. Complete a few tasks to see your productivity trends."

"No notes yet. Create your first note."

---

## 23. Demo Data

Initially populate the application with realistic sample data so the dashboard and charts are immediately visible.

Clearly label demo/sample data and provide a way to remove it.

---

## 24. Important UX Requirement

The app should make adding a task extremely fast.

Add a prominent:

"+ Add Task"

button.

The user should be able to create a basic task in only a few clicks.

Also provide a quick-add format such as:

"DSA Practice — Today — 5:15 PM — 3 hours"

and parse it into the task form if feasible.

---

## 25. Responsive Design

Desktop:
- Sidebar
- Large dashboard
- Multiple analytics cards
- Charts

Mobile:
- Bottom navigation
- Compact cards
- Swipe-friendly task lists
- Mobile-friendly task creation
- Mobile-friendly calendar

Make sure no chart or table overflows on small screens.

---

## 26. Production Quality

Do not create a static mockup.

Build actual working functionality:

- Authentication
- CRUD operations
- Database persistence
- Recurring tasks
- Task completion tracking
- Notifications
- Analytics calculations
- Charts
- Notes
- Calendar
- Settings

Handle:
- Loading states
- Error states
- Empty states
- Form validation
- API errors
- Notification permission denial
- Invalid dates/times
- Duplicate tasks

Use reusable components and clean project structure.

The final result should feel like a polished personal productivity application that can actually be used every day.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe7c0579-93c8-4d39-b241-dd544df1f52b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
