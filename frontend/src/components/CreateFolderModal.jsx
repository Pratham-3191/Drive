import React, { useState } from 'react';
import api from '../api/axios';
import { FolderPlus, X } from 'lucide-react';

const CreateFolderModal = ({ isOpen, onClose, parentFolderId, onFolderCreated }) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/folders', {
        name: folderName.trim(),
        parentFolderId: parentFolderId || null
      });
      setFolderName('');
      onFolderCreated(); // Callback to refresh folder contents
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose}></div>

      {/* Modal wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded bg-white p-6 text-left border border-gray-200 shadow-xl transition-all w-full max-w-md">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <FolderPlus className="h-5 w-5 text-gray-500" />
              <h3 className="text-md font-semibold text-gray-900">New Folder</h3>
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

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-4">
              <label htmlFor="folderName" className="block text-xs font-medium text-gray-500 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Untitled folder"
                required
                autoFocus
                className="block w-full px-3 py-2 border border-gray-300 rounded shadow-none placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600 text-sm"
              />
            </div>

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
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
