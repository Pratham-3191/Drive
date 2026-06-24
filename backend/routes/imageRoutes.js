const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage, deleteImage } = require('../controllers/imageController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for memory storage upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit files to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Optional: Filter to allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.use(protect); // Protect all image routes

router.post('/', upload.single('image'), uploadImage);
router.delete('/:id', deleteImage);

// Error handler for multer errors or file filter errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router;
