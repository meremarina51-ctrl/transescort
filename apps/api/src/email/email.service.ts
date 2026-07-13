import { Injectable, Logger, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isLocalRelay(host: string, port: number): boolean {
  const h = host.toLowerCase();
  return port === 1025 || port === 1026 || h === 'localhost' || h === '127.0.0.1' || h.includes('mailhog');
}

/** Single SMTP wrapper shared by auth (verification emails) and the contact form. */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private transportOptions(): SMTPTransport.Options {
    const host = this.config.get<string>('SMTP_HOST', '').trim();
    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10);
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS') ?? '';
    const localRelay = isLocalRelay(host, port);

    return {
      host,
      port,
      secure: !localRelay && port === 465,
      ...(localRelay ? { ignoreTLS: true, requireTLS: false } : {}),
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 15_000,
    };
  }

  private fromAddress(): string {
    return this.config.get<string>('SMTP_FROM')?.trim() || 'TransEscort <noreply@transescort.local>';
  }

  private async send(mail: { to: string; subject: string; text: string; html: string; replyTo?: string }) {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      throw new ServiceUnavailableException('SMTP is not configured on the server.');
    }

    const transporter = nodemailer.createTransport(this.transportOptions());
    try {
      await transporter.sendMail({ ...mail, from: this.fromAddress() });
    } catch (err) {
      const e = err as Error & { response?: string };
      this.logger.error(`sendMail failed: ${[e.message, e.response].filter(Boolean).join(' | ')}`);
      throw new BadGatewayException('Failed to send email via SMTP.');
    }
  }

  async sendVerificationEmail(to: string, fullName: string, verifyUrl: string) {
    await this.send({
      to,
      subject: 'Подтвердите email',
      text: `Здравствуйте, ${fullName}!\n\nПодтвердите email по ссылке: ${verifyUrl}\n\nСсылка действует 24 часа.`,
      html: `
        <p>Здравствуйте, ${escapeHtml(fullName)}!</p>
        <p>Подтвердите свой email, перейдя по ссылке:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color:#888;font-size:12px;">Ссылка действует 24 часа.</p>
      `,
    });
    this.logger.log(`Verification email sent to ${to}`);
  }

  async sendContactMessage(params: { to: string; fromName: string; fromEmail: string; message: string }) {
    await this.send({
      to: params.to,
      replyTo: params.fromEmail,
      subject: `Сообщение с сайта: ${params.fromName}`,
      text: `От: ${params.fromName} <${params.fromEmail}>\n\n${params.message}`,
      html: `<p><strong>От:</strong> ${escapeHtml(params.fromName)} &lt;${escapeHtml(params.fromEmail)}&gt;</p><p>${escapeHtml(params.message).replace(/\n/g, '<br/>')}</p>`,
    });
  }
}
