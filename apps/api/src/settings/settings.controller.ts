import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";


@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('cta-mode')
    @ApiOperation({ summary: 'Get current CTA mode setting' })
    async getCtaMode() {
        const value = await this.settingsService.getCtaMode();
        return { value };
    }
}