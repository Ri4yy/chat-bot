import crypto from 'crypto'

// Ключ шифрования должен быть 32 символа (256 бит). 
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('КРИТИЧЕСКАЯ ОШИБКА: Переменная ENCRYPTION_KEY должна быть установлена в .env.local и состоять ровно из 32 символов.')
}

const ALGORITHM = 'aes-256-cbc'

export function encrypt(text: string): string {
  if (!text) return text
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  } catch (error) {
    console.error('Encryption error:', error)
    return text // В случае ошибки (например, неверная длина ключа) возвращаем как есть, либо можно прокидывать ошибку
  }
}

export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text
  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (error) {
    console.error('Decryption error:', error)
    return text // Возвращаем сырой текст, если не удалось расшифровать
  }
}
