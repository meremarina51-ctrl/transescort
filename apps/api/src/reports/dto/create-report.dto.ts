import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { REPORT_CATEGORIES, REPORT_TARGET_TYPES, type ReportCategory, type ReportTargetType } from '@transescort/db';

export class CreateReportDto {
  @ApiProperty({ enum: REPORT_TARGET_TYPES })
  @IsIn(REPORT_TARGET_TYPES)
  targetType!: ReportTargetType;

  @ApiProperty()
  @IsUUID()
  targetId!: string;

  @ApiProperty({ enum: REPORT_CATEGORIES })
  @IsIn(REPORT_CATEGORIES)
  category!: ReportCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Опишите жалобу подробнее' })
  @MaxLength(2000)
  text!: string;
}
