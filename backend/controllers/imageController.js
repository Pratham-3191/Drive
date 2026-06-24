const Image = require('../models/Image');
const Folder = require('../models/Folder');
const { uploadBuffer, deleteFile } = require('../utils/cloudinary');

/**
 * @desc    Upload an image
 * @route   POST /api/images
 * @access  Private
 */
const uploadImage = async (req, res) => {
  const { name, folderId } = req.body;
  const userId = req.user._id;

  try {
    // 1. Verify file was uploaded via multer
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageName = name ? name.trim() : req.file.originalname;

    // 2. If folderId is specified, check if it exists and belongs to the user
    let folder = null;
    const targetFolderId = folderId === 'null' || !folderId ? null : folderId;
    if (targetFolderId) {
      folder = await Folder.findOne({ _id: targetFolderId, userId });
      if (!folder) {
        return res.status(404).json({ message: 'Target folder not found' });
      }
    }

    // 3. Upload buffer to Cloudinary
    // We can pass options like folder and resource_type. Multer puts the file size in req.file.size.
    // Let's stream the buffer to Cloudinary.
    let uploadResult;
    try {
      uploadResult = await uploadBuffer(req.file.buffer, {
        displayName: imageName
      });
    } catch (uploadError) {
      console.error('Cloudinary upload failure:', uploadError);
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
    }

    // 4. Save Image record in Database
    const newImage = await Image.create({
      name: imageName,
      userId,
      folderId: targetFolderId,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      size: req.file.size // size in bytes from Multer
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error('Upload image controller error:', error);
    res.status(500).json({ message: 'Server error uploading image' });
  }
};

/**
 * @desc    Delete an image
 * @route   DELETE /api/images/:id
 * @access  Private
 */
const deleteImage = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Find image and verify ownership
    const image = await Image.findOne({ _id: id, userId });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    try {
      await deleteFile(image.publicId);
    } catch (cloudErr) {
      console.error(`Failed to delete from Cloudinary: ${image.publicId}`, cloudErr);
      // We can continue to delete from DB to prevent dead references if Cloudinary delete fails
    }

    // Delete from DB
    await Image.deleteOne({ _id: id });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error deleting image' });
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
