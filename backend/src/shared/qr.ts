import QRCode from 'qrcode'

export async function generateQrPng(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#0c4a6e', light: '#ffffff' },
  })
}

export async function generateQrSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    width: 400,
    margin: 2,
  })
}
