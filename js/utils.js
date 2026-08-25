window.addEventListener("error", (event) => {
  const error = `${event.type}: ${event.message}`;
  console.error(error);
  alert(error);
});

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hide(element) {
  element.classList.add("hidden");
}

function show(element) {
  element.classList.remove("hidden");
}

function blink(element) {
  element.classList.add("hidden");

  setTimeout(() => element.classList.remove("hidden"), 100);
}

function save(key, value) {
  localStorage.setItem(`${projectName}_${key}`, JSON.stringify(value));
}

function load(key, defaultValue) {
  const savedValue = localStorage.getItem(`${projectName}_${key}`);
  if (savedValue == null) return defaultValue;
  return JSON.parse(savedValue);
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function getFileName(file) {
  const encoded = file.name;
  const decoded = decodeURIComponent(encoded);
  const fileName = decoded.split("/").pop();

  return fileName;
}

function getFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function changeScreen(screenName) {
  document.querySelectorAll(".screen").forEach((element) => {
    element.classList.add("hidden");
  });

  document.querySelector(`.screen.${screenName}`).classList.remove("hidden");
}

function createLinks(element) {
  const text = element.innerHTML;
  const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  const replacedText = text.replace(urlPattern, (url) => `<a href="${url}" target="_blank">${url}</a>`);
  element.innerHTML = replacedText;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readClipboard() {
  await sleep(1000);
  if (!document.hasFocus()) return;
  if (!(navigator.clipboard && navigator.clipboard.readText)) return;

  const clipboardText = await navigator.clipboard.readText();

  return clipboardText;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.body.requestFullscreen();
  else document.exitFullscreen();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cycleIndex(index, length) {
  return ((index % length) + length) % length;
}

function getFileName(file) {
  const lastDotIndex = file.name.lastIndexOf(".");
  if (lastDotIndex <= 0) return file.name; // No extension or hidden file
  return file.name.substring(0, lastDotIndex);
}

function isSubtitle(file) {
  const subtitleExtensions = ["srt", "vtt"];

  const extension = file.name.split(".").pop().toLowerCase();

  return subtitleExtensions.includes(extension);
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = String(mins).padStart(2, "0");
  const formattedSecs = String(secs).padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${formattedMins}:${formattedSecs}`;
  }
  return `${formattedMins}:${formattedSecs}`;
}
