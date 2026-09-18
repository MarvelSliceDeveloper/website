async function compressImage(file, maxWidth = 1920, quality = 0.82) {
  if (
    !file ||
    !file.type?.startsWith('image/') ||
    file.type?.includes('svg') ||
    file.type?.includes('png') ||
    file.type?.includes('gif') ||
    file.type?.includes('webp')
  ) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export async function uploadFile(file) {
  if (!file) throw new Error('No file provided');

  let fileToUpload = file;
  try {
    fileToUpload = await compressImage(file);
  } catch (e) {
    console.warn('Image compression skipped:', e);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (res.status === 413) {
      throw new Error('File payload too large (413 Request Entity Too Large). Please increase client_max_body_size 50m; in your Nginx configuration on the server.');
    }
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
