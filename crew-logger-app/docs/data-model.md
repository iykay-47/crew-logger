# Data Model

## Job Entry
- id — unique identifier
- date — date the job was performed
- job_number — identifier for the job
- description — what the job involved
- status — draft / submitted / pending_confirmation / confirmed / disputed / expired
- submitted_by — employee id of the person who created the entry
- created_at — timestamp of creation
- updated_at — timestamp of last update

## Participation
- id — unique identifier
- job_id — links to the job entry
- employee_id — links to the user
- hours — hours this person worked on this job
- miles — miles this person drove for this job
- start_time — when this person started
- end_time — when this person ended

## User
- id — unique identifier
- username — unique, used for login
- employee_pin — unique, also used for login
- password_hash — hashed password, never stored in plain text
- display_name — shown in the app
- created_at — timestamp of creation
