import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

export function getHelmetConfig(configService: ConfigService) {
  const isProd = configService.get('NODE_ENV') === 'production';

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        ...(isProd && { upgradeInsecureRequests: [] }),
      },
    },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  });
}
