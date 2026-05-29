import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
let cached: Transporter | null = null
/** Google SMTP Relay (IP 기반 인증, 포트 587 STARTTLS) */
export function getMailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER
  if (!user) {
    console.warn('[mail] GMAIL_USER missing; skip mail')
    return null
  }
  if (!cached) {
    cached = nodemailer.createTransport({
      host: 'smtp-relay.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      tls: { rejectUnauthorized: false },
    })
  }
  return cached
}
