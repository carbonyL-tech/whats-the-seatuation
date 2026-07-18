from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


def time_to_minutes(value):
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


def minutes_to_time(value):
    hours = value // 60
    minutes = value % 60
    return f"{hours:02d}:{minutes:02d}"


def create_requests(time_slots):
    requests = []
    for student, slots in time_slots.items():
        for index, slot in enumerate(slots, start=1):
            if len(slot) != 2:
                raise ValueError(f"Invalid time slot for {student}: {slot}")
            start, end = slot
            start_minutes = time_to_minutes(start)
            end_minutes = time_to_minutes(end)
            if end_minutes <= start_minutes:
                raise ValueError(f"End time must be later than start time for {student}: {slot}")
            requests.append(
                {
                    "id": f"{student}#{index}",
                    "student": student,
                    "slot_index": index,
                    "start": start,
                    "end": end,
                    "start_minutes": start_minutes,
                    "end_minutes": end_minutes,
                    "duration": end_minutes - start_minutes,
                    "input_order": len(requests),
                }
            )
    return requests


def create_intervals(requests):
    boundaries = sorted(
        {
            boundary
            for req in requests
            for boundary in (req["start_minutes"], req["end_minutes"])
        }
    )
    return list(zip(boundaries, boundaries[1:]))


def covered_intervals(req, intervals):
    return [
        interval
        for interval in intervals
        if interval[0] >= req["start_minutes"] and interval[1] <= req["end_minutes"]
    ]


def compute_priority(req, areas, comfort):
    student = req["student"]
    if student not in comfort:
        raise ValueError(f"Missing comfort scores for {student}")

    scores = []
    for area in areas:
        if area not in comfort[student]:
            raise ValueError(f"Missing comfort score for {student} in {area}")
        scores.append(float(comfort[student][area]))

    sorted_scores = sorted(scores, reverse=True)
    best = sorted_scores[0]
    second_best = sorted_scores[1] if len(sorted_scores) > 1 else 0
    regret = best - second_best

    req["best"] = best
    req["second_best"] = second_best
    req["regret"] = regret
    req["priority"] = regret * req["duration"]


def can_assign(req, area, occupancy, capacities, intervals):
    for interval in covered_intervals(req, intervals):
        if occupancy[area][interval] + 1 > capacities[area]:
            return False
    return True


def apply_assignment(req, area, occupancy, intervals):
    for interval in covered_intervals(req, intervals):
        occupancy[area][interval] += 1


def allocate_study_areas(capacities, comfort, time_slots):
    areas = list(capacities.keys())
    requests = create_requests(time_slots)
    if not requests:
        return {"allocations": [], "unassigned": [], "total_effectiveness": 0, "intervals": []}

    intervals = create_intervals(requests)
    occupancy = {
        area: {interval: 0 for interval in intervals}
        for area in areas
    }

    for req in requests:
        compute_priority(req, areas, comfort)

    requests.sort(
        key=lambda req: (
            -req["priority"],
            req["regret"],
            -req["duration"],
            req["input_order"],
        )
    )

    allocations = []
    unassigned = []
    total_effectiveness = 0

    for req in requests:
        student = req["student"]
        candidate_areas = sorted(
            areas,
            key=lambda area: (-float(comfort[student][area]), area),
        )

        assigned_area = None
        for area in candidate_areas:
            if can_assign(req, area, occupancy, capacities, intervals):
                assigned_area = area
                apply_assignment(req, area, occupancy, intervals)
                break

        if assigned_area is None:
            unassigned.append(
                {
                    "student": student,
                    "slot": req["slot_index"],
                    "start": req["start"],
                    "end": req["end"],
                    "duration": req["duration"],
                    "regret": req["regret"],
                    "priority": req["priority"],
                }
            )
            continue

        assigned_comfort = float(comfort[student][assigned_area])
        effectiveness = assigned_comfort * req["duration"]
        total_effectiveness += effectiveness
        allocations.append(
            {
                "student": student,
                "slot": req["slot_index"],
                "start": req["start"],
                "end": req["end"],
                "area": assigned_area,
                "comfort": assigned_comfort,
                "duration": req["duration"],
                "effectiveness": effectiveness,
                "regret": req["regret"],
                "priority": req["priority"],
            }
        )

    allocations.sort(key=lambda item: (item["start"], item["student"], item["slot"]))

    interval_rows = []
    for start, end in intervals:
        row = {
            "interval": f"{minutes_to_time(start)}-{minutes_to_time(end)}",
            "areas": {area: occupancy[area][(start, end)] for area in areas},
        }
        interval_rows.append(row)

    return {
        "allocations": allocations,
        "unassigned": unassigned,
        "total_effectiveness": total_effectiveness,
        "intervals": interval_rows,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/allocate", methods=["POST"])
def allocate():
    try:
        data = request.get_json(force=True)
        capacities = data.get("areas", {})
        comfort = data.get("comfort", {})
        time_slots = data.get("time_slots", {})

        if not capacities:
            raise ValueError("Areas/capacities cannot be empty")
        if not comfort:
            raise ValueError("Comfort table cannot be empty")
        if not time_slots:
            raise ValueError("Time slots cannot be empty")

        capacities = {area: int(capacity) for area, capacity in capacities.items()}
        if any(capacity <= 0 for capacity in capacities.values()):
            raise ValueError("All area capacities must be positive")

        result = allocate_study_areas(capacities, comfort, time_slots)
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(debug=True)
