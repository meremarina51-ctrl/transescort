import { Module } from "@nestjs/common";
import { AuthGuardsModule } from "../auth/guards/auth-guards.module";
import { AdminSettingsController } from "./admin-settings.controller";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
    imports: [AuthGuardsModule],
    controllers: [SettingsController, AdminSettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})

export class SettingsModule {};
