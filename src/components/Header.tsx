import React, { useState } from 'react';
import { User, LogIn, LogOut } from 'lucide-react';
import logoSvg from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';

export function Header() {
  const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo, Title and Admin badge (aligned on a single row) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <img src={logoSvg} alt="AMOS Logo" className="h-8" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-2xl font-bold leading-none">AMOS CloudStore</h1>
            </div>
            <p className="text-muted-foreground text-sm">File Management System</p>
          </div>
        </div>

        {/* Search bar removed from header — moved to sidebar for better discoverability */}

        {/* User Section */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="animate-pulse flex items-center gap-4">
              <div className="hidden lg:block text-right">
                <div className="h-4 w-24 bg-muted rounded mb-1"></div>
                <div className="h-3 w-32 bg-muted rounded"></div>
              </div>
              <div className="w-10 h-10 bg-muted rounded-full"></div>
            </div>
          ) : isAuthenticated && user ? (
            <>
              <div className="hidden lg:block text-right">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-foreground">{user.displayName || user.email}</p>
                  {/* Admin badge moved to the brand area — kept out of the right user block to avoid duplication */}
                </div>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                  title={user.email}
                >
                  <User className="w-5 h-5 text-primary-foreground" />
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </header>
  );
}
