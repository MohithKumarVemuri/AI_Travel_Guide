import os
import sys
import webbrowser
import threading
import time
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from Backend.app import app

def open_browser(port):
    time.sleep(1.2)
    url = f"http://127.0.0.1:{port}"
    print(f"\n🚀 Opening browser at {url} ...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not automatically open browser: {e}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print("=" * 60)
    print("🧭 Starting AI Travel Guide Server")
    print(f"📍 Local URL: http://127.0.0.1:{port}")
    print("=" * 60)

    # Start browser opener in background thread
    threading.Thread(target=open_browser, args=(port,), daemon=True).start()

    app.run(host="0.0.0.0", port=port, debug=False)
