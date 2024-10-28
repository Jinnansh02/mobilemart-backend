import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import multer from 'multer';
import path from 'path';

// Configure multer for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadToFirebase = async (
  file: Express.Multer.File
): Promise<string> => {
  try {
    const dateTime = Date.now();
    const originalname = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '-')
      .toLowerCase();
    const fileName = `products/${dateTime}-${originalname}`;
    const storageRef = ref(storage, fileName);

    // Set proper metadata with content type
    const metadata = {
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    };

    // Upload the file
    await uploadBytes(storageRef, file.buffer, metadata);

    // Get the Firebase Storage download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL; // This will return the Firebase Storage URL format
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(
      `Error uploading file to Firebase: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};
