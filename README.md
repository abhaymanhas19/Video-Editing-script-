# Video Overlay Pipeline

This project turns a raw talking-head video into an edited clip with animated
overlays, timed subtitles, and background music. All of the heavy lifting is
handled by `video_overlay_script.py`, which orchestrates OpenCV for frame level
work and MoviePy/Whisper for audio and transcription.

## Features
- **Highlight overlays:** Drop a secondary clip on top of the main footage for
  specific phrases. Re‑used clips keep playing across consecutive subtitles and
  stay visible until the next subtitle begins.
- **Subtitle control:** Auto-generate word timestamps with Whisper or provide
  your own transcript. Subtitles stay on screen until the next subtitle starts,
  and you can override the text, styling, and layout.
- **Audio mixing:** Preserve the original audio, add per-highlight music beds,
  and/or score the entire output with a global background track.
- **One-stop render:** Outputs the composited video (and, when audio mixing is
  required, a temporary silent pass that is cleaned up automatically).

## Requirements
- Python 3.9+ (MoviePy 2.x and Whisper require a fairly recent Python).
- System packages for video encoding/decoding (FFmpeg, libx264).
- Install Python dependencies:

```bash
pip install -r requirements.txt
```

GPU support is optional but strongly recommended for Whisper and large overlay
clips.

## Project layout
- `video_overlay_script.py` – main pipeline and CLI.
- `demo_project.json` – example configuration describing highlights, subtitles,
  music, and styling.
- `clips/` & `audio_files/` – reusable overlay/video and music assets.

Running the script will also emit word-level transcripts as
`<video>_subtitle.json` and plain-text transcripts beside the media file.

## Configuration
All runtime options live in a JSON file. Key sections from `demo_project.json`:

- `transcript_text` *(optional)* – supply a transcript instead of running
  Whisper.
- `highlight_assignments` – list of phrases to highlight. Each item can specify:
  - `phrase` / manual `start_word` & `end_word`
  - `clip_path` overlay video
  - `music_path` & `music_volume`
- `global_music_path` / `global_music_volume` – looped music bed that covers the
  entire output.
- `subtitle_sentences` – custom subtitle text mapped to phrases.
- `subtitle_design` – colour, font, padding, etc.
- `preserve_audio` – mix the original soundtrack into the final render.

You can also provide precomputed `subtitle_segments` (word index pairs) when you
want full manual control.

## Usage

```bash
python video_overlay_script.py \
  --main-video input.mp4 \
  --config demo_project.json \
  --output output.mp4
```

What happens under the hood:
1. Whisper (or the provided transcript) generates word timestamps.
2. Highlight phrases are resolved to word ranges and paired with overlay clips.
3. Subtitles are rendered frame-by-frame; overlays loop or hold the last frame
   until the next subtitle starts so there are no gaps.
4. If audio mixing is required, a silent video is produced first, then MoviePy
   merges the requested music layers and deletes the temporary file.

### Demo mode

```bash
python video_overlay_script.py --demo
```

Creates synthetic media, runs the full pipeline, and writes `demo_output.mp4`.

## Tips
- Overlay clip paths are resolved relative to the working directory, so keep
  assets inside the project tree or use absolute paths.
- For best results, match the overlay frame rate to the main video. The script
  loops overlays when they are shorter than the highlighted subtitle.
- When experimenting with subtitle styling, tweak `subtitle_design` and rerun;
  no manual cache clearing is necessary.

---

With the configuration dialed in you can batch render assets simply by swapping
the main video and JSON file, making the script a good fit for templated ad
creation or social-media highlight packaging.
