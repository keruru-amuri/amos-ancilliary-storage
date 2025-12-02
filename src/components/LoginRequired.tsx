import React from 'react';
import { LogIn } from 'lucide-react';

/**
 * Full-page component shown to unauthenticated users.
 * Malaysia Airlines Design System - clean, professional modal aesthetic.
 */
export function LoginRequired() {
  const handleSignIn = () => {
    window.location.href = '/.auth/login/aad?post_login_redirect_uri=/amos-cloudstore';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F5F7FA] flex items-center justify-center p-4">
      
      {/* Modal Card - Malaysia Airlines Design System */}
      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-lg p-6">
        
        {/* Malaysia Airlines Logo */}
        <div className="flex justify-end mb-6">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Malaysia_Airlines_logo_%282019%29.svg/512px-Malaysia_Airlines_logo_%282019%29.svg.png"
            alt="Malaysia Airlines"
            className="h-8"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          AMOS CloudStore
        </h2>

        {/* Description */}
        <p className="text-[#666666] text-sm leading-relaxed mb-8">
          Engineering document management system. Sign in with your Microsoft account to access files and collaborate with your team.
        </p>

        {/* Sign In Button - MAS Blue */}
        <button
          onClick={handleSignIn}
          className="w-full h-[42px] bg-[#003C71] hover:bg-[#002952] text-white font-medium rounded-[21px] transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          Sign in with Microsoft
        </button>

        {/* Footer Note */}
        <p className="text-xs text-[#999999] text-center mt-6 leading-relaxed">
          Access restricted to authorized personnel
        </p>
      </div>
    </div>
  );
}
