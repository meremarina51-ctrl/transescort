import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_DECISIONS = ['resolved', 'dismissed'] as const;

export class VerifyReportDto {
  @ApiProperty({ enum: REPORT_DECISIONS })
  @IsIn(REPORT_DECISIONS)
  decision!: (typeof REPORT_DECISIONS)[number];

  @ApiProperty({ required: false, description: 'Внутренняя заметка админа — не показывается заявителю' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
