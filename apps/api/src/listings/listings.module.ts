import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { ListingsController } from './listings.controller';
import { CatalogController } from './catalog.controller';
import { AdminListingsController } from './admin-listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [AuthGuardsModule, StorageModule, TelegramModule, FavoritesModule],
  controllers: [ListingsController, CatalogController, AdminListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
