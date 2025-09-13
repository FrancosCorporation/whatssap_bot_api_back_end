from transformers import pipeline

# Carregar o pipeline de TTS
tts = pipeline('text-to-speech', model='nari-labs/Dia-1.6B')

# Texto que você quer converter em áudio
texto = "Olá, como você está?"

# Gerar áudio
tts(texto)