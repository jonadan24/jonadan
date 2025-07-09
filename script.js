const { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } = window.firestoreFns;

let currentDate = new Date();
let scheduleData = {}; // 날짜별 일정

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

    // 오늘 날짜 표시
    const today = new Date();
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    // 일정 표시
    if (scheduleData[dateKey]) {
      const scheduleDiv = document.createElement("div");
      scheduleDiv.className = "schedule-text";
      scheduleDiv.textContent = scheduleData[dateKey].text;
      if (scheduleData[dateKey].done) {
        scheduleDiv.classList.add("completed");
      }
      cell.appendChild(scheduleDiv);
    }

    // 클릭 시 prompt로 입력
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
  const existing = scheduleData[dateKey];
  const existingText = existing ? `${existing.text}${existing.done ? " [마감]" : ""}` : "";
  const input = prompt(
    `${dateKey} 일정\n기존: ${existingText}\n\n새 일정 입력 또는 D1(삭제)/M1(마감):`
  );
  if (input === null) return;

  const colRef = collection(db, "posts", "schedules", "items");
  const snapshot = await getDocs(colRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.date === dateKey) {
      await deleteDoc(docSnap.ref);
    }
  }

  if (/^D1$/i.test(input)) {
    delete scheduleData[dateKey];
  } else if (/^M1$/i.test(input) && existing) {
    scheduleData[dateKey].done = true;
    await addDoc(colRef, {
      date: dateKey,
      text: existing.text,
      done: true,
    });
  } else if (input.trim() !== "") {
    scheduleData[dateKey] = { text: input.trim(), done: false };
    await addDoc(colRef, {
      date: dateKey,
      text: input.trim(),
      done: false,
    });
  }

  renderCalendar();
}

async function loadFirestoreData() {
  const colRef = collection(db, "posts", "schedules", "items");
  const snapshot = await getDocs(colRef);

  scheduleData = {};
  snapshot.forEach((doc) => {
    const { date, text, done } = doc.data();
    scheduleData[date] = { text, done };
  });

  renderCalendar();
}

// 앱 시작 시
loadFirestoreData();
