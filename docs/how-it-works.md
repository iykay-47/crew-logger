# How It Works

A plain-language walkthrough of what this system does and how information moves
through it. No code. Every term is explained the first time it appears.

---

## What the app is for

A train crew of one to three people finishes a run. Someone needs to record what
happened — which train, from where to where, what time they came on duty, what
time they went off, how far they went. That record then needs to be checked by
the other person who was there, because a record only one person has seen is
just one person's memory.

This app does that: one crew member logs the run, their crewmate confirms it.
The resulting numbers feed internal estimates. They are **not** payroll and not
billing.

---

## The people

A **crew** is one to three people working the same run. Everyone on the crew
sees the same record. There is no manager role, no admin approving things — the
crew checks its own work.

---

## The journey of one record

Follow a single run from start to finish.

**1. The run happens.** A crew works train `A44251-22` from station 81918 to
station 81716.

**2. Someone logs it.** One crew member opens the app and enters what happened.
The system creates **one record** for that run.

**3. That record is shared.** This is the central idea. The record does not
belong to the person who created it. Both crew members see *the same record* —
not two copies. Either can edit it.

Why it matters: if each person kept their own copy, the two copies could
disagree — one says 112 miles, the other says 115 — and nothing could say which
was right. One shared record makes that disagreement impossible.

**4. The crewmate is notified and checks it.** They either confirm it's correct,
or they change it.

**5. A change restarts the check.** If the crewmate edits something, that edit
goes back to the first person to confirm. Confirmation applies to *the current
version*, not to the record forever. Every edit needs a fresh confirmation.

There's no separate "dispute" button. Disagreeing means editing the record to
what you believe is right — the other person then sees that change and responds.
Disagreement is expressed by correcting, not by filing a complaint.

**6. Once confirmed, it locks.** A confirmed record can't be quietly changed.
Reopening it is a deliberate, recorded act.

**Every single change is logged** — who made it, when, what the value was before
and after. Nothing changes invisibly.

> **Note:** steps 4–6 are *designed but not built yet*. See "What exists today."

---

## Where the information lives

Information is stored in **tables** — think spreadsheets, where each row is one
thing and each column is one piece of information about it. There are four.

**`jobs`** — one row per run. Everything about the run itself: the train, the
stations, the times, the miles. This is the shared record both crew members see.

**`participation`** — one row per *person* per run. This is how the system knows
who was on the crew: everyone with a row pointing at the same run was on it
together. These rows are deliberately nearly empty, holding only that person's
own **claims** (anything they're individually claiming for that run). Everything
else about the run is shared, so it lives in `jobs`, stored once.

**`job_edits`** — one row per change ever made. The history.

**`users`** — the people.

### A real record, read out loud

Here is an actual row from the data:

| Field | Value | Meaning |
|---|---|---|
| `record_date` | 2026-08-22 | the day |
| `train_id` | A44251-22 | which train/run |
| `origin_station` | 81918 | started here |
| `final_station` | 81716 | ended here |
| `on_duty` | 15:15 | went on duty |
| `start_time` | 15:30 | train started moving |
| `initial_os` | 17:10 | first "OS" — a position report |
| `final_os` | 21:50 | last position report |
| `off_duty` | 22:45 | went off duty |
| `run_miles` | 112.72 | distance |
| `cars` | 15 | cars on the train |
| `work_minutes` | 450 | **calculated** — 7 hours 30 minutes |

Note `on_duty` (15:15) and `start_time` (15:30) are 15 minutes apart. They are
genuinely different moments — when the crew came on duty, versus when the train
began moving. An earlier version of the plans assumed these were the same thing.
Checking the real data showed they differ on 64 of the 74 historic records, so
they're stored as two separate pieces of information. Had we not checked, one of
them would have been thrown away.

### Why the computer calculates the hours

`work_minutes` above is not typed in by anyone. The database calculates it from
`on_duty` and `off_duty` every time the record changes, and it **refuses** to
accept a value from the app.

The reason: a typed-in total can disagree with the times it supposedly came
from. Someone corrects an off-duty time but forgets to update the total, and now
the record contradicts itself with no way to tell which is wrong. A calculated
value can never drift from its inputs.

This also handles runs crossing midnight. One real record goes on duty at 20:45
and off duty at 02:30 the next morning — the system correctly computes 345
minutes rather than a negative number.

The general rule: **store facts, calculate conclusions.** Facts are stable;
conclusions change as you learn more.

---

## The 74 historic records

The database already holds 74 real past runs, loaded once from a file called
`records.csv`. They came from **PSTS562**, a screen in the railroad's existing
terminal system — historical data extracted so this app starts with real
information rather than an empty database.

Two things worth knowing:

- **The source file is never modified.** It is mounted read-only, meaning the
  system is physically prevented from writing to it. It's the original evidence;
  it stays exactly as it was.
- **The import can be run again safely.** It checks what's already there and
  skips it — run it five times, still 74 records.

All 74 belong to one employee and are marked as already confirmed (they're
historical fact, not pending anyone's review).

---

## How a request travels

When someone taps something in the app, here's the path.

The phone never talks to the database. It talks to the **API** — a program that
sits in front of the database, receives requests, applies the rules, and answers.
"API" just means a defined set of things a program will do when asked. Each
specific request it accepts is an **endpoint** (for example, "give me all
entries").

Inside the API, the work is split into three layers. A useful analogy is a
doctor's office:

**`routes/` — the receptionist.** Takes the request, checks the form is filled
in properly (is the date a real date?), and passes it along. Deliberately does no
real thinking.

**`services/` — the doctor.** All actual decisions live here: is this date in the
future? Is off-duty after on-duty? Does this person exist? Record what changed.
This is where the rules are.

**`models/` — the filing system.** Defines the shape of the records — what a job
record contains, what a person record contains.

Keeping these separate means the rules live in exactly one place. If confirming
a record should also send a notification, that goes in `services/`, and it then
applies no matter how the request arrived — phone, web, or script.

So the full path is:

```
phone → API receptionist (routes) → doctor (services) → filing system (models)
      → database → and back out the same way
```

The database also enforces its own rules independently — as a last line of
defence, in case a bug in the app ever lets something through.

---

## What exists today

**Built and working:**
- All four tables
- The 74 historic records, loaded
- Creating, viewing, updating, and deleting job records
- Adding crew members to a run
- Full change logging — every edit records who, when, and what
- Validation: no future dates, off-duty must be after on-duty, no negative miles
- 12 automated tests

**Not built yet:**
- **Logging in.** There are no passwords or accounts in use — the app currently
  identifies a person by them stating who they are. Anyone reaching the API can
  do anything.
- **The confirmation loop.** Steps 4–6 of the journey above are designed but not
  implemented. Nothing notifies a crewmate, nothing confirms, nothing locks.
- **Photos, offline use, reading data off a photographed ticket** — all planned
  for later stages.

**A known gap:** if two crew members each log the same run today, the system
creates two separate records instead of recognising it as one shared run. There
is no matching logic yet. It's written down and will be handled when the
confirmation loop is built.

---

## Glossary

**Railroad terms**

| Term | Meaning |
|---|---|
| **train_id** | Identifies a run, e.g. `A44251-22`. Reused on different dates — the same designator in January and March are unrelated runs |
| **on duty / off duty** | When the crew's working time started and ended |
| **OS** | A position report — where the train was at a given time |
| **claims** | What an individual crew member is claiming for that run; the only thing recorded per-person rather than shared |
| **timeslip** | The railroad's own record of a run |
| **consist** | What the train is made of — number of cars, length, locomotives |
| **PSTS562** | The terminal screen the 74 historic records came from |

**Technical terms**

| Term | Meaning |
|---|---|
| **API** | The program sitting between the app and the database; receives requests, applies rules, answers |
| **endpoint** | One specific request the API accepts |
| **database** | Where information is permanently stored |
| **table** | One kind of thing being stored — like a spreadsheet; rows are things, columns are details |
| **row / record** | One single thing: one run, one person |
| **migration** | A recorded, repeatable change to the database's structure, so it can be rebuilt identically anywhere |
| **container** | A packaged program bundled with everything it needs to run, so it behaves the same on any machine |
| **JSON** | A common text format for sending structured information between programs |
| **validation** | Checking information is sensible before storing it |
| **read-only** | Can be looked at but not changed |
