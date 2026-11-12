export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_FILE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const AVATAR_SIZE = 512;

export const getAvatarFileError = file => {
  if (!file || !file.size) return 'avatar.invalidImage';
  if (!AVATAR_FILE_TYPES.split(',').includes(file.type))
    return 'avatar.invalidFormat';
  if (file.size > AVATAR_MAX_BYTES) return 'avatar.tooLarge';
  return null;
};

const canvasToBlob = canvas =>
  new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('avatar.invalidImage'));
    }, 'image/png');
  });

// Freeze animated images on their first frame and apply EXIF orientation once,
// so the crop preview and the uploaded pixels always describe the same image.
export const prepareAvatar = async file => {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image'
  });
  try {
    if (bitmap.width * bitmap.height > 50 * 1024 * 1024)
      throw new Error('avatar.invalidImage');
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext('2d')
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await canvasToBlob(canvas);
  } finally {
    bitmap.close();
  }
};

export const createAvatarFile = async (imageUrl, crop, shouldContain) => {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (shouldContain) {
    const side = Math.min(
      AVATAR_SIZE,
      Math.max(image.naturalWidth, image.naturalHeight)
    );
    canvas.width = side;
    canvas.height = side;
    const scale = side / Math.max(image.naturalWidth, image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(
      image,
      (side - width) / 2,
      (side - height) / 2,
      width,
      height
    );
  } else {
    if (!crop || crop.width <= 0 || crop.height <= 0)
      throw new Error('avatar.invalidImage');
    const side = Math.max(1, Math.min(AVATAR_SIZE, Math.floor(crop.width)));
    canvas.width = side;
    canvas.height = side;
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      side,
      side
    );
  }
  const blob = await canvasToBlob(canvas);
  return new File([blob], 'avatar.png', { type: 'image/png' });
};
