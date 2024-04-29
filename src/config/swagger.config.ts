import { ApiTags, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import {
  OpenAPIObject,
  OperationObject,
  SecuritySchemeObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const SWAGGER_AUTH_OPTIONS: SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'Bearer',
};

const web = {
  title: 'BPK API Module Admin Kurikulum (Web Version)',
  description: 'BPK API module admin kurikulum documentation for web',
};

const mobile = {
  title: 'BPK API Module Admin Kurikulum (Mobile Version)',
  description: 'BPK API module admin kurikulum documentation for mobile',
};

export const MobileTag = 'Mobile';
export const IsMobile = () => ApiTags(MobileTag);

/**
 * Filters out mobile routes from the OpenAPI document.
 *
 * @param doc - The OpenAPI document to filter.
 * @returns The filtered OpenAPI document.
 */
export function filterMobileRoutes(doc: OpenAPIObject) {
  const webDoc = structuredClone(doc);

  Object.entries(webDoc.paths).map(([k, path]) => {
    Object.entries(path).forEach(([k, operation]) => {
      const op = operation as OperationObject;
      if (op.tags.some((tag) => tag.startsWith('mobile'))) delete path[k];
    });
  });

  return webDoc;
}

/**
 * Configures the Swagger module for the NestJS application.
 * @param app {INestApplication} - The NestJS application instance.
 * @param apiVersion {string} - The API version.
 */
export function swaggerConfig(
  app: INestApplication,
  apiVersion?: string,
): void {
  const fullConfig = new DocumentBuilder()
    .setTitle(mobile.title)
    .setDescription(mobile.description)
    .setVersion(apiVersion)
    .addBearerAuth(SWAGGER_AUTH_OPTIONS)
    .build();

  const fullDocumentation = SwaggerModule.createDocument(app, fullConfig);

  const webConfig = new DocumentBuilder()
    .setTitle(web.title)
    .setDescription(web.description)
    .setVersion(apiVersion)
    .addBearerAuth(SWAGGER_AUTH_OPTIONS)
    .build();

  const webDocumentation = SwaggerModule.createDocument(app, webConfig);
  Object.assign(
    webDocumentation.paths,
    filterMobileRoutes(fullDocumentation).paths,
  );

  SwaggerModule.setup(`api/docs/v${apiVersion}/web`, app, webDocumentation);
  SwaggerModule.setup(`api/docs/v${apiVersion}/mobile`, app, fullDocumentation);
}
