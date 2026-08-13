import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type RequestWithUser } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const MAX_PHOTOS_PER_UPLOAD = 10;

const EXT_BY_MIMETYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

function fileExtension(file: Express.Multer.File): string {
  return extname(file.originalname) || EXT_BY_MIMETYPE[file.mimetype] || '';
}

@ApiTags('Listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly storageService: StorageService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить анкету текущего исполнителя' })
  @ApiResponse({ status: 200, description: 'Анкета (или null, если ещё не создана)' })
  @ApiResponse({ status: 403, description: 'Доступно только для исполнителей' })
  async getMine(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    return this.listingsService.findByUserId(req.user!.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Создать или обновить анкету текущего исполнителя' })
  @ApiResponse({ status: 200, description: 'Анкета сохранена' })
  @ApiResponse({ status: 403, description: 'Доступно только для исполнителей' })
  async updateMine(@Request() req: RequestWithUser, @Body() body: UpdateListingDto) {
    this.assertPerformer(req);
    // Status transitions only ever happen through the dedicated endpoints below (submit/hide/unhide)
    // or admin decisions — UpdateListingDto has no `status` field, so there's nothing to strip here.
    return this.listingsService.upsert(req.user!.userId, body);
  }

  @Post('me/submit')
  @ApiOperation({ summary: 'Отправить анкету на проверку админом' })
  @ApiResponse({ status: 200, description: 'Анкета отправлена на проверку' })
  @ApiResponse({ status: 404, description: 'Анкета ещё не создана' })
  async submit(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    return this.listingsService.submitForReview(req.user!.userId);
  }

  @Post('me/hide')
  @ApiOperation({ summary: 'Скрыть свою опубликованную анкету из каталога' })
  @ApiResponse({ status: 400, description: 'Скрыть можно только опубликованную анкету' })
  async hide(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    return this.listingsService.hide(req.user!.userId);
  }

  @Post('me/unhide')
  @ApiOperation({ summary: 'Вернуть скрытую анкету обратно в каталог' })
  @ApiResponse({ status: 400, description: 'Анкета не скрыта' })
  async unhide(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    return this.listingsService.unhide(req.user!.userId);
  }

  @Post('me/photos')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить фото в анкету' })
  @ApiResponse({ status: 201, description: 'Фото загружены, анкета обновлена' })
  @ApiResponse({ status: 404, description: 'Анкета ещё не создана' })
  @UseInterceptors(FilesInterceptor('files', MAX_PHOTOS_PER_UPLOAD, { storage: memoryStorage(), limits: { fileSize: MAX_PHOTO_SIZE } }))
  async uploadPhotos(@Request() req: RequestWithUser, @UploadedFiles() files: Express.Multer.File[]) {
    this.assertPerformer(req);
    if (!files?.length) {
      throw new BadRequestException('Файлы не переданы');
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(`Файл ${file.originalname} не является изображением`);
      }
      const key = `uploads/${req.user!.userId}/${randomUUID()}${fileExtension(file)}`;
      urls.push(await this.storageService.upload(key, file.buffer, file.mimetype));
    }

    return this.listingsService.addPhotos(req.user!.userId, urls);
  }

  @Patch('me/photos/order')
  @ApiOperation({ summary: 'Изменить порядок фото анкеты — первое фото становится главным (в каталоге)' })
  @ApiResponse({ status: 200, description: 'Порядок фото обновлён' })
  @ApiResponse({ status: 400, description: 'Список фото не совпадает с текущими фото анкеты' })
  async reorderPhotos(@Request() req: RequestWithUser, @Body() body: ReorderPhotosDto) {
    this.assertPerformer(req);
    return this.listingsService.reorderPhotos(req.user!.userId, body.photos);
  }

  @Get('me/photo-reviews')
  @ApiOperation({ summary: 'Статус проверки по каждому фото собственной анкеты — видны причины отклонения' })
  async photoReviews(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    return this.listingsService.getPhotoReviewsForUser(req.user!.userId);
  }

  @Post('me/photos/submit')
  @ApiOperation({ summary: 'Отправить текущий набор фото на проверку админом — требуется минимум 3 фото' })
  @ApiResponse({ status: 200, description: 'Фото отправлены на проверку' })
  @ApiResponse({ status: 400, description: 'Недостаточно фото' })
  async submitPhotos(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    return this.listingsService.submitPhotosForReview(req.user!.userId);
  }

  @Delete('me/photos')
  @ApiOperation({ summary: 'Удалить фото из анкеты' })
  async deletePhoto(@Request() req: RequestWithUser, @Body() body: { url?: string }) {
    this.assertPerformer(req);
    if (!body?.url) {
      throw new BadRequestException('Не указан url фото');
    }
    const key = this.storageService.keyFromUrl(body.url);
    if (key) {
      await this.storageService.delete(key).catch(() => undefined);
    }
    return this.listingsService.removePhoto(req.user!.userId, body.url);
  }

  @Post('me/video')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Загрузить видео в анкету (заменяет предыдущее, если было)' })
  @ApiResponse({ status: 201, description: 'Видео загружено, анкета обновлена' })
  @ApiResponse({ status: 404, description: 'Анкета ещё не создана' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_VIDEO_SIZE } }))
  async uploadVideo(@Request() req: RequestWithUser, @UploadedFile() file: Express.Multer.File) {
    this.assertPerformer(req);
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Файл должен быть видео');
    }

    const existing = await this.listingsService.findByUserId(req.user!.userId);
    if (existing?.videoUrl) {
      const oldKey = this.storageService.keyFromUrl(existing.videoUrl);
      if (oldKey) {
        await this.storageService.delete(oldKey).catch(() => undefined);
      }
    }

    const key = `uploads/${req.user!.userId}/${randomUUID()}${fileExtension(file)}`;
    const url = await this.storageService.upload(key, file.buffer, file.mimetype);
    return this.listingsService.setVideo(req.user!.userId, url);
  }

  @Delete('me/video')
  @ApiOperation({ summary: 'Удалить видео из анкеты' })
  async deleteVideo(@Request() req: RequestWithUser) {
    this.assertPerformer(req);
    const existing = await this.listingsService.findByUserId(req.user!.userId);
    if (existing?.videoUrl) {
      const key = this.storageService.keyFromUrl(existing.videoUrl);
      if (key) {
        await this.storageService.delete(key).catch(() => undefined);
      }
    }
    return this.listingsService.setVideo(req.user!.userId, null);
  }

  private assertPerformer(req: RequestWithUser) {
    if (req.user?.role !== 'performer') {
      throw new ForbiddenException('Доступно только для исполнителей');
    }
  }
}
