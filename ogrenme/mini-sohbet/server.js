const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");

// 1) Normal bir web sunucusu: sayfayı (index.html) gönderir
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(fs.readFileSync(__dirname + "/index.html"));
});

// 2) Aynı sunucuya "telefon santrali" (Socket.IO) takıyoruz
const io = new Server(server);

// 3) Biri telefonu açınca (bağlanınca)...
io.on("connection", (socket) => {
  console.log("Biri bağlandı:", socket.id);
  io.emit("sayi", io.engine.clientsCount); // herkese yeni kişi sayısını söyle

  // 4) O kişi "mesaj" gönderirse, aynısını HERKESE yay
  socket.on("mesaj", (yazi) => {
    io.emit("mesaj", yazi);
  });

  // 5) Telefonu kapatınca, herkese yeni sayıyı söyle
  socket.on("disconnect", () => {
    io.emit("sayi", io.engine.clientsCount);
  });
});

server.listen(5000, () => console.log("Aç: http://localhost:5000"));
