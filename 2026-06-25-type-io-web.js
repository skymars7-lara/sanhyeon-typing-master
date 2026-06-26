const TEACHER_PIN = "202603";
const STORAGE_KEY = "type_io_passages";
const SUPABASE_CONFIG_KEY = "type_io_supabase_config";
const DEFAULT_SUPABASE_URL = "";
const DEFAULT_SUPABASE_ANON_KEY = "";
const PASSAGES_TABLE = "type_io_passages";
const ROOMS_TABLE = "type_io_rooms";
const PLAYERS_TABLE = "type_io_players";

const samples = {
  ko: {
    subject: "국어",
    title: "이상 시집 1",
    source: "이상 / 공유마당 / CC B",
    text: `거울

거울속에는소리가없소

저렇게까지조용한세상은참없을것이오

거울속에도내게귀가있소

내말을못알아듣는딱한귀가두개나있소

거울속의나는왼손잡이오

내악수를받을줄모르는악수를모르는왼손잡이오`
  },
  en: {
    subject: "영어",
    title: "The Learning Room",
    source: "TYPE.IO 기본 영타 지문",
    text: `Learning is not a race against others.

It is a quiet practice of attention.

Every sentence becomes easier when the mind stays calm.

Careful practice builds confidence, and confidence makes speed possible.`
  }
};

let roomCode = "202603";
let currentLang = "ko";
let currentPassage = { ...samples.ko };
let lines = [];
let currentLineIndex = 0;
let startedAt = 0;
let mistakeCount = 0;
let score = 0;
let timerId = 0;
let isTeacherBattle = false;
let previousRankMap = new Map();
let tickerMessages = [];
let tickerIndex = 0;
let lastLeaderName = "";
let announcedRanks = new Set();
let eliminatedPlayers = new Set();
let lastAccuracyStatus = "safe";
let currentPlayerId = "";
let currentRoomCode = "202603";
let remotePlayers = [];
let teacherPollId = 0;
let roomPollId = 0;
let lastRoomStatus = "waiting";
let lastPlayerSyncAt = 0;
let audioContext;
let musicTimer = 0;
let masterGain;

const cheerArts = [
  "♥ ♥ ♥  산현 파이팅  ♥ ♥ ♥",
  "✦ · ✹ · ✦  폭죽 팡팡!  ✦ · ✹ · ✦",
  "＼ㅇ／  정확하게! 빠르게!  ＼ㅇ／",
  "ㅇ  /|\\  / \\   키보드 영웅 등장!",
  "★ ☆ ★  집중력 충전 완료  ★ ☆ ★"
];

const students = [
  { name: "김도윤", speed: 278, accuracy: 100, progress: 64 },
  { name: "박서연", speed: 251, accuracy: 99, progress: 58 },
  { name: "최민준", speed: 232, accuracy: 99, progress: 52 },
  { name: "이지우", speed: 211, accuracy: 99, progress: 46 },
  { name: "한유진", speed: 198, accuracy: 99, progress: 41 }
];

const entryScreen = document.getElementById("entryScreen");
const teacherScreen = document.getElementById("teacherScreen");
const battleScreen = document.getElementById("battleScreen");
const studentCodeInput = document.getElementById("studentCodeInput");
const studentNameInput = document.getElementById("studentNameInput");
const studentAuthMessage = document.getElementById("studentAuthMessage");
const teacherPinInput = document.getElementById("teacherPinInput");
const teacherAuthMessage = document.getElementById("teacherAuthMessage");
const roomCodeEl = document.getElementById("roomCode");
const teacherBattleBtn = document.getElementById("teacherBattleBtn");
const studentCodePanel = document.getElementById("studentCodePanel");
const customRoomCodeInput = document.getElementById("customRoomCodeInput");
const roomCodeMessage = document.getElementById("roomCodeMessage");
const subjectSelect = document.getElementById("subjectSelect");
const passageTitleSelect = document.getElementById("passageTitleSelect");
const passageTitleInput = document.getElementById("passageTitleInput");
const newPassageBtn = document.getElementById("newPassageBtn");
const textFileInput = document.getElementById("textFileInput");
const passageTextInput = document.getElementById("passageTextInput");
const editPassageBtn = document.getElementById("editPassageBtn");
const publishPassageBtn = document.getElementById("publishPassageBtn");
const teacherPassageLabel = document.getElementById("teacherPassageLabel");
const driveState = document.getElementById("driveState");
const supabaseUrlInput = document.getElementById("supabaseUrlInput");
const supabaseKeyInput = document.getElementById("supabaseKeyInput");
const supabaseTableInput = document.getElementById("supabaseTableInput");
const subjectLabel = document.getElementById("subjectLabel");
const battleTitle = document.getElementById("battleTitle");
const sourceChip = document.getElementById("sourceChip");
const playerName = document.getElementById("playerName");
const progressText = document.getElementById("progressText");
const speedText = document.getElementById("speedText");
const progressFill = document.getElementById("progressFill");
const scoreList = document.getElementById("scoreList");
const langToggleBtn = document.getElementById("langToggleBtn");
const accuracyText = document.getElementById("accuracyText");
const rankText = document.getElementById("rankText");
const leaderGapText = document.getElementById("leaderGapText");
const tickerText = document.getElementById("tickerText");
const tickerWindow = document.querySelector(".ticker-window");
const battleStartBtn = document.getElementById("battleStartBtn");
const teacherSettingsBtn = document.getElementById("teacherSettingsBtn");
const teacherBattleActions = document.querySelector(".teacher-battle-actions");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownCircle = document.getElementById("countdownCircle");
const previousLine = document.getElementById("previousLine");
const targetLine = document.getElementById("targetLine");
const nextLine = document.getElementById("nextLine");
const passageWindow = document.getElementById("passageWindow");
const typingInput = document.getElementById("typingInput");
const totalCharsLabel = document.getElementById("totalCharsLabel");
const typedCharsLabel = document.getElementById("typedCharsLabel");
const koOverlay = document.getElementById("koOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultSummary = document.getElementById("resultSummary");
const finalRankList = document.getElementById("finalRankList");
const connectedCount = document.getElementById("connectedCount");
const teacherStudentList = document.getElementById("teacherStudentList");
const teacherRankBoard = document.getElementById("teacherRankBoard");
const teacherRankList = document.getElementById("teacherRankList");
const teacherRankCount = document.getElementById("teacherRankCount");
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];

function showScreen(screen) {
  [entryScreen, teacherScreen, battleScreen].forEach((node) => {
    node.classList.toggle("is-visible", node === screen);
  });
  if (screen !== teacherScreen) clearInterval(teacherPollId);
  if (screen === battleScreen) typingInput.focus();
}

function makeCode() {
  return String(Math.floor(1000 + Math.random() * 900000));
}

function splitPassage(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function updateTeacherLabel() {
  teacherPassageLabel.textContent = `${subjectSelect.value} / ${passageTitleInput.value || "제목 없음"}`;
}

function syncTeacherFields() {
  subjectSelect.value = currentPassage.subject;
  passageTitleInput.value = currentPassage.title;
  if (passageTitleSelect) passageTitleSelect.value = currentPassage.title;
  passageTextInput.value = currentPassage.text;
  passageTextInput.readOnly = true;
  editPassageBtn.textContent = "수정";
  updateTeacherLabel();
}

function startNewPassage() {
  const nextTitle = window.prompt("새 지문 제목을 입력하세요.", "");
  if (!nextTitle || !nextTitle.trim()) return;
  currentPassage = {
    subject: subjectSelect.value,
    title: nextTitle.trim(),
    source: `${subjectSelect.value} / 교사 작성 지문`,
    text: ""
  };
  passageTitleInput.value = currentPassage.title;
  passageTitleSelect.value = "";
  passageTextInput.value = "";
  passageTextInput.readOnly = false;
  editPassageBtn.textContent = "수정 중";
  updateTeacherLabel();
  passageTextInput.focus();
}

function savePassages(passages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passages));
}

function getPassages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getSupabaseConfig() {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY) || "{}");
    } catch {
      return {};
    }
  })();
  return {
    url: (supabaseUrlInput.value.trim() || saved.url || DEFAULT_SUPABASE_URL).replace(/\/+$/, ""),
    key: supabaseKeyInput.value.trim() || saved.key || DEFAULT_SUPABASE_ANON_KEY,
    table: supabaseTableInput.value.trim() || saved.table || PASSAGES_TABLE
  };
}

function loadSupabaseConfig() {
  try {
    const config = JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY) || "{}");
    supabaseUrlInput.value = config.url || DEFAULT_SUPABASE_URL;
    supabaseKeyInput.value = config.key || DEFAULT_SUPABASE_ANON_KEY;
    supabaseTableInput.value = config.table || PASSAGES_TABLE;
    driveState.textContent = config.url && config.key ? "Supabase 설정됨" : "Supabase 미설정";
  } catch {
    supabaseUrlInput.value = DEFAULT_SUPABASE_URL;
    supabaseKeyInput.value = DEFAULT_SUPABASE_ANON_KEY;
    supabaseTableInput.value = PASSAGES_TABLE;
  }
}

function saveSupabaseConfig() {
  const config = getSupabaseConfig();
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  supabaseUrlInput.value = config.url;
  supabaseTableInput.value = config.table;
  driveState.textContent = config.url && config.key && config.table ? "Supabase 설정 저장됨" : "Supabase 정보가 비어 있음";
}

function hasRuntimeSupabaseConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key);
}

async function testSupabaseConnection() {
  saveSupabaseConfig();
  if (!hasSupabaseConfig()) {
    driveState.textContent = "Supabase 정보를 먼저 입력하세요";
    return;
  }
  driveState.textContent = "Supabase 확인 중...";
  try {
    const config = getSupabaseConfig();
    const rows = await requestSupabase(`${config.table}?select=subject,title,updated_at&limit=20`);
    const count = Array.isArray(rows) ? rows.length : 0;
    driveState.textContent = count
      ? `Supabase 확인 완료 - 저장된 지문 ${count}개`
      : "Supabase 연결 완료 - 아직 저장된 지문 없음";
  } catch (error) {
    driveState.textContent = "Supabase 확인 실패 - URL, key, RLS, 테이블 확인";
  }
}

function hasSupabaseConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key && config.table);
}

function hasDefaultSupabaseConfig() {
  return Boolean(DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY);
}

async function requestSupabase(path, options = {}) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase 요청 실패: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function verifyRoomCode(inputCode) {
  if (!hasSupabaseConfig()) return inputCode === roomCode;
  try {
    const rows = await requestSupabase(`${ROOMS_TABLE}?room_code=eq.${encodeURIComponent(inputCode)}&select=room_code,active_subject,active_title,active_passage,status&limit=1`);
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return inputCode === roomCode;
  }
}

async function loadActiveRoom(inputCode) {
  if (!hasSupabaseConfig()) return false;
  try {
    const rows = await requestSupabase(`${ROOMS_TABLE}?room_code=eq.${encodeURIComponent(inputCode)}&select=room_code,active_subject,active_title,active_passage,status&limit=1`);
    const room = Array.isArray(rows) ? rows[0] : null;
    if (!room || !room.active_passage) return false;
    currentPassage = {
      subject: room.active_subject || "국어",
      title: room.active_title || "배포 지문",
      source: `${room.active_subject || "교사"} / 교사 배포 지문`,
      text: room.active_passage
    };
    roomCode = room.room_code || inputCode;
    currentRoomCode = roomCode;
    return true;
  } catch {
    return false;
  }
}

async function saveRoomCodeToSupabase() {
  if (!hasSupabaseConfig()) return false;
  await requestSupabase(`${ROOMS_TABLE}?on_conflict=room_code`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      room_code: roomCode,
      active_subject: currentPassage.subject,
      active_title: currentPassage.title,
      active_passage: currentPassage.text,
      status: "waiting",
      updated_at: new Date().toISOString()
    })
  });
  return true;
}

async function setRoomStatus(status) {
  if (!hasSupabaseConfig()) return false;
  await requestSupabase(`${ROOMS_TABLE}?room_code=eq.${encodeURIComponent(roomCode)}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      status,
      started_at: status === "countdown" || status === "playing" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
  });
  lastRoomStatus = status;
  return true;
}

function sortPlayers(players) {
  return [...players]
    .filter((player) => player.status !== "eliminated" && Number(player.accuracy) > 95)
    .sort((a, b) => {
      const aScore = Number(a.progress || 0) * 1000 + Number(a.speed || 0) * 2 + Number(a.accuracy || 0);
      const bScore = Number(b.progress || 0) * 1000 + Number(b.speed || 0) * 2 + Number(b.accuracy || 0);
      return bScore - aScore;
    });
}

async function fetchPlayers() {
  if (!hasSupabaseConfig()) return [];
  const rows = await requestSupabase(`${PLAYERS_TABLE}?room_code=eq.${encodeURIComponent(currentRoomCode)}&select=id,student_name,progress,speed,accuracy,typed_chars,status,updated_at&order=updated_at.desc&limit=60`);
  remotePlayers = rows || [];
  return remotePlayers;
}

function renderTeacherStudents(players = remotePlayers) {
  const active = players.filter((player) => player.status !== "finished_old");
  connectedCount.textContent = `${active.length}명`;
  teacherStudentList.innerHTML = active.length ? active.map((player) => `
    <li>
      <b>${escapeHtml(player.student_name || "학생")}</b>
      <small>진행률 ${player.progress || 0}% / 분당 타자속도 ${player.speed || 0}타 / 정확도 ${player.accuracy || 100}% / ${escapeHtml(player.status || "waiting")}</small>
    </li>
  `).join("") : `<li><b>아직 접속한 학생이 없습니다</b><small>학생이 입장하면 자동으로 표시됩니다.</small></li>`;
}

function renderTeacherRankings(players = remotePlayers) {
  const ranked = sortPlayers(players).slice(0, 20);
  teacherRankCount.textContent = `${ranked.length}명`;
  teacherRankList.innerHTML = ranked.length ? ranked.map((player, index) => `
    <li class="${index < 3 ? `rank-top-${index + 1}` : ""}">
      <span>
        <b>${escapeHtml(player.student_name || "학생")}</b>
        <small>진행률 ${player.progress || 0}% / 분당 타자속도 ${player.speed || 0}타 / 정확도 ${player.accuracy || 100}%</small>
      </span>
      <strong>${escapeHtml(player.status || "playing")}</strong>
    </li>
  `).join("") : `<li><span><b>순위 대기 중</b><small>배틀이 시작되면 학생 순위가 표시됩니다.</small></span><strong>-</strong></li>`;
}

async function refreshTeacherLive() {
  try {
    const players = await fetchPlayers();
    renderTeacherStudents(players);
    renderTeacherRankings(players);
  } catch {
    connectedCount.textContent = "확인 실패";
  }
}

function startTeacherPolling() {
  clearInterval(teacherPollId);
  refreshTeacherLive();
  teacherPollId = setInterval(refreshTeacherLive, 2000);
}

async function registerCurrentPlayer(name) {
  if (!hasSupabaseConfig()) return;
  const rows = await requestSupabase(PLAYERS_TABLE, {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      room_code: currentRoomCode,
      student_name: name,
      progress: 0,
      speed: 0,
      accuracy: 100,
      typed_chars: 0,
      status: "waiting",
      updated_at: new Date().toISOString()
    })
  });
  currentPlayerId = rows?.[0]?.id || "";
}

async function updateCurrentPlayer(player) {
  if (!hasSupabaseConfig() || !currentPlayerId) return;
  await requestSupabase(`${PLAYERS_TABLE}?id=eq.${encodeURIComponent(currentPlayerId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      progress: player.progress,
      speed: player.speed,
      accuracy: player.accuracy,
      typed_chars: player.doneChars,
      status: player.status || "playing",
      finished_at: player.status === "finished" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
  });
}

async function pollRoomForStart() {
  if (!hasSupabaseConfig() || isTeacherBattle) return;
  try {
    await fetchPlayers();
    const rows = await requestSupabase(`${ROOMS_TABLE}?room_code=eq.${encodeURIComponent(currentRoomCode)}&select=status,active_subject,active_title,active_passage&limit=1`);
    const room = rows?.[0];
    if (!room) return;
    if (room.active_passage && (room.active_subject !== currentPassage.subject || room.active_title !== currentPassage.title)) {
      currentPassage = {
        subject: room.active_subject || "국어",
        title: room.active_title || "배포 지문",
        source: `${room.active_subject || "교사"} / 교사 배포 지문`,
        text: room.active_passage
      };
      prepareBattle();
    }
    if (room.status === "countdown" && lastRoomStatus !== "countdown") {
      lastRoomStatus = "countdown";
      runCountdownThenStart();
    }
  } catch {
    // 교실 네트워크가 잠깐 흔들려도 학생 입력은 계속 가능하게 둡니다.
  }
}

function startRoomPolling() {
  clearInterval(roomPollId);
  pollRoomForStart();
  roomPollId = setInterval(pollRoomForStart, 1500);
}

function cacheCurrentPassage(passage) {
  const passages = getPassages();
  const list = Array.isArray(passages[passage.subject])
    ? passages[passage.subject]
    : passages[passage.subject]
      ? [passages[passage.subject]]
      : [];
  const index = list.findIndex((item) => item.title === passage.title);
  if (index >= 0) list[index] = passage;
  else list.unshift(passage);
  passages[passage.subject] = list;
  savePassages(passages);
}

function getCachedPassagesForSubject(subject) {
  const value = getPassages()[subject];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function renderPassageTitleOptions(passages = []) {
  passageTitleSelect.innerHTML = `<option value="">새 지문 작성</option>${passages.map((passage) => (
    `<option value="${escapeHtml(passage.title)}">${escapeHtml(passage.title)}</option>`
  )).join("")}`;
  const match = passages.find((passage) => passage.title === passageTitleInput.value);
  passageTitleSelect.value = match ? match.title : "";
}

async function loadPassageTitlesForSubject() {
  let passages = [];
  if (hasSupabaseConfig()) {
    const config = getSupabaseConfig();
    try {
      const rows = await requestSupabase(`${config.table}?subject=eq.${encodeURIComponent(subjectSelect.value)}&select=subject,title,source,body,updated_at&order=updated_at.desc`);
      passages = (rows || []).map((row) => ({
        subject: row.subject,
        title: row.title,
        source: row.source,
        text: row.body
      }));
      passages.forEach(cacheCurrentPassage);
    } catch {
      passages = getCachedPassagesForSubject(subjectSelect.value);
    }
  } else {
    passages = getCachedPassagesForSubject(subjectSelect.value);
  }
  renderPassageTitleOptions(passages);
  return passages;
}

async function saveCurrentPassage() {
  currentPassage = {
    subject: subjectSelect.value,
    title: passageTitleInput.value.trim() || "제목 없음",
    source: `${subjectSelect.value} / 교사 업로드 지문`,
    text: passageTextInput.value.trim() || samples.ko.text
  };
  cacheCurrentPassage(currentPassage);
  if (hasSupabaseConfig()) {
    const config = getSupabaseConfig();
    try {
      await requestSupabase(`${config.table}?on_conflict=subject,title`, {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify({
          subject: currentPassage.subject,
          title: currentPassage.title,
          source: currentPassage.source,
          body: currentPassage.text,
          updated_at: new Date().toISOString()
        })
      });
      driveState.textContent = "Supabase 저장 완료";
      await loadPassageTitlesForSubject();
      passageTitleSelect.value = currentPassage.title;
    } catch (error) {
      driveState.textContent = "Supabase 실패 - 브라우저 저장";
    }
  } else {
    driveState.textContent = "브라우저 임시 저장 완료";
  }
  passageTextInput.readOnly = true;
  editPassageBtn.textContent = "수정";
  updateTeacherLabel();
}

async function loadSavedPassage() {
  let saved = null;
  if (hasSupabaseConfig()) {
    const config = getSupabaseConfig();
    try {
      const titleQuery = passageTitleSelect.value
        ? `&title=eq.${encodeURIComponent(passageTitleSelect.value)}`
        : "";
      const rows = await requestSupabase(`${config.table}?subject=eq.${encodeURIComponent(subjectSelect.value)}${titleQuery}&select=subject,title,source,body,updated_at&order=updated_at.desc&limit=1`);
      if (rows && rows[0]) {
        saved = {
          subject: rows[0].subject,
          title: rows[0].title,
          source: rows[0].source,
          text: rows[0].body
        };
        cacheCurrentPassage(saved);
        driveState.textContent = "Supabase에서 불러옴";
      }
    } catch (error) {
      driveState.textContent = "Supabase 실패 - 브라우저 저장 확인";
    }
  }
  saved = saved || getCachedPassagesForSubject(subjectSelect.value).find((passage) => passage.title === passageTitleSelect.value) || getCachedPassagesForSubject(subjectSelect.value)[0];
  currentPassage = saved || (subjectSelect.value === "영어" ? { ...samples.en } : { ...samples.ko, subject: subjectSelect.value });
  syncTeacherFields();
  if (!saved) driveState.textContent = "기본 지문 불러옴";
}

function prepareBattle() {
  lines = splitPassage(currentPassage.text);
  if (!lines.length) lines = splitPassage(samples.ko.text);
  currentLineIndex = 0;
  startedAt = 0;
  mistakeCount = 0;
  score = 0;
  eliminatedPlayers = new Set();
  lastAccuracyStatus = "safe";
  typingInput.value = "";
  koOverlay.classList.remove("is-visible");
  typingInput.disabled = false;
  teacherBattleActions.hidden = !isTeacherBattle;
  teacherRankBoard.hidden = !isTeacherBattle;
  battleScreen.classList.toggle("is-teacher-battle", isTeacherBattle);
  subjectLabel.textContent = currentPassage.subject;
  battleTitle.textContent = currentPassage.title;
  sourceChip.textContent = currentPassage.source;
  totalCharsLabel.textContent = `${currentPassage.text.replace(/\s/g, "").length} 자`;
  updateLineView();
  updateStats();
  if (isTeacherBattle) refreshTeacherLive();
  setTickerMessages([
    "순위 안내: 정확도 95% 이하는 순위에서 잠시 제외됩니다.",
    "정확도 96% 이상으로 회복하면 실시간 순위에 다시 등록됩니다.",
    "정확도 90% 이하는 즉시 탈락입니다. 끝까지 정확하게 입력하세요."
  ]);
}

async function publishPassage() {
  await saveCurrentPassage();
  currentPassage = {
    subject: subjectSelect.value,
    title: passageTitleInput.value.trim() || "제목 없음",
    source: `${subjectSelect.value} / 교사 배포 지문`,
    text: passageTextInput.value.trim() || samples.ko.text
  };
  try {
    const saved = await saveRoomCodeToSupabase();
    driveState.textContent = saved ? "학생 배틀 지문으로 Supabase 배포됨" : "학생 배틀 지문으로 배포됨";
  } catch {
    driveState.textContent = "학생 배틀 지문으로 배포됨 - Supabase 방 갱신 실패";
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function updateLineView() {
  const typed = typingInput.value;
  const target = lines[currentLineIndex] || "";
  passageWindow.classList.remove("is-advancing");
  void passageWindow.offsetWidth;
  passageWindow.classList.add("is-advancing");
  previousLine.innerHTML = Array.from(target).map((char, index) => {
    let className = "pending-char";
    if (index < typed.length) className = typed[index] === char ? "done-char" : "bad-char";
    return `<span class="${className}">${escapeHtml(char)}</span>`;
  }).join("");
  targetLine.textContent = lines[currentLineIndex + 1] || "";
  nextLine.textContent = lines[currentLineIndex + 2] || "";
}

function calculateAccuracy() {
  const typed = typingInput.value;
  const target = lines[currentLineIndex] || "";
  if (!typed.length) return 100;
  const correct = Array.from(typed).filter((char, index) => char === target[index]).length;
  return Math.max(0, Math.round((correct / typed.length) * 100));
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h} : ${m} : ${s}`;
}

function updateStats() {
  const typed = typingInput.value;
  const accuracy = calculateAccuracy();
  const doneBefore = lines.slice(0, currentLineIndex).join("").length;
  const totalChars = lines.join("").length || 1;
  const doneChars = Math.min(totalChars, doneBefore + typed.length);
  const progress = Math.round((doneChars / totalChars) * 100);
  const elapsed = startedAt ? Date.now() - startedAt : 0;
  const elapsedMinutes = elapsed ? Math.max(elapsed / 60000, 0.05) : 0;
  const speed = elapsedMinutes ? Math.round(doneChars / elapsedMinutes) : 0;

  score = Math.max(0, Math.round(doneChars * accuracy * 0.25));
  progressText.textContent = `${progress}%`;
  speedText.textContent = `${speed}타`;
  progressFill.style.width = `${progress}%`;
  accuracyText.textContent = `${accuracy}%`;
  typedCharsLabel.textContent = `${typed.length} 자`;

  const playerNameValue = playerName.textContent.trim() || "나";
  if (typed.length > 10 && accuracy <= 90 && !eliminatedPlayers.has(playerNameValue)) {
    eliminatedPlayers.add(playerNameValue);
    typingInput.disabled = true;
    resultTitle.textContent = "탈락";
    resultSummary.textContent = "정확도 90% 이하로 내려가 탈락 처리되었습니다.";
    finalRankList.innerHTML = "";
    koOverlay.classList.add("is-visible");
    stopTensionMusic();
    setTickerMessages([`${playerNameValue} 학생 정확도 ${accuracy}%. 90% 이하로 탈락입니다.`]);
  } else if (typed.length > 10 && accuracy <= 95 && lastAccuracyStatus !== "excluded") {
    setTickerMessages([`정확도 ${accuracy}%. 95% 이하는 순위에서 잠시 제외됩니다. 96% 이상으로 회복하면 다시 등록됩니다.`]);
  } else if (typed.length > 10 && accuracy > 95 && lastAccuracyStatus === "excluded") {
    setTickerMessages([`정확도 ${accuracy}% 회복! 실시간 순위에 다시 등록됩니다.`]);
  }
  lastAccuracyStatus = accuracy <= 90 ? "eliminated" : accuracy <= 95 ? "excluded" : "safe";
  const playerStatus = eliminatedPlayers.has(playerNameValue)
    ? "eliminated"
    : progress >= 100
      ? "finished"
      : startedAt
        ? "playing"
        : "waiting";

  const playerSnapshot = { progress, accuracy, speed, doneChars, status: playerStatus };
  renderScores(playerSnapshot);
  if (!isTeacherBattle && currentPlayerId && Date.now() - lastPlayerSyncAt > 1200) {
    lastPlayerSyncAt = Date.now();
    updateCurrentPlayer(playerSnapshot).catch(() => {});
  }
}

function setTickerMessages(messages) {
  tickerMessages = withCheerArts(messages.filter(Boolean));
  if (!tickerMessages.length) return;
  tickerIndex %= tickerMessages.length;
  applyTickerMessage(tickerMessages[tickerIndex]);
  restartTickerAnimation();
}

function rotateTicker() {
  if (!tickerMessages.length) return;
  tickerIndex = (tickerIndex + 1) % tickerMessages.length;
  applyTickerMessage(tickerMessages[tickerIndex]);
  restartTickerAnimation();
}

function withCheerArts(messages) {
  return messages.flatMap((message, index) => {
    const art = cheerArts[(tickerIndex + index) % cheerArts.length];
    return index % 2 === 0 ? [message, { text: art, art: true }] : [message];
  });
}

function applyTickerMessage(message) {
  const isArt = typeof message === "object";
  tickerText.textContent = isArt ? message.text : message;
  tickerText.classList.toggle("is-dot-art", isArt);
}

function restartTickerAnimation() {
  tickerText.style.animation = "none";
  void tickerText.offsetWidth;
  tickerText.style.animation = "";
}

function startTensionMusic() {
  if (audioContext) {
    audioContext.resume();
    return;
  }
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.035;
  masterGain.connect(audioContext.destination);
  const notes = [110, 146.83, 164.81, 196, 220, 196, 164.81, 146.83];
  let step = 0;
  musicTimer = setInterval(() => {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.type = step % 4 === 0 ? "sawtooth" : "square";
    osc.frequency.value = notes[step % notes.length];
    filter.type = "lowpass";
    filter.frequency.value = 900 + (step % 3) * 240;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
    step += 1;
  }, 190);
}

function stopTensionMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = 0;
  if (masterGain) masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
}

function runCountdownThenStart() {
  const steps = [
    { label: "3", color: "#00e8ff" },
    { label: "2", color: "#ffd166" },
    { label: "1", color: "#ff38d1" },
    { label: "START", color: "#76ff7a" }
  ];
  countdownOverlay.hidden = false;
  let index = 0;
  const showStep = () => {
    const step = steps[index];
    countdownCircle.textContent = step.label;
    countdownCircle.style.setProperty("--countdown-color", step.color);
    countdownCircle.classList.toggle("is-start", step.label === "START");
    countdownCircle.style.animation = "none";
    void countdownCircle.offsetWidth;
    countdownCircle.style.animation = "";
    index += 1;
    if (index < steps.length) {
      setTimeout(showStep, 850);
      return;
    }
    setTimeout(() => {
      countdownOverlay.hidden = true;
      countdownCircle.classList.remove("is-start");
      startTensionMusic();
      prepareBattle();
      if (isTeacherBattle) setRoomStatus("playing");
      setTickerMessages(["배틀이 시작되었습니다. 정확하고 빠르게 입력하세요.", "첫 완주자가 나오는 순간 최종 경쟁이 시작됩니다."]);
    }, 850);
  };
  showStep();
}

function renderScores(player = { progress: 0, accuracy: 100, speed: 0, doneChars: 0 }) {
  const playerNameValue = playerName.textContent.trim() || "나";
  const remoteCompetitors = remotePlayers
    .filter((student) => student.id !== currentPlayerId)
    .map((student) => ({
      name: student.student_name,
      speed: Number(student.speed || 0),
      accuracy: Number(student.accuracy || 100),
      progress: Number(student.progress || 0),
      status: student.status,
      isMe: false,
      points: Number(student.progress || 0) * 1000 + Number(student.speed || 0) * 2 + Number(student.accuracy || 0)
    }));
  const competitors = [
    ...(remoteCompetitors.length ? remoteCompetitors : students.map((student) => ({
      ...student,
      isMe: false,
      points: student.progress * 1000 + student.speed * 2 + student.accuracy
    }))),
    {
      name: playerNameValue,
      speed: player.speed,
      accuracy: player.accuracy,
      progress: player.progress,
      isMe: true,
      points: player.progress * 1000 + player.speed * 2 + player.accuracy
    }
  ];
  const ranked = competitors
    .filter((student) => student.accuracy > 95 && student.status !== "eliminated" && !eliminatedPlayers.has(student.name))
    .sort((a, b) => b.points - a.points);
  const playerEliminated = eliminatedPlayers.has(playerNameValue);

  if (!ranked.length) {
    rankText.textContent = playerEliminated ? "탈락" : "제외";
    leaderGapText.textContent = playerEliminated ? "90% 이하" : "정확도 회복 필요";
    setTickerMessages([
      playerEliminated
        ? "정확도 90% 이하 참가자는 탈락 처리됩니다."
        : "정확도 95% 이하 참가자는 실시간 순위에서 잠시 제외됩니다."
    ]);
    scoreList.innerHTML = "";
    return;
  }

  const myIndex = ranked.findIndex((student) => student.isMe);
  const leader = ranked[0];
  const me = myIndex >= 0 ? ranked[myIndex] : { speed: player.speed, accuracy: player.accuracy };
  const visibleRanked = ranked.slice(0, 10);
  const rankAnnouncements = visibleRanked.slice(0, 5).map((student, index) => {
    const rankKey = `${index + 1}:${student.name}`;
    const isNewRank = !announcedRanks.has(rankKey);
    announcedRanks.add(rankKey);
    const trend = getRankTrend(student.name, index);
    if (index === 0 && (lastLeaderName !== student.name || isNewRank)) return `${student.name} 학생 1등 등장! 현재 ${student.speed}타, 정확도 ${student.accuracy}%`;
    if (index === 1 && isNewRank) return `${student.name} 학생 2등 진입! 선두를 추격합니다.`;
    if (index === 2 && isNewRank) return `${student.name} 학생 3등 진입! 메달권 경쟁 시작.`;
    if (trend === "rank-up") return `${student.name} 학생 순위 상승! 현재 ${index + 1}등`;
    if (trend === "rank-down") return `${student.name} 학생 순위 하락, 재추격이 필요합니다.`;
    return "";
  }).filter(Boolean);
  lastLeaderName = leader.name;

  rankText.textContent = playerEliminated ? "탈락" : myIndex >= 0 ? `${myIndex + 1}등` : "제외";
  leaderGapText.textContent = `1등 ${leader.speed}타\n내 타수 ${me.speed}타`;
  setTickerMessages([
    ...rankAnnouncements,
    playerEliminated
      ? `${playerNameValue} 학생은 정확도 90% 이하로 탈락했습니다.`
      : myIndex < 0
        ? `${playerNameValue} 학생은 정확도 ${player.accuracy}%로 순위 제외 중입니다. 96% 이상이면 복귀합니다.`
        : myIndex === 0
      ? `${playerNameValue} 학생이 1등입니다. 뒤에서 추격 중입니다. 정확도를 유지하세요.`
      : `${leader.name} 학생 추격 중. 1등 ${leader.speed}타, 현재 ${me.speed}타. 차이는 ${Math.max(0, leader.speed - me.speed)}타입니다.`,
    `현재 TOP3: ${visibleRanked.slice(0, 3).map((student, index) => `${index + 1}등 ${student.isMe ? "나" : student.name}`).join(" / ")}`,
    `완주 예상: ${visibleRanked[0].name} 선두, ${visibleRanked[1]?.name || "2위"} 추격 중`
  ]);

  scoreList.innerHTML = visibleRanked.map((student, index) => `
    <li class="${student.isMe ? "is-me" : ""} ${index < 3 ? `rank-top-${index + 1}` : ""}">
      <b>${index + 1}등</b>
      <span>
        <strong>${student.isMe ? "나" : student.name}</strong>
        <small>진행율 ${student.progress}% / 분당 타자속도 ${student.speed}타 / 정확도 ${student.accuracy}%</small>
      </span>
      <em class="${getRankTrend(student.name, index)}">${getRankArrow(student.name, index)}</em>
    </li>
  `).join("");
  previousRankMap = new Map(ranked.map((student, index) => [student.name, index]));
  if (isTeacherBattle) renderTeacherRankings(remotePlayers);
}

function getRankTrend(name, index) {
  if (!previousRankMap.has(name)) return "rank-same";
  const previous = previousRankMap.get(name);
  if (index < previous) return "rank-up";
  if (index > previous) return "rank-down";
  return "rank-same";
}

function getRankArrow(name, index) {
  const trend = getRankTrend(name, index);
  if (trend === "rank-up") return "▲";
  if (trend === "rank-down") return "▼";
  return "―";
}

function buildFinalRanking(player = { progress: 100, accuracy: 100, speed: 0 }) {
  const playerNameValue = playerName.textContent.trim() || "나";
  return [
    { name: playerNameValue, speed: player.speed, accuracy: player.accuracy, progress: 100, isMe: true },
    ...students.map((student, index) => ({
      ...student,
      progress: 100,
      speed: Math.max(120, student.speed - index * 8),
      accuracy: Math.max(78, student.accuracy - index),
      isMe: false
    }))
  ]
    .map((student) => ({
      ...student,
      points: student.speed * 3 + student.accuracy * 8
    }))
    .sort((a, b) => b.points - a.points);
}

function showFinalRanking(player) {
  updateCurrentPlayer({ progress: 100, accuracy: player.accuracy, speed: player.speed, doneChars: lines.join("").length, status: "finished" }).catch(() => {});
  const ranking = buildFinalRanking(player);
  const myIndex = ranking.findIndex((student) => student.isMe);
  resultTitle.textContent = `${myIndex + 1}등`;
  resultSummary.textContent = "모든 학생이 끝까지 타이핑을 마쳤습니다.";
  finalRankList.innerHTML = ranking.map((student, index) => `
    <li class="${student.isMe ? "is-me" : ""}">
      <b>${index + 1}등</b>
      <span>${student.isMe ? "나" : student.name}</span>
      <strong>${student.speed}타 / ${student.accuracy}%</strong>
    </li>
  `).join("");
  setTickerMessages([
    `최종 1등 ${ranking[0].name}! ${ranking[0].speed}타, 정확도 ${ranking[0].accuracy}%`,
    `최종 2등 ${ranking[1]?.name || "-"}, 최종 3등 ${ranking[2]?.name || "-"}`,
    `나의 최종 순위는 ${myIndex + 1}등입니다.`
  ]);
  stopTensionMusic();
  koOverlay.classList.add("is-visible");
  typingInput.disabled = true;
}

function spawnParticles() {
  const rect = targetLine.getBoundingClientRect();
  for (let i = 0; i < 10; i += 1) {
    particles.push({
      x: rect.left + Math.random() * rect.width,
      y: rect.top + Math.random() * rect.height,
      vx: -1 + Math.random() * 2,
      vy: -3 - Math.random() * 2,
      life: 34
    });
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.09;
    particle.life -= 1;
    ctx.globalAlpha = particle.life / 34;
    ctx.fillStyle = "#536dff";
    ctx.fillRect(particle.x, particle.y, 3, 13);
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(animateParticles);
}

document.getElementById("studentEnterBtn").addEventListener("click", async () => {
  const inputCode = studentCodeInput.value.trim();
  const name = studentNameInput.value.trim() || "학생";
  currentRoomCode = inputCode;
  studentAuthMessage.textContent = "입장코드를 확인하는 중입니다...";
  const codeOk = await verifyRoomCode(inputCode);
  if (!codeOk) {
    studentAuthMessage.textContent = hasRuntimeSupabaseConfig()
      ? "입장코드가 맞지 않습니다."
      : "배포 사이트에 Supabase 기본 설정이 없어 입장코드를 확인할 수 없습니다.";
    studentCodeInput.focus();
    return;
  }
  studentAuthMessage.textContent = "배포된 지문을 불러오는 중입니다...";
  await loadActiveRoom(inputCode);
  studentAuthMessage.textContent = "학생 정보를 등록하는 중입니다...";
  await registerCurrentPlayer(name).catch(() => {});
  studentAuthMessage.textContent = "";
  isTeacherBattle = false;
  playerName.textContent = name;
  prepareBattle();
  startRoomPolling();
  showScreen(battleScreen);
});

document.getElementById("teacherEnterBtn").addEventListener("click", () => {
  if (teacherPinInput.value.trim() !== TEACHER_PIN) {
    teacherAuthMessage.textContent = "관리자 인증번호가 맞지 않습니다.";
    teacherPinInput.focus();
    return;
  }
  teacherAuthMessage.textContent = "";
  currentRoomCode = roomCode;
  syncTeacherFields();
  loadPassageTitlesForSubject();
  startTeacherPolling();
  showScreen(teacherScreen);
});

document.getElementById("newRoomBtn").addEventListener("click", () => {
  studentCodePanel.hidden = !studentCodePanel.hidden;
  customRoomCodeInput.value = roomCode;
  customRoomCodeInput.focus();
});

document.getElementById("applyRoomCodeBtn").addEventListener("click", async () => {
  const nextCode = customRoomCodeInput.value.trim();
  if (!/^\d{4,}$/.test(nextCode)) {
    roomCodeMessage.textContent = "학생 입장코드는 숫자 4자리 이상이어야 합니다.";
    customRoomCodeInput.focus();
    return;
  }
  roomCode = nextCode;
  currentRoomCode = nextCode;
  if (roomCodeEl) roomCodeEl.textContent = roomCode;
  roomCodeMessage.textContent = "입장코드를 저장하는 중입니다...";
  try {
    const saved = await saveRoomCodeToSupabase();
    roomCodeMessage.textContent = saved
      ? `학생 입장코드가 ${roomCode}(으)로 Supabase에 저장되었습니다.`
      : `학생 입장코드가 ${roomCode}(으)로 이 브라우저에만 설정되었습니다.`;
  } catch {
    roomCodeMessage.textContent = `학생 입장코드가 ${roomCode}(으)로 이 브라우저에만 설정되었습니다. Supabase 저장은 실패했습니다.`;
  }
});

document.getElementById("savePassageBtn").addEventListener("click", () => {
  saveCurrentPassage();
});
const loadPassageBtn = document.getElementById("loadPassageBtn");
if (loadPassageBtn) loadPassageBtn.addEventListener("click", loadSavedPassage);
document.getElementById("saveSupabaseConfigBtn").addEventListener("click", saveSupabaseConfig);
document.getElementById("saveSupabaseConfigInlineBtn").addEventListener("click", saveSupabaseConfig);
document.getElementById("testSupabaseBtn").addEventListener("click", testSupabaseConnection);
editPassageBtn.addEventListener("click", () => {
  passageTextInput.readOnly = !passageTextInput.readOnly;
  editPassageBtn.textContent = passageTextInput.readOnly ? "수정" : "수정 중";
  if (!passageTextInput.readOnly) passageTextInput.focus();
});
publishPassageBtn.addEventListener("click", publishPassage);
teacherBattleBtn.addEventListener("click", () => {
  publishPassage().then(() => {
    isTeacherBattle = true;
    currentRoomCode = roomCode;
    playerName.textContent = studentNameInput.value.trim() || "교사";
    prepareBattle();
    startTeacherPolling();
    showScreen(battleScreen);
  });
});
document.getElementById("goBattleBtn").addEventListener("click", () => {
  saveCurrentPassage().then(() => {
    isTeacherBattle = true;
    currentRoomCode = roomCode;
    playerName.textContent = studentNameInput.value.trim() || "교사";
    prepareBattle();
    startTeacherPolling();
    showScreen(battleScreen);
  });
});

battleStartBtn.addEventListener("click", () => {
  if (!isTeacherBattle) return;
  setRoomStatus("countdown").catch(() => {});
  runCountdownThenStart();
});

teacherSettingsBtn.addEventListener("click", () => {
  if (!isTeacherBattle) return;
  stopTensionMusic();
  showScreen(teacherScreen);
});

subjectSelect.addEventListener("change", async () => {
  const passages = await loadPassageTitlesForSubject();
  if (passages[0]) {
    currentPassage = passages[0];
    syncTeacherFields();
    passageTitleSelect.value = currentPassage.title;
  } else {
    currentPassage = subjectSelect.value === "영어" ? { ...samples.en } : { ...samples.ko, subject: subjectSelect.value, title: "새 지문" };
    syncTeacherFields();
  }
});

passageTitleInput.addEventListener("input", updateTeacherLabel);
newPassageBtn.addEventListener("click", startNewPassage);

passageTitleSelect.addEventListener("change", () => {
  if (!passageTitleSelect.value) {
    startNewPassage();
    return;
  }
  loadSavedPassage();
});

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  const textChunks = [];
  const textPattern = /\((([^\\)]|\\.)*)\)\s*Tj|\[((?:.|\n|\r)*?)\]\s*TJ/g;
  let match;
  while ((match = textPattern.exec(binary)) !== null) {
    if (match[1]) textChunks.push(decodePdfString(match[1]));
    if (match[3]) {
      const innerMatches = [...match[3].matchAll(/\((([^\\)]|\\.)*)\)/g)];
      innerMatches.forEach((inner) => textChunks.push(decodePdfString(inner[1])));
    }
  }
  return textChunks
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodePdfString(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

textFileInput.addEventListener("change", async () => {
  const file = textFileInput.files[0];
  if (!file) return;
  passageTitleInput.value = file.name.replace(/\.(txt|pdf)$/i, "");
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const extracted = await extractPdfText(file);
    passageTextInput.value = extracted || "PDF에서 텍스트를 자동 추출하지 못했습니다. 복사 가능한 PDF인지 확인한 뒤 지문을 직접 붙여넣어 주세요.";
    driveState.textContent = extracted ? "PDF 텍스트 추출 완료" : "PDF 텍스트 추출 실패";
  } else {
    passageTextInput.value = await file.text();
    driveState.textContent = "텍스트 파일 업로드 완료";
  }
  passageTextInput.readOnly = false;
  editPassageBtn.textContent = "수정 중";
  updateTeacherLabel();
});

typingInput.addEventListener("input", () => {
  if (!startedAt) {
    startedAt = Date.now();
    startTensionMusic();
    clearInterval(timerId);
    timerId = setInterval(updateStats, 1000);
  }
  const target = lines[currentLineIndex] || "";
  const typed = typingInput.value;
  const lastIndex = typed.length - 1;
  if (lastIndex >= 0 && typed[lastIndex] !== target[lastIndex]) mistakeCount += 1;
  if (typed === target) {
    spawnParticles();
    if (currentLineIndex >= lines.length - 1) {
      const finalAccuracy = calculateAccuracy();
      const elapsed = startedAt ? Date.now() - startedAt : 0;
      const elapsedMinutes = elapsed ? Math.max(elapsed / 60000, 0.05) : 0;
      const finalSpeed = elapsedMinutes ? Math.round(lines.join("").length / elapsedMinutes) : 0;
      updateStats();
      showFinalRanking({ speed: finalSpeed, accuracy: finalAccuracy, progress: 100 });
      return;
    }
    currentLineIndex += 1;
    typingInput.value = "";
  }
  updateLineView();
  updateStats();
});

document.getElementById("prevLineBtn").addEventListener("click", () => {
  currentLineIndex = Math.max(0, currentLineIndex - 1);
  typingInput.value = "";
  updateLineView();
  updateStats();
});

document.getElementById("nextLineBtn").addEventListener("click", () => {
  currentLineIndex = Math.min(lines.length - 1, currentLineIndex + 1);
  typingInput.value = "";
  updateLineView();
  updateStats();
});

langToggleBtn.addEventListener("click", () => {
  currentLang = currentLang === "ko" ? "en" : "ko";
  langToggleBtn.textContent = currentLang === "ko" ? "한타" : "영타";
  currentPassage = currentLang === "ko" ? { ...samples.ko } : { ...samples.en };
  prepareBattle();
});

window.addEventListener("resize", resizeCanvas);

loadSupabaseConfig();
syncTeacherFields();
resizeCanvas();
animateParticles();
setInterval(() => {
  if (!tickerWindow) return;
  const sparks = [
    "rgba(255, 255, 255, 0.5)",
    "rgba(255, 56, 209, 0.44)",
    "rgba(184, 118, 255, 0.44)",
    "rgba(255, 168, 224, 0.42)"
  ];
  tickerWindow.style.setProperty("--led-spark", sparks[Math.floor(Math.random() * sparks.length)]);
}, 850);
tickerText.addEventListener("animationend", rotateTicker);
