import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <HardDrive className="h-6 w-6 text-gray-700 mr-2" />
            <span className="text-lg font-semibold text-gray-900 tracking-tight">Drive Manager</span>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-500 mr-1.5" />
                <span className="font-medium mr-1">{user.name}</span>
                <span className="text-gray-400">({user.email})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-gray-500 mr-1.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
