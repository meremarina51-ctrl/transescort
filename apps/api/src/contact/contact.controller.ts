import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('message')
  @ApiOperation({ summary: 'Отправить сообщение с формы обратной связи «Контакты»' })
  async send(@Body() body: CreateContactMessageDto) {
    await this.contactService.sendMessage(body.name.trim(), body.email.trim(), body.message.trim());
    return { ok: true };
  }
}
