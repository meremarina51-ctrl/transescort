import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import type { ContactMessageDto } from './dto/contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async sendContactMessage(dto: ContactMessageDto): Promise<void> {
    const to = this.config.get<string>('CONTACT_FORM_TO_EMAIL')?.trim() || 'contact@transescort.local';
    await this.emailService.sendContactMessage({
      to,
      fromName: dto.name,
      fromEmail: dto.email,
      message: dto.message,
    });
  }
}
