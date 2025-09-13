from ultralytics import YOLO

# Carregar o modelo YOLOv11
model = YOLO('yolo11l.pt')  # Você pode escolher entre yolo11n.pt, yolo11s.pt, yolo11m.pt, yolo11l.pt, yolo11x.pt

# Caminho da imagem
image_path = 'downloads/pf.jpg'

# Realizar a detecção
results = model(image_path)

#print(results)  # Remove espaços extras antes e depois
