import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Resolve the path to src/uploads
const uploadDir = path.resolve(__dirname, '../uploads');

// ✅ Create the uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads folder at:', uploadDir);
}

// 📦 Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📁 Saving to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const cleanField = file.fieldname.replace(/\[\]/g, '');
    const finalName = Date.now() + '-' + cleanField + ext;
    console.log(`📝 Filename set: ${finalName}`);
    cb(null, finalName);
  },
});

// ✅ Custom file filter per field
const fileFilter = (req, file, cb) => {
  const field = file.fieldname;

  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const pdfTypes = ['application/pdf'];

  if (
    field === 'featuredImage' ||
    field === 'otherImages' ||
    field === 'otherImages[]'
  ) {
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only image files (jpeg, png, webp) are allowed for vehicle images'
        ),
        false
      );
    }
  } else if (field === 'profileImage') {
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only image files (jpeg, png, webp) are allowed for profile images'
        ),
        false
      );
    }
  } else if (field === 'billofsales') {
    if ([...imageTypes, ...pdfTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Only image or PDF files are allowed for bill of sales'),
        false
      );
    }
  } else if (field === 'transferDocument' || field === 'transferDocument[]') {
    if ([...imageTypes, ...pdfTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Only image or PDF files are allowed for transfer document'),
        false
      );
    }
  } else if (field === 'uploadedNotes' || field === 'uploadedNotes[]') {
    if ([...imageTypes, ...pdfTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Only image or PDF files are allowed for transfer document'),
        false
      );
    }
  } else {
    cb(new Error(`Unexpected upload field: ${field}`), false);
  }
};

// 🚀 Final multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export default upload;

// 🔄 Image conversion middleware: convert images to AVIF with WEBP fallback
export const convertImages = async (req, res, next) => {
  try {
    const filesByField = req.files || {};
    const allFiles = [];
    Object.keys(filesByField).forEach((key) => {
      const list = Array.isArray(filesByField[key]) ? filesByField[key] : [filesByField[key]];
      allFiles.push(...list);
    });

    for (const file of allFiles) {
      try {
        if (!file || !file.mimetype || !file.mimetype.startsWith('image/')) continue;
        const inputPath = file.path;
        const { dir, name } = path.parse(inputPath);
        const avifPath = path.join(dir, `${name}.avif`);
        const webpPath = path.join(dir, `${name}.webp`);

        let finalPath = null;
        try {
          await sharp(inputPath).avif({ quality: 50 }).toFile(avifPath);
          finalPath = avifPath;
        } catch {
          await sharp(inputPath).webp({ quality: 75 }).toFile(webpPath);
          finalPath = webpPath;
        }

        if (finalPath) {
          try {
            fs.unlinkSync(inputPath);
          } catch {
            // ignore unlink errors
          }
          file.filename = path.basename(finalPath);
          file.path = finalPath;
          file.mimetype = finalPath.endsWith('.avif') ? 'image/avif' : 'image/webp';
        }
      } catch {
        // Skip individual file conversion errors
      }
    }

    next();
  } catch {
    next();
  }
};
