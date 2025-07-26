from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import replicate
import tempfile
import os
import logging
import asyncio
import edge_tts
import sys
import shutil
from threading import Thread

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
from flask_cors import CORS
CORS(app, origins=["http://localhost:8080", "http://localhost:5173"], supports_credentials=True)

# Set your Replicate API token here
os.environ["REPLICATE_API_TOKEN"] = "r8_1IMPNwx80t3o09mSFNgpxVE15CHZnRa3bJQju"

# Comprehensive language dictionary for Edge TTS
language_dict = {
    "English": {
        "Jenny": "en-US-JennyNeural",
        "Guy": "en-US-GuyNeural"
    },
    "Hindi": {
        "Madhur": "hi-IN-MadhurNeural",
        "Swara": "hi-IN-SwaraNeural"
    },
    "Tamil": {
        "Pallavi": "ta-IN-PallaviNeural",
        "Valluvar": "ta-IN-ValluvarNeural"
    },
    "Telugu": {
        "Mohan": "te-IN-MohanNeural",
        "Shruti": "te-IN-ShrutiNeural"
    },
    "Kannada": {
        "Gagan": "kn-IN-GaganNeural",
        "Sapna": "kn-IN-SapnaNeural"
    },
    "Malayalam": {
        "Midhun": "ml-IN-MidhunNeural",
        "Sobhana": "ml-IN-SobhanaNeural"
    },
    "Marathi": {
        "Aarohi": "mr-IN-AarohiNeural",
        "Manohar": "mr-IN-ManoharNeural"
    },
    "Gujarati": {
        "Dhwani": "gu-IN-DhwaniNeural",
        "Niranjan": "gu-IN-NiranjanNeural"
    },
    "Bengali": {
        "Nabanita": "bn-BD-NabanitaNeural",
        "Bashkar": "bn-IN-BashkarNeural"
    },
    "Urdu": {
        "Gul": "ur-IN-GulNeural",
        "Salman": "ur-IN-SalmanNeural"
    }
}

# Function to generate TTS audio
async def generate_tts_audio(text, language):
    if language not in language_dict:
        # Default to English if language not found
        language = "English"
    
    # Use the first speaker by default
    speaker_name = list(language_dict[language].keys())[0]
    voice = language_dict[language][speaker_name]
    
    logger.info(f"Generating TTS for text: '{text}' in {language} using voice: {speaker_name}")
    
    communicate = edge_tts.Communicate(text, voice)
    
    # Create temporary file for audio
    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    await communicate.save(temp_audio.name)
    
    return temp_audio.name

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "Server is running", "message": "Audio transcription service ready"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        logger.info("Received transcription request")
        
        # Check if file is present in request
        if 'file' not in request.files:
            logger.error("No file found in request")
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['file']
        
        if audio_file.filename == '':
            logger.error("Empty filename")
            return jsonify({"error": "No file selected"}), 400
        
        logger.info(f"Processing audio file: {audio_file.filename}")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp:
            audio_file.save(temp.name)
            logger.info(f"Saved audio to temporary file: {temp.name}")
            
            try:
                # Run Replicate transcription
                logger.info("Starting Replicate API call...")
                output = replicate.run(
                    "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
                    input={
                        "audio": open(temp.name, "rb"),
                        "model": "large-v3",
                        "language": "auto",
                        "translate": False,
                        "temperature": 0,
                        "suppress_tokens": "-1",
                        "logprob_threshold": -1.0,
                        "no_speech_threshold": 0.6,
                        "condition_on_previous_text": True
                    }
                )
                
                logger.info("Replicate API call successful")
                logger.info(f"Transcription result: {output}")
                
                # Clean up temporary file
                os.unlink(temp.name)
                
                # Extract transcription from output
                transcription = ""
                if isinstance(output, dict):
                    transcription = output.get("transcription", str(output))
                elif isinstance(output, str):
                    transcription = output
                else:
                    transcription = str(output)
                
                return jsonify({
                    "transcription": transcription,
                    "language": output.get("language") if isinstance(output, dict) else None
                })
                
            except Exception as replicate_error:
                logger.error(f"Replicate API error: {str(replicate_error)}")
                # Clean up temporary file
                if os.path.exists(temp.name):
                    os.unlink(temp.name)
                return jsonify({"error": f"Transcription failed: {str(replicate_error)}"}), 500
                
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/tts", methods=["POST"])
def text_to_speech():
    try:
        logger.info("Received TTS request")
        
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        language = data.get('language', 'English')
        
        if not text.strip():
            return jsonify({"error": "Empty text provided"}), 400
        
        logger.info(f"Generating TTS for: '{text}' in language: {language}")
        
        # Run the async TTS generation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            audio_file_path = loop.run_until_complete(generate_tts_audio(text, language))
            logger.info(f"TTS audio generated: {audio_file_path}")
            
            # Return the audio file
            return send_file(
                audio_file_path,
                mimetype='audio/mpeg',
                as_attachment=False,
                download_name='speech.mp3'
            )
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        return jsonify({"error": f"TTS generation failed: {str(e)}"}), 500

if __name__ == "__main__":
    logger.info("Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5100)
