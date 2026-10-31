import { byId } from './dom';

const TRACKS = ['music/harbor-stillness-1.mp3', 'music/harbor-stillness-2.mp3'];
const VOLUME = 0.4;
const MUTED_KEY = 'zeus.music.muted';

export function attachMusic(): void {
  const button = byId<HTMLButtonElement>('music-button');
  const audio = new Audio(TRACKS[0]);
  audio.volume = VOLUME;
  let track = 0;
  let muted = localStorage.getItem(MUTED_KEY) === '1';

  function play(): void {
    // Browsers refuse playback until the player has interacted with the page; the next gesture retries.
    audio.play().catch(() => {});
  }

  function playOnGesture(): void {
    if (!muted && audio.paused) play();
  }

  function toggle(): void {
    muted = !muted;
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
    button.classList.toggle('active', !muted);
    if (muted) audio.pause();
    else play();
  }

  audio.addEventListener('ended', () => {
    track = (track + 1) % TRACKS.length;
    audio.src = TRACKS[track];
    play();
  });
  button.classList.toggle('active', !muted);
  button.addEventListener('click', toggle);
  window.addEventListener('pointerdown', playOnGesture);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && !e.repeat) toggle();
    else playOnGesture();
  });
}
