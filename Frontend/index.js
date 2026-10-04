// --- Configuration & Constants ---
const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://127.0.0.1:5000';

const VOICES = {
  English: { Male: "Matthew", Female: "Alicia" },
  Hindi: { Male: "Aman", Female: "Namrita" },
  Tamil: { Male: "Murali", Female: "Iniya" },
  Telugu: { Male: "Zion", Female: "Josie" },
  Kannada: { Male: "Aman", Female: "Namrita" },
  Spanish: { Male: "Matthew", Female: "Alicia" },
  French: { Male: "Matthew", Female: "Alicia" }
};

const LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Spanish: "es-ES",
  French: "fr-FR"
};

// --- Application State ---
const state = {
  place: 'Taj Mahal',
  image: '',
  length: 'Summary',
  voice: 'Male',
  tone: 'Enthusiastic Storyteller',
  activeTab: 'audio', // 'audio' or 'itinerary'
  tripDays: 2,
  tripStyle: 'Cultural & Heritage',
  currentItineraryData: null,
  currentTranscript: ''
};

// --- DOM Elements ---
const cardsContainer = document.querySelector('.cards');
const experiencePanel = document.getElementById('experience');
const previewTitle = document.getElementById('previewTitle');
const previewSubtitle = document.getElementById('previewSubtitle');
const destinationBadge = document.getElementById('destinationBadge');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptText = document.getElementById('scriptText');
const generateButton = document.getElementById('generateBtn');
const btnIcon = document.getElementById('btnIcon');
const btnText = document.getElementById('btnText');
const languageSelect = document.getElementById('selectLanguage');
const closeButton = document.getElementById('closeExperience');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchSpinner = document.getElementById('searchSpinner');
const searchClearBtn = document.getElementById('searchClearBtn');
const searchPreviewCard = document.getElementById('searchPreviewCard');
const searchPreviewImage = document.getElementById('searchPreviewImage');
const searchPreviewTitle = document.getElementById('searchPreviewTitle');
const searchPreviewDesc = document.getElementById('searchPreviewDesc');
const searchPreviewLocation = document.getElementById('searchPreviewLocation');
const searchPreviewCategory = document.getElementById('searchPreviewCategory');
const transcriptToggle = document.getElementById('transcriptToggle');
const transcriptContent = document.getElementById('transcriptContent');
const transcriptArrow = document.getElementById('transcriptArrow');
const copyTranscriptBtn = document.getElementById('copyTranscriptBtn');
const waveVisualizer = document.getElementById('waveVisualizer');
const audioStatusText = document.getElementById('audioStatusText');
const audioVoiceInfo = document.getElementById('audioVoiceInfo');

// Tabs & Itinerary Elements
const tabAudioGuide = document.getElementById('tabAudioGuide');
const tabItinerary = document.getElementById('tabItinerary');
const panelAudioGuide = document.getElementById('panelAudioGuide');
const panelItinerary = document.getElementById('panelItinerary');
const generateItineraryBtn = document.getElementById('generateItineraryBtn');
const itineraryBtnText = document.getElementById('itineraryBtnText');
const itineraryResultSection = document.getElementById('itineraryResultSection');
const itineraryDaysList = document.getElementById('itineraryDaysList');
const itineraryTagline = document.getElementById('itineraryTagline');
const itineraryFoodList = document.getElementById('itineraryFoodList');
const itineraryTipsList = document.getElementById('itineraryTipsList');
const copyItineraryBtn = document.getElementById('copyItineraryBtn');

// --- Destination Selection Logic ---

function selectDestination(place, image, clickedCard = null, metadata = null) {
  state.place = place;
  state.image = image;

  // Update UI headers
  previewTitle.textContent = place;
  if (metadata && metadata.city) {
    previewSubtitle.textContent = `${metadata.city}, ${metadata.country || ''} • ${metadata.category || 'Historical Monument'}`;
    destinationBadge.textContent = metadata.historicalEra || 'Iconic Landmark';
  } else {
    previewSubtitle.textContent = "Iconic World Destination • AI Guide Ready";
    destinationBadge.textContent = "AI Ready";
  }

  // Fade cards layout
  cardsContainer.classList.add('faded');
  document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));

  if (clickedCard) {
    clickedCard.classList.add('active');
    searchPreviewCard.classList.add('hidden');
  } else {
    // Dynamic or searched card
    searchPreviewImage.src = image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
    searchPreviewTitle.textContent = place;
    if (metadata) {
      searchPreviewDesc.textContent = metadata.shortDescription || 'Historical destination discovered via AI search.';
      searchPreviewLocation.textContent = `${metadata.city || ''}, ${metadata.country || ''}`.trim() || 'Worldwide';
      searchPreviewCategory.textContent = metadata.category || 'Historic Monument';
    }
    searchPreviewCard.classList.remove('hidden');
    searchPreviewCard.classList.add('active');
  }

  // Reset Audio Panel
  audioSection.classList.add('hidden');
  audioPlayer.pause();
  audioPlayer.src = '';
  transcriptText.textContent = '';
  state.currentTranscript = '';
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  btnText.textContent = 'Generate Audio Guide';
  btnIcon.textContent = '🔊';
  generateButton.disabled = false;
  waveVisualizer.classList.remove('wave-playing');

  // Reset Itinerary section
  itineraryResultSection.classList.add('hidden');
  itineraryDaysList.innerHTML = '';

  // Show Panel
  experiencePanel.classList.remove('hidden');
  setTimeout(() => {
    experiencePanel.classList.add('visible');
    experiencePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 20);
}

function deselectDestination() {
  experiencePanel.classList.remove('visible');
  audioPlayer.pause();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  waveVisualizer.classList.remove('wave-playing');

  setTimeout(() => {
    experiencePanel.classList.add('hidden');
    cardsContainer.classList.remove('faded');
    searchPreviewCard.classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
  }, 300);
}

// Close Button
closeButton.addEventListener('click', deselectDestination);

// Initial Place Cards Click
document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
  card.addEventListener('click', () => {
    selectDestination(card.dataset.place, card.dataset.image, card);
  });
});

// Quick Tags click handler
document.querySelectorAll('.quick-tag').forEach(tagBtn => {
  tagBtn.addEventListener('click', () => {
    const tagName = tagBtn.dataset.tag;
    searchInput.value = tagName;
    handleSearch(tagName);
  });
});

// --- Search Functionality (🗺️ Search for tourist places) ---

async function handleSearch(searchTerm) {
  const query = (searchTerm || searchInput.value || '').trim();
  if (!query) return;

  // First check if query matches an existing on-screen place card
  const existingCards = Array.from(document.querySelectorAll('.place-card:not(.search-preview-card)'));
  const matchedCard = existingCards.find(c =>
    c.dataset.place.toLowerCase().includes(query.toLowerCase()) ||
    query.toLowerCase().includes(c.dataset.place.toLowerCase())
  );

  if (matchedCard) {
    selectDestination(matchedCard.dataset.place, matchedCard.dataset.image, matchedCard);
    searchClearBtn.classList.remove('hidden');
    return;
  }

  // Otherwise, query Gemini backend for dynamic tourist place details
  searchSpinner.classList.remove('hidden');
  searchBtn.disabled = true;
  searchClearBtn.classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/search-place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error('Search failed');

    const data = await res.json();
    selectDestination(data.name || query, data.imageUrl, null, data);

  } catch (err) {
    console.error('Search error:', err);
    // Graceful fallback destination if network or endpoint has issue
    selectDestination(query, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80', null, {
      city: 'Destination',
      country: 'World',
      category: 'Tourist Landmark',
      shortDescription: `Explore ${query} with an AI-generated historical narration and custom trip itinerary.`
    });
  } finally {
    searchSpinner.classList.add('hidden');
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener('click', () => handleSearch());
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});
searchInput.addEventListener('input', () => {
  if (searchInput.value.trim().length > 0) {
    searchClearBtn.classList.remove('hidden');
  } else {
    searchClearBtn.classList.add('hidden');
  }
});
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.classList.add('hidden');
  searchInput.focus();
});

// --- Option Controls (History Depth, Voice, Tone) ---

const lengthButtons = document.querySelectorAll('[data-group="length"] button');
lengthButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    lengthButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.length = btn.dataset.value;
  });
});

const voiceButtons = document.querySelectorAll('[data-group="voice"] button');
voiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    voiceButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.voice = btn.dataset.value;
  });
});

const toneButtons = document.querySelectorAll('[data-group="tone"] button');
toneButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    toneButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tone = btn.dataset.tone;
  });
});

// Playback Speed Controls
document.querySelectorAll('.speed-btn').forEach(sBtn => {
  sBtn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.classList.remove('active-speed', 'text-[#ea580c]', 'font-extrabold');
      b.classList.add('text-gray-600');
    });
    sBtn.classList.add('active-speed', 'text-[#ea580c]', 'font-extrabold');
    const speed = parseFloat(sBtn.dataset.speed);
    audioPlayer.playbackRate = speed;
  });
});

// Audio Visualizer states
audioPlayer.addEventListener('play', () => {
  waveVisualizer.classList.add('wave-playing');
  audioStatusText.textContent = "Playing AI Narration...";
});
audioPlayer.addEventListener('pause', () => {
  waveVisualizer.classList.remove('wave-playing');
  audioStatusText.textContent = "Audio Paused";
});
audioPlayer.addEventListener('ended', () => {
  waveVisualizer.classList.remove('wave-playing');
  audioStatusText.textContent = "Narration Completed";
});

// --- Web Speech Synthesis Fallback Helper ---
function speakTextFallback(text, language, gender) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const localeMap = {
    English: 'en-US', Hindi: 'hi-IN', Tamil: 'ta-IN', Telugu: 'te-IN',
    Kannada: 'kn-IN', Spanish: 'es-ES', French: 'fr-FR'
  };
  utterance.lang = localeMap[language] || 'en-US';
  utterance.rate = 0.95;

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
  if (matchedVoice) utterance.voice = matchedVoice;

  utterance.onstart = () => {
    waveVisualizer.classList.add('wave-playing');
    audioStatusText.textContent = `Speaking via Web Speech (${language})`;
  };
  utterance.onend = () => {
    waveVisualizer.classList.remove('wave-playing');
    audioStatusText.textContent = "Audio Guide Completed";
  };
  utterance.onerror = () => {
    waveVisualizer.classList.remove('wave-playing');
  };

  window.speechSynthesis.speak(utterance);
}

// --- Generate Audio Guide Logic (🔊 & 📖 & 🌐 & 🎙️ & 📝) ---

generateButton.addEventListener('click', async () => {
  generateButton.disabled = true;
  btnIcon.textContent = '⏳';
  btnText.textContent = 'Synthesizing Audio Guide...';

  try {
    const selectedLanguage = languageSelect.value;
    const selectedVoice = state.voice;
    const voiceId = (VOICES[selectedLanguage] && VOICES[selectedLanguage][selectedVoice]) || "Matthew";
    const locale = LOCALES[selectedLanguage] || "en-US";

    const response = await fetch(`${API_BASE}/generate-audio-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        answerType: state.length,
        language: selectedLanguage,
        voiceId: voiceId,
        locale: locale,
        tone: state.tone
      })
    });

    if (!response.ok) throw new Error('Generation failed');

    const data = await response.json();

    // Update Transcript
    state.currentTranscript = data.description || '';
    transcriptText.textContent = state.currentTranscript;
    audioSection.classList.remove('hidden');
    transcriptContent.classList.remove('hidden');
    transcriptArrow.classList.add('rotate-180');

    // Audio Output Handling
    if (data.audioBase64) {
      audioPlayer.src = `data:audio/mp3;base64,${data.audioBase64}`;
      audioPlayer.classList.remove('hidden');
      audioPlayer.load();
      audioPlayer.play().catch(() => {});
      audioVoiceInfo.textContent = `Murf AI Voice (${voiceId}) • ${selectedLanguage}`;
      audioStatusText.textContent = "Playing AI Audio Guide";
    } else {
      // Automatic fallback to Web Speech Synthesis
      audioPlayer.classList.add('hidden');
      audioVoiceInfo.textContent = `Speech Engine (${selectedVoice}) • ${selectedLanguage}`;
      speakTextFallback(data.description, selectedLanguage, selectedVoice);
    }

    btnIcon.textContent = '🔊';
    btnText.textContent = 'Re-generate Guide';
    generateButton.disabled = false;

  } catch (err) {
    console.error('Audio guide generation error:', err);
    alert('Audio generation failed. Please check your network connection.');
    btnIcon.textContent = '🔊';
    btnText.textContent = 'Generate Audio Guide';
    generateButton.disabled = false;
  }
});

// Transcript Toggle & Copy
transcriptToggle.addEventListener('click', (e) => {
  if (e.target === copyTranscriptBtn) return;
  transcriptContent.classList.toggle('hidden');
  transcriptArrow.classList.toggle('rotate-180');
});

copyTranscriptBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!state.currentTranscript) return;
  navigator.clipboard.writeText(state.currentTranscript).then(() => {
    const originalText = copyTranscriptBtn.textContent;
    copyTranscriptBtn.textContent = '✓ Copied';
    setTimeout(() => { copyTranscriptBtn.textContent = originalText; }, 2000);
  });
});

// --- Tab Switching: [Audio Guide] vs [Trip Itinerary] ---

tabAudioGuide.addEventListener('click', () => {
  state.activeTab = 'audio';
  tabAudioGuide.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
  tabAudioGuide.classList.remove('text-gray-500');
  tabItinerary.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
  tabItinerary.classList.add('text-gray-500');
  panelAudioGuide.classList.remove('hidden');
  panelItinerary.classList.add('hidden');
});

tabItinerary.addEventListener('click', () => {
  state.activeTab = 'itinerary';
  tabItinerary.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
  tabItinerary.classList.remove('text-gray-500');
  tabAudioGuide.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
  tabAudioGuide.classList.add('text-gray-500');
  panelItinerary.classList.remove('hidden');
  panelAudioGuide.classList.add('hidden');
});

// Itinerary Day Selector
document.querySelectorAll('[data-group="tripDays"] button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-group="tripDays"] button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tripDays = parseInt(btn.dataset.days);
  });
});

// Itinerary Style Selector
document.querySelectorAll('[data-group="tripStyle"] button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-group="tripStyle"] button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tripStyle = btn.dataset.style;
  });
});

// --- Itinerary / Trip Planning Generation (🧭) ---

generateItineraryBtn.addEventListener('click', async () => {
  generateItineraryBtn.disabled = true;
  itineraryBtnText.textContent = 'Architecting Itinerary...';

  try {
    const selectedLanguage = languageSelect.value;
    const response = await fetch(`${API_BASE}/generate-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        days: state.tripDays,
        style: state.tripStyle,
        language: selectedLanguage
      })
    });

    if (!response.ok) throw new Error('Failed to generate itinerary');

    const data = await response.json();
    state.currentItineraryData = data;
    renderItinerary(data);

  } catch (err) {
    console.error('Itinerary generation error:', err);
    alert('Failed to generate trip plan. Please try again.');
  } finally {
    generateItineraryBtn.disabled = false;
    itineraryBtnText.textContent = 'Regenerate Itinerary';
  }
});

function renderItinerary(data) {
  itineraryTagline.textContent = data.tagline || `Tailored ${state.tripDays}-Day Exploration`;
  itineraryDaysList.innerHTML = '';

  (data.days || []).forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 hover:bg-white hover:border-[#ff8a1f] transition-all space-y-2.5';
    dayCard.innerHTML = `
      <div class="flex items-center justify-between border-b border-gray-200/60 pb-2">
        <span class="text-xs font-black text-white bg-gradient-to-r from-[#ff8a1f] to-[#ff5500] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Day ${day.dayNumber}
        </span>
        <span class="text-xs font-bold text-gray-800">${day.theme || ''}</span>
      </div>
      <div class="space-y-2 text-xs">
        <div class="flex items-start gap-2">
          <span class="text-sm">🌅</span>
          <div>
            <div class="font-bold text-gray-900">${day.morning?.title || 'Morning Exploration'} <span class="text-[10px] text-gray-400 font-normal">(${day.morning?.time || ''})</span></div>
            <p class="text-gray-600 text-[11px] leading-relaxed">${day.morning?.description || ''}</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-sm">☀️</span>
          <div>
            <div class="font-bold text-gray-900">${day.afternoon?.title || 'Afternoon Highlights'} <span class="text-[10px] text-gray-400 font-normal">(${day.afternoon?.time || ''})</span></div>
            <p class="text-gray-600 text-[11px] leading-relaxed">${day.afternoon?.description || ''}</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-sm">🌙</span>
          <div>
            <div class="font-bold text-gray-900">${day.evening?.title || 'Evening & Dinner'} <span class="text-[10px] text-gray-400 font-normal">(${day.evening?.time || ''})</span></div>
            <p class="text-gray-600 text-[11px] leading-relaxed">${day.evening?.description || ''}</p>
          </div>
        </div>
      </div>
    `;
    itineraryDaysList.appendChild(dayCard);
  });

  // Render Must-Try Food
  itineraryFoodList.innerHTML = '';
  (data.localCuisine || []).forEach(f => {
    const item = document.createElement('div');
    item.innerHTML = `<span class="font-bold text-gray-800">• ${f.dish}:</span> <span class="text-gray-600">${f.description}</span>`;
    itineraryFoodList.appendChild(item);
  });

  // Render Pro Tips
  itineraryTipsList.innerHTML = '';
  (data.proTips || []).forEach(tip => {
    const item = document.createElement('div');
    item.textContent = `• ${tip}`;
    itineraryTipsList.appendChild(item);
  });

  itineraryResultSection.classList.remove('hidden');
}

// Copy Itinerary Text
copyItineraryBtn.addEventListener('click', () => {
  if (!state.currentItineraryData) return;
  const d = state.currentItineraryData;
  let text = `🧭 ${d.destination} - ${d.tagline}\n\n`;
  (d.days || []).forEach(day => {
    text += `=== Day ${day.dayNumber}: ${day.theme} ===\n`;
    text += `🌅 Morning: ${day.morning?.title} (${day.morning?.time})\n   ${day.morning?.description}\n`;
    text += `☀️ Afternoon: ${day.afternoon?.title} (${day.afternoon?.time})\n   ${day.afternoon?.description}\n`;
    text += `🌙 Evening: ${day.evening?.title} (${day.evening?.time})\n   ${day.evening?.description}\n\n`;
  });
  text += `🍽️ Must-Try Cuisine:\n`;
  (d.localCuisine || []).forEach(f => { text += `- ${f.dish}: ${f.description}\n`; });
  text += `\n💡 Travel Tips:\n`;
  (d.proTips || []).forEach(t => { text += `- ${t}\n`; });

  navigator.clipboard.writeText(text).then(() => {
    const orig = copyItineraryBtn.textContent;
    copyItineraryBtn.textContent = '✓ Copied Plan';
    setTimeout(() => { copyItineraryBtn.textContent = orig; }, 2000);
  });
});
