# Backend Setup for Audio Transcription

This project uses a Python Flask backend to handle Replicate API calls and avoid CORS issues.

## Setup Instructions

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set your Replicate API token:**
   - Edit `server.py` and replace `"your_replicate_api_token_here"` with your actual Replicate API token
   - Or set it as an environment variable: `export REPLICATE_API_TOKEN=your_token_here`

3. **Run the Flask server:**
   ```bash
   python server.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /` - Health check endpoint
- `POST /transcribe` - Upload audio file for transcription

## Usage

The frontend will automatically send audio recordings to the backend for transcription using the Replicate Whisper model.

## For Electron Apps

When building as an Electron app, make sure to:
1. Start the Flask server before launching the Electron app
2. Or package the Python server with your Electron app
3. Configure the backend URL in your Electron app settings