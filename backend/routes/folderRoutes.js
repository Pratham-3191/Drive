const express = require('express');
const router = express.Router();
const {
  createFolder,
  getFolderContent,
  getFolderTree,
  deleteFolder
} = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all folder routes

router.post('/', createFolder);
router.get('/content', getFolderContent);
router.get('/tree', getFolderTree);
router.delete('/:id', deleteFolder);

module.exports = router;
