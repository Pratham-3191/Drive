import React, { useState, useRef } from 'react';
import api from '../api/axios';
import { Upload, X, FileImage } from 'lucide-react';

const UploadImageModal = ({ isOpen, onClose, parentFolderId, onImageUploaded }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Only image files are allowed');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    setError('');
    setFile(selectedFile);
    setName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Strip extension for default name input

    // Create a local URL preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCancelFile = () => {
    setFile(null);
    setName('');
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to upload');
      return;
    }
    setError('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name.trim() || file.name);
    formData.append('folderId', parentFolderId || 'null');

    try {
      await api.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      handleCancelFile();
      onImageUploaded();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose}></div>

      {/* Modal Wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded bg-white p-6 text-left border border-gray-200 shadow-xl transition-all w-full max-w-md">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-gray-500" />
              <h3 className="text-md font-semibold text-gray-900">Upload Image</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-2 bg-gray-50 border border-gray-300 text-xs text-gray-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <FileImage className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Click to upload an image</span>
                <span className="text-xs text-gray-400 mt-1">Supports PNG, JPG, GIF, WebP (Max 10MB)</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded bg-gray-50">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded border border-gray-300"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelFile}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label htmlFor="imageName" className="block text-xs font-medium text-gray-500 mb-1">
                    Image Name
                  </label>
                  <input
                    type="text"
                    id="imageName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name for the image"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded shadow-none placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || isUploading}
                className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded disabled:bg-gray-400"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadImageModal;
