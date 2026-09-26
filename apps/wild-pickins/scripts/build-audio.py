"""Rebuild the template sprite from MP3 sources. Requires FFmpeg on PATH or FFMPEG_BINARY."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import wave

APP = Path(__file__).resolve().parent.parent
AUDIO = APP / 'static/assets/audio'
SOURCES = APP / 'scripts/audio-sources'
FFMPEG = os.environ.get('FFMPEG_BINARY', 'ffmpeg')
RATE = 44100
# This MP3 has about 11 ms of near-silent padding after the musical loop.
MUSIC_TAIL_TRIM_FRAMES = round(RATE * 0.011)


def decode(source, target):
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', str(source),
                    '-ar', str(RATE), '-ac', '2', '-c:a', 'pcm_s16le', str(target)], check=True)
    with wave.open(str(target), 'rb') as audio:
        return audio.readframes(audio.getnframes())


def main():
    catalogue = json.loads((AUDIO / 'sounds.json').read_text())
    replacements = [
        ('music.mp3', ['bgm_main'], True, 0.5),
        ('bonus-music.mp3', ['bgm_freespin'], True, 0.5),
        ('normal-win.mp3', ['sfx_winlevel_small'], False, 0.65),
        ('bonus-entry.mp3', ['jng_intro_fs'], False, 0.7),
        ('bonus-summary.mp3', ['sfx_youwon_panel'], False, 0.7),
        ('yeehaw.mp3', ['sfx_bonus_yeehaw'], False, 0.65),
        ('spin-award.mp3', ['sfx_fs_respins'], False, 0.5),
        ('bonus-open.mp3', ['sfx_bonus_open'], False, 0.55),
        ('bonus-close.mp3', ['sfx_bonus_close'], False, 0.55),
        ('money-drop.mp3', ['sfx_money_drop'], False, 0.65),
        ('money-pour.mp3', ['sfx_money_pour'], False, 0.5),
        ('scatter-riser.mp3', ['sfx_scatter_riser'], False, 0.55),
        ('bonus-ending-riser.mp3', ['sfx_bonus_ending_riser'], False, 0.55),
        ('spin.mp3', ['sfx_btn_spin'], True, 0.45),
        ('reel-stop.mp3', [f'sfx_reel_stop_{n}' for n in range(1, 6)], False, 0.6),
    ]
    replacements.extend((f'scatter-level-{n}.mp3', [f'sfx_scatter_stop_{n}'], False, 0.65) for n in range(1, 6))
    with tempfile.TemporaryDirectory() as directory:
        temp = Path(directory)
        # Always start from the untouched template, so repeated builds never append twice.
        pcm = bytearray(decode(AUDIO / 'legacy/template.mp3', temp / 'original.wav'))
        for filename, names, loop, volume in replacements:
            pcm.extend(bytes(RATE * 4))  # One second of silence between sprite regions.
            start = len(pcm) / 4 / RATE * 1000
            clip = decode(SOURCES / filename, temp / filename.replace('.mp3', '.wav'))
            if filename == 'music.mp3':
                clip = clip[:-MUSIC_TAIL_TRIM_FRAMES * 4]
            duration = len(clip) / 4 / RATE * 1000
            pcm.extend(clip)
            if loop and filename != 'spin.mp3':
                # Encode the seam against its actual continuation, not silence.
                # This guard is outside the sprite's loop interval.
                pcm.extend(clip[:round(RATE * 0.05) * 4])
            for name in names:
                catalogue['sprite'][name] = [start, duration, loop]
                catalogue['config'][name] = {'volume': 1}
        pcm.extend(bytes(RATE * 4))
        with wave.open(str(temp / 'sprite.wav'), 'wb') as audio:
            audio.setnchannels(2)
            audio.setsampwidth(2)
            audio.setframerate(RATE)
            audio.writeframes(pcm)
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', str(temp / 'sprite.wav'),
                        '-c:a', 'libmp3lame', '-b:a', '192k', str(temp / 'sounds.mp3')], check=True)
        (AUDIO / 'sounds.mp3').write_bytes((temp / 'sounds.mp3').read_bytes())
    # Old alternative encodings must not take precedence over the new MP3 sprite.
    for config in catalogue['config'].values():
        config['volume'] = 1
    catalogue['config']['bgm_main']['volume'] = 0.11
    catalogue['config']['bgm_freespin']['volume'] = 0.14
    catalogue['config']['sfx_btn_spin']['volume'] = 1
    for reel in range(1, 6):
        catalogue['config'][f'sfx_reel_stop_{reel}']['volume'] = 0.45
    catalogue['src'] = ['./assets/audio/sounds.mp3']
    (AUDIO / 'sounds.json').write_text(json.dumps(catalogue, indent=2) + '\n')
    (APP / 'src/game/audioSprite.json').write_text(json.dumps(catalogue, indent=2) + '\n')


if __name__ == '__main__':
    main()
