import os
import sys

# Ensure project root and Backend can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from Backend.app import app

# Handler for Vercel serverless
# app is the WSGI callable
