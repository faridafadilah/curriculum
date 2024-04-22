import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { IsUniqueConstraint } from './common/validators';
import { ResponseInterceptor } from './client';
import { GlobalExceptionFilter } from './common/exceptions';
import { dataSourceOptions } from './config/database.config';
import { LoggerMiddleware } from './common/loggers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'id',
      loaderOptions: {
        path: join(__dirname, '/common/locale/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  providers: [
    IsUniqueConstraint,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  static port: number;
  static apiVersion: string;
  static apiPrefix: string;

  constructor(private readonly configService: ConfigService) {
    AppModule.port = +this.configService.get('API_PORT');
    AppModule.apiVersion = this.configService.get('API_VERSION');
    AppModule.apiPrefix = this.configService.get('API_PREFIX');
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
