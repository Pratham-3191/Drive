const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null // null indicates a root folder
  }
}, {
  timestamps: true
});

// Indexes for faster lookups
folderSchema.index({ userId: 1 });
folderSchema.index({ parentFolderId: 1 });
// Unique folder name per directory per user
folderSchema.index({ userId: 1, parentFolderId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);
