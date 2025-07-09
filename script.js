let currentDate = new Date();
let events = {}; // 나중에 이걸 CSV로 저장할 거예요

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay.getDay();

  document.getElementById("month-year").textContent = `${year}년 ${month + 1}월`;

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  // 빈 칸 채우기 (전월 마지막날 요일까지)
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    grid.appendChild(empty);
  }

  // 날짜 채우기
  for (let day = 1; day <= lastDate; day++) {
    const cell = document.createElement("div");
    cell.className = "day";
    const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    cell.dataset.date = dateStr;
    cell.textContent = day;

    // ✅ 오늘 날짜면 .today 클래스 추가
    const today = new Date();
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    if (isToday) {
      cell.classList.add("today");
    }

    // 일정이 있으면 표시
    if (events[dateStr]) {
      const eventList = events[dateStr].slice(0, 2);
      eventList.forEach(event => {
        const eventDiv = document.createElement("div");
        eventDiv.textContent = event.text;
        eventDiv.style.fontSize = "0.75em";
        eventDiv.style.color = event.done ? "gray" : "blue";
        if (event.done) eventDiv.style.textDecoration = "line-through";
        cell.appendChild(eventDiv);
      });
    }

    // 클릭 이벤트
    cell.addEventListener("click", () => {
      const currentEvents = events[dateStr] || [];

      let message = `${dateStr} 일정\n`;
      if (currentEvents.length > 0) {
        message += currentEvents
          .map((event, idx) => {
            const status = event.done ? "[마감]" : "";
            return `${idx + 1}. ${event.text} ${status}`;
          })
          .join("\n");
        message += `\n\n새 일정 입력\n또는 삭제(D번호) / 마감(M번호)\n예: D2 또는 M1`;
      } else {
        message += "(등록된 일정 없음)\n\n새로운 일정 입력:";
      }

      const input = prompt(message);

      if (input === null) return;

      const trimmed = input.trim();

      if (/^D\d+$/.test(trimmed.toUpperCase())) {
        // 삭제 요청
        const idx = parseInt(trimmed.slice(1), 10) - 1;
        if (idx >= 0 && idx < currentEvents.length) {
          currentEvents.splice(idx, 1);
        }
      } else if (/^M\d+$/.test(trimmed.toUpperCase())) {
        // 마감 처리
        const idx = parseInt(trimmed.slice(1), 10) - 1;
        if (idx >= 0 && idx < currentEvents.length) {
          currentEvents[idx].done = true;
        }
      } else if (trimmed !== "") {
        currentEvents.push({ text: trimmed, done: false });
      }

      // 저장 또는 삭제
      if (currentEvents.length > 0) {
        events[dateStr] = currentEvents;
      } else {
        delete events[dateStr];
      }

      renderCalendar();
    });

    grid.appendChild(cell);
  }
}

// 월 이동 기능
function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

//CSV 저장 함수
function downloadCSV() {
  let csvContent = "date,text,done\n";

  for (const date in events) {
    events[date].forEach(event => {
      csvContent += `${date},${event.text.replace(/,/g, " ")},${event.done}\n`;
    });
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "my_schedule.csv";
  link.click();
}

//CSV 불러오기 함수
function loadCSV() {
  const fileInput = document.getElementById("csvFileInput");
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.trim().split("\n").slice(1); // 첫 줄은 헤더
    events = {};

    lines.forEach(line => {
      const [date, text, done] = line.split(",");
      if (!events[date]) events[date] = [];
      events[date].push({
        text: text.trim(),
        done: done.trim() === "true"
      });
    });

    renderCalendar();
  };

  reader.readAsText(file);
}

// 초기 렌더링
renderCalendar();
