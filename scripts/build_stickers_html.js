import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInitialSeats, locations } from '../server/data/initialSeats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const targetFile = path.join(rootDir, 'public', 'desk-stickers.html')

const seats = createInitialSeats()

// Group seats by location & floor
const groups = [
  {
    id: 'merkez-kutuphanesi-kat-1',
    label: 'Merkez Kütüphane · 1. Kat',
    shortLabel: 'Merkez · 1. Kat',
    filter: (s) => s.locationId === 'merkez-kutuphanesi' && s.floor === 1,
    folder: 'merkez-kutuphanesi-kat-1',
    locationName: 'Merkez Kütüphane · 1. Kat (Sessiz Salon A)',
  },
  {
    id: 'merkez-kutuphanesi-kat-2',
    label: 'Merkez Kütüphane · 2. Kat',
    shortLabel: 'Merkez · 2. Kat',
    filter: (s) => s.locationId === 'merkez-kutuphanesi' && s.floor === 2,
    folder: 'merkez-kutuphanesi-kat-2',
    locationName: 'Merkez Kütüphane · 2. Kat (Grup & Çalışma Salonu B)',
  },
  {
    id: 'genc-ofis',
    label: 'Genç Ofis',
    shortLabel: 'Genç Ofis',
    filter: (s) => s.locationId === 'genc-ofis',
    folder: 'genc-ofis',
    locationName: 'Genç Ofis · Zemin Kat (Ana Salon)',
  },
  {
    id: 'isletme-fakultesi',
    label: 'İşletme Fakültesi',
    shortLabel: 'İşletme Fakültesi',
    filter: (s) => s.locationId === 'isletme-fakultesi',
    folder: 'isletme-fakultesi',
    locationName: 'İşletme Fakültesi · 1. Kat',
  },
  {
    id: 'bilgisayar-binasi',
    label: 'Bilgisayar Binası',
    shortLabel: 'Bilgisayar Binası',
    filter: (s) => s.locationId === 'bilgisayar-binasi',
    folder: 'bilgisayar-binasi',
    locationName: 'Bilgisayar Binası · Zemin Kat',
  },
]

let cardsHtml = ''

for (const group of groups) {
  const groupSeats = seats.filter(group.filter)
  for (const seat of groupSeats) {
    const payload = seat.floor
      ? `KUTUPHANE:${seat.locationId}:${seat.floor}:${seat.code}`
      : `KUTUPHANE:${seat.locationId}:${seat.code}`
    const qrSrc = `/qr-codes/${group.folder}/${seat.code}.png`

    cardsHtml += `
    <div class="sticker-card" data-group="${group.id}">
      <div class="sticker-brand">
        <img src="/logo-badge.png" alt="Logo">
        <div class="sticker-brand-text">
          <strong>kampüs</strong>
          <small>MASA & KÜTÜPHANE</small>
        </div>
      </div>
      <div class="sticker-qr">
        <img src="${qrSrc}" alt="${seat.code} QR Kod" loading="lazy">
      </div>
      <div class="sticker-seat">${seat.code}</div>
      <div class="sticker-meta">${group.locationName} · ${seat.table}</div>
      <div class="sticker-instruction">
        <strong>Otururken QR Okutun</strong>
        Kampüs Masa uygulamasından kameranızı açarak bu karekodu tarayın.
      </div>
      <div class="qr-payload">${payload}</div>
    </div>`
  }
}

const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kampüs Masa - Tüm Masa QR Etiketleri (80 Masa)</title>
  <link rel="icon" type="image/png" href="/logo-badge.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f1f4ef;
      color: #202923;
      padding: 32px 20px 60px;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      max-width: 1080px;
      margin: 0 auto 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-info h1 {
      font-family: 'Manrope', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #183d32;
      letter-spacing: -0.4px;
    }
    .header-info p {
      font-size: 13px;
      color: #5c685d;
      margin-top: 4px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .print-btn {
      background: #183d32;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.18s ease;
    }
    .print-btn:hover { background: #123027; }

    .filter-bar {
      max-width: 1080px;
      margin: 0 auto 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      padding: 12px 16px;
      background: #ffffff;
      border: 1px solid #dce4da;
      border-radius: 12px;
    }
    .filter-label {
      font-size: 11px;
      font-weight: 800;
      color: #546657;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-right: 4px;
    }
    .filter-btn {
      padding: 7px 12px;
      border-radius: 6px;
      border: 1px solid #d5dfd3;
      background: #f7faf5;
      color: #3b4e3f;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn:hover {
      background: #ebf3e7;
      border-color: #bcd0b6;
    }
    .filter-btn.active {
      background: #183d32;
      color: #ffffff;
      border-color: #183d32;
    }

    .grid {
      max-width: 1080px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 22px;
    }
    .sticker-card {
      background: #ffffff;
      border: 2px dashed #cfdad0;
      border-radius: 16px;
      padding: 22px 20px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 4px 14px rgba(24, 61, 50, 0.04);
      position: relative;
      break-inside: avoid;
    }
    .sticker-card.hidden {
      display: none !important;
    }
    .sticker-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .sticker-brand img {
      width: 26px;
      height: 26px;
      border-radius: 6px;
    }
    .sticker-brand-text {
      text-align: left;
      line-height: 1.1;
    }
    .sticker-brand-text strong {
      display: block;
      font-family: 'Manrope', sans-serif;
      font-size: 13px;
      font-weight: 800;
      color: #183d32;
      letter-spacing: -0.2px;
    }
    .sticker-brand-text small {
      font-size: 8px;
      font-weight: 700;
      color: #6e7d70;
      letter-spacing: 0.6px;
    }
    .sticker-qr {
      width: 170px;
      height: 170px;
      padding: 8px;
      background: #ffffff;
      border: 1px solid #e0e9df;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: inset 0 0 0 1px #f0f5ed;
    }
    .sticker-qr img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }
    .sticker-seat {
      font-family: 'Manrope', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #183d32;
      letter-spacing: 0.5px;
      line-height: 1;
      margin-bottom: 4px;
    }
    .sticker-meta {
      font-size: 11px;
      font-weight: 600;
      color: #556758;
      margin-bottom: 10px;
    }
    .sticker-instruction {
      background: #f4f8f1;
      border: 1px solid #e1ecde;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 10px;
      color: #3b503e;
      line-height: 1.4;
      width: 100%;
      margin-top: auto;
    }
    .sticker-instruction strong {
      display: block;
      color: #183d32;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .qr-payload {
      margin-top: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 8px;
      color: #7b8c7e;
      background: #fbfdf9;
      padding: 3px 6px;
      border-radius: 4px;
      border: 1px solid #e9eee8;
      width: 100%;
      word-break: break-all;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .header, .filter-bar { display: none !important; }
      .grid { gap: 14px; grid-template-columns: repeat(2, 1fr); max-width: 100%; }
      .sticker-card { box-shadow: none; border-color: #666; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-info">
      <h1>Tüm Çalışma Masaları QR Etiketleri (80 Masa)</h1>
      <p>Merkez Kütüphane 1. Kat, 2. Kat ve tüm fakülte çalışma alanları için fiziki masa etiketleri.</p>
    </div>
    <div class="header-actions">
      <button class="print-btn" onclick="window.print()">Etiketleri Yazdır / PDF Al</button>
    </div>
  </div>

  <div class="filter-bar">
    <span class="filter-label">Filtrele:</span>
    <button class="filter-btn active" onclick="filterGroup('all', this)">Tümü (80)</button>
    <button class="filter-btn" onclick="filterGroup('merkez-kutuphanesi-kat-1', this)">Merkez · 1. Kat (16)</button>
    <button class="filter-btn" onclick="filterGroup('merkez-kutuphanesi-kat-2', this)">Merkez · 2. Kat (16)</button>
    <button class="filter-btn" onclick="filterGroup('genc-ofis', this)">Genç Ofis (16)</button>
    <button class="filter-btn" onclick="filterGroup('isletme-fakultesi', this)">İşletme Fakültesi (16)</button>
    <button class="filter-btn" onclick="filterGroup('bilgisayar-binasi', this)">Bilgisayar Binası (16)</button>
  </div>

  <div class="grid" id="stickersGrid">
    ${cardsHtml}
  </div>

  <script>
    function filterGroup(groupId, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cards = document.querySelectorAll('.sticker-card');
      cards.forEach(card => {
        if (groupId === 'all' || card.getAttribute('data-group') === groupId) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }
  </script>
</body>
</html>
`

fs.writeFileSync(targetFile, html, 'utf-8')
console.log('Successfully wrote public/desk-stickers.html with 80 desk cards.')
