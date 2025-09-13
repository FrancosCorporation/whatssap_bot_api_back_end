import sys
import whisper

audio_path = sys.argv[1]
model = whisper.load_model("medium")  # base ou "medium", se quiser melhorar

result = model.transcribe(audio_path, language="Portuguese")
text = result["text"]

# Garantir saída em UTF-8
sys.stdout.reconfigure(encoding='utf-8')
print(text)
