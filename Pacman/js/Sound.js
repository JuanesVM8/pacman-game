const SOUND_FILES = Object.freeze({
  START: "game_start.wav",
  MUNCH_1: "munch_1.wav",
  MUNCH_2: "munch_2.wav",
  POWER: "power_pellet.wav",
  DEATH: "death_1.wav",
  WIN: "intermission.wav",
  SIREN: "siren_1.wav",
});

const audioPool = new Map();
export let isMuted = false;

export function toggleMute() {
  isMuted = !isMuted;
  for (const audio of audioPool.values()) {
    audio.muted = isMuted;
  }
  return isMuted;
}

function getAudio(key) {
  if (!audioPool.has(key)) {
    const file = SOUND_FILES[key];
    if (!file) return null;
    const audio = new Audio(`assets/sounds/${file}`);
    audio.preload = "auto";
    audio.muted = isMuted;
    audioPool.set(key, audio);
  }
  return audioPool.get(key);
}

function safePlay(audio, restart = true) {
  if (!audio) return;
  if (restart) {
    audio.currentTime = 0;
  }
  const p = audio.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {});
  }
}

export function playSfx(name) {
  const audio = getAudio(name);
  safePlay(audio, true);
}

export function playLoop(name, volume = 0.2) {
  const audio = getAudio(name);
  if (!audio) return;
  audio.loop = true;
  audio.volume = volume;
  safePlay(audio, false);
}

export function stopLoop(name) {
  const audio = getAudio(name);
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
}
