const audioPlayer = document.getElementById("audio-player");
const videoPlayer = document.getElementById("video-player");

const coverEl = document.querySelector(".media-container .cover");
const titleEl = document.querySelector(".app .title p");
const controlsEl = document.querySelector(".controls");
const progressBar = document.querySelector(".progress-bar .slider");
const pauseBtn = document.querySelector(".controls .pause");

const volumeDisplay = document.querySelector(".controls .volume .value");
const repeatBtn = document.querySelector(".controls .repeat");
const rateBtn = document.querySelector(".controls .rate");

let currentPlayer = null;
let currentVolume = load("currentVolume", 50)
let currentRate = 1;

let isMuted = load("isMuted", false)
let repeatEnabled = false;

let currentFiles = [];
let currentFile = -1;
let currentSubtitles = []
let currentSubtitle = null;

let currentCover = null;
let animationInterval = null;

document.addEventListener("DOMContentLoaded", async function () {
  updateVolumeDisplay();
  currentCover = await DB.getItem("settings", "cover")
  updateCoverEl()
});

async function openFile(file) {
  if (!file) return;
  
  const subtitle = currentSubtitles.find(subtitle => getFileName(subtitle) === getFileName(file))
  if (subtitle) {
    await SubtitleDisplay.openFile(subtitle)
    currentSubtitle = subtitle
  } else {
    currentSubtitle = null
    SubtitleDisplay.toggle(false)
  }
  
  const isAudio = file.type.startsWith("audio/");
  const isVideo = file.type.startsWith("video/");
  
  if (!isAudio && !isVideo) return;

  const dataUrl = URL.createObjectURL(file);

  if (currentPlayer) currentPlayer.pause();

  if (isAudio) {
    currentPlayer = audioPlayer;
    videoPlayer.classList.add("hidden");
  } else if (isVideo) {
    currentPlayer = videoPlayer;
    audioPlayer.classList.add("hidden");
  }

  const decodedFileName = decodeURIComponent(file.name).split("/").pop();
  titleEl.textContent = decodedFileName;
  currentPlayer.classList.remove("hidden");
  currentPlayer.src = dataUrl;
  currentPlayer.play();

  if (isVideo) coverEl.classList.add("hidden")
  document.title = decodedFileName + " - Media Player";
  toggleHeaderMenu(false);
}

function openFiles(files) {
  if (!files) return;
  if (files.length <= 0) return;

  const filtered = Array.from(files).filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'));
  currentFiles = shuffle(filtered)

  const subtitles = Array.from(files).filter(file => isSubtitle(file));
  currentSubtitles = subtitles

  openNext();
}

function openNext() {
  currentFile = cycleIndex(currentFile + 1, currentFiles.length)
  openFile(currentFiles[currentFile]);
}

function openPrev() {
  currentFile = cycleIndex(currentFile - 1, currentFiles.length)
  openFile(currentFiles[currentFile]);
}

function pause() {
  if (!currentPlayer) return;

  const ended = currentPlayer.currentTime >= currentPlayer.duration - 0.1;

  if (!ended) currentPlayer.paused ? currentPlayer.play() : currentPlayer.pause();
  else {
    replay();
    return;
  }
}

function replay() {
  if (!currentPlayer) return;

  currentPlayer.currentTime = 0;
  currentPlayer.play();
  SubtitleDisplay.replay()
}

function updatePauseBtn() {
  if (!currentPlayer) return;

  const ended = currentPlayer.currentTime >= currentPlayer.duration - 0.1;
  if (!ended) {
    pauseBtn.innerHTML = currentPlayer.paused
      ? `
      <i class="bi bi-play-fill"></i>
      <div class="tooltip-text">Play (k)</div>
    `
      : `
      <i class="bi bi-pause-fill"></i>
      <div class="tooltip-text">Pause (k)</div>
    `;
  } else {
    pauseBtn.innerHTML = `
      <i class="bi bi-arrow-counterclockwise"></i>
      <div class="tooltip-text">Replay (k)</div>
    `;
  }
}

function changeVolume(direction) {
  let amount = direction >= 0 ? 5 : -5;

  if (currentVolume <= 5 && amount < 0) amount = -1;
  if (currentVolume < 5 && amount > 0) amount = 1;

  currentVolume = Math.min(Math.max(currentVolume + amount, 0), 100);

  if (currentPlayer) currentPlayer.volume = currentVolume / 100;
  save("currentVolume", currentVolume)
  updateVolumeDisplay();
  Toast.show(`<i class="bi bi-volume-down-fill"></i> ${currentVolume}%`)
}

function updateVolumeDisplay() {
  volumeDisplay.textContent = currentVolume;

  let icon = isMuted ? `<i class="bi bi-volume-mute-fill"></i>` : `<i class="bi bi-volume-down-fill"></i>`;
  document.querySelector(".controls .volume .mute-btn").innerHTML = icon;
}

function mute() {
  isMuted = !isMuted;
  if (currentPlayer) currentPlayer.muted = isMuted;

  save("isMuted", isMuted)

  updateVolumeDisplay();
}

function jump(amount) {
  if (!currentPlayer) return

  currentPlayer.currentTime += amount
  Toast.show(`${amount} seconds`);
}

function toggleRepeat() {
  repeatEnabled = !repeatEnabled;

  repeatBtn.innerHTML = `
    <i class="bi bi-repeat${repeatEnabled ? "-1" : ""}"></i>
    <div class="tooltip-text">Repeat ${repeatEnabled ? "on" : "off"}</div>
  `;
}

function stop() {
  if (!currentPlayer) return;

  currentPlayer.pause();
  currentPlayer.currentTime = 0;
}

function updateProgressBar() {
  progressBar.min = 0;
  progressBar.max = currentPlayer.duration;
  progressBar.value = currentPlayer.currentTime;
}

function seekTo(time) {
  if (!currentPlayer) return;

  currentPlayer.currentTime = time;

  if (currentPlayer.paused) currentPlayer.play();

  if (currentSubtitle) SubtitleDisplay.seekTo(time)
}

function changeRate() {
  currentRate = Math.max(0.75, (currentRate + 0.25) % 1.5)

  if (currentPlayer) currentPlayer.playbackRate = currentRate;

  rateBtn.innerHTML = `
  ${currentRate}x
  <div class="tooltip-text">Playback speed ${currentRate}x</div>
  `;
  Toast.show(`${currentRate}x`)
}

async function changeCover(file) {
  if (!file) return

  currentCover = file
  updateCoverEl();

  DB.putItem("settings", currentCover, "cover")
}

function updateCoverEl() {
  coverEl.src = currentCover ? URL.createObjectURL(currentCover) : "";
  coverEl.classList.toggle("hidden", !currentCover);
}

function startAnimation() {
  clearInterval(animationInterval);
  animationInterval = setInterval(animate, 500);
}

function stopAnimation() {
  clearInterval(animationInterval);
}

function animate() {
  const x = Math.random() * 0.8 - 0.4;
  const y = Math.random() * 0.8 - 0.4;
  const scale = 1.01 + Math.random() * 0.01;

  coverEl.style.transform = `translate(${x}%, ${y}%) scale(${scale})`;
}

function switchControlMenu() {
  const buttonsEl = document.querySelectorAll(".controls .buttons");

  buttonsEl.forEach((el) => {
    el.classList.toggle("active");
  });
}

function toggleHeaderMenu(force) {
  document.querySelector(".header .menu").classList.toggle("expanded", force);
}

[audioPlayer, videoPlayer].forEach((player) => {
  player.addEventListener("loadedmetadata", function () {
    player.volume = currentVolume / 100;
    player.muted = isMuted;
    player.playbackRate = currentRate;
    updateVolumeDisplay();
    updatePauseBtn();
  });
  player.addEventListener("timeupdate", updateProgressBar);

  player.addEventListener("play", function () {
    startAnimation();
    updatePauseBtn();
    if (currentSubtitle) SubtitleDisplay.play()
  });

  player.addEventListener("pause", function () {
    stopAnimation();
    updatePauseBtn();
    if (currentSubtitle) SubtitleDisplay.pause()
  });

  player.addEventListener("ended", () => {
    if (!repeatEnabled) {
      currentFile < currentFiles.length - 1 ? openNext() : updatePauseBtn();
    } else {
      replay()
      if (currentSubtitle) SubtitleDisplay.replay()
    }
  });
});

const keyActions = {
  Space: pause,
  KeyK: pause,
  ArrowUp: () => changeVolume(1),
  KeyW: () => changeVolume(1),
  KeyI: () => changeVolume(1),
  ArrowDown: () => changeVolume(-1),
  KeyS: () => changeVolume(-1),
  KeyU: () => changeVolume(-1),
  KeyM: mute,
  KeyL: () => jump(5),
  ArrowRight: () => jump(5),
  KeyD: () => jump(5),
  KeyJ: () => jump(-5),
  ArrowLeft: () => jump(-5),
  KeyA: () => jump(-5),
  KeyF: toggleFullscreen,
};

document.addEventListener("keydown", (event) => {
  const action = keyActions[event.code];
  if (action) {
    event.preventDefault();
    action();
  }
});
