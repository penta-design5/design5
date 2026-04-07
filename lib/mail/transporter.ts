import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

let cached: Transporter | null = null

/** Gmail 앱 비밀번호 미설정 시 null — 호출부에서 스킵 */
export function getMailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    return null
  }
  if (!cached) {
    cached = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }
  return cached
}
