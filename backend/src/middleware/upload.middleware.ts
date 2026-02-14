import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';

// Ensure uploads directories exist
const expenseUploadDir = path.join(__dirname, '../../uploads/expenses');
const billUploadDir = path.join(__dirname, '../../uploads/bills');
if (!fs.existsSync(expenseUploadDir)) {
  fs.mkdirSync(expenseUploadDir, { recursive: true });
}
if (!fs.existsSync(billUploadDir)) {
  fs.mkdirSync(billUploadDir, { recursive: true });
}
const uploadDir = expenseUploadDir;

// Use memory storage to process images before saving
const memoryStorage = multer.memoryStorage();

// File filter to accept only images and PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDFs are allowed.'));
  }
};

// Multer upload instance
const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Compression middleware - processes image after multer upload
const compressImage = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalExt = path.extname(req.file.originalname);
    const nameWithoutExt = path.basename(req.file.originalname, originalExt);

    // Check if it's an image (not PDF)
    const isImage = req.file.mimetype.startsWith('image/');

    if (isImage) {
      // Compress image using sharp
      // Convert to JPEG for best compression, resize if too large
      const compressedFilename = `${nameWithoutExt}-${uniqueSuffix}.jpg`;
      const outputPath = path.join(uploadDir, compressedFilename);

      await sharp(req.file.buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 75,
          progressive: true
        })
        .toFile(outputPath);

      // Get compressed file stats
      const stats = fs.statSync(outputPath);

      // Update req.file with compressed file info
      req.file.filename = compressedFilename;
      req.file.path = outputPath;
      req.file.size = stats.size;

      console.log(`Image compressed: ${req.file.originalname} (${(req.file.buffer.length / 1024).toFixed(2)}KB) -> ${compressedFilename} (${(stats.size / 1024).toFixed(2)}KB)`);
    } else {
      // PDF - save as-is without compression
      const pdfFilename = `${nameWithoutExt}-${uniqueSuffix}${originalExt}`;
      const outputPath = path.join(uploadDir, pdfFilename);

      fs.writeFileSync(outputPath, req.file.buffer);

      req.file.filename = pdfFilename;
      req.file.path = outputPath;

      console.log(`PDF saved: ${pdfFilename} (${(req.file.buffer.length / 1024).toFixed(2)}KB)`);
    }

    next();
  } catch (error) {
    console.error('Error processing file:', error);
    next(error);
  }
};

// Combined middleware: upload + compress
export const uploadExpenseVoucher = {
  single: (fieldName: string) => {
    return [
      upload.single(fieldName),
      compressImage
    ];
  }
};

// Bill file upload - multiple files (up to 5, 10MB each)
const billUpload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});

// Process multiple uploaded files (compress images, save PDFs)
const compressBillFiles = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles: { filename: string; originalname: string; url: string }[] = [];

    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalExt = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, originalExt);
      const isImage = file.mimetype.startsWith('image/');

      if (isImage) {
        const compressedFilename = `${nameWithoutExt}-${uniqueSuffix}.jpg`;
        const outputPath = path.join(billUploadDir, compressedFilename);

        await sharp(file.buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 75, progressive: true })
          .toFile(outputPath);

        processedFiles.push({
          filename: compressedFilename,
          originalname: file.originalname,
          url: `/uploads/bills/${compressedFilename}`,
        });
      } else {
        const pdfFilename = `${nameWithoutExt}-${uniqueSuffix}${originalExt}`;
        const outputPath = path.join(billUploadDir, pdfFilename);
        fs.writeFileSync(outputPath, file.buffer);

        processedFiles.push({
          filename: pdfFilename,
          originalname: file.originalname,
          url: `/uploads/bills/${pdfFilename}`,
        });
      }
    }

    (req as any).processedFiles = processedFiles;
    next();
  } catch (error) {
    console.error('Error processing bill files:', error);
    next(error);
  }
};

export const uploadBillFiles = {
  array: (fieldName: string, maxCount: number) => {
    return [
      billUpload.array(fieldName, maxCount),
      compressBillFiles
    ];
  }
};
