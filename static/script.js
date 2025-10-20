// Global state
let currentVideoPath = null;
let transcriptData = [];
let subtitles = []; // Subtitle boxes from line breaks in TXT file (for organization only)
let highlights = [];
let selectedRange = null;

// DOM Elements
const mainVideoInput = document.getElementById("main-video-input");
const videoFilename = document.getElementById("video-filename");
const transcriptFileInput = document.getElementById("transcript-file-input");
const transcriptFilename = document.getElementById("transcript-filename");
const uploadBtn = document.getElementById("upload-btn");
const uploadProgress = document.getElementById("upload-progress");
const transcriptPreviewSection = document.getElementById(
  "transcript-preview-section"
);
const transcriptPreview = document.getElementById("transcript-preview");
const selectionSection = document.getElementById("selection-section");
const transcriptDisplay = document.getElementById("transcript-display");
const selectionControls = document.getElementById("selection-controls");
const selectedTextSpan = document.getElementById("selected-text");
const clipInput = document.getElementById("clip-input");
const clipFilename = document.getElementById("clip-filename");
const uploadClipBtn = document.getElementById("upload-clip-btn");
const existingClipsSelect = document.getElementById("existing-clips");
const addHighlightBtn = document.getElementById("add-highlight-btn");
const cancelSelectionBtn = document.getElementById("cancel-selection-btn");
const highlightsSection = document.getElementById("highlights-section");
const highlightsList = document.getElementById("highlights-list");
const musicSelectionSection = document.getElementById(
  "music-selection-section"
);
const musicTranscriptDisplay = document.getElementById(
  "music-transcript-display"
);
const musicSelectionControls = document.getElementById(
  "music-selection-controls"
);
const musicSelectedText = document.getElementById("music-selected-text");
const musicInput = document.getElementById("music-input");
const musicFilename = document.getElementById("music-filename");
const uploadMusicBtn = document.getElementById("upload-music-btn");
const existingMusicSelect = document.getElementById("existing-music-select");
const musicVolume = document.getElementById("music-volume");
const musicVolumeDisplay = document.getElementById("music-volume-display");
const addMusicBtn = document.getElementById("add-music-btn");
const cancelMusicSelectionBtn = document.getElementById(
  "cancel-music-selection-btn"
);
const musicHighlightsSection = document.getElementById(
  "music-highlights-section"
);
const musicHighlightsList = document.getElementById("music-highlights-list");
const processSection = document.getElementById("process-section");
const processBtn = document.getElementById("process-btn");
const processProgress = document.getElementById("process-progress");
const resultSection = document.getElementById("result-section");
const resultMessage = document.getElementById("result-message");
const downloadBtn = document.getElementById("download-btn");

// Music state
let musicHighlights = [];
let selectedMusicRange = null;

// Event Listeners
mainVideoInput.addEventListener("change", handleVideoSelection);
transcriptFileInput.addEventListener("change", handleTranscriptSelection);
uploadBtn.addEventListener("click", uploadVideo);
clipInput.addEventListener("change", handleClipSelection);
uploadClipBtn.addEventListener("click", uploadClip);
addHighlightBtn.addEventListener("click", addHighlight);
cancelSelectionBtn.addEventListener("click", cancelSelection);
musicInput.addEventListener("change", handleMusicSelection);
uploadMusicBtn.addEventListener("click", uploadMusicFile);
musicVolume.addEventListener("input", (e) => {
  musicVolumeDisplay.textContent = e.target.value;
});
addMusicBtn.addEventListener("click", addMusicHighlight);
cancelMusicSelectionBtn.addEventListener("click", cancelMusicSelection);
processBtn.addEventListener("click", processVideo);

// Load existing clips and music on page load
loadExistingClips();
loadExistingMusic();

function handleVideoSelection(e) {
  const file = e.target.files[0];
  if (file) {
    videoFilename.textContent = `Selected: ${file.name}`;
    checkUploadReady();
  }
}

function handleTranscriptSelection(e) {
  const file = e.target.files[0];
  if (file) {
    transcriptFilename.textContent = `Selected: ${file.name}`;
    checkUploadReady();
  }
}

function handleClipSelection(e) {
  const file = e.target.files[0];
  if (file) {
    clipFilename.textContent = file.name;
  } else {
    clipFilename.textContent = "";
  }
}

function handleMusicSelection(e) {
  const file = e.target.files[0];
  if (file) {
    musicFilename.textContent = file.name;
  } else {
    musicFilename.textContent = "";
  }
}

function checkUploadReady() {
  const hasVideo = mainVideoInput.files.length > 0;
  const hasTranscript = transcriptFileInput.files.length > 0;
  uploadBtn.disabled = !(hasVideo && hasTranscript);
}

async function uploadVideo() {
  const videoFile = mainVideoInput.files[0];
  const txtFile = transcriptFileInput.files[0];

  if (!videoFile || !txtFile) {
    alert("Please select both video and TXT file");
    return;
  }

  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("transcript_file", txtFile);

  uploadBtn.disabled = true;
  uploadProgress.style.display = "block";

  try {
    const response = await fetch("/upload-video-with-txt", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      alert("Error: " + data.error);
      return;
    }

    if (!data.subtitles || !data.transcript) {
      alert(
        "Error: Invalid response from server. Missing subtitles or transcript data."
      );
      console.error("Server response:", data);
      return;
    }

    currentVideoPath = data.video_path;
    transcriptData = data.transcript;
    subtitles = data.subtitles;

    displayTranscript(data.subtitles, data.transcript);
    displayMusicTranscript(data.transcript);
    transcriptPreviewSection.style.display = "block";
    selectionSection.style.display = "block";
    highlightsSection.style.display = "block";
    musicSelectionSection.style.display = "block";
    musicHighlightsSection.style.display = "block";
    processSection.style.display = "block";

    alert(
      `Script loaded! Found ${data.subtitles.length} subtitle boxes from ${data.word_count} words.`
    );
  } catch (error) {
    alert("Error uploading files: " + error.message);
  } finally {
    uploadProgress.style.display = "none";
    uploadBtn.disabled = false;
  }
}

function displayTranscript(subtitles, transcript) {
  // Clear both sections
  transcriptPreview.innerHTML = "";
  transcriptDisplay.innerHTML = "";

  // STEP 2: Read-only preview with line-by-line display and highlights
  const previewContainer = document.createElement("div");
  previewContainer.className = "transcript-preview-container";

  // Display transcript line by line with subtitle labels
  subtitles.forEach((subtitle, index) => {
    const subtitleBlock = document.createElement("div");
    subtitleBlock.className = "subtitle-block";

    // Add subtitle label
    const label = document.createElement("div");
    label.className = "subtitle-label-preview";
    label.textContent = `Subtitle ${index + 1}`;
    subtitleBlock.appendChild(label);

    // Add the line of text
    const lineDiv = document.createElement("div");
    lineDiv.className = "transcript-line";

    for (let i = subtitle.start_word; i <= subtitle.end_word; i++) {
      const wordSpan = document.createElement("span");
      wordSpan.className = "preview-word";
      wordSpan.dataset.index = i;
      wordSpan.textContent = transcript[i].word;
      lineDiv.appendChild(wordSpan);
      lineDiv.appendChild(document.createTextNode(" "));
    }

    subtitleBlock.appendChild(lineDiv);
    previewContainer.appendChild(subtitleBlock);
  });

  transcriptPreview.appendChild(previewContainer);

  // STEP 3: Interactive word selection
  const selectionContainer = document.createElement("div");
  selectionContainer.className = "transcript-text-container";

  // Display all words inline for selection
  transcript.forEach((entry, index) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "word-inline";
    wordSpan.textContent = entry.word;
    wordSpan.dataset.index = index;

    // Mouse events for selection
    wordSpan.addEventListener("mousedown", (e) => {
      if (e.shiftKey && selectedRange) {
        const newIndex = parseInt(wordSpan.dataset.index);
        selectedRange.end = newIndex;
        updateSelection();
      } else {
        selectedRange = {
          start: parseInt(wordSpan.dataset.index),
          end: parseInt(wordSpan.dataset.index),
        };
        updateSelection();
      }
    });

    wordSpan.addEventListener("mouseenter", (e) => {
      if (e.buttons === 1 && selectedRange) {
        selectedRange.end = parseInt(wordSpan.dataset.index);
        updateSelection();
      }
    });

    selectionContainer.appendChild(wordSpan);
    selectionContainer.appendChild(document.createTextNode(" "));
  });

  transcriptDisplay.appendChild(selectionContainer);

  // Update preview with existing highlights
  updatePreviewHighlights();
}

function displayMusicTranscript(transcript) {
  // Clear music transcript display
  musicTranscriptDisplay.innerHTML = "";

  // STEP 5: Interactive word selection for music
  const musicContainer = document.createElement("div");
  musicContainer.className = "transcript-text-container";

  // Display all words inline for music selection
  transcript.forEach((entry, index) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "word-inline-music";
    wordSpan.textContent = entry.word;
    wordSpan.dataset.index = index;

    // Mouse events for music selection
    wordSpan.addEventListener("mousedown", (e) => {
      if (e.shiftKey && selectedMusicRange) {
        const newIndex = parseInt(wordSpan.dataset.index);
        selectedMusicRange.end = newIndex;
        updateMusicSelection();
      } else {
        selectedMusicRange = {
          start: parseInt(wordSpan.dataset.index),
          end: parseInt(wordSpan.dataset.index),
        };
        updateMusicSelection();
      }
    });

    wordSpan.addEventListener("mouseenter", (e) => {
      if (e.buttons === 1 && selectedMusicRange) {
        selectedMusicRange.end = parseInt(wordSpan.dataset.index);
        updateMusicSelection();
      }
    });

    musicContainer.appendChild(wordSpan);
    musicContainer.appendChild(document.createTextNode(" "));
  });

  musicTranscriptDisplay.appendChild(musicContainer);

  // Update with existing music highlights
  updateMusicHighlightsDisplay();
}

function updatePreviewHighlights() {
  // Clear all highlights in Step 2 preview
  document.querySelectorAll(".preview-word").forEach((el) => {
    el.classList.remove("highlighted");
  });

  // Clear all highlights in Step 3 selection
  document.querySelectorAll(".word-inline").forEach((el) => {
    el.classList.remove("highlighted");
  });

  // Apply highlights based on current highlights array to BOTH Step 2 and Step 3
  highlights.forEach((highlight) => {
    const start = Math.min(highlight.start_word, highlight.end_word);
    const end = Math.max(highlight.start_word, highlight.end_word);

    for (let i = start; i <= end; i++) {
      // Highlight in Step 2 preview
      const previewWordEl = document.querySelector(
        `.preview-word[data-index="${i}"]`
      );
      if (previewWordEl) {
        previewWordEl.classList.add("highlighted");
      }

      // Highlight in Step 3 selection
      const selectionWordEl = document.querySelector(
        `.word-inline[data-index="${i}"]`
      );
      if (selectionWordEl) {
        selectionWordEl.classList.add("highlighted");
      }
    }
  });
}

function updateSelection() {
  // Clear previous selection in Step 3
  document.querySelectorAll(".word-inline.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  // Clear previous selection preview in Step 2
  document.querySelectorAll(".preview-word.selecting").forEach((el) => {
    el.classList.remove("selecting");
  });

  if (!selectedRange) return;

  const start = Math.min(selectedRange.start, selectedRange.end);
  const end = Math.max(selectedRange.start, selectedRange.end);

  // Highlight selected words in Step 3
  for (let i = start; i <= end; i++) {
    const wordEl = document.querySelector(`.word-inline[data-index="${i}"]`);
    if (wordEl) {
      wordEl.classList.add("selected");
    }

    // Also highlight in Step 2 preview (real-time)
    const previewWordEl = document.querySelector(
      `.preview-word[data-index="${i}"]`
    );
    if (previewWordEl) {
      previewWordEl.classList.add("selecting");
    }
  }

  // Show selection controls
  const selectedWords = transcriptData
    .slice(start, end + 1)
    .map((e) => e.word)
    .join(" ");
  selectedTextSpan.textContent = selectedWords;
  selectionControls.style.display = "block";
}

function cancelSelection() {
  selectedRange = null;
  currentSubtitleIndex = null;

  // Clear selection in Step 3
  document.querySelectorAll(".word-inline.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  // Clear real-time preview in Step 2
  document.querySelectorAll(".preview-word.selecting").forEach((el) => {
    el.classList.remove("selecting");
  });

  selectionControls.style.display = "none";
}

// Music selection functions
function updateMusicSelection() {
  // Clear previous selection in Step 5
  document.querySelectorAll(".word-inline-music.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  if (!selectedMusicRange) return;

  const start = Math.min(selectedMusicRange.start, selectedMusicRange.end);
  const end = Math.max(selectedMusicRange.start, selectedMusicRange.end);

  // Highlight selected words in Step 5
  for (let i = start; i <= end; i++) {
    const wordEl = document.querySelector(
      `.word-inline-music[data-index="${i}"]`
    );
    if (wordEl) {
      wordEl.classList.add("selected");
    }
  }

  // Show music selection controls
  const selectedWords = transcriptData
    .slice(start, end + 1)
    .map((e) => e.word)
    .join(" ");
  musicSelectedText.textContent = selectedWords;
  musicSelectionControls.style.display = "block";
}

function cancelMusicSelection() {
  selectedMusicRange = null;

  // Clear selection in Step 5
  document.querySelectorAll(".word-inline-music.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  musicSelectionControls.style.display = "none";
}

async function uploadClip() {
  const file = clipInput.files[0];
  if (!file) {
    alert("Please select a file to upload");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  uploadClipBtn.disabled = true;

  try {
    const response = await fetch("/upload-clip", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      alert("Error: " + data.error);
      return;
    }

    // Add to existing clips dropdown
    const option = document.createElement("option");
    option.value = data.file_path;
    option.textContent = file.name;
    existingClipsSelect.appendChild(option);
    existingClipsSelect.value = data.file_path;

    alert("File uploaded successfully!");
  } catch (error) {
    alert("Error uploading file: " + error.message);
  } finally {
    uploadClipBtn.disabled = false;
  }
}

async function loadExistingClips() {
  try {
    const response = await fetch("/list-clips");
    const data = await response.json();

    // Add clips only (videos)
    data.clips.forEach((clip) => {
      const option = document.createElement("option");
      option.value = `clips/${clip}`;
      option.textContent = `📹 ${clip}`;
      existingClipsSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading clips:", error);
  }
}

async function uploadMusicFile() {
  const file = musicInput.files[0];
  if (!file) {
    alert("Please select a music file to upload");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  uploadMusicBtn.disabled = true;

  try {
    const response = await fetch("/upload-clip", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      alert("Error: " + data.error);
      return;
    }

    // Add to existing music dropdown
    const option = document.createElement("option");
    option.value = data.file_path;
    option.textContent = file.name;
    existingMusicSelect.appendChild(option);
    existingMusicSelect.value = data.file_path;

    alert("Music uploaded successfully!");
  } catch (error) {
    alert("Error uploading music: " + error.message);
  } finally {
    uploadMusicBtn.disabled = false;
  }
}

async function loadExistingMusic() {
  try {
    const response = await fetch("/list-clips");
    const data = await response.json();

    // Add audio files to music dropdown
    data.audio_files.forEach((audio) => {
      const option = document.createElement("option");
      option.value = `audio_files/${audio}`;
      option.textContent = `🎵 ${audio}`;
      existingMusicSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading music:", error);
  }
}

function addMusicHighlight() {
  if (!selectedMusicRange) return;

  const musicPath = existingMusicSelect.value;
  if (!musicPath) {
    alert("Please select or upload a music/audio file");
    return;
  }

  const start = Math.min(selectedMusicRange.start, selectedMusicRange.end);
  const end = Math.max(selectedMusicRange.start, selectedMusicRange.end);
  const phrase = transcriptData
    .slice(start, end + 1)
    .map((e) => e.word)
    .join(" ");

  const musicHighlight = {
    phrase: phrase,
    start_word: start,
    end_word: end,
    music_path: musicPath,
    music_volume: parseFloat(musicVolume.value),
    occurrence: 1,
  };

  musicHighlights.push(musicHighlight);

  updateMusicHighlightsList();
  updateMusicHighlightsDisplay();
  cancelMusicSelection();
}

function updateMusicHighlightsList() {
  musicHighlightsList.innerHTML = "";

  if (musicHighlights.length === 0) {
    musicHighlightsList.innerHTML =
      '<p style="color: #999; text-align: center; padding: 20px;">No music/audio added yet. Select words in Step 5 to add music.</p>';
    return;
  }

  // Add header
  const header = document.createElement("div");
  header.className = "subtitles-header";
  header.innerHTML = `
    <h3>Your Music/Audio Highlights (${musicHighlights.length})</h3>
    <p class="subtitles-description">Each music/audio will play during the selected words</p>
  `;
  musicHighlightsList.appendChild(header);

  // Add each music highlight
  musicHighlights.forEach((music, index) => {
    const item = document.createElement("div");
    item.className = "highlight-item";

    const badge = document.createElement("div");
    badge.className = "subtitle-badge";
    badge.textContent = `#${index + 1}`;

    const info = document.createElement("div");
    info.className = "highlight-info";

    const phrase = document.createElement("div");
    phrase.className = "highlight-phrase";
    phrase.textContent = `"${music.phrase}"`;

    const details = document.createElement("div");
    details.className = "highlight-details";

    const musicName = music.music_path.split("/").pop();
    details.innerHTML = `
      <span class="detail-item">🎵 ${musicName}</span>
      <span class="detail-item">🔊 Volume: ${music.music_volume.toFixed(
        1
      )}</span>
      <span class="detail-item">📝 Words ${music.start_word + 1}-${
      music.end_word + 1
    }</span>
    `;

    info.appendChild(phrase);
    info.appendChild(details);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteMusicHighlight(index);

    item.appendChild(badge);
    item.appendChild(info);
    item.appendChild(deleteBtn);

    musicHighlightsList.appendChild(item);
  });
}

function updateMusicHighlightsDisplay() {
  // Clear all music highlights in Step 5
  document.querySelectorAll(".word-inline-music").forEach((el) => {
    el.classList.remove("highlighted");
  });

  // Apply music highlights
  musicHighlights.forEach((music) => {
    const start = Math.min(music.start_word, music.end_word);
    const end = Math.max(music.start_word, music.end_word);

    for (let i = start; i <= end; i++) {
      const wordEl = document.querySelector(
        `.word-inline-music[data-index="${i}"]`
      );
      if (wordEl) {
        wordEl.classList.add("highlighted");
      }
    }
  });
}

function deleteMusicHighlight(index) {
  musicHighlights.splice(index, 1);
  updateMusicHighlightsList();
  updateMusicHighlightsDisplay();
}

function addHighlight() {
  if (!selectedRange) return;

  const clipPath = existingClipsSelect.value;
  if (!clipPath) {
    alert("Please select or upload a clip");
    return;
  }

  const start = Math.min(selectedRange.start, selectedRange.end);
  const end = Math.max(selectedRange.start, selectedRange.end);
  const phrase = transcriptData
    .slice(start, end + 1)
    .map((e) => e.word)
    .join(" ");

  const highlight = {
    phrase: phrase,
    start_word: start,
    end_word: end,
    clip_path: clipPath,
    music_path: null,
    music_volume: 1.0,
    occurrence: 1,
  };

  highlights.push(highlight);

  updateHighlightsList();
  updatePreviewHighlights(); // Update Step 2 and Step 3
  cancelSelection();
}

function updateHighlightsList() {
  highlightsList.innerHTML = "";

  if (highlights.length === 0) {
    highlightsList.innerHTML =
      '<p style="color: #999; text-align: center; padding: 20px;">No subtitles added yet. Select text in the transcript above to create your first subtitle.</p>';
    return;
  }

  // Add header
  const header = document.createElement("div");
  header.className = "subtitles-header";
  header.innerHTML = `
    <h3>Your Assigned Highlights (${highlights.length})</h3>
    <p class="subtitles-description">Each highlight will appear during the selected words with the assigned clip/audio</p>
  `;
  highlightsList.appendChild(header);

  highlights.forEach((highlight, index) => {
    const item = document.createElement("div");
    item.className = "highlight-item";

    // Subtitle number badge
    const badge = document.createElement("div");
    badge.className = "subtitle-badge";
    badge.textContent = `#${index + 1}`;

    const info = document.createElement("div");
    info.className = "highlight-info";

    // Subtitle text label
    const label = document.createElement("div");
    label.className = "subtitle-label";
    label.textContent = `Subtitle ${index + 1}`;

    const phrase = document.createElement("div");
    phrase.className = "highlight-phrase";
    phrase.textContent = `"${highlight.phrase}"`;

    const details = document.createElement("div");
    details.className = "highlight-details";
    const fileName = (highlight.clip_path || highlight.music_path)
      .split("/")
      .pop();
    const fileType = highlight.clip_path ? "📹 Video Clip" : "🎵 Audio/Music";
    const wordRange = `Words ${highlight.start_word + 1}-${
      highlight.end_word + 1
    }`;
    details.innerHTML = `
      <span class="detail-item">${fileType}: <strong>${fileName}</strong></span>
      <span class="detail-item">Volume: <strong>${highlight.music_volume}</strong></span>
      <span class="detail-item">${wordRange}</span>
    `;

    info.appendChild(label);
    info.appendChild(phrase);
    info.appendChild(details);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-danger";
    removeBtn.innerHTML = "🗑️<br>Remove";
    removeBtn.onclick = () => removeHighlight(index);

    item.appendChild(badge);
    item.appendChild(info);
    item.appendChild(removeBtn);
    highlightsList.appendChild(item);
  });
}

function removeHighlight(index) {
  highlights.splice(index, 1);
  updateHighlightsList();
  updatePreviewHighlights(); // Update Step 2 preview
}

async function processVideo() {
  if (!currentVideoPath) {
    alert("Please upload a video first");
    return;
  }

  if (highlights.length === 0) {
    alert("Please add at least one highlight");
    return;
  }

  processBtn.disabled = true;
  processProgress.style.display = "block";

  // Combine highlights and music highlights
  const allHighlights = [...highlights, ...musicHighlights];

  try {
    const response = await fetch("/process-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_path: currentVideoPath,
        highlights: allHighlights,
        transcript: transcriptData,
        preserve_audio: true,
        subtitle_sentences: subtitles,
      }),
    });

    const data = await response.json();

    if (data.error) {
      alert("Error: " + data.error);
      return;
    }

    resultMessage.textContent = data.message;
    downloadBtn.onclick = () => {
      window.location.href = `/download/${data.output_filename}`;
    };

    resultSection.style.display = "block";
    processProgress.style.display = "none";
  } catch (error) {
    alert("Error processing video: " + error.message);
    processProgress.style.display = "none";
  } finally {
    processBtn.disabled = false;
  }
}
