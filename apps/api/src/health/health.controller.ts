import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Check API health' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
  }

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  root() {
    return { name: 'TransEscort API', version: '0.1.0', docs: '/api/docs', health: '/health' };
  }
}
