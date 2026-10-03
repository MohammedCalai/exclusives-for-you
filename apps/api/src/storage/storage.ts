export interface StoredObject {
  key: string;
  url: string;
  provider: string;
}
export interface SignedUpload {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
  maxBytes: number;
}
export interface StorageService {
  put(input: { key: string; body: Uint8Array; contentType: string }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  signedUploadUrl(key: string, contentType: string, maxBytes: number): Promise<SignedUpload>;
}
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
