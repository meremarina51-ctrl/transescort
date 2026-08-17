import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger('ContactService');
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly toEmail: string;

  constructor(private readonly configService: ConfigService) {
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port,
      // 465 is implicit TLS (e.g. Yandex); everything else (587, Mailhog's 1025/1026, ...) starts
      // plain and upgrades via STARTTLS only if the server actually advertises it — Mailhog doesn't,
      // so it stays plain; real providers like Yandex require this and will reject a plain connection.
      secure: Number(port) === 465,
      auth: user && pass ? { user, pass } : undefined,
      // Fails fast instead of silently hanging on a broken/unreachable host — see the 127.0.0.1
      // vs "localhost" IPv6 issue this project hit locally with Mailhog on Docker Desktop.
      connectionTimeout: 10_000,
    });
    this.fromEmail = this.configService.get<string>('SMTP_FROM') ?? 'LuxEscortia <noreply@luxescortia.local>';
    this.toEmail = this.configService.get<string>('CONTACT_FORM_TO_EMAIL') ?? this.fromEmail;
  }

  async sendMessage(name: string, email: string, message: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: this.toEmail,
      replyTo: email,
      subject: `Сообщение с сайта от ${name}`,
      text: `Имя: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><b>Имя:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
    });
    this.logger.log(`Contact form message relayed from ${email}`);
  }
}
