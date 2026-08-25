import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/guards/roles.guard";
import { SettingsService } from "./settings.service";
import { UpdateCtaModeDto } from "./dto/update-cta-mode.dto";

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Patch('cta-mode')
    @ApiOperation({ summary: 'Update CTA mode setting' })
    async updateCtaMode (@Body() body: UpdateCtaModeDto) {
        await this.settingsService.updateCtaMode(body.value);

        return { value: body.value };
    }
}