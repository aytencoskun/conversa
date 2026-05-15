FROM python:3.10-slim

WORKDIR /app

# Ses işleme (faster-whisper ve ffmpeg-python) için gerekli sistem kütüphaneleri
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Cache mekanizmasından faydalanmak için önce requirements.txt kopyalanır
COPY requirements.txt .

# Python bağımlılıklarını kur
RUN pip install --no-cache-dir -r requirements.txt

# Geri kalan tüm backend kodlarını kopyala
COPY . .

# FastAPI portunu dışa aç
EXPOSE 8000

# Sunucuyu başlat
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
