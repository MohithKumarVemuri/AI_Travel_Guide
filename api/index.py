import os
import sys

# Ensure project root and Backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from Backend.app import app

# Expose WSGI callable for Vercel
handler = app

