import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SQL_FILE = path.join(__dirname, 'data', 'database.sql')

class AuthManager {
  constructor() {
    this.users = new Map()
    this.loadFromSql()
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(String(password)).digest('hex')
  }

  loadFromSql() {
    try {
      if (!fs.existsSync(SQL_FILE)) {
        console.warn('database.sql not found at:', SQL_FILE)
        return
      }

      const content = fs.readFileSync(SQL_FILE, 'utf-8')
      // Supports ('359', 'Ada', 'Yılmaz', SHA2('359', 256))
      const withNamesRegex = /\('(\d+)',\s*'([^']*)',\s*'([^']*)',\s*SHA2\('([^']+)',\s*256\)\)/g
      let match
      let count = 0

      while ((match = withNamesRegex.exec(content)) !== null) {
        const studentNo = match[1]
        const firstName = match[2]
        const lastName = match[3]
        const rawPassword = match[4]
        const hash = this.hashPassword(rawPassword)
        this.users.set(studentNo, {
          student_no: studentNo,
          first_name: firstName,
          last_name: lastName,
          password_hash: hash,
        })
        count++
      }

      // Fallback for simple ('359', SHA2('359', 256))
      if (count === 0) {
        const legacyRegex = /\('(\d+)',\s*SHA2\('([^']+)',\s*256\)\)/g
        while ((match = legacyRegex.exec(content)) !== null) {
          const studentNo = match[1]
          const rawPassword = match[2]
          const hash = this.hashPassword(rawPassword)
          this.users.set(studentNo, {
            student_no: studentNo,
            first_name: 'Öğrenci',
            last_name: studentNo,
            password_hash: hash,
          })
          count++
        }
      }

      console.log(`Loaded ${count} student accounts from database.sql`)
    } catch (err) {
      console.error('Error loading database.sql:', err)
    }
  }

  getAllStudentNumbers() {
    return Array.from(this.users.keys()).sort()
  }

  getUser(studentNo) {
    return this.users.get(studentNo) ?? null
  }

  /**
   * Implements the exact LoginStudent MySQL Stored Procedure logic:
   * SELECT id, student_no, first_name, last_name
   * FROM Users
   * WHERE student_no = p_student_no AND password_hash = SHA2(p_password, 256) LIMIT 1;
   */
  login(studentNo, password) {
    if (!studentNo || typeof studentNo !== 'string') {
      throw new Error('Öğrenci numarası gereklidir.')
    }
    if (!password || typeof password !== 'string') {
      throw new Error('Şifre gereklidir.')
    }

    const cleanNo = studentNo.trim()
    const cleanPass = password.trim()
    const passwordHash = this.hashPassword(cleanPass)

    const user = this.users.get(cleanNo)
    if (!user || user.password_hash !== passwordHash) {
      throw new Error('Sistemde böyle bir kayıt bulunamadı.')
    }

    const fullName = user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : `Öğrenci ${user.student_no}`

    return {
      studentNo: user.student_no,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName,
    }
  }
}

export const authManager = new AuthManager()
