# Mini sohbet: anlık mesajlaşmanın en sade hali

Şark Köşesi'ndeki anlık mesajlaşma, çevrimiçi sayısı ve canlı güncellemeler bu örnekteki fikrin büyütülmüş halidir.

Bu klasör ana projeden bağımsızdır (kendi paketleri var). Çalıştırmak için bu klasörde:

```
npm install
npm start
```

Sonra http://localhost:5000 adresini **iki ayrı pencerede** aç (biri gizli pencere olsun).
Birinden yaz, diğerinde anında gör. Bir pencereyi kapat, sayının düştüğünü gör.

Denemeler:
1. `server.js` içinde `io.emit("mesaj", yazi)` yerine `socket.broadcast.emit("mesaj", yazi)` yaz. Ne değişti? (Mesaj gönderene geri gelmez.)
2. Mesajın başına saat ekle: `io.emit("mesaj", new Date().toLocaleTimeString() + " " + yazi)`.
3. Küfür filtresi ekle: `if (yazi.includes("salak")) return;` ile mesajı yayınlamadan kes.
4. Tarayıcıda F12 → Network → WS → Messages sekmesinden giden ve gelen mesajları canlı izle.
