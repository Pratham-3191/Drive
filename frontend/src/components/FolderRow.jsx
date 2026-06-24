import React from 'react';
import { Folder, Trash2 } from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === undefined || bytes === null) return '-';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FolderRow = ({ folder, onFolderClick, onDeleteClick }) => {
  const handleFolderClick = (e) => {
    // Avoid navigating if they click the delete button
    if (e.target.closest('button')) return;
    onFolderClick(folder._id);
  };

  return (
    <tr
      onClick={handleFolderClick}
      className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer text-sm transition-colors text-gray-700"
    >
      <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 flex items-center space-x-3">
        <Folder className="h-4.5 w-4.5 text-gray-400 flex-shrink-0" />
        <span className="truncate max-w-xs sm:max-w-md hover:underline">{folder.name}</span>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
        Folder
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
        {formatBytes(folder.size)}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
        {new Date(folder.updatedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-right text-xs">
        <button
          onClick={() => onDeleteClick(folder._id, folder.name)}
          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
          title="Delete Folder"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

export default FolderRow;
