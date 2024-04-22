import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { corsConfig, swaggerConfig } from './config';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  process.env.TZ = 'Asia/Jakarta';
  app.enableCors(corsConfig);
  app.enableVersioning();
  app.setGlobalPrefix(AppModule.apiPrefix);
  app.useGlobalPipes(new I18nValidationPipe({ transform: true }));
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    }),
  );
  swaggerConfig(app, AppModule.apiVersion);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(AppModule.port);

  return AppModule.port;
}

bootstrap().then((port: number) => {
  Logger.log(`App is running on port: ${port}`);
});
