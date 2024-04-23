import { BadRequestException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { I18nService } from 'nestjs-i18n';
import { extname } from 'path';

export interface UploadedFileResponse {
  originalFileName: string;
  fileURL: string;
  fileName: string;
}

interface FileParams {
  Bucket: string;
  Key: string;
  Body: Buffer;
  ContentType: string;
}

@Injectable()
export class StorageService {
  private AWS_S3: S3Client;
  private prefix: string = process.env.NODE_ENV || '';

  constructor(private readonly i18n: I18nService) {
    this.AWS_S3 = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
    });
  }

  async uploadFileToS3(
    file: Express.Multer.File | Buffer,
    folder: string,
    extension: string[],
    customFileName?: string,
    contentType?: string,
    maxSize: number = 1024 * 1024 * 10,
  ): Promise<UploadedFileResponse> {
    if (file instanceof Buffer) {
      return this.uploadBuffer(file, folder, customFileName);
    } else {
      return this.uploadFile(file, folder, extension, customFileName, maxSize);
    }
  }

  async renameFileOnS3(
    folder: string,
    oldFileName: string,
    newFileName: string,
  ): Promise<UploadedFileResponse> {
    const oldKey = `${this.prefix}/${folder}/${oldFileName}`;
    const newKey = `${this.prefix}/${folder}/${newFileName}`;

    const copyParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      CopySource: encodeURI(`${process.env.AWS_S3_BUCKET}/${oldKey}`),
      Key: newKey,
    };

    await this.AWS_S3.send(new CopyObjectCommand(copyParams));
    await this.deleteFileFromS3(folder, oldFileName);

    return {
      originalFileName: newFileName,
      fileURL: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`,
      fileName: newFileName,
    };
  }

  async deleteFileFromS3(folder: string, file: string): Promise<void> {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${this.prefix}/${folder}/${file}`,
    };

    await this.AWS_S3.send(new DeleteObjectCommand(deleteParams));
  }

  // TODO: Currently the file is can be accessed publicly
  //       We need to add configuration on AWS S3
  // private async assignFilePermissions(
  //   folder: string,
  //   fileName: string,
  //   userId: string,
  // ): Promise<void> {
  //   const params = {
  //     Bucket: process.env.AWS_S3_BUCKET,
  //     Key: `${this.prefix}/${folder}/${fileName}`,
  //     ACL: 'private',
  //     GrantFullControl: `id=${userId}`,
  //   };

  //   await this.AWS_S3.send(new PutObjectAclCommand(params));
  // }

  private async uploadBuffer(
    file: Buffer,
    folder: string,
    customFileName?: string,
  ): Promise<UploadedFileResponse> {
    const params: FileParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${this.prefix}/${folder}/${customFileName}`,
      Body: file,
      ContentType: 'application/pdf',
    };

    await this.upload(params);

    return this.createUploadedFileResponse(customFileName, folder);
  }

  private async uploadFile(
    file: Express.Multer.File,
    folder: string,
    extension: string[],
    customFileName?: string,
    maxSize?: number,
  ): Promise<UploadedFileResponse> {
    let fileExtension = extname(file.mimetype);
    const timestamp = new Date().getTime().toString();
    let originalFileName = timestamp;

    if (file.originalname) {
      fileExtension = extname(file.originalname);
      originalFileName = file.originalname;
    }

    this.validateFile(file, extension, maxSize);

    const fileNameWithoutExtension =
      this.getFileNameWithoutExtension(originalFileName);
    const fileName = `${customFileName || fileNameWithoutExtension}${fileExtension}`;

    const params: FileParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${this.prefix}/${folder}/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.upload(params);

    return this.createUploadedFileResponse(originalFileName, folder, fileName);
  }

  private async upload(params: FileParams): Promise<void> {
    await this.AWS_S3.send(new PutObjectCommand(params));
  }

  private createUploadedFileResponse(
    originalFileName: string,
    folder?: string,
    fileName?: string,
  ): UploadedFileResponse {
    const fileURL = `https://${process.env.AWS_S3_BUCKET}.s3.${
      process.env.AWS_REGION
    }.amazonaws.com/${this.prefix}/${folder}/${fileName || originalFileName}`;

    return {
      originalFileName,
      fileURL,
      fileName: fileName || originalFileName,
    };
  }

  private validateFile(
    file: Express.Multer.File,
    extension: string[],
    maxSize: number,
  ): void {
    const fileExtension = extname(file.originalname);
    const isExtensionValid = extension.some(
      (ext) => fileExtension.toLowerCase() === `.${ext}`,
    );

    if (!isExtensionValid) {
      throw new BadRequestException(
        this.i18n.t('general.FILE_VALIDATION_FORMAT', {
          args: {
            extension: extension.join(','),
          },
        }),
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        this.i18n.t('general.FILE_VALIDATION_MAX', {
          args: {
            maximum: maxSize,
          },
        }),
      );
    }
  }

  private getFileNameWithoutExtension(originalFileName: string): string {
    const lastDotIndex = originalFileName.lastIndexOf('.');
    return lastDotIndex !== -1
      ? originalFileName.slice(0, lastDotIndex)
      : originalFileName;
  }
}
