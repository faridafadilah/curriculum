import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const SWAGGER_AUTH_OPTIONS: SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'Bearer',
};

const title = 'BPK API Module Admin Kurikulum';
const description = `BPK API module admin kurikulum documentation`;

/**
 * Configures the Swagger module for the NestJS application.
 * @param app {INestApplication} - The NestJS application instance.
 * @param apiVersion {string} - The API version.
 */
export function swaggerConfig(
  app: INestApplication,
  apiVersion?: string,
): void {
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(apiVersion)
    .addBearerAuth(SWAGGER_AUTH_OPTIONS)
    .build();

  const document = SwaggerModule.createDocument(app, config);

  /**
   * TOOO: Add API versioning
   * currently we not implemented this, because we need to change the API version in the code
   * and also in the frontend need to set the version of API.
   *
   * SwaggerModule.setup(`api/v${apiVersion}/docs`, app, document);
   */

  SwaggerModule.setup('api/docs', app, document);
}
