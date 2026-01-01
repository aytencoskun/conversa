# Conversa – Gerçek Zamanlı Görüşme Asistanı


Conversa, mobil cihaz üzerinden alınan ses verisini gerçek zamanlı olarak metne dönüştüren, çeviren ve görüşme sonunda yapay zekâ destekli özet üreten bir görüşme asistanıdır. Sistem; ses akışı, çeviri ve özetleme işlemlerini aynı anda yürüten çok katmanlı bir streaming mimarisi üzerine kuruludur.

---

## Projenin Amacı

Conversa, kullanıcıların telefon görüşmelerini veya çevredeki konuşmaları anlık olarak takip edebilmesini sağlamak amacıyla geliştirilmiştir. Uygulama, konuşmaları düşük gecikmeyle metne dönüştürür, seçilen dile çevirir ve görüşme sonunda içeriği anlamlı bir özet haline getirir. Gerektiğinde çevrimdışı çalışabilecek hafif bir yapay zekâ mimarisi hedeflenmiştir.

Geliştirme sürecinin ilerleyen aşamalarında, kullanıcıların görüşme geçmişlerine göre uyarlanmış bir özetleme modeli (fine-tuned LLM) sisteme entegre edilecektir.

---

## Sistem Yapısı

Uygulama, mobil cihazdan alınan ses verisini WebSocket üzerinden FastAPI tabanlı backend servisine iletir. Backend tarafında:

- Ses-metne dönüştürme işlemi faster-whisper ile gerçekleştirilir.
- Çeviri işlemi LibreTranslate veya DeepL API üzerinden yapılır.
- Özetleme adımı Mistral veya GPT tabanlı bir LLM tarafından yürütülür.
- Tüm çıktılar MongoDB Atlas üzerinde saklanır.
- Kullanıcı kimlik doğrulaması Firebase Auth ile sağlanır.

---

## Kullanılan Teknolojiler

### Mobil (Frontend)
- React Native (Bare)
- WebSocket tabanlı gerçek zamanlı iletişim
- Firebase Authentication
- Firebase Storage (opsiyonel ses depolama)

### Backend
- FastAPI
- Python WebSockets
- Faster-Whisper (lokal STT)
- LibreTranslate / DeepL Free API (çeviri)
- Mistral / GPT-4 (özetleme)
- MongoDB Atlas

### Ek Bileşenler
- WebRTC VAD (konuşmacı ayrıştırma)
- LoRA tabanlı kullanıcıya özel özetleme modeli

---

## Fonksiyonel Gereksinimler

- Ses kaydı başlatma ve durdurma
- Gerçek zamanlı ses-metne dönüştürme
- Anlık çeviri
- Konuşmacı ayrıştırma (opsiyonel)
- Yapay zekâ destekli özetleme
- Görüşme geçmişi saklama
- Kullanıcı girişi (e-posta veya Google hesabı)
- Eşzamanlı streaming yapısı
- Kısmi metin ve özet sonuçlarının canlı gösterimi
- Model seçimi (varsayılan veya fine-tuned)
- Opsiyonel model eğitimi desteği

---

## Fonksiyonel Olmayan Gereksinimler

- Ses işleme gecikmesinin 1–2 saniye arasında olması
- Android ve iOS uyumluluğu
- Güvenli veri saklama ve şifreleme
- Basit ve sezgisel kullanıcı arayüzü
- Çoklu dil desteği
- Erişilebilirlik özellikleri
- Paralel işlem yürütebilen mimari
- Streaming gecikmesinin 1 saniyenin altında tutulması
- Fine-tuned model dosyalarının güvenli yönetimi
- CPU/GPU kaynaklarının verimli kullanılması
- Modüler ve genişletilebilir yapı

---

## Güvenlik ve Gizlilik

- Kullanıcı kimlik doğrulaması Firebase Auth üzerinden yapılır.
- Ses kayıtları varsayılan olarak saklanmaz; yalnızca metin çıktıları depolanır.
- STT işlemi yerel cihazda çalışabilir, böylece veri sızma riski azaltılır.
- Çeviri ve özetleme yalnızca metin üzerinden yapılır.

---

## Planlanan Ekranlar

- Gerçek zamanlı transkript ekranı
- Anlık çeviri ekranı
- Görüşme özeti ekranı
- Geçmiş oturumlar
- Ayarlar (model ve dil tercihleri)

---

## Gelecek Çalışmalar

- Offline çeviri modeli
- Gerçek zamanlı konu tespiti
- Duygu analizi
- Görüşme içinden aksiyon maddesi çıkarımı
- Kişiye özel davranan özetleme modeli

---

## Geliştirici

**Ayten Coşkun**  
