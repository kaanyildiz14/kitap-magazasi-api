import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const app = express();
const port = 3000;

// PostgreSQL Veritabanı bağlantı ayarlarımız
const pool = new Pool({
  user: 'kaanyildiz',
  host: 'localhost',
  database: 'kaanyildiz',
  password: '', 
  port: 5432,
});

// 1. Kural: Ana sayfaya girildiğinde tüm dükkanın stoklarını liste halinde göster
app.get('/', async (req: Request, res: Response) => {
  try {
    // Tüm kitapları ID numarasına göre sıralayarak çekiyoruz
    const result = await pool.query("SELECT * FROM kitaplar ORDER BY id ASC");
    const kitaplar = result.rows;
    
    // Tarayıcıda güzel görünmesi için basit bir liste oluşturuyoruz
    let html = "<h1>📚 Kitap Mağazası Güncel Stoklar</h1><ul>";
    kitaplar.forEach((kitap: any) => {
      html += `<li>[ID: ${kitap.id}] - <b>${kitap.isim}</b> (Kalan Stok: ${kitap.stok})</li>`;
    });
    html += "</ul>";
    
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Veritabanına bağlanılamadı!');
  }
});

// 2. Kural: Adresin sonuna yazılan ID numarasına göre o kitabı sat (Örn: /satis-yap/3)
app.get('/satis-yap/:kitapId', async (req: Request, res: Response) => {
  const id = req.params.kitapId; // URL'nin sonuna yazılan sayıyı yakalıyoruz

  try {
    // Gelen ID'ye göre güncelleme yap ($1 güvenlik önlemidir, SQL Injection saldırılarını önler)
    const result = await pool.query(
      "UPDATE kitaplar SET stok = stok - 1 WHERE id = $1 AND stok > 0 RETURNING *",
      [id]
    );

    if (result.rows.length > 0) {
      const satilanKitap = result.rows[0];
      res.send(`🎉 Başarılı! <b>${satilanKitap.isim}</b> adlı kitaptan 1 adet satıldı. Yeni stok: ${satilanKitap.stok}`);
    } else {
      res.send('❌ Satış başarısız! Ya stokta kitap kalmadı ya da böyle bir ID numarası yok.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Satış işlemi sırasında veritabanı hatası oluştu!');
  }
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Akıllı sunucu çalışıyor: http://localhost:${port}`);
});



// CI-CD Ajan Tetikleme Testi