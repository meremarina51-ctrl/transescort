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
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      // The relay (Mailhog locally; a same-host/trusted relay in prod per SMTP_HOST) doesn't need
      // TLS — without this, nodemailer opportunistically negotiates STARTTLS if the server merely
      // advertises it, and a broken handshake silently hangs for its ~2min default timeout instead
      // of failing fast.
      ignoreTLS: true,
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
