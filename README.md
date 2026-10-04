# 🧭 AI Travel Guide — Smart Audio & Itinerary Companion

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://ai-travel-guide-six.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/MohithKumarVemuri/AI_Travel_Guide)

> 🌐 **Live Website:** [https://ai-travel-guide-six.vercel.app/](https://ai-travel-guide-six.vercel.app/)

A full-stack, AI-powered travel companion web application that generates immersive audio guides, historical transcripts, multilingual narrations, and custom day-by-day trip itineraries for iconic landmarks worldwide.

---

## ✨ Features Implemented

1. **🗺️ Search for Tourist Places**:
   - Search for **any** landmark or destination worldwide (e.g. *Charminar, Eiffel Tower, Colosseum, Hampi*).
   - Powered by Gemini to dynamically fetch the official name, city, country, category, summary, and imagery.
   - Quick-tag pills for instant discovery of popular landmarks.

2. **📖 Generate Historical Information**:
   - In-depth cultural & architectural history generation.
   - Toggle between **Summarized (~1.5 min)** and **In-Depth (~3.5 min)** narratives.
   - Tailored storytelling tones: *Enthusiastic Storyteller*, *Historical Scholar*, and *Local Insider*.

3. **🔊 Generate AI-Powered Audio Guides**:
   - Crystal-clear audio stream powered by **Murf AI**.
   - Built-in graceful fallback to the browser's native **Web Speech Synthesis API** if network or Murf limits are reached.
   - Custom audio player with interactive audio waveform animation and playback speed control (1x, 1.25x, 1.5x).

4. **🌐 Multilingual Support**:
   - Multi-language narrations: **English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Spanish (Español), French (Français)**.

5. **🎙️ Voice Selection & Customization**:
   - Male & Female voice selector with localized voice mappings.
   - Tone selector for narrative pacing.

6. **📝 Text Transcript**:
   - Collapsible, styled transcript reader with real-time text display.
   - One-click **Copy Transcript** button.

7. **🧭 Itinerary / Trip Planning**:
   - Generate structured **1-Day, 2-Day, or 3-Day** itineraries for any destination.
   - Custom travel vibes (*Heritage & Art, Food & Markets, Relaxed & Scenic, Photography & Gems*).
   - Morning, Afternoon, and Evening schedule breakdowns.
   - Must-try local culinary delicacies & insider travel pro tips.
   - One-click **Copy Plan** to save the itinerary to your notes.

---

## 📁 Project Structure

```
AI_Travel_Guide/
├── .env                  # API keys (ignored by git)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore configuration
├── requirements.txt      # Python dependencies
├── vercel.json           # Vercel serverless deployment config
├── run.py                # One-click runner script
├── api/
│   └── index.py          # Vercel serverless entrypoint
├── Backend/
│   └── app.py            # Flask REST API & Gemini / Murf backend
└── Frontend/
    ├── index.html        # Modern responsive UI
    └── index.js          # Interactive frontend logic & audio player
```

---

## 🚀 Running Locally

### 1. Prerequisites
- Python 3.10+
- Installed dependencies:
  ```bash
  pip install -r requirements.txt
  ```

### 2. Configure Environment Variables
Ensure `.env` exists in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MURF_API_KEY=your_murf_api_key_here
PORT=5000
```

### 3. Start the Server
Run the root script:
```bash
python run.py
```
Or run Flask directly:
```bash
python Backend/app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser.

---

## 🐙 Push to GitHub

1. Initialize git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "feat: AI Travel Guide with search, audio narration, and itinerary planner"
   ```
   *(Note: `.env` is automatically ignored by `.gitignore` to keep your API keys secure.)*

2. Link to your GitHub repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

---

## ▲ Deploying to Vercel

### Option A: Via GitHub (Recommended)
1. Push your code to GitHub (as shown above).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. In the **Environment Variables** section on Vercel, add:
   - `GEMINI_API_KEY` = your Gemini API key
   - `MURF_API_KEY` = your Murf API key
5. Click **Deploy**. Vercel will automatically configure the Python API via `api/index.py` and serve the `Frontend` assets using `vercel.json`!

### Option B: Via Vercel CLI
```bash
npx vercel
```
Follow the interactive prompts and add the environment variables in your project settings.
