export async function uploadFile(file) {
  if (!file) throw new Error('No file provided');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (res.status === 404) {
      throw new Error('Upload server endpoint (/api/upload) returned 404 Not Found. Please rebuild/restart the landing-api container on the server (docker-compose restart landing-api).');
    }
    throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 150)}`);
  }

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to upload file');
  }

  return data.url;
}
