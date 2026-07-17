# What's the seatuation?

A Flask demo for generating library seat / study-area allocation schedules using a regret-based greedy algorithm.

The app takes study area capacities, student comfort scores, and student expected study time slots as input. It then generates:

- an allocation table;
- total study effectiveness;
- capacity / occupancy checks;
- unassigned requests;
- a visual daily timeline with colored blocks for different areas.

## Algorithm idea

Each student-provided study time slot is treated as an indivisible request. For each request, the backend computes:

```text
Regret = BestComfort - SecondBestComfort
Priority = Regret × Duration
```

Requests with higher priority are assigned first. For each request, the algorithm tries areas in decreasing comfort order and chooses the first area that does not violate capacity during the whole time slot.

## Run locally

Install dependencies:

```bash
py -m pip install -r requirements.txt
```

Start the Flask app:

```bash
py app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Input format

The page accepts three JSON inputs:

- study areas and capacities;
- comfort scores for each student-area pair;
- student expected study time slots.

Example area input:

```json
{
  "Area 1": 2,
  "Area 2": 2,
  "Area 3": 2,
  "Area 4": 1
}
```

Each student-provided time slot is assigned to exactly one study area for its whole duration.
