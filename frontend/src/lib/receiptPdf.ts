import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import type { Seat } from '../types'
import { formatClock } from './format'
import { locations } from '../data/locations'

export async function buildReceiptPdf(seat: Seat): Promise<Blob> {
  const locationName = locations.find((location) => location.id === seat.locationId)?.name ?? seat.locationId
  const receiptCode = seat.receiptCode ?? `KM-${new Date().getFullYear()}-${seat.code.replace('-', '')}`
  const generatedAt = Date.now()

  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  Object.assign(pdfMake, { vfs: pdfFonts })
  const documentDefinition: TDocumentDefinitions = {
    pageSize: 'A4' as const,
    pageMargins: [46, 42, 46, 48] as [number, number, number, number],
    info: {
      title: `Kütüphane kullanım fişi ${receiptCode}`,
      author: 'Kampüs Masa',
      subject: 'Doğrulanmış masa oturumu',
    },
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'KAMPÜS MASA', style: 'brand' },
              { text: 'KÜTÜPHANE · DİJİTAL KULLANIM BELGESİ', style: 'eyebrow' },
            ],
          },
          {
            width: 104,
            stack: [
              { text: 'OTURUM DURUMU', style: 'smallLabel', alignment: 'right' },
              { text: 'AKTİF', style: 'activeStatus', alignment: 'right' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 518, y2: 0, lineWidth: 1, lineColor: '#dfe7dd' }], margin: [0, 16, 0, 25] },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'MASA KULLANIM FİŞİ', style: 'eyebrow' },
              { text: 'Oturum onaylandı', style: 'title' },
              { text: 'Kütüphane çalışma alanı kullanım belgesi', style: 'subtitle' },
            ],
          },
          {
            width: 160,
            table: {
              widths: ['*'],
              body: [[{
                stack: [
                  { text: 'FİŞ NUMARASI', style: 'smallLabel' },
                  { text: receiptCode, style: 'receiptCode' },
                ],
                fillColor: '#f1f6ee',
                margin: [12, 11, 12, 11],
              }]],
            },
            layout: 'noBorders',
          },
        ],
        columnGap: 18,
      },
      { text: 'OTURUM BİLGİLERİ', style: 'sectionTitle', margin: [0, 30, 0, 10] },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { stack: [{ text: 'ÖĞRENCİ NUMARASI', style: 'smallLabel' }, { text: seat.studentNumber ?? '—', style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
              { stack: [{ text: 'GİRİŞ SAATİ', style: 'smallLabel' }, { text: formatClock(seat.checkedInAt), style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
            ],
            [
              { stack: [{ text: 'ÇALIŞMA NOKTASI', style: 'smallLabel' }, { text: locationName, style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
              { stack: [{ text: 'MASA', style: 'smallLabel' }, { text: `${seat.code} · ${seat.table}`, style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
            ],
            [
              { stack: [{ text: 'ÇALIŞMA ALANI', style: 'smallLabel' }, { text: seat.area, style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
              { stack: [{ text: 'TAHMİNİ ÇIKIŞ', style: 'smallLabel' }, { text: seat.estimatedLeaveAt || 'Belirtilmedi', style: 'fieldValue' }], margin: [12, 12, 12, 12], fillColor: '#f7f9f5' },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 5,
          vLineWidth: () => 8,
          hLineColor: () => '#ffffff',
          vLineColor: () => '#ffffff',
        },
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'QR DOĞRULAMA', style: 'sectionTitle' },
              { text: 'Bu kod, fiş numarası ve masa oturumuyla eşleşir.', style: 'subtitle', margin: [0, 6, 0, 0] },
              { text: `Belge oluşturulma saati · ${formatClock(generatedAt)}`, style: 'smallLabel', margin: [0, 15, 0, 0] },
            ],
            margin: [0, 18, 0, 0],
          },
          {
            width: 136,
            stack: [
              { qr: `KUTUPHANE-FIS:${receiptCode}`, fit: 112, eccLevel: 'M', foreground: '#204936', background: '#ffffff', alignment: 'center' },
              { text: 'DOĞRULAMA KODU', style: 'smallLabel', alignment: 'center', margin: [0, 7, 0, 0] },
            ],
          },
        ],
        columnGap: 14,
        margin: [0, 24, 0, 0],
      },
    ],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: 'KAMPÜS MASA · KÜTÜPHANE OTURUM BELGESİ', alignment: 'left' },
        { text: `${currentPage} / ${pageCount}`, alignment: 'right' },
      ],
      margin: [46, 0, 46, 20],
      fontSize: 8,
      color: '#819084',
    }),
    defaultStyle: { font: 'Roboto', color: '#263a2d' },
    styles: {
      brand: { fontSize: 12, bold: true, color: '#204936', characterSpacing: 1.1 },
      eyebrow: { fontSize: 8, bold: true, color: '#758579', characterSpacing: 1 },
      smallLabel: { fontSize: 7, bold: true, color: '#829084', characterSpacing: .6 },
      activeStatus: { fontSize: 10, bold: true, color: '#4e8155', margin: [0, 4, 0, 0] },
      title: { fontSize: 23, bold: true, color: '#1f3f2e', margin: [0, 8, 0, 5] },
      subtitle: { fontSize: 9, color: '#748176', lineHeight: 1.35 },
      receiptCode: { fontSize: 12, bold: true, color: '#254b36', margin: [0, 5, 0, 0] },
      sectionTitle: { fontSize: 9, bold: true, color: '#335741', characterSpacing: .8 },
      fieldValue: { fontSize: 10, bold: true, color: '#34493a', margin: [0, 5, 0, 0], lineHeight: 1.25 },
    },
  }

  const pdfDocument = pdfMake.createPdf(documentDefinition) as ReturnType<typeof pdfMake.createPdf> & {
    getBlob: (callback: (blob: Blob) => void) => void
  }
  return await new Promise<Blob>((resolve, reject) => {
    try {
      pdfDocument.getBlob(resolve)
    } catch (error) {
      reject(error)
    }
  })
}
