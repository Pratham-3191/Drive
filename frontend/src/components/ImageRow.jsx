import React from 'react';
import { FileImage, Trash2, ExternalLink } from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === undefined || bytes === null) return '-';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ImageRow = ({ image, onDeleteClick }) => {
  return (
    <tr className="hover:bg-gray-50 border-b border-gray-100 text-sm transition-colors text-gray-700">
      <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-900 flex items-center space-x-3">
        {/* Tiny preview thumbnail */}
        <div className="h-6 w-6 rounded border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
          <img
            src={image.url}
            alt={image.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'; // Fallback if image fails to render
            }}
          />
        </div>
        <a
          href={image.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate max-w-xs sm:max-w-md hover:underline flex items-center"
        >
          <span className="truncate">{image.name}</span>
          <ExternalLink className="h-3 w-3 text-gray-400 ml-1.5 flex-shrink-0 inline" />
        </a>
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
        Image
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
        {formatBytes(image.size)}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
        {new Date(image.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </td>
      <td className="px-6 py-3 whitespace-nowrap text-right text-xs">
        <button
          onClick={() => onDeleteClick(image._id, image.name)}
          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
          title="Delete Image"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

export default ImageRow;
