# Contributing Guidelines

Bu proje tek geliştirici tarafından yürütülse de, düzenli ve profesyonel bir geliştirme süreci sağlamak için aşağıdaki standartlar takip edilir.

---

## 1. Branch Yapısı

Projede iki ana branch bulunur:

- **main** – Stabil üretim sürümü  
- **dev** – Aktif geliştirme branch’i

Gerekirse ek branch açılabilir:

feature/<özellik-adi>
fix/<hata-adi>
docs/<belge-duzenleme>


---

## 2. Commit Mesaj Formatı

Commit mesajları semantic-friendly formatta yazılır:

<tip>: <kısa açıklama>


### Kullanılan tipler:
- **feat:** Yeni özellik  
- **fix:** Hata düzeltme  
- **docs:** Belge güncelleme  
- **refactor:** Davranışı değiştirmeyen düzenleme  
- **chore:** Küçük bakım işleri  
- **style:** Biçimlendirme değişiklikleri  

---

## 3. Pull Request Süreci

Her ne kadar tek geliştirici olunsa da düzen sağlamak için PR süreci uygulanır.

1. Tüm geliştirmeler **dev** branch’inde yapılır.  
2. Değişiklik bittikten sonra PR açılır.  
3. Açıklayıcı bir özet yazılır.  
4. İnceleme sonrası **main** branch’ine merge edilir.

---

## 4. Kod İnceleme (Self-review)

Merge etmeden önce kontrol listesi:

- Gereksiz dosya var mı?  
- console.log veya debug çıktıları temizlendi mi?  
- UI state akışı sorunsuz mu?  
- Endpoint hata yakalama mekanizması çalışıyor mu?  
- README güncellenmesi gerekiyor mu?  

---

## 6. Güvenlik Kuralları

- API anahtarları hiçbir zaman commite eklenmez.  
- `.env` dosyaları `.gitignore` altında tutulur.  
- JWT tokenlar secure storage altında saklanır.  

---
