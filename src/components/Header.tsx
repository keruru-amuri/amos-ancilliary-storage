import React from 'react';
import { User } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

export function Header() {
  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <img src={logoSvg} alt="AMOS Logo" className="h-8" />
          </div>
          <div>
            <h1 className="text-foreground">CloudStore</h1>
            <p className="text-muted-foreground">File Management System</p>
          </div>
        </div>

        {/* Search bar removed from header — moved to sidebar for better discoverability */}

        {/* User Section */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right">
            <p className="text-foreground">Sarah Mitchell</p>
            <p className="text-muted-foreground">sarah@company.com</p>
          </div>
          <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
            <User className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile search removed — search lives in the sidebar */}
    </header>
  );
}
