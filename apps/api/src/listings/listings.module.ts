import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { StorageModule } from '../storage/storage.module';
import { ListingsController } from './listings.controller';
import { CatalogController } from './catalog.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [AuthGuardsModule, StorageModule],
  controllers: [ListingsController, CatalogController],
  providers: [ListingsService],
})
export class ListingsModule {}
