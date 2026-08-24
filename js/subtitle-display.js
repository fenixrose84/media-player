const SubtitleDisplay = (() => {
  const element = document.querySelector(".subtitle-display");

  let subtitles = [];
  let currentTime = 0;
  let duration = 0;

  async function openFile(file) {
    if (!file) return;

    const text = await file.text();
    subtitles = parseSubtitles(text);

    duration = subtitles[subtitles.length - 1].endTime;
    
    seekTo(0)
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

  function updateUI() {
    const activeSubtitles = subtitles.filter((s) => currentTime >= s.startTime && currentTime <= s.endTime);

    const subtitlesFound = activeSubtitles.length > 0
    if (subtitlesFound) {
      element.innerHTML = activeSubtitles.map((sub) => `${sub.content}<br>`).join("");
    } else {
      element.innerHTML = "";
    }

    element.classList.toggle("hidden", !subtitlesFound)
  }

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

  return { openFile, seekTo, toggle };
})();
