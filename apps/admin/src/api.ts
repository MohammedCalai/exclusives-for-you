const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

type ApiEnvelope<T> = { data: T };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('adminAccessToken');
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & {
    message?: string;
  };
  if (!response.ok) {
    if (response.status === 401) sessionStorage.removeItem('adminAccessToken');
    throw new Error(typeof payload.message === 'string' ? payload.message : 'Something went wrong');
  }
  return payload.data;
}

export async function uploadProductImage(file: File) {
  const signed = await api<{ key: string; uploadUrl: string; publicUrl: string }>(
    '/admin/uploads/presign',
    {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
    },
  );
  const upload = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!upload.ok) throw new Error(`Could not upload ${file.name}`);
  return signed;
}
