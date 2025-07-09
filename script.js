
const { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } = window.firestoreFns;

let currentDate = new Date();
let scheduleData = {}; // 날짜별 일정 배열

function renderCalendar() {
  const calendarGrid = document.getElementById("calendar-grid");
  const monthYear = document.getElementById("month-year");
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const dateKey = `${year}-${month + 1}-${day}`;
    const dateDiv = document.createElement("div");
    dateDiv.textContent = day;
    cell.appendChild(dateDiv);

    const today = new Date();
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    if (scheduleData[dateKey]) {
      const eventList = scheduleData[dateKey];
      eventList.slice(0, 2).forEach(ev => {
        const div = document.createElement("div");
        div.className = "schedule-text";
        div.textContent = ev.text;
        if (ev.done) div.classList.add("completed");
        cell.appendChild(div);
      });
      if (eventList.length > 2) {
        const moreDiv = document.createElement("div");
        moreDiv.className = "schedule-text";
        moreDiv.textContent = `+${eventList.length - 2}`;
        cell.appendChild(moreDiv);
      }
    }

    cell.onclick = () => openSchedulePrompt(dateKey);
    calendarGrid.appendChild(cell);
  }
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

async function openSchedulePrompt(dateKey) {
  const colRef = collection(db, "posts", "schedules", "items");
  const eventList = scheduleData[dateKey] || [];

  let msg = `${dateKey} 일정
`;
  if (eventList.length > 0) {
    msg += eventList.map((ev, i) => `${i + 1}. ${ev.text}${ev.done ? " [마감]" : ""}`).join("\n");
    msg += `\n\n새 일정 입력 또는 D번호(삭제)/M번호(마감):`;
  } else {
    msg += "(일정 없음)\n새 일정 입력:";
  }

  const input = prompt(msg);
  if (!input) return;

  const trimmed = input.trim();
  const dMatch = trimmed.match(/^D(\d+)$/i);
  const mMatch = trimmed.match(/^M(\d+)$/i);

  if (dMatch) {
    const index = parseInt(dMatch[1], 10) - 1;
    const target = eventList[index];
    if (target) {
      await deleteDoc(doc(db, "posts", "schedules", "items", target.id));
      eventList.splice(index, 1);
    }
  } else if (mMatch) {
    const index = parseInt(mMatch[1], 10) - 1;
    const target = eventList[index];
    if (target) {
      target.done = true;
      await updateDoc(doc(db, "posts", "schedules", "items", target.id), { done: true });
    }
  } else if (trimmed !== "") {
    const docRef = await addDoc(colRef, {
      date: dateKey,
      text: trimmed,
      done: false
    });
    eventList.push({ id: docRef.id, text: trimmed, done: false });
  }

  if (eventList.length > 0) {
    scheduleData[dateKey] = eventList;
  } else {
    delete scheduleData[dateKey];
  }

  renderCalendar();
}

async function loadFirestoreData() {
  const colRef = collection(db, "posts", "schedules", "items");
  const snapshot = await getDocs(colRef);

  scheduleData = {};
  snapshot.forEach((docSnap) => {
    const { date, text, done } = docSnap.data();
    if (!scheduleData[date]) scheduleData[date] = [];
    scheduleData[date].push({ id: docSnap.id, text, done });
  });

  renderCalendar();
}

loadFirestoreData();
