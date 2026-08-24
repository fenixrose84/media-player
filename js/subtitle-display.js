const SubtitleDisplay = (() => {
  // --- DOM ELEMENTS ---
  const element = document.querySelector(".subtitle-display");
  const fileInput = document.querySelector(".subtitle-input");

  // --- APP STATE ---
  let subtitles = [];
  let currentTime = 0;
  let duration = 0;
  let isPlaying = false;
  let playbackRate = 1.0;
  let timerId = null;
  let lastTimestamp = null;

  // --- PARSER (SRT & VTT) ---
  function parseSubtitles(text) {
    const blocks = text.trim().replace(/\r\n/g, "\n").split(/\n\n+/);
    const parsed = [];

    blocks.forEach((block) => {
      const lines = block.split("\n");
      let timeLineIndex = lines.findIndex((l) => l.includes("-->"));
      if (timeLineIndex === -1) return;

      const [startStr, endStr] = lines[timeLineIndex].split("-->");
      const startTime = parseTimestamp(startStr);
      const endTime = parseTimestamp(endStr);
      const content = lines.slice(timeLineIndex + 1).join("<br>");

      parsed.push({ startTime, endTime, content });
    });

    return parsed;
  }

  async function openFile(file) {
    if (!file) return;

    const text = await file.text();
    subtitles = parseSubtitles(text);
    subtitles = subtitles.filter((item) => item.content !== "[Music]");

    duration = subtitles[subtitles.length - 1].endTime;

    pause();
    currentTime = 0;

    updateUI();
  }

  // --- PLAYBACK ENGINE ---
  function tick(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    currentTime += delta * playbackRate;

    if (currentTime >= duration) {
      currentTime = duration;
      pause();
    }

    updateUI();

    if (isPlaying) {
      timerId = requestAnimationFrame(tick);
    }
  }

  function play() {
    if (isPlaying || subtitles.length === 0) return;
    isPlaying = true;
    lastTimestamp = null;
    timerId = requestAnimationFrame(tick);
    toggle(true);
  }

  function replay() {
    seekTo(0);
    play();
  }

  function pause() {
    isPlaying = false;
    if (timerId) cancelAnimationFrame(timerId);
  }

  function seekTo(time) {
    currentTime = Math.max(0, Math.min(time, duration));
    updateUI();
  }

  function toggle(force) {
    if (force != null) {
      element.classList.toggle("hidden", !force);
    } else {
      element.classList.toggle("hidden");
    }
  }

  // --- UI UPDATES ---
  function updateUI() {
    // Find active subtitle index
    const currentIndex = subtitles.findIndex((s) => currentTime >= s.startTime && currentTime <= s.endTime);

    if (currentIndex === -1) return;

    element.innerHTML = "";
    for (let i = 0; i <= 2; i++) {
      const order = 2 - i;
      displaySubtitle(currentIndex - order);
    }
  }

  function displaySubtitle(index) {
    const subtitle = subtitles[index];
    if (!subtitle) return;
    element.innerHTML += `${subtitle.content}<br>`;
  }

  // --- TIME PARSING ---
  function parseTimestamp(timeStr) {
    const normalized = timeStr.replace(",", ".").trim();
    const parts = normalized.split(":");
    let hrs = 0,
      mins = 0,
      secs = 0;

    if (parts.length === 3) {
      hrs = parseFloat(parts[0]);
      mins = parseFloat(parts[1]);
      secs = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      mins = parseFloat(parts[0]);
      secs = parseFloat(parts[1]);
    }
    return hrs * 3600 + mins * 60 + secs;
  }

  return { openFile, play, replay, pause, seekTo, toggle };
})();
