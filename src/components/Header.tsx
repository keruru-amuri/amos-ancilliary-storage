import React from 'react';
import { Search, User } from 'lucide-react';
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

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files and folders..."
              className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-[var(--radius)] outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

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

      {/* Mobile Search */}
      <div className="md:hidden px-6 pb-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-[var(--radius)] outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </header>
  );
}
