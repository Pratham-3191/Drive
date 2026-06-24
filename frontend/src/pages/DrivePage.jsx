import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import FolderTree from '../components/FolderTree';
import FolderRow from '../components/FolderRow';
import ImageRow from '../components/ImageRow';
import CreateFolderModal from '../components/CreateFolderModal';
import UploadImageModal from '../components/UploadImageModal';
import { FolderPlus, Upload, ChevronRight, HardDrive, Info } from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === undefined || bytes === null) return '-';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DrivePage = () => {
  // State for folders and images in active folder
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [subfolders, setSubfolders] = useState([]);
  const [images, setImages] = useState([]);
  const [folderSize, setFolderSize] = useState(0);

  // State for all folders (for sidebar tree)
  const [allFolders, setAllFolders] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Deletion prompt state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, type }

  // Fetch current folder contents
  const fetchFolderContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/folders/content', {
        params: { parentFolderId: currentFolderId || 'null' }
      });
      const { currentFolder, breadcrumbs, folders, images, size } = response.data;
      setCurrentFolder(currentFolder);
      setBreadcrumbs(breadcrumbs);
      setSubfolders(folders);
      setImages(images);
      setFolderSize(size);
    } catch (err) {
      console.error(err);
      setError('Failed to load drive contents');
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  // Fetch all folders for sidebar tree
  const fetchFolderTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const response = await api.get('/folders/tree');
      setAllFolders(response.data);
    } catch (err) {
      console.error('Failed to load folder tree:', err);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  // Initialize page
  useEffect(() => {
    fetchFolderContent();
  }, [currentFolderId, fetchFolderContent]);

  useEffect(() => {
    fetchFolderTree();
  }, [currentFolderId, fetchFolderTree]);

  const handleFolderSelect = (folderId) => {
    setCurrentFolderId(folderId);
  };

  const handleRefreshAll = () => {
    fetchFolderContent();
    fetchFolderTree();
  };

  // Handle deletions
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    try {
      if (type === 'folder') {
        await api.delete(`/folders/${id}`);
      } else {
        await api.delete(`/images/${id}`);
      }
      setDeleteTarget(null);
      handleRefreshAll();
    } catch (err) {
      console.error(err);
      alert(`Failed to delete ${type}: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 md:space-y-0 md:space-x-8">
        {/* Sidebar Panel - Folder tree (25% width on desktop) */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded p-4 h-fit md:sticky md:top-6">
          <div className="pb-3 mb-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Folders Tree</span>
          </div>
          {treeLoading ? (
            <div className="py-4 text-center text-xs text-gray-400">Loading hierarchy...</div>
          ) : (
            <FolderTree
              folders={allFolders}
              activeFolderId={currentFolderId}
              onFolderSelect={handleFolderSelect}
            />
          )}
        </div>

        {/* Main Workspace (75% width on desktop) */}
        <div className="flex-1 bg-white border border-gray-200 rounded p-6 flex flex-col min-w-0">

          {/* Breadcrumbs Navigation */}
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-4 overflow-x-auto pb-1 select-none">
            <button
              onClick={() => handleFolderSelect(null)}
              className="flex items-center hover:text-gray-900 transition-colors font-medium"
            >
              <HardDrive className="h-3.5 w-3.5 mr-1" />
              My Drive
            </button>

            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb._id}>
                <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => handleFolderSelect(crumb._id)}
                  className="hover:text-gray-900 transition-colors truncate font-medium"
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Folder Details / Metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-gray-100 space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate max-w-xs sm:max-w-md">
                {currentFolder ? currentFolder.name : 'My Drive'}
              </h1>
              <div className="flex items-center mt-1 text-xs text-gray-500 space-x-1">
                <Info className="h-3.5 w-3.5 text-gray-400" />
                <span>Recursive Size:</span>
                <span className="font-semibold text-gray-700">{formatBytes(folderSize)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="flex items-center px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <FolderPlus className="h-4 w-4 text-gray-500 mr-1.5" />
                New Folder
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center px-3.5 py-1.5 text-xs font-semibold text-white bg-gray-900 border border-transparent rounded hover:bg-gray-800 transition-colors shadow-none"
              >
                <Upload className="h-4 w-4 text-gray-300 mr-1.5" />
                Upload Image
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-300 text-xs text-gray-700 rounded">
              {error}
            </div>
          )}

          {/* Main files table */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <span className="text-sm text-gray-400">Loading contents...</span>
              </div>
            ) : subfolders.length === 0 && images.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded">
                <HardDrive className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">Folder is empty</p>
                <p className="text-xs text-gray-400 mt-1">Create a folder or upload an image to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 select-none">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Modified
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {/* Render subfolders */}
                    {subfolders.map((folder) => (
                      <FolderRow
                        key={folder._id}
                        folder={folder}
                        onFolderClick={handleFolderSelect}
                        onDeleteClick={(id, name) => setDeleteTarget({ id, name, type: 'folder' })}
                      />
                    ))}

                    {/* Render images */}
                    {images.map((image) => (
                      <ImageRow
                        key={image._id}
                        image={image}
                        onDeleteClick={(id, name) => setDeleteTarget({ id, name, type: 'image' })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        parentFolderId={currentFolderId}
        onFolderCreated={handleRefreshAll}
      />

      {/* Upload Image Modal */}
      <UploadImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        parentFolderId={currentFolderId}
        onImageUploaded={handleRefreshAll}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setDeleteTarget(null)}></div>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded bg-white p-6 text-left border border-gray-200 shadow-xl transition-all w-full max-w-sm">
              <h3 className="text-md font-semibold text-gray-900 border-b border-gray-100 pb-3">Confirm Deletion</h3>
              <p className="mt-3 text-xs text-gray-500">
                Are you sure you want to delete the {deleteTarget.type} <span className="font-semibold text-gray-800">"{deleteTarget.name}"</span>?
                {deleteTarget.type === 'folder' && ' This will recursively delete all nested subfolders and images. This action cannot be undone.'}
              </p>
              <div className="mt-6 flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrivePage;
