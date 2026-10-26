import type { LibraryNote } from '../types'

export function createInitialNotes(): LibraryNote[] {
  const now = Date.now()
  return [
    {
      id: 'note-1',
      title: 'Siyah Sony kulaklık kutusu masada unutuldu',
      content: 'Merkez Kütüphane 1. Kat pencere kenarı P-03 masasında siyah Sony kablosuz kulaklık kutumu unuttum. Gören ya da danışmaya bırakan oldu mu?',
      category: 'kayip',
      locationName: 'Merkez Kütüphane · 1. Kat',
      seatCode: 'P-03',
      studentNumber: '567',
      studentName: 'Sude Kaplan',
      isResolved: false,
      createdAt: now - 3 * 3600_000 - 25 * 60_000,
      comments: [
        {
          id: 'comm-101',
          noteId: 'note-1',
          studentNumber: '686',
          studentName: 'Kerem Ergin',
          content: 'Saat 18.00 gibi danışma bankosuna siyah bir kutu teslim edildiğini duydum, oraya sormanı tavsiye ederim.',
          createdAt: now - 2 * 3600_000 - 10 * 60_000,
        },
        {
          id: 'comm-102',
          noteId: 'note-1',
          studentNumber: '567',
          studentName: 'Sude Kaplan',
          content: 'Harikasın Kerem, hemen danışmaya gidip soruyorum!',
          createdAt: now - 1 * 3600_000 - 45 * 60_000,
        },
      ],
    },
    {
      id: 'note-2',
      title: 'Mavi Stanley su termosu bulundu',
      content: '2. Kat grup çalışma masası G-02 üzerinde unutulmuş mavi renkli çelik termos bulundu. Görevliye teslim edildi, danışmadan alabilirsiniz.',
      category: 'bulundu',
      locationName: 'Merkez Kütüphane · 2. Kat',
      seatCode: 'G-02',
      studentNumber: '178',
      studentName: 'Can Bozkurt',
      isResolved: false,
      createdAt: now - 4 * 3600_000 - 15 * 60_000,
      comments: [
        {
          id: 'comm-201',
          noteId: 'note-2',
          studentNumber: '359',
          studentName: 'Ada Yılmaz',
          content: 'Grup arkadaşımın termosuydu, danışmaya yönlendirdim teşekkürler.',
          createdAt: now - 3 * 3600_000 - 5 * 60_000,
        },
      ],
    },
    {
      id: 'note-3',
      title: 'Fizik 1 Özet Formül Kağıtları',
      content: 'Vize sınavına hazırlık için çıkardığım 3 sayfalık türev ve hareket formülleri özetini masada bıraktım. İhtiyacı olan alıp fotokopi çekebilir.',
      category: 'genel',
      locationName: 'Merkez Kütüphane · 1. Kat Sessiz Salon',
      seatCode: 'S-01',
      studentNumber: '370',
      studentName: 'Mert Öztürk',
      isResolved: true,
      createdAt: now - 6 * 3600_000,
      comments: [
        {
          id: 'comm-301',
          noteId: 'note-3',
          studentNumber: '897',
          studentName: 'Zeynep Çetin',
          content: 'Notlar çok düzenli ve faydalı olmuş, emeğine sağlık.',
          createdAt: now - 4 * 3600_000 - 50 * 60_000,
        },
      ],
    },
  ]
}
