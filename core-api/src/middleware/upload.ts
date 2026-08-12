import multer from 'multer';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DIET_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const dietUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    cb(null, DIET_MIME_TYPES.includes(file.mimetype));
  },
});

export const plateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    cb(null, IMAGE_MIME_TYPES.includes(file.mimetype));
  },
});
