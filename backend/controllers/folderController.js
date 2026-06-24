const Folder = require('../models/Folder');
const Image = require('../models/Image');
const { deleteFile } = require('../utils/cloudinary');
const mongoose = require('mongoose');

/**
 * Helper to recursively calculate folder size
 */
const calculateFolderSizeHelper = async (folderId, userId) => {
  const folders = await Folder.aggregate([
    { $match: { _id: folderId, userId } },
    {
      $graphLookup: {
        from: 'folders',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentFolderId',
        as: 'descendants'
      }
    }
  ]);

  if (!folders || folders.length === 0) return 0;

  const folderIds = [folders[0]._id, ...folders[0].descendants.map(f => f._id)];

  const sizeResult = await Image.aggregate([
    { $match: { folderId: { $in: folderIds }, userId } },
    { $group: { _id: null, totalSize: { $sum: '$size' } } }
  ]);

  return sizeResult.length > 0 ? sizeResult[0].totalSize : 0;
};

/**
 * Helper to get breadcrumbs for a folder
 */
const getBreadcrumbs = async (folderId, userId) => {
  const breadcrumbs = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await Folder.findOne({ _id: currentId, userId }).select('name parentFolderId');
    if (!folder) break;
    breadcrumbs.unshift({
      _id: folder._id,
      name: folder.name
    });
    currentId = folder.parentFolderId;
  }

  return breadcrumbs;
};

/**
 * @desc    Create a new folder
 * @route   POST /api/folders
 * @access  Private
 */
const createFolder = async (req, res) => {
  const { name, parentFolderId } = req.body;
  const userId = req.user._id;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // If parentFolderId is specified, verify it exists and belongs to the user
    let parentFolder = null;
    if (parentFolderId) {
      parentFolder = await Folder.findOne({ _id: parentFolderId, userId });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
    }

    // Check for duplicate name in the same directory
    const duplicate = await Folder.findOne({
      name: name.trim(),
      userId,
      parentFolderId: parentFolderId || null
    });

    if (duplicate) {
      return res.status(400).json({ message: 'A folder with this name already exists here' });
    }

    const folder = await Folder.create({
      name: name.trim(),
      userId,
      parentFolderId: parentFolderId || null
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Server error creating folder' });
  }
};

/**
 * @desc    Get folder contents (subfolders, images, breadcrumbs)
 * @route   GET /api/folders/content
 * @access  Private
 */
const getFolderContent = async (req, res) => {
  const userId = req.user._id;
  const parentFolderId = req.query.parentFolderId === 'null' || !req.query.parentFolderId
    ? null
    : req.query.parentFolderId;

  try {
    // If a specific folder is requested, make sure it exists and belongs to the user
    let currentFolder = null;
    if (parentFolderId) {
      currentFolder = await Folder.findOne({ _id: parentFolderId, userId });
      if (!currentFolder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
    }

    // Get child folders
    const subfoldersRaw = await Folder.find({ userId, parentFolderId }).sort({ name: 1 });

    // Calculate size for each subfolder recursively
    const subfolders = await Promise.all(
      subfoldersRaw.map(async (folder) => {
        const size = await calculateFolderSizeHelper(folder._id, userId);
        return {
          ...folder.toObject(),
          size
        };
      })
    );

    // Get images in the folder
    const images = await Image.find({ userId, folderId: parentFolderId }).sort({ createdAt: -1 });

    // Get breadcrumbs
    const breadcrumbs = parentFolderId ? await getBreadcrumbs(parentFolderId, userId) : [];

    // Calculate total size of the current folder recursively (if root, sum all user images)
    let currentFolderSize = 0;
    if (parentFolderId) {
      currentFolderSize = await calculateFolderSizeHelper(new mongoose.Types.ObjectId(parentFolderId), userId);
    } else {
      // Sum all user images
      const totalSizeResult = await Image.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);
      currentFolderSize = totalSizeResult.length > 0 ? totalSizeResult[0].totalSize : 0;
    }

    res.status(200).json({
      currentFolder,
      breadcrumbs,
      folders: subfolders,
      images,
      size: currentFolderSize
    });
  } catch (error) {
    console.error('Get folder content error:', error);
    res.status(500).json({ message: 'Server error retrieving folder contents' });
  }
};

/**
 * @desc    Get folder tree hierarchy for sidebar navigation
 * @route   GET /api/folders/tree
 * @access  Private
 */
const getFolderTree = async (req, res) => {
  const userId = req.user._id;

  try {
    // Fetch all folders for the user to construct the tree in frontend
    const folders = await Folder.find({ userId }).select('name parentFolderId').sort({ name: 1 });
    res.status(200).json(folders);
  } catch (error) {
    console.error('Get folder tree error:', error);
    res.status(500).json({ message: 'Server error retrieving folder tree' });
  }
};

/**
 * @desc    Delete a folder recursively (cascading files and subfolders)
 * @route   DELETE /api/folders/:id
 * @access  Private
 */
const deleteFolder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const folderId = new mongoose.Types.ObjectId(id);

    // Verify folder exists and belongs to user
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Get all descendant folders (including the folder itself)
    const folderDescendants = await Folder.aggregate([
      { $match: { _id: folderId, userId } },
      {
        $graphLookup: {
          from: 'folders',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentFolderId',
          as: 'descendants'
        }
      }
    ]);

    const folderIds = [folderId, ...folderDescendants[0].descendants.map(f => f._id)];

    // Find all images in these folders
    const imagesToDelete = await Image.find({ folderId: { $in: folderIds }, userId });

    // Delete images from Cloudinary
    for (const img of imagesToDelete) {
      try {
        await deleteFile(img.publicId);
      } catch (err) {
        console.error(`Failed to delete Cloudinary image: ${img.publicId}`, err);
      }
    }

    // Delete images from DB
    await Image.deleteMany({ folderId: { $in: folderIds }, userId });

    // Delete folders from DB
    await Folder.deleteMany({ _id: { $in: folderIds }, userId });

    res.status(200).json({ message: 'Folder and all its contents deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ message: 'Server error deleting folder' });
  }
};

module.exports = {
  createFolder,
  getFolderContent,
  getFolderTree,
  deleteFolder
};
