# What's the seatuation?

A Flask demo for generating library seat / study-area allocation schedules using a regret-based greedy algorithm.

The app lets you build input data with dynamic forms instead of hand-writing JSON. You can:

- add or remove study areas;
- add or remove students;
- add multiple study time slots for each student;
- edit comfort scores in an auto-generated matrix.

It then generates:

- an allocation table;
- total study effectiveness;
- capacity / occupancy checks;
- unassigned requests;
- a visual daily timeline with colored blocks for different areas.

## Quick start from GitHub

If you are not familiar with Git, the easiest way is to download the project as a ZIP file.

1. Open the GitHub repository page.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Unzip the downloaded folder.
5. Open a terminal / PowerShell inside the unzipped project folder.
6. Install dependencies:

```bash
py -m pip install -r requirements.txt
```

If `py` does not work, try:

```bash
python -m pip install -r requirements.txt
```

7. Start the Flask app:

```bash
py app.py
```

Or:

```bash
python app.py
```

8. Open this address in your browser:

```text
http://127.0.0.1:5000
```

You should then see the demo page.

To stop the app, go back to the terminal and press:

```text
Ctrl + C
```

## Requirements

To run this project locally, you need:

- Python 3 installed;
- pip available;
- internet access for installing Flask the first time.

You do not need Git if you use **Download ZIP**.

## Run locally with Git

If you have Git installed, you can clone the repository:

```bash
git clone https://github.com/carbonyL-tech/whats-the-seatuation.git
cd whats-the-seatuation
py -m pip install -r requirements.txt
py app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## How to use the demo

1. Click **Load Instance 2 Sample** to populate the page with example data.
2. Edit study areas, student names, capacities, comfort scores, and time slots.
3. Click **Generate Schedule**.
4. Read the generated schedule, capacity checks, unassigned requests, and timeline on the right.

## Algorithm idea

Each student-provided study time slot is treated as an indivisible request. For each request, the backend computes:

```text
Regret = BestComfort - SecondBestComfort
Priority = Regret × Duration
```

Requests with higher priority are assigned first. For each request, the algorithm tries areas in decreasing comfort order and chooses the first area that does not violate capacity during the whole time slot.

This is a greedy heuristic, so it is designed to produce a reasonable feasible schedule, but it does not guarantee a globally optimal solution.

## Input behavior

The current UI uses dynamic form editors rather than raw JSON:

- areas are edited as rows with name and capacity;
- students are edited as cards with one or more time slots;
- comfort scores are edited in a matrix that updates automatically when areas or students change.

Time slots use `HH:MM` format, for example:

- `09:00`
- `10:30`
- `14:45`

Each student-provided time slot is assigned to exactly one study area for its whole duration.

## Common issues

### `py` is not recognized

Try using `python` instead:

```bash
python app.py
```

### Flask is missing

Run:

```bash
py -m pip install -r requirements.txt
```

or:

```bash
python -m pip install -r requirements.txt
```

### The page does not open

Make sure the terminal shows that the Flask app is running. The local URL should be:

```text
http://127.0.0.1:5000
```

### I changed the input but got an error

Check that every student has a comfort score for every area listed in the area capacity input.

For example, if the area input contains `Area 4`, then every student in the comfort matrix must also have an `Area 4` score.
