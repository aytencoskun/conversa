# Conversa – Gerçek Zamanlı Görüşme Asistanı

Conversa, mobil cihaz üzerinden alınan ses akışını gerçek zamanlı olarak metne dönüştüren, kullanıcı tarafından seçilen dile çeviren ve görüşme tamamlandığında özet çıkaran kişisel bir görüşme asistanıdır. Uygulama; düşük gecikmeli ses işleme, anlık çeviri ve metin özetleme yeteneklerini tek bir pipeline içerisinde birleştirir.

---

## 1. Proje Vizyonu

Conversa'nın amacı, konuşmaları mümkün olan en düşük gecikmeyle işleyebilen hafif ve mobil odaklı bir sistem oluşturmaktır. Ses akışı alındığı anda üç işlem paralel olarak yürütülür:

1. Ses → Metin (STT)
2. Metin → Çeviri
3. Metin → Özet

Kullanıcı konuşurken metin çıktısı, çeviri ve kısmi özet bilgileri ekranda eşzamanlı olarak görünür. Uzun vadede kullanıcıya özel fine-tuned bir özetleme modeli desteği hedeflenmektedir.

---

## 2. Kullanıcı Senaryoları

### 2.1 Toplantı Takibi  
Kullanıcı toplantı sırasında uygulamayı açar. Konuşmalar gerçek zamanlı olarak metne dökülür. Toplantı sonunda otomatik özet oluşturulur.

### 2.2 Dil Öğrenimi  
Yabancı dil pratiği yapan kullanıcı konuşmalarını takip eder, çeviri ve metin çıktıları öğrenme sürecine destek olur.

### 2.3 Kişisel Not Çıkarma  
Telefon görüşmeleri veya bireysel kayıtlar otomatik metne dökülür ve görüşme sonrası özet olarak saklanabilir.

---

## 3. Amaç ve Gereksinimler

Bu bölüm, Conversa uygulamasının işlevsel ve işlevsel olmayan gereksinimlerinin sade bir özetini içerir.

### 3.1 Amaç  
Gerçek zamanlı çalışan bir ses işleme pipeline’ı geliştirmek:  
- Ses → Metin  
- Metin → Çeviri  
- Metin → Özet  

Tüm işlemler düşük gecikmeyle, modüler ve mobil uyumlu bir yapıda olacaktır.

---

### 3.2 Fonksiyonel Gereksinimler

- Ses kaydı başlatma ve durdurma
- Gerçek zamanlı metin çıktısı (STT)
- Seçilen dile anlık çeviri
- Görüşme sonunda otomatik özet
- Kayıtların saklanması ve tekrar görüntülenmesi
- Kullanıcı giriş/çıkış (Firebase)
- Basit dil seçim ekranı
- Düşük gecikmeli WebSocket bağlantısı

---

### 3.3 Fonksiyonel Olmayan Gereksinimler

- Gecikme en fazla 1–2 saniye
- Android ve iOS uyumluluğu
- Verilerin güvenli tutulması
- Düşük cihaz yükü (hafif modeller)
- Kolay genişletilebilir modüler yapı
- Basit ve düzenli kullanıcı arayüzü

---

## 4. Mimari Karar Kaydı (ADR-001)

Bu kayıt, proje boyunca alınan temel mimari kararların nedenlerini açıklar.

### 4.1 Bağlam  
Conversa, gerçek zamanlı çalışan bir pipeline gerektirir. Mobil performansı ve streaming yapısı için doğru teknolojileri seçmek kritik öneme sahiptir. Tek geliştirici tarafından yönetilebilir, açık kaynak dostu ve yüksek performanslı araçlar tercih edilmelidir.

---

### 4.2 Alınan Kararlar

**Frontend:** React Native (Bare)  
- Doğrudan native modüllere erişim  
- WebSocket performansı  
- Mobil platformlar arasında esneklik  

**Backend:** FastAPI  
- Asenkron mimari  
- WebSocket desteği  
- Python ekosistemiyle güçlü entegrasyon  

**STT Modeli:** faster-whisper  
- CPU ve GPU'da düşük gecikmeli çalışma  
- Hafif model seçenekleri  

**Çeviri:** LibreTranslate veya DeepL Free  
- Ücretsiz veya düşük maliyetli API seçenekleri  

**Özetleme:** Mistral 7B veya GPT tabanlı modeller  
- Token verimliliği  
- İleride fine-tune edilebilirlik  

---

### 4.3 Değerlendirilen Alternatifler ve Reddedilme Nedenleri

- Flutter tabanlı geliştirme: LLM ve STT ekosistemi Python tarafında daha güçlü olduğu için tercih edilmedi.  
- Tamamen offline çalışan model zinciri: Mobil cihazlarda maliyet yüksek olacağı için sonraki aşamalara bırakıldı.  
- Node.js backend: Ses işleme kütüphanelerinin Python tarafında daha kararlı olması nedeniyle tercih edilmedi.

---

### 4.4 Sonuçlar

- Mimarinin tüm bileşenleri modülerdir ve gerektiğinde ayrı ayrı güncellenebilir.  
- Frontend ve backend birbirinden bağımsız geliştirilebilir.  
- STT, çeviri ve özetleme modülleri birbirinden ayrıldığı için değiştirmesi kolaydır.

---

## 5. Teknolojiler

### Mobil (Frontend)
- React Native (Bare)
- WebSocket Client
- Firebase Auth

### Backend
- FastAPI
- Python WebSockets
- Faster-Whisper
- LibreTranslate / DeepL
- Mistral / GPT modelleri
- MongoDB Atlas

---

## 6. Geliştirici
**Ayten Coşkun  

## How can i start my project ?
cd frontend/Conversa
npx react-native run-ios
or 
npx react-native run-ios --simulator="iPhone 15"

## in a different terminal 

cd backend
source venv/bin/activate
uvicorn app.main:app --reload


## in a different terminal 

docker run -ti --rm -v libretranslate_data:/home/libretranslate/.local -p 5001:5000 libretranslate/libretranslate
