import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directories exist
const createUploadsDir = () => {
  const dirs = [
    'uploads',
    'uploads/profiles',
    'uploads/products',
    'uploads/requests',
    'uploads/csv'
  ];
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadsDir();

// Configuration for Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/';
    if (file.fieldname === 'profileImage') {
      folder += 'profiles/';
    } else if (file.fieldname === 'productImage' || file.fieldname === 'images') {
      folder += 'products/';
    } else if (file.fieldname === 'partImage') {
      folder += 'requests/';
    } else if (file.fieldname === 'csvFile') {
      folder += 'csv/';
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'csvFile') {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  } else {
    // Images
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export default upload;
