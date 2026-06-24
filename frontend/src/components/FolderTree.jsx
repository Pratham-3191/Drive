import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, HardDrive } from 'lucide-react';

// TreeNode sub-component to render individual nested folders recursively
const TreeNode = ({ node, activeFolderId, onFolderSelect, level = 0, openNodes, toggleNode }) => {
  const isExpanded = openNodes[node._id];
  const isActive = node._id === activeFolderId;
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleNode(node._id);
  };

  const handleSelect = () => {
    onFolderSelect(node._id);
  };

  return (
    <div className="select-none">
      <div
        onClick={handleSelect}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        className={`flex items-center py-1.5 px-3 cursor-pointer text-xs font-medium border-l-2 transition-colors ${isActive
            ? 'bg-gray-100 text-gray-900 border-gray-900 font-semibold'
            : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        {/* Toggle Chevron */}
        <button
          onClick={handleToggle}
          className={`p-0.5 rounded hover:bg-gray-200 mr-0.5 focus:outline-none transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0 cursor-default'
            }`}
          disabled={!hasChildren}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          )}
        </button>

        {/* Folder Icon */}
        <Folder className={`h-4 w-4 mr-2 flex-shrink-0 ${isActive ? 'text-gray-700' : 'text-gray-400'}`} />

        {/* Folder Name */}
        <span className="truncate">{node.name}</span>
      </div>

      {/* Children Nodes */}
      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              activeFolderId={activeFolderId}
              onFolderSelect={onFolderSelect}
              level={level + 1}
              openNodes={openNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = ({ folders = [], activeFolderId, onFolderSelect }) => {
  const [treeData, setTreeData] = useState([]);
  const [openNodes, setOpenNodes] = useState({});

  // Parse list folders to structured tree format
  useEffect(() => {
    const buildTree = (list) => {
      const map = {};
      const roots = [];

      list.forEach((item) => {
        map[item._id] = { ...item, children: [] };
      });

      list.forEach((item) => {
        if (item.parentFolderId) {
          if (map[item.parentFolderId]) {
            map[item.parentFolderId].children.push(map[item._id]);
          } else {
            roots.push(map[item._id]);
          }
        } else {
          roots.push(map[item._id]);
        }
      });

      return roots;
    };

    setTreeData(buildTree(folders));
  }, [folders]);

  // Handle expanding / collapsing tree nodes
  const toggleNode = (nodeId) => {
    setOpenNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Helper to expand all ancestors of active folder so it's visible in the sidebar tree
  useEffect(() => {
    if (!activeFolderId || folders.length === 0) return;

    const expandAncestors = (folderId) => {
      const updates = {};
      let currentId = folderId;

      while (currentId) {
        const found = folders.find((f) => f._id === currentId);
        if (!found) break;

        if (found.parentFolderId) {
          updates[found.parentFolderId] = true;
        }
        currentId = found.parentFolderId;
      }

      if (Object.keys(updates).length > 0) {
        setOpenNodes((prev) => ({ ...prev, ...updates }));
      }
    };

    expandAncestors(activeFolderId);
  }, [activeFolderId, folders]);

  return (
    <div className="flex flex-col space-y-1">
      {/* Root Node / All Files */}
      <div
        onClick={() => onFolderSelect(null)}
        className={`flex items-center py-1.5 px-3 cursor-pointer text-xs font-medium border-l-2 transition-colors ${activeFolderId === null
            ? 'bg-gray-100 text-gray-900 border-gray-900 font-semibold'
            : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        <span className="w-4.5 mr-0.5"></span>
        <HardDrive className={`h-4 w-4 mr-2 ${activeFolderId === null ? 'text-gray-700' : 'text-gray-400'}`} />
        <span>All Files (Root)</span>
      </div>

      {/* Tree items */}
      <div className="mt-1">
        {treeData.length === 0 ? (
          <div className="px-6 py-2 text-[11px] text-gray-400">No folders created</div>
        ) : (
          treeData.map((node) => (
            <TreeNode
              key={node._id}
              node={node}
              activeFolderId={activeFolderId}
              onFolderSelect={onFolderSelect}
              level={0}
              openNodes={openNodes}
              toggleNode={toggleNode}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FolderTree;
