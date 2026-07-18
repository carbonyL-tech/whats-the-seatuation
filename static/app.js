const sample = {
  areas: [
    { id: 'area-1', name: 'Area 1', capacity: 2 },
    { id: 'area-2', name: 'Area 2', capacity: 2 },
    { id: 'area-3', name: 'Area 3', capacity: 2 }
  ],
  students: [
    {
      id: 'student-1',
      name: 'Student 1',
      timeSlots: [{ start: '09:00', end: '11:00' }, { start: '14:00', end: '16:00' }],
      comfort: { 'Area 1': 10, 'Area 2': 9, 'Area 3': 2 }
    },
    {
      id: 'student-2',
      name: 'Student 2',
      timeSlots: [{ start: '10:00', end: '12:00' }, { start: '13:30', end: '15:30' }],
      comfort: { 'Area 1': 9, 'Area 2': 3, 'Area 3': 9 }
    },
    {
      id: 'student-3',
      name: 'Student 3',
      timeSlots: [{ start: '14:00', end: '17:00' }],
      comfort: { 'Area 1': 10, 'Area 2': 1, 'Area 3': 1 }
    },
    {
      id: 'student-4',
      name: 'Student 4',
      timeSlots: [{ start: '08:30', end: '10:30' }, { start: '14:30', end: '16:30' }],
      comfort: { 'Area 1': 9, 'Area 2': 2, 'Area 3': 10 }
    },
    {
      id: 'student-5',
      name: 'Student 5',
      timeSlots: [{ start: '13:00', end: '15:00' }, { start: '16:30', end: '18:30' }],
      comfort: { 'Area 1': 10, 'Area 2': 9, 'Area 3': 2 }
    },
    {
      id: 'student-6',
      name: 'Student 6',
      timeSlots: [{ start: '09:30', end: '11:30' }, { start: '14:00', end: '16:00' }],
      comfort: { 'Area 1': 9, 'Area 2': 3, 'Area 3': 9 }
    },
    {
      id: 'student-7',
      name: 'Student 7',
      timeSlots: [{ start: '15:00', end: '18:00' }],
      comfort: { 'Area 1': 10, 'Area 2': 8, 'Area 3': 3 }
    }
  ]
};

let state = structuredClone(sample);
let nextAreaId = 4;
let nextStudentId = 8;

const areasEditor = document.getElementById('areasEditor');
const studentsEditor = document.getElementById('studentsEditor');
const comfortEditor = document.getElementById('comfortEditor');
const errorBox = document.getElementById('errorBox');
const totalEffectiveness = document.getElementById('totalEffectiveness');
const assignedCount = document.getElementById('assignedCount');
const unassignedCount = document.getElementById('unassignedCount');
const runStatus = document.getElementById('runStatus');
const allocationBody = document.querySelector('#allocationTable tbody');
const unassignedBody = document.querySelector('#unassignedTable tbody');
const occupancyBox = document.getElementById('occupancyBox');
const timelineBox = document.getElementById('timelineBox');
const timelineLegend = document.getElementById('timelineLegend');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(2);
}

function areaClass(area) {
  const match = area.match(/\d+/);
  const number = match ? Number(match[0]) : 0;
  return `area-${((number - 1) % 6) + 1}`;
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60).toString().padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildTimelineTicks(start, end) {
  const first = Math.floor(start / 60) * 60;
  const last = Math.ceil(end / 60) * 60;
  const ticks = [];
  for (let minute = first; minute <= last; minute += 60) {
    ticks.push(minute);
  }
  return ticks;
}

function setStatus(text) {
  runStatus.textContent = text;
}

function setError(message) {
  errorBox.hidden = false;
  errorBox.textContent = message;
  setStatus('Error');
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function areaNames() {
  return state.areas.map(area => area.name.trim()).filter(Boolean);
}

function ensureComfortShape() {
  const names = areaNames();
  state.students.forEach(student => {
    const nextComfort = {};
    names.forEach(areaName => {
      const existing = student.comfort[areaName];
      nextComfort[areaName] = existing === undefined || existing === null || existing === '' ? 0 : existing;
    });
    student.comfort = nextComfort;
  });
}

function addArea() {
  const index = nextAreaId++;
  state.areas.push({ id: `area-${index}`, name: `Area ${index}`, capacity: 1 });
  ensureComfortShape();
  renderAllInputs();
}

function addStudent() {
  const index = nextStudentId++;
  const names = areaNames();
  const comfort = {};
  names.forEach(name => {
    comfort[name] = 0;
  });
  state.students.push({
    id: `student-${index}`,
    name: `Student ${index}`,
    timeSlots: [{ start: '09:00', end: '10:00' }],
    comfort
  });
  renderAllInputs();
}

function addSlot(studentId) {
  const student = state.students.find(item => item.id === studentId);
  if (!student) return;
  student.timeSlots.push({ start: '09:00', end: '10:00' });
  renderStudentsEditor();
}

function deleteArea(areaId) {
  if (state.areas.length <= 1) return;
  const area = state.areas.find(item => item.id === areaId);
  state.areas = state.areas.filter(item => item.id !== areaId);
  state.students.forEach(student => {
    if (area) delete student.comfort[area.name];
  });
  ensureComfortShape();
  renderAllInputs();
}

function deleteStudent(studentId) {
  if (state.students.length <= 1) return;
  state.students = state.students.filter(item => item.id !== studentId);
  renderAllInputs();
}

function deleteSlot(studentId, slotIndex) {
  const student = state.students.find(item => item.id === studentId);
  if (!student || student.timeSlots.length <= 1) return;
  student.timeSlots.splice(slotIndex, 1);
  renderStudentsEditor();
}

function renderAreasEditor() {
  areasEditor.innerHTML = state.areas.map((area, index) => `
    <div class="form-row area-row" data-area-id="${area.id}">
      <input class="text-input area-name-input" data-field="area-name" data-area-id="${area.id}" value="${area.name}" aria-label="Area name ${index + 1}">
      <input class="number-input" type="number" min="1" step="1" data-field="capacity" data-area-id="${area.id}" value="${area.capacity}" aria-label="Capacity ${index + 1}">
      <button type="button" class="tiny-danger" data-action="delete-area" data-area-id="${area.id}">Delete</button>
    </div>
  `).join('');
}

function renderStudentsEditor() {
  studentsEditor.innerHTML = state.students.map((student, studentIndex) => `
    <div class="student-card" data-student-id="${student.id}">
      <div class="student-card-header">
        <input class="text-input student-name-input" data-field="student-name" data-student-id="${student.id}" value="${student.name}" aria-label="Student name ${studentIndex + 1}">
        <button type="button" class="tiny-danger" data-action="delete-student" data-student-id="${student.id}">Delete Student</button>
      </div>
      <div class="slot-list">
        ${student.timeSlots.map((slot, slotIndex) => `
          <div class="form-row slot-row" data-slot-index="${slotIndex}" data-student-id="${student.id}">
            <input class="time-input" type="time" data-field="slot-start" data-student-id="${student.id}" data-slot-index="${slotIndex}" value="${slot.start}">
            <span class="slot-separator">to</span>
            <input class="time-input" type="time" data-field="slot-end" data-student-id="${student.id}" data-slot-index="${slotIndex}" value="${slot.end}">
            <button type="button" class="tiny-danger" data-action="delete-slot" data-student-id="${student.id}" data-slot-index="${slotIndex}">Delete Slot</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="secondary add-slot-btn" data-action="add-slot" data-student-id="${student.id}">+ Add Time Slot</button>
    </div>
  `).join('');
}

function renderComfortEditor() {
  const names = areaNames();
  const header = names.map(name => `<th>${name}</th>`).join('');
  const rows = state.students.map(student => `
    <tr>
      <td class="comfort-student-name">${student.name}</td>
      ${names.map(areaName => `
        <td>
          <input
            class="number-input comfort-input"
            type="number"
            min="0"
            max="10"
            step="1"
            data-student-id="${student.id}"
            data-area-name="${areaName}"
            value="${student.comfort[areaName] ?? 0}"
          >
        </td>
      `).join('')}
    </tr>
  `).join('');

  comfortEditor.innerHTML = `
    <div class="table-wrap comfort-table-wrap">
      <table class="comfort-table">
        <thead>
          <tr>
            <th>Student</th>
            ${header}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function renderAllInputs() {
  ensureComfortShape();
  renderAreasEditor();
  renderStudentsEditor();
  renderComfortEditor();
}
function renderAllocations(rows) {
  if (!rows.length) {
    allocationBody.innerHTML = '<tr><td colspan="9" class="empty">No allocations generated.</td></tr>';
    return;
  }
  allocationBody.innerHTML = rows.map(row => `
    <tr>
      <td><strong>${row.student}</strong></td>
      <td>${row.slot}</td>
      <td>${row.start}-${row.end}</td>
      <td><span class="area-pill ${areaClass(row.area)}">${row.area}</span></td>
      <td>${formatNumber(row.comfort)}</td>
      <td>${row.duration} min</td>
      <td><strong>${formatNumber(row.effectiveness)}</strong></td>
      <td>${formatNumber(row.regret)}</td>
      <td>${formatNumber(row.priority)}</td>
    </tr>
  `).join('');
}

function renderUnassigned(rows) {
  if (!rows.length) {
    unassignedBody.innerHTML = '<tr><td colspan="5" class="empty">None.</td></tr>';
    return;
  }
  unassignedBody.innerHTML = rows.map(row => `
    <tr>
      <td>${row.student}</td>
      <td>${row.slot}</td>
      <td>${row.start}-${row.end}</td>
      <td>${row.duration} min</td>
      <td>${formatNumber(row.priority)}</td>
    </tr>
  `).join('');
}

function renderOccupancy(rows) {
  if (!rows.length) {
    occupancyBox.textContent = 'No occupancy data.';
    return;
  }
  occupancyBox.innerHTML = rows.map(row => {
    const areas = Object.entries(row.areas)
      .map(([area, count]) => `<span class="${areaClass(area)}"><strong>${area}</strong>${count}</span>`)
      .join('');
    return `<div class="occupancy-row"><b>${row.interval}</b>${areas}</div>`;
  }).join('');
}

function renderTimeline(rows) {
  if (!rows.length) {
    timelineLegend.innerHTML = '';
    timelineBox.textContent = 'No timeline generated yet.';
    return;
  }

  const starts = rows.map(row => timeToMinutes(row.start));
  const ends = rows.map(row => timeToMinutes(row.end));
  const minTime = Math.min(...starts);
  const maxTime = Math.max(...ends);
  const padding = 30;
  const timelineStart = Math.max(0, Math.floor((minTime - padding) / 30) * 30);
  const timelineEnd = Math.min(24 * 60, Math.ceil((maxTime + padding) / 30) * 30);
  const timelineDuration = Math.max(1, timelineEnd - timelineStart);
  const ticks = buildTimelineTicks(timelineStart, timelineEnd);
  const students = [...new Set(rows.map(row => row.student))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const areas = [...new Set(rows.map(row => row.area))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  timelineLegend.innerHTML = areas.map(area => '<span class="legend-pill ' + areaClass(area) + '">' + area + '</span>').join('');

  const tickHtml = ticks.map(tick => {
    const left = ((tick - timelineStart) / timelineDuration) * 100;
    return '<span class="timeline-tick" style="left:' + left + '%">' + minutesToTime(tick) + '</span>';
  }).join('');

  const gridHtml = ticks.map(tick => {
    const left = ((tick - timelineStart) / timelineDuration) * 100;
    return '<span class="timeline-grid-line" style="left:' + left + '%"></span>';
  }).join('');

  const rowsHtml = students.map(student => {
    const blocks = rows
      .filter(row => row.student === student)
      .map(row => {
        const start = timeToMinutes(row.start);
        const end = timeToMinutes(row.end);
        const left = ((start - timelineStart) / timelineDuration) * 100;
        const width = ((end - start) / timelineDuration) * 100;
        return '<div class="timeline-block ' + areaClass(row.area) + '" style="left:' + left + '%; width:' + width + '%;" title="' + row.student + ' - ' + row.start + '-' + row.end + ' - ' + row.area + '"><strong>' + row.area + '</strong><span>' + row.start + '-' + row.end + '</span></div>';
      }).join('');
    return '<div class="timeline-row"><div class="timeline-student">' + student + '</div><div class="timeline-track">' + gridHtml + blocks + '</div></div>';
  }).join('');

  timelineBox.innerHTML = '<div class="timeline-scale"><div class="timeline-student spacer"></div><div class="timeline-track scale-track">' + tickHtml + '</div></div><div class="timeline-rows">' + rowsHtml + '</div>';
}

function validateState() {
  const names = areaNames();
  if (!names.length) {
    throw new Error('Please add at least one area.');
  }
  if (!state.students.length) {
    throw new Error('Please add at least one student.');
  }

  const areasPayload = {};
  state.areas.forEach(area => {
    const name = area.name.trim();
    if (!name) {
      throw new Error('Area names cannot be empty.');
    }
    const capacity = Number(area.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error(`Capacity for ${name} must be a positive number.`);
    }
    areasPayload[name] = Math.floor(capacity);
  });

  const comfortPayload = {};
  state.students.forEach(student => {
    const studentName = student.name.trim();
    if (!studentName) {
      throw new Error('Student names cannot be empty.');
    }
    const comfortRow = {};
    names.forEach(areaName => {
      const raw = student.comfort[areaName];
      const score = Number(raw);
      if (!Number.isFinite(score)) {
        throw new Error(`Comfort score missing for ${studentName} in ${areaName}.`);
      }
      comfortRow[areaName] = score;
    });
    comfortPayload[studentName] = comfortRow;
  });

  const timeSlotPayload = {};
  state.students.forEach(student => {
    const studentName = student.name.trim();
    const slots = student.timeSlots.map(slot => {
      if (!slot.start || !slot.end) {
        throw new Error(`Time slots for ${studentName} cannot be empty.`);
      }
      if (timeToMinutes(slot.end) <= timeToMinutes(slot.start)) {
        throw new Error(`End time must be later than start time for ${studentName}: ${slot.start}-${slot.end}`);
      }
      return [slot.start, slot.end];
    });
    timeSlotPayload[studentName] = slots;
  });

  return {
    areas: areasPayload,
    comfort: comfortPayload,
    time_slots: timeSlotPayload
  };
}

async function generateSchedule() {
  clearError();
  setStatus('Running');
  let payload;
  try {
    payload = validateState();
  } catch (error) {
    setError(error.message);
    return;
  }

  try {
    const response = await fetch('/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Allocation failed');
    }
    const allocations = result.allocations || [];
    const unassigned = result.unassigned || [];
    totalEffectiveness.textContent = formatNumber(result.total_effectiveness);
    assignedCount.textContent = allocations.length;
    unassignedCount.textContent = unassigned.length;
    setStatus(unassigned.length ? 'Partial' : 'Complete');
    renderAllocations(allocations);
    renderUnassigned(unassigned);
    renderOccupancy(result.intervals || []);
    renderTimeline(allocations);
  } catch (error) {
    setError(error.message);
  }
}

function clearOutput() {
  totalEffectiveness.textContent = '¡ª';
  assignedCount.textContent = '0';
  unassignedCount.textContent = '0';
  setStatus('Waiting');
  allocationBody.innerHTML = '<tr><td colspan="9" class="empty">No schedule generated yet.</td></tr>';
  unassignedBody.innerHTML = '<tr><td colspan="5" class="empty">None.</td></tr>';
  occupancyBox.textContent = 'No occupancy data yet.';
  timelineLegend.innerHTML = '';
  timelineBox.textContent = 'No timeline generated yet.';
  clearError();
}
areasEditor.addEventListener('input', event => {
  const target = event.target;
  const areaId = target.dataset.areaId;
  const area = state.areas.find(item => item.id === areaId);
  if (!area) return;
  if (target.dataset.field === 'area-name') {
    area.name = target.value;
    ensureComfortShape();
    renderComfortEditor();
    return;
  }
  if (target.dataset.field === 'capacity') {
    area.capacity = target.value;
  }
});

areasEditor.addEventListener('click', event => {
  const action = event.target.dataset.action;
  if (action === 'delete-area') {
    deleteArea(event.target.dataset.areaId);
  }
});

studentsEditor.addEventListener('input', event => {
  const target = event.target;
  const studentId = target.dataset.studentId;
  const student = state.students.find(item => item.id === studentId);
  if (!student) return;
  if (target.dataset.field === 'student-name') {
    student.name = target.value;
    renderComfortEditor();
    return;
  }
  if (target.dataset.field === 'slot-start' || target.dataset.field === 'slot-end') {
    const slotIndex = Number(target.dataset.slotIndex);
    const slot = student.timeSlots[slotIndex];
    if (!slot) return;
    if (target.dataset.field === 'slot-start') {
      slot.start = target.value;
    } else {
      slot.end = target.value;
    }
  }
});

studentsEditor.addEventListener('click', event => {
  const action = event.target.dataset.action;
  const studentId = event.target.dataset.studentId;
  if (action === 'delete-student') {
    deleteStudent(studentId);
  } else if (action === 'add-slot') {
    addSlot(studentId);
  } else if (action === 'delete-slot') {
    deleteSlot(studentId, Number(event.target.dataset.slotIndex));
  }
});

comfortEditor.addEventListener('input', event => {
  const target = event.target;
  const studentId = target.dataset.studentId;
  const areaName = target.dataset.areaName;
  const student = state.students.find(item => item.id === studentId);
  if (!student || !areaName) return;
  student.comfort[areaName] = target.value;
});

document.getElementById('loadSample').addEventListener('click', loadSample);
document.getElementById('generate').addEventListener('click', generateSchedule);
document.getElementById('generateTop').addEventListener('click', generateSchedule);
document.getElementById('clearOutput').addEventListener('click', clearOutput);
document.getElementById('addAreaBtn').addEventListener('click', addArea);
document.getElementById('addStudentBtn').addEventListener('click', addStudent);

renderAllInputs();
clearOutput();
