import React from 'react';
import { LogIn } from 'lucide-react';

/**
 * Full-page component shown to unauthenticated users.
 * Malaysia Airlines Design System - exact Figma modal specifications.
 */
export function LoginRequired() {
  const handleSignIn = () => {
    window.location.href = '/.auth/login/aad?post_login_redirect_uri=/amos-cloudstore';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      
      {/* Modal Card - Exact Figma Specs */}
      <div className="w-full max-w-[360px] bg-white rounded-[16px] border border-[#E1E7EA] overflow-hidden"
           style={{
             boxShadow: '0px 0px 3px 0px rgba(0, 0, 0, 0.1), 0px 3px 15px 0px rgba(2, 43, 83, 0.05)'
           }}>
        
        {/* Header Section with Logo - 8px top padding */}
        <div className="pt-[8px] pb-0 px-[24px] flex justify-end">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Malaysia_Airlines_logo_%282019%29.svg/512px-Malaysia_Airlines_logo_%282019%29.svg.png"
            alt="Malaysia Airlines"
            className="h-[32px]"
          />
        </div>

        {/* Title Section - 24px horizontal padding, 16px vertical */}
        <div className="px-[24px] py-[16px]">
          <h2 
            className="text-[#333333] text-[18px] font-bold leading-[24px]"
            style={{ fontFamily: 'Mundial, sans-serif' }}
          >
            AMOS CloudStore
          </h2>
        </div>

        {/* Description Section - 24px horizontal, 8px vertical */}
        <div className="px-[24px] py-[8px]">
          <p 
            className="text-[#333333] text-[14px] font-light leading-[20px]"
            style={{ fontFamily: 'Mundial, sans-serif' }}
          >
            Engineering document management system. Sign in with your Microsoft account to access files and collaborate with your team.
          </p>
        </div>

        {/* Button Section - 24px horizontal, 16px top, 24px bottom */}
        <div className="px-[24px] pt-[16px] pb-[24px]">
          <button
            onClick={handleSignIn}
            className="w-full bg-[#0D4689] hover:bg-[#0A3766] text-white rounded-[100px] px-[16px] py-[12px] flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <LogIn className="h-[16px] w-[16px]" />
            <span 
              className="text-[14px] font-semibold leading-[24px]"
              style={{ fontFamily: 'Work Sans, sans-serif' }}
            >
              Sign in with Microsoft
            </span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-[24px] pb-[16px]">
          <p 
            className="text-[#999999] text-[12px] text-center leading-[16px]"
            style={{ fontFamily: 'Mundial, sans-serif' }}
          >
            Access restricted to authorized personnel
          </p>
        </div>
      </div>
    </div>
  );
}
