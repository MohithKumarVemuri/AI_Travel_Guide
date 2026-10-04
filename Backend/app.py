import os
import json
import base64
import tempfile
import urllib.parse
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env in workspace root or current dir
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, "Frontend"))
CORS(app)

MURF_API_KEY = os.getenv("MURF_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

client = genai.Client(api_key=GEMINI_API_KEY)

PROMPTS = {
    "Summary": """
You are a captivating and knowledgeable professional tourist guide with a tone of {tone}.
Provide a high-level historical and cultural overview of "{place}" in {language}.

Focus on:
- The historical origins and significance
- Why the place is world-famous or culturally revered
- Key architectural marvels or highlights
- One fascinating legend or fun fact

Keep the explanation concise, storytelling-focused, and easy to follow.
Limit the response to around 180 to 220 words.
Respond ONLY in {language}.
""",

    "Detailed": """
You are a captivating and knowledgeable professional tourist guide with a tone of {tone}.
Provide a detailed, immersive, and storytelling explanation of "{place}" in {language}.

Cover:
- Historical background, founding era, and timeline of major events
- Architectural design, craftsmanship, and unique structural features
- Cultural importance, spiritual/social relevance, and royal or historical figures
- Fascinating legends, hidden secrets, and visitor insights

Explain concepts vividly in an engaging storytelling manner.
Limit the response to around 350 to 450 words.
Respond ONLY in {language}.
"""
}

# Curated HD verified photographs for prominent tourist landmarks
CURATED_IMAGES = {
    "golconda fort": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Golconda_Fort_005.jpg/1280px-Golconda_Fort_005.jpg",
    "golconda": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Golconda_Fort_005.jpg/1280px-Golconda_Fort_005.jpg",
    "charminar": "https://upload.wikimedia.org/wikipedia/commons/7/71/Charminar_Hyderabad_1.jpg",
    "qutub minar": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Qutb_Minar_2022.jpg/1280px-Qutb_Minar_2022.jpg",
    "eiffel tower": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1000&q=80",
    "colosseum": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1000&q=80",
    "hampi": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/1280px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg",
    "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80",
    "meenakshi temple": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg/1280px-An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg",
    "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
    "kerala backwaters": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
    "taj mahal": "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Taj_Mahal_%28Edited%29.jpeg",
    "red fort": "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Delhi_fort.jpg",
    "gateway of india": "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Mumbai_03-2016_30_Gateway_of_India.jpg",
    "hawa mahal": "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg",
    "golden temple": "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/The_Golden_Temple_of_Amrithsar_7.jpg",
    "mysore palace": "https://s3.ap-south-1.amazonaws.com/new-assets.ccbp.in/frontend/loading-data/niat-course-projects/Mysore_Palace_Morning.jpg",
    "brihadisvara temple": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Brihadisvara_Temple_during_sunset.jpg/1280px-Brihadisvara_Temple_during_sunset.jpg",
    "statue of liberty": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Front_view_of_Statue_of_Liberty.jpg/1280px-Front_view_of_Statue_of_Liberty.jpg",
    "machu picchu": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu%2C_Peru.jpg"
}

def fetch_landmark_image(query):
    """Dynamically fetches authentic landmark photograph from Wikipedia / Wikimedia Commons."""
    headers = {"User-Agent": "AITravelGuideApp/1.0 (travel@guide.app)"}
    try:
        s_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(query)}&limit=3&namespace=0&format=json"
        s_res = requests.get(s_url, headers=headers, timeout=5).json()
        titles = s_res[1] if len(s_res) > 1 and s_res[1] else [query]

        for title in titles:
            u = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
            data = requests.get(u, headers=headers, timeout=5).json()
            img = data.get("originalimage", {}).get("source") or data.get("thumbnail", {}).get("source")
            if img and not any(bad in img.lower() for bad in [".svg", "logo", ".gif", ".tif", "coat_of_arms", "flag"]):
                return img
    except Exception as e:
        print(f"[Wikipedia Image Fetch Error] {e}")
    return None

def generate_speech(text, voice_id, locale):
    """Generate audio via Murf API; returns base64 or None on failure."""
    if not MURF_API_KEY:
        return None
    try:
        url = "https://global.api.murf.ai/v1/speech/stream"
        headers = {
            "api-key": MURF_API_KEY,
            "Content-Type": "application/json"
        }
        data = {
            "voice_id": voice_id,
            "text": text[:1000],  # protect against payload limit
            "locale": locale,
            "model": "FALCON",
            "format": "MP3",
            "sampleRate": 24000,
            "channelType": "MONO"
        }
        response = requests.post(url, headers=headers, json=data, timeout=25)
        if response.status_code == 200 and len(response.content) > 100:
            return base64.b64encode(response.content).decode("utf-8")
        else:
            print(f"[Murf API Notice] Status: {response.status_code}, response: {response.text[:200]}")
            return None
    except Exception as e:
        print(f"[Murf Speech Generation Error] {e}")
        return None

def generate_description(place, answer_type, language, tone="Enthusiastic Storyteller"):
    prompt_template = PROMPTS.get(answer_type, PROMPTS["Summary"])
    prompt = prompt_template.format(place=place, language=language, tone=tone)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"[Gemini Description Error] {e}")
        try:
            response = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt
            )
            return response.text
        except Exception as e2:
            return f"{place} is a world-renowned historical destination celebrated for its extraordinary architecture, rich cultural heritage, and deep historical importance."

# --- Routes ---

@app.route("/")
def serve_index():
    frontend_dir = os.path.join(BASE_DIR, "Frontend")
    return send_from_directory(frontend_dir, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    frontend_dir = os.path.join(BASE_DIR, "Frontend")
    if os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    return send_from_directory(frontend_dir, "index.html")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "murf_configured": bool(MURF_API_KEY)
    })

@app.route("/generate-audio-guide", methods=["POST"])
def generate_audio_guide():
    data = request.json or {}
    place = data.get("place", "Taj Mahal")
    answer_type = data.get("answerType", "Summary")
    language = data.get("language", "English")
    voice_id = data.get("voiceId", "Matthew")
    locale = data.get("locale", "en-US")
    tone = data.get("tone", "Enthusiastic Storyteller")

    text_description = generate_description(place, answer_type, language, tone)
    encoded_audio = generate_speech(text_description, voice_id, locale)

    return jsonify({
        "description": text_description,
        "audioBase64": encoded_audio,
        "language": language,
        "voiceId": voice_id
    })

@app.route("/search-place", methods=["POST"])
def search_place():
    data = request.json or {}
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"error": "Query is required"}), 400

    # Ask Gemini to return structured details for the searched place
    search_prompt = f"""
Given the destination query "{query}", return a clean JSON object describing this tourist attraction.
JSON format:
{{
  "name": "Official or Common Name (e.g. 'Golconda Fort')",
  "city": "City or Region name (e.g. 'Hyderabad')",
  "country": "Country (e.g. 'India')",
  "category": "Category like 'Historical Fort', 'World Wonder', 'Royal Palace', 'Ancient Temple', 'Scenic Wonder', etc.",
  "shortDescription": "2 concise, engaging sentences describing what makes this place iconic.",
  "bestTimeToVisit": "e.g. October to March",
  "historicalEra": "e.g. 16th-17th Century Qutb Shahi Dynasty",
  "wikipediaSearchTerm": "Exact Wikipedia title for fetching photos (e.g. 'Golconda Fort')"
}}
Return ONLY valid JSON without markdown wrapping.
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=search_prompt
        )
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
            if text.startswith("json"):
                text = text[4:].strip()
        result = json.loads(text)
    except Exception as e:
        print(f"[Search Place Gemini Error] {e}")
        result = {
            "name": query.title(),
            "city": "Historic Destination",
            "country": "India",
            "category": "Historical Landmark",
            "shortDescription": f"A breathtaking tourist destination featuring centuries of history, architectural marvels, and cultural splendor.",
            "bestTimeToVisit": "October to March",
            "historicalEra": "Historic Era",
            "wikipediaSearchTerm": query
        }

    # 1. Match curated high-res library
    q_key = query.lower()
    img_url = None
    for k, v in CURATED_IMAGES.items():
        if k in q_key or q_key in k:
            img_url = v
            break

    # 2. Dynamic authentic photograph from Wikipedia / Wikimedia Commons
    if not img_url:
        wiki_term = result.get("wikipediaSearchTerm") or result.get("name") or query
        img_url = fetch_landmark_image(wiki_term)
        if not img_url and wiki_term != query:
            img_url = fetch_landmark_image(query)

    # 3. Final fallback: high quality architecture landscape
    if not img_url:
        img_url = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1000&q=80"

    result["imageUrl"] = img_url
    return jsonify(result)

@app.route("/generate-itinerary", methods=["POST"])
def generate_itinerary():
    data = request.json or {}
    place = data.get("place", "Taj Mahal")
    days = data.get("days", 2)
    style = data.get("style", "Cultural & Heritage")
    language = data.get("language", "English")

    itinerary_prompt = f"""
You are an expert travel planner and local tour architect.
Create a detailed, exciting, and practical {days}-Day travel itinerary for "{place}" tailored for travelers who love "{style}".
Write all content in {language}.

Format your output as a clean JSON object with this exact structure:
{{
  "destination": "{place}",
  "tagline": "A catchy travel subtitle for this itinerary",
  "days": [
    {{
      "dayNumber": 1,
      "theme": "Theme title for this day",
      "morning": {{
        "title": "Morning Activity / Attraction",
        "description": "What to see and do, best morning timing, photography spots",
        "time": "08:30 AM - 12:00 PM"
      }},
      "afternoon": {{
        "title": "Afternoon Activity / Lunch",
        "description": "Exploration, culinary recommendation, local delicacies to try",
        "time": "12:30 PM - 04:00 PM"
      }},
      "evening": {{
        "title": "Evening & Sunset Experience",
        "description": "Sunset views, lively bazaars, cultural performance or dinner",
        "time": "05:00 PM - 08:30 PM"
      }}
    }}
  ],
  "localCuisine": [
    {{"dish": "Dish Name", "description": "Why you must try it"}}
  ],
  "proTips": [
    "Practical tip 1 (tickets, dress code, crowd avoidance)",
    "Practical tip 2 (local transport, navigation)",
    "Practical tip 3 (budget, safety or weather advice)"
  ]
}}

Generate {days} day objects in the "days" array. Return ONLY valid JSON without markdown wrapping.
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=itinerary_prompt
        )
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
            if text.startswith("json"):
                text = text[4:].strip()
        result = json.loads(text)
    except Exception as e:
        print(f"[Generate Itinerary Gemini Error] {e}")
        result = {
            "destination": place,
            "tagline": f"Unforgettable {days}-Day Heritage & Discovery Tour",
            "days": [
                {
                    "dayNumber": i + 1,
                    "theme": f"Exploring {place} - Part {i + 1}",
                    "morning": {
                        "title": f"Morning Tour of {place}",
                        "description": "Early arrival to beat crowds, capture golden hour photographs, and explore the core monuments.",
                        "time": "08:30 AM - 12:00 PM"
                    },
                    "afternoon": {
                        "title": "Local Cultural Immersion & Lunch",
                        "description": "Savor authentic regional cuisine and visit nearby artisan workshops and heritage streets.",
                        "time": "12:30 PM - 04:00 PM"
                    },
                    "evening": {
                        "title": "Sunset Panorama & Evening Walk",
                        "description": "Witness the glowing twilight across the horizon and explore vibrant local bazaars.",
                        "time": "05:00 PM - 08:30 PM"
                    }
                } for i in range(int(days))
            ],
            "localCuisine": [
                {"dish": "Traditional Thali", "description": "A diverse platter of authentic regional curries, breads, and sweets."},
                {"dish": "Street Food Delights", "description": "Crisp savories and fragrant spiced snacks loved by locals."}
            ],
            "proTips": [
                "Book monument entrance tickets online in advance to skip long queues.",
                "Dress comfortably in modest, breathable cotton clothing suitable for walking and holy sites.",
                "Visit during sunrise or early morning for the best lighting and coolest temperatures."
            ]
        }

    return jsonify(result)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting AI Travel Guide Server on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)