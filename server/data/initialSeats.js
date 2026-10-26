export const locations = [
  {
    id: 'merkez-kutuphanesi',
    name: 'Merkez Kütüphane',
    shortName: 'Merkez',
    sectionLabel: 'KÜTÜPHANE · 1. & 2. KAT',
    floorLabel: '1. Kat',
    mapTitle: '1. kat yerleşimi',
    mapLabel: '1. KAT · SALON A',
    hours: '08.00 — 22.00',
    floors: [
      {
        floorNumber: 1,
        floorLabel: '1. Kat',
        sectionLabel: 'MERKEZ KÜTÜPHANE · 1. KAT',
        mapTitle: '1. kat yerleşimi (Sessiz Salon)',
        mapLabel: '1. KAT · SALON A',
      },
      {
        floorNumber: 2,
        floorLabel: '2. Kat',
        sectionLabel: 'MERKEZ KÜTÜPHANE · 2. KAT',
        mapTitle: '2. kat yerleşimi (Grup & Çalışma)',
        mapLabel: '2. KAT · SALON B',
      },
    ],
    areaLabels: { 'Pencere önü': 'Pencere önü', 'Sessiz salon': 'Sessiz salon', 'Grup masaları': 'Grup masaları' },
    tableLabels: { 'Pencere 01': 'Pencere 01', 'Sessiz 01': 'Sessiz 01', 'Pencere 02': 'Pencere 02', 'Grup 01': 'Grup 01' },
  },
  {
    id: 'genc-ofis',
    name: 'Genç Ofis',
    shortName: 'Genç Ofis',
    sectionLabel: 'GENÇ OFİS · ANA SALON',
    floorLabel: 'Zemin Kat',
    mapTitle: 'Genç Ofis yerleşimi',
    mapLabel: 'GENÇ OFİS · ANA SALON',
    hours: '08.00 — 22.00',
    areaLabels: { 'Pencere önü': 'Açık çalışma', 'Sessiz salon': 'Odak alanı', 'Grup masaları': 'Ortak çalışma' },
    tableLabels: { 'Pencere 01': 'Ofis masası 01', 'Sessiz 01': 'Odak masası 01', 'Pencere 02': 'Ofis masası 02', 'Grup 01': 'Ortak masa 01' },
  },
  {
    id: 'isletme-fakultesi',
    name: 'İşletme Fakültesi çalışma alanı',
    shortName: 'İşletme',
    sectionLabel: 'İŞLETME FAKÜLTESİ · ÇALIŞMA ALANI',
    floorLabel: '1. Kat',
    mapTitle: 'Fakülte çalışma alanı',
    mapLabel: 'İŞLETME FAKÜLTESİ · 1. KAT',
    hours: '08.00 — 22.00',
    areaLabels: { 'Pencere önü': 'Açık çalışma', 'Sessiz salon': 'Bireysel alan', 'Grup masaları': 'Grup çalışma' },
    tableLabels: { 'Pencere 01': 'İşletme 01', 'Sessiz 01': 'Bireysel 01', 'Pencere 02': 'İşletme 02', 'Grup 01': 'Grup masası 01' },
  },
  {
    id: 'bilgisayar-binasi',
    name: 'Bilgisayar Binası çalışma alanı',
    shortName: 'Bilgisayar',
    sectionLabel: 'BİLGİSAYAR BİNASI · ÇALIŞMA ALANI',
    floorLabel: 'Zemin Kat',
    mapTitle: 'Bilgisayar Binası yerleşimi',
    mapLabel: 'BİLGİSAYAR BİNASI · ANA SALON',
    hours: '08.00 — 22.00',
    areaLabels: { 'Pencere önü': 'Açık bilgisayar alanı', 'Sessiz salon': 'Sessiz çalışma', 'Grup masaları': 'Grup çalışma' },
    tableLabels: { 'Pencere 01': 'Bilgisayar masası 01', 'Sessiz 01': 'Sessiz masa 01', 'Pencere 02': 'Bilgisayar masası 02', 'Grup 01': 'Grup masası 01' },
  },
]

export const CENTRAL_LOCATION_ID = locations[0].id

export const DEMO_STUDENT_NUMBERS = [
  '359', '370', '897', '306', '646', '461', '346', '686', '475', '123',
  '516', '178', '508', '911', '309', '419', '454', '403', '703', '365',
  '690', '463', '144', '680', '512', '120', '247', '567', '710', '932',
  '485', '251', '398', '855', '155', '391', '330', '688', '517', '366',
  '997', '482', '827', '436', '140', '681', '131', '832', '379', '357',
  '943', '878', '798', '256', '839', '630', '740', '814', '615', '723',
  '833', '693', '786', '345', '429', '642', '862', '377', '408', '882',
  '822', '994', '121', '386', '891', '817', '253', '376', '332', '298',
  '198', '137', '423', '718', '719', '829', '258', '762', '714', '141',
  '843', '663', '286', '109', '341', '912', '792', '185', '771', '239'
]

export const seatDefinitions = [
  { id: 'P-01', area: 'Pencere önü', table: 'Pencere 01', status: 'occupied' },
  { id: 'P-02', area: 'Pencere önü', table: 'Pencere 01', status: 'reserved' },
  { id: 'P-03', area: 'Pencere önü', table: 'Pencere 01', status: 'available' },
  { id: 'P-04', area: 'Pencere önü', table: 'Pencere 01', status: 'available' },
  { id: 'S-01', area: 'Sessiz salon', table: 'Sessiz 01', status: 'available' },
  { id: 'S-02', area: 'Sessiz salon', table: 'Sessiz 01', status: 'occupied' },
  { id: 'S-03', area: 'Sessiz salon', table: 'Sessiz 01', status: 'available' },
  { id: 'S-04', area: 'Sessiz salon', table: 'Sessiz 01', status: 'reserved' },
  { id: 'O-01', area: 'Pencere önü', table: 'Pencere 02', status: 'occupied' },
  { id: 'O-02', area: 'Pencere önü', table: 'Pencere 02', status: 'available' },
  { id: 'O-03', area: 'Pencere önü', table: 'Pencere 02', status: 'available' },
  { id: 'O-04', area: 'Pencere önü', table: 'Pencere 02', status: 'available' },
  { id: 'G-01', area: 'Grup masaları', table: 'Grup 01', status: 'available' },
  { id: 'G-02', area: 'Grup masaları', table: 'Grup 01', status: 'occupied' },
  { id: 'G-03', area: 'Grup masaları', table: 'Grup 01', status: 'available' },
  { id: 'G-04', area: 'Grup masaları', table: 'Grup 01', status: 'available' },
]

export function formatClock(timestamp) {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')}`
}

export function createInitialSeats() {
  const now = Date.now()
  const occupiedDurations = [89, 63, 47, 31, 74, 52]
  let globalIndex = 0

  return locations.flatMap((location, locationIndex) => {
    const floorsToRender = location.floors && location.floors.length > 0
      ? location.floors
      : [null]

    return floorsToRender.flatMap((floorObj, floorIdx) => {
      let occupiedIndex = 0
      const floorNum = floorObj ? floorObj.floorNumber : undefined
      const idPrefix = floorNum ? `${location.id}:${floorNum}` : location.id

      return seatDefinitions.map((definition, index) => {
        globalIndex++
        const isOccupied = floorIdx === 1
          ? (index === 0 || index === 5 || index === 8)
          : definition.status === 'occupied'
        const isReserved = floorIdx === 1
          ? (index === 1 || index === 7)
          : definition.status === 'reserved'
        const status = isOccupied ? 'occupied' : isReserved ? 'reserved' : 'available'

        const startedAt = status === 'occupied'
          ? now - (occupiedDurations[(occupiedIndex++) % occupiedDurations.length] + locationIndex * 3 + (floorIdx * 5)) * 60000
          : null
        const assignedStudent = DEMO_STUDENT_NUMBERS[globalIndex % DEMO_STUDENT_NUMBERS.length]
        const floorReceiptTag = floorNum ? `K${floorNum}` : location.id.slice(0, 2).toUpperCase()

        return {
          ...definition,
          id: `${idPrefix}:${definition.id}`,
          code: definition.id,
          locationId: location.id,
          floor: floorNum,
          area: location.areaLabels[definition.area],
          table: location.tableLabels[definition.table],
          status,
          studentNumber: status === 'occupied' ? assignedStudent : null,
          expiresAt: status === 'reserved' ? now + (index === 1 ? 8 : 12) * 60000 : null,
          checkedInAt: startedAt,
          estimatedLeaveAt: status === 'occupied' && index % 2 === 0 ? formatClock(now + 55 * 60000) : null,
          receiptCode: status === 'occupied' ? `KM-2026-${floorReceiptTag}-${definition.id.replace('-', '')}` : null,
          breakStartedAt: null,
        }
      })
    })
  })
}
