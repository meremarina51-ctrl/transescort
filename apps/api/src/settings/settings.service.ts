import { Inject, Injectable } from "@nestjs/common";
import { platformSettings } from "@transescort/db";
import { eq } from "drizzle-orm";

const CTA_MODE_KEY = 'cta_mode';
const DEFAULT_CTA_MODE = 'account';

@Injectable()
export class SettingsService {
    constructor(@Inject('DRIZZLE') private readonly db: any) { }

    async getCtaMode(): Promise<string> {
        const row = await this.db
            .select()
            .from(platformSettings)
            .where(eq(platformSettings.key, CTA_MODE_KEY))
            .limit(1);

        return row[0]?.value ?? DEFAULT_CTA_MODE;
    }

    async updateCtaMode(value: string) {
        await this.db
            .insert(platformSettings)
            .values({ key: CTA_MODE_KEY, value, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: platformSettings.key,
                set: { value, updatedAt: new Date() },
            });
    }
};
