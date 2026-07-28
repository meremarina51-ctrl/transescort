import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const STATUS_OPTIONS = ['draft', 'published'] as const;
export const TYPE_OPTIONS = ['Активный', 'Универсал', 'Пассивный'] as const;
export const FIGURE_OPTIONS = ['Стройная', 'Спортивная', 'Худощавая', 'Пышная', 'Модельная'] as const;
export const TEMPERAMENT_OPTIONS = ['Нежная', 'Страстная', 'Доминантная', 'Игривая', 'Спокойная'] as const;
export const HAIR_COLOR_OPTIONS = ['Блондинка', 'Брюнетка', 'Шатенка', 'Рыжая', 'Другой'] as const;
export const EYE_COLOR_OPTIONS = ['Голубые', 'Зелёные', 'Карие', 'Серые', 'Чёрные'] as const;
export const COUNTRY_OPTIONS = ['Россия', 'Беларусь', 'Украина', 'Казахстан', 'Другая'] as const;
export const CITY_OPTIONS = [
  'Москва',
  'Балашиха',
  'Люберцы',
  'Одинцово',
  'Химки',
  'Мытищи',
  'Подольск',
  'Другой',
] as const;

export class UpdateListingDto {
  @ApiProperty({ required: false, enum: STATUS_OPTIONS })
  @IsOptional()
  @IsIn(STATUS_OPTIONS)
  status?: 'draft' | 'published';

  @ApiProperty({ required: false, maxLength: 3000 })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  bio?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Укажите имя для анкеты' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ required: false, minimum: 18, maximum: 80 })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(80)
  age?: number;

  @ApiProperty({ required: false, minimum: 130, maximum: 220 })
  @IsOptional()
  @IsInt()
  @Min(130)
  @Max(220)
  height?: number;

  @ApiProperty({ required: false, minimum: 30, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  weight?: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  breastSize?: number;

  @ApiProperty({ required: false, enum: TYPE_OPTIONS })
  @IsOptional()
  @IsIn(TYPE_OPTIONS)
  type?: string;

  @ApiProperty({ required: false, enum: FIGURE_OPTIONS })
  @IsOptional()
  @IsIn(FIGURE_OPTIONS)
  figure?: string;

  @ApiProperty({ required: false, enum: TEMPERAMENT_OPTIONS })
  @IsOptional()
  @IsIn(TEMPERAMENT_OPTIONS)
  temperament?: string;

  @ApiProperty({ required: false, enum: HAIR_COLOR_OPTIONS })
  @IsOptional()
  @IsIn(HAIR_COLOR_OPTIONS)
  hairColor?: string;

  @ApiProperty({ required: false, enum: EYE_COLOR_OPTIONS })
  @IsOptional()
  @IsIn(EYE_COLOR_OPTIONS)
  eyeColor?: string;

  @ApiProperty({ required: false, enum: COUNTRY_OPTIONS })
  @IsOptional()
  @IsIn(COUNTRY_OPTIONS)
  country?: string;

  @ApiProperty({ required: false, enum: CITY_OPTIONS })
  @IsOptional()
  @IsIn(CITY_OPTIONS)
  city?: string;
}
