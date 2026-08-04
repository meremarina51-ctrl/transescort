import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ListingsService } from '../listings/listings.service';

export const VERIFY_DECISIONS = ['approved', 'rejected', 'changes_requested'] as const;

class VerifyListingDto {
  @ApiProperty({ enum: VERIFY_DECISIONS })
  @IsIn(VERIFY_DECISIONS)
  decision!: (typeof VERIFY_DECISIONS)[number];

  @ApiProperty({
    required: false,
    description: 'Комментарий админа — обязателен при отклонении или запросе замены, показывается исполнителю',
  })
  @ValidateIf((o) => o.decision !== 'approved')
  @IsString()
  @IsNotEmpty({ message: 'Комментарий обязателен при отклонении или запросе замены' })
  @MaxLength(1000)
  note?: string;
}

@ApiTags('Admin Moderation')
@ApiBearerAuth()
@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ModerationController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('listings')
  @ApiOperation({ summary: 'Очередь анкет, ожидающих проверки' })
  async listingsQueue() {
    return this.listingsService.listModerationQueue();
  }

  @Patch('listings/:id/verify')
  @ApiOperation({ summary: 'Подтвердить (публикует), отклонить или запросить замену (оба — с обязательным комментарием)' })
  async verifyListing(@Param('id') id: string, @Body() body: VerifyListingDto) {
    const existing = await this.listingsService.findByIdForAdmin(id);
    if (!existing) throw new NotFoundException('Анкета не найдена');

    return this.listingsService.verify(id, body.decision, body.note);
  }
}
