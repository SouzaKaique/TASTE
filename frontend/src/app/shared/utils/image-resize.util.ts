/** Tamanho máximo aceito na escolha do arquivo, antes da compressão. */
export const MAX_ORIGINAL_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Reduz a imagem no navegador (lado maior = maxSize px) e devolve um data URI JPEG.
 * Enquanto não existe armazenamento de arquivos, a foto viaja como texto até o
 * backend; reduzir aqui mantém cada foto com poucas centenas de KB.
 */
export async function resizeImageToDataUrl(file: File, maxSize: number, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.');
  }
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error('A imagem é muito grande (máximo de 15 MB).');
  }

  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível processar a imagem.');
  }
  // Fundo branco para PNGs transparentes (JPEG não tem transparência).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler esta imagem. Tente outro arquivo (JPG ou PNG).'));
    };
    img.src = url;
  });
}
