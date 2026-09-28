"""Make the shipped wooden reel stop less bright without changing its timing."""

import math
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'scripts/audio-sources/reel-stop-wood-original.wav'
TARGET = ROOT / 'static/assets/audio/effects/reelStopWood.wav'
CUTOFF_HZ = 2500
Q = 1 / math.sqrt(2)  # Butterworth: smooth passband, 12 dB/octave rolloff.


def main():
    with wave.open(str(SOURCE), 'rb') as source:
        channels = source.getnchannels()
        rate = source.getframerate()
        frames = source.getnframes()
        if source.getsampwidth() != 2 or channels != 2 or rate != 44100:
            raise ValueError('Expected stereo 44.1 kHz, 16-bit PCM source')
        samples = struct.unpack(f'<{frames * channels}h', source.readframes(frames))

    omega = 2 * math.pi * CUTOFF_HZ / rate
    cosine = math.cos(omega)
    alpha = math.sin(omega) / (2 * Q)
    b0 = (1 - cosine) / (2 * (1 + alpha))
    b1 = (1 - cosine) / (1 + alpha)
    b2 = b0
    a1 = -2 * cosine / (1 + alpha)
    a2 = (1 - alpha) / (1 + alpha)
    states = [[0.0, 0.0, 0.0, 0.0] for _ in range(channels)]
    filtered = []
    for index, sample in enumerate(samples):
        state = states[index % channels]
        value = sample / 32768
        output = b0 * value + b1 * state[0] + b2 * state[1] - a1 * state[2] - a2 * state[3]
        state[1], state[0] = state[0], value
        state[3], state[2] = state[2], output
        filtered.append(output)

    # Match overall sample RMS so this edit changes brightness, not cue level.
    original_rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples)) / 32768
    filtered_rms = math.sqrt(sum(sample * sample for sample in filtered) / len(filtered))
    gain = original_rms / filtered_rms
    if max(abs(sample * gain) for sample in filtered) >= 1:
        raise ValueError('Filtered audio would clip')
    pcm = struct.pack(f'<{len(filtered)}h', *(round(sample * gain * 32767) for sample in filtered))
    with wave.open(str(TARGET), 'wb') as target:
        target.setnchannels(channels)
        target.setsampwidth(2)
        target.setframerate(rate)
        target.writeframes(pcm)


if __name__ == '__main__':
    main()
