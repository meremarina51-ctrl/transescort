import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class UpdateCtaModeDto {
    @ApiProperty({ enum: ['account', 'telegram'] })
    @IsIn(['account', 'telegram'])
    value!: 'account' | 'telegram';
};
