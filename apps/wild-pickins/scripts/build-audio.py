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
        # The bundled tick remains a sprite fallback; runtime spin playback uses
        # static/assets/audio/effects/symbolFastWhoosh.wav instead.
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
    # Keep the 75/75/75 starting sliders, with the music/effects balance of the
    # preferred screenshot at approximately 70/70/80. The effects gain below
    # already matches that reference within 0.04 dB.
    for name, config in catalogue['config'].items():
        config['volume'] = 1 if name.startswith('bgm_') else 8 / 9
    catalogue['config']['bgm_main']['volume'] = 0.14
    catalogue['config']['bgm_freespin']['volume'] = 0.30
    catalogue['config']['sfx_btn_spin']['volume'] = 0.55 * 8 / 9
    # Keep the 59 ms control click below the spin cue, especially during bet stepping.
    catalogue['config']['sfx_btn_general']['volume'] = 0.38
    # Tiny follow-up mix pass: Wild +0.5 dB, money-bag drop about -1 dB.
    # The five scatter hits retain their shared level.
    catalogue['config']['sfx_multiplier_landing']['volume'] = 1.06
    catalogue['config']['sfx_money_drop']['volume'] = 0.79
    # Keep every scatter landing at one level, 2.5 dB below the former mix.
    # The anticipation riser and bonus entry retain their separate gains.
    for scatter in range(1, 6):
        catalogue['config'][f'sfx_scatter_stop_{scatter}']['volume'] = 0.75 * 8 / 9
    # Keep the bonus transition music near the bed instead of letting several
    # full-level one-shots dominate it. Accent hits can still sit above it.
    for name, volume in {
        'sfx_scatter_riser': 0.45,
        'sfx_anticipation_start': 0.20,
        'jng_intro_fs': 0.40,
        'sfx_bonus_yeehaw': 0.50,
        'sfx_bonus_ending_riser': 0.35,
        'sfx_youwon_panel': 0.40,
    }.items():
        catalogue['config'][name]['volume'] = volume
    # The anticipation tick shares the original tick recording retained in
    # the sprite, while runtime uses its standalone WAV for a clean loop.
    catalogue['sprite']['sfx_anticipation_start'] = [*catalogue['sprite']['sfx_btn_spin'][:2], True]
    catalogue['sprite'].pop('sfx_ultra_toggle', None)
    catalogue['config'].pop('sfx_ultra_toggle', None)

    # The healing spell ships as its original MP3 in a standalone Howl.
    catalogue['sprite']['sfx_bonus_continue_spell'] = [0, 3395.918, False]
    catalogue['config']['sfx_bonus_continue_spell'] = {'volume': 0.55}
    catalogue['sprite']['sfx_bonus_continue_wood_zap'] = [0, 1875.034, False]
    catalogue['config']['sfx_bonus_continue_wood_zap'] = {'volume': 0.55}
    catalogue['sprite']['sfx_bonus_summary_modest'] = [0, 3030.204, False]
    catalogue['config']['sfx_bonus_summary_modest'] = {'volume': 0.38}
    catalogue['sprite']['sfx_bonus_summary_strong'] = [0, 6034.286, False]
    catalogue['config']['sfx_bonus_summary_strong'] = {'volume': 0.40}
    catalogue['sprite']['sfx_farm_entry_riser'] = [0, 6034.286, False]
    catalogue['config']['sfx_farm_entry_riser'] = {'volume': 0.35}
    for reel in range(1, 6):
        # Runtime routes this cue to effects/reelStopWood.wav; retain the sprite fallback.
        catalogue['config'][f'sfx_reel_stop_{reel}']['volume'] = 0.16 * 8 / 9
    catalogue['src'] = ['./assets/audio/sounds.mp3']
    (AUDIO / 'sounds.json').write_text(json.dumps(catalogue, indent=2) + '\n')
    (APP / 'src/game/audioSprite.json').write_text(json.dumps(catalogue, indent=2) + '\n')


if __name__ == '__main__':
    main()
