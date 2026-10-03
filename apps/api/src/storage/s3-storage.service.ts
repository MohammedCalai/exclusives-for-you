import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SignedUpload, StoredObject, StorageService } from './storage';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly bucket = process.env.STORAGE_BUCKET ?? '';
  private readonly publicBaseUrl = (process.env.STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '');
  private readonly client = new S3Client({
    region: process.env.STORAGE_REGION ?? 'auto',
    ...(process.env.STORAGE_ENDPOINT ? { endpoint: process.env.STORAGE_ENDPOINT } : {}),
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
    ...(process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
            secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });

  private assertConfigured() {
    if (!this.bucket || !this.publicBaseUrl) {
      throw new ServiceUnavailableException('Product image storage is not configured');
    }
  }

  private publicUrl(key: string) {
    return `${this.publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async put(input: { key: string; body: Uint8Array; contentType: string }): Promise<StoredObject> {
    this.assertConfigured();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return { key: input.key, url: this.publicUrl(input.key), provider: 's3-compatible' };
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async signedUploadUrl(key: string, contentType: string, maxBytes: number): Promise<SignedUpload> {
    this.assertConfigured();
    const expiresInSeconds = 300;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: maxBytes,
      }),
      { expiresIn: expiresInSeconds },
    );
    return { key, uploadUrl, publicUrl: this.publicUrl(key), expiresInSeconds, maxBytes };
  }
}
