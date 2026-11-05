const NOTES_HZ = [880, 1174.66];
const NOTE_SPACING_S = 0.18;
const NOTE_LENGTH_S = 0.45;
const PEAK_GAIN = 0.25;

// Short two-note chime generated with Web Audio: no audio asset needed
export function playChime(): void {
  const context = new AudioContext();
  void context.resume();
  const start = context.currentTime;
  NOTES_HZ.forEach((frequency, index) => {
    const at = start + index * NOTE_SPACING_S;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, at + NOTE_LENGTH_S - 0.05);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + NOTE_LENGTH_S);
  });
  setTimeout(() => void context.close(), 1500);
}
