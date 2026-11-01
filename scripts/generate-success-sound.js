// Generates assets/sounds/success.wav: a short, soft three-note rising chime
// played when a learner drops the right letter. Run: node scripts/generate-success-sound.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const NOTES = [
  { freq: 659.25, start: 0.0 }, // E5
  { freq: 783.99, start: 0.11 }, // G5
  { freq: 1046.5, start: 0.22 }, // C6
];
const NOTE_LENGTH = 0.6;
const TOTAL_SECONDS = 0.95;

const samples = new Float64Array(Math.floor(SAMPLE_RATE * TOTAL_SECONDS));

for (const { freq, start } of NOTES) {
  const offset = Math.floor(start * SAMPLE_RATE);
  const length = Math.floor(NOTE_LENGTH * SAMPLE_RATE);
  for (let i = 0; i < length && offset + i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.008); // avoid a click at note start
    const decay = Math.exp(-t * 6);
    const tone = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
    samples[offset + i] += tone * attack * decay;
  }
}

// Normalise to a comfortable, non-clipping level.
const peak = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0);
const gain = 0.6 / peak;

const data = Buffer.alloc(samples.length * 2);
samples.forEach((s, i) => data.writeInt16LE(Math.round(s * gain * 32767), i * 2));

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16); // PCM chunk size
header.writeUInt16LE(1, 20); // PCM format
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
header.writeUInt16LE(2, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'success.wav');
fs.writeFileSync(outFile, Buffer.concat([header, data]));
console.log(`Wrote ${outFile} (${header.length + data.length} bytes)`);
