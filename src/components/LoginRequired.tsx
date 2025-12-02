import React from 'react';
import { LogIn } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

/**
 * Full-page component shown to unauthenticated users.
 * Malaysia Airlines Design System - exact Figma modal specifications.
 */
export function LoginRequired() {
  const handleSignIn = () => {
    window.location.href = '/.auth/login/aad?post_login_redirect_uri=/amos-cloudstore';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F5F7FA' }}>
      
      {/* Modal Card - Exact Figma Specs */}
      <div className="w-full bg-white border overflow-hidden" 
           style={{
             maxWidth: '360px',
             borderRadius: '16px',
             borderColor: '#E1E7EA',
             boxShadow: '0px 0px 3px 0px rgba(0, 0, 0, 0.1), 0px 3px 15px 0px rgba(2, 43, 83, 0.05)'
           }}>
        
        {/* Header Section with Logo - 8px top padding */}
        <div className="flex justify-end" style={{ paddingTop: '8px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '0' }}>
          <img 
            src={logoSvg}
            alt="AMOS Logo"
            style={{ height: '32px' }}
          />
        </div>

        {/* Title Section - 24px horizontal padding, 16px vertical */}
        <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px' }}>
          <h2 
            style={{ 
              fontFamily: 'Mundial, sans-serif',
              color: '#333333',
              fontSize: '18px',
              fontWeight: 700,
              lineHeight: '24px',
              margin: 0
            }}
          >
            AMOS CloudStore
          </h2>
        </div>

        {/* Description Section - 24px horizontal, 8px vertical */}
        <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '8px', paddingBottom: '8px' }}>
          <p 
            style={{ 
              fontFamily: 'Mundial, sans-serif',
              color: '#333333',
              fontSize: '14px',
              fontWeight: 300,
              lineHeight: '20px',
              margin: 0
            }}
          >
            Engineering document management system. Sign in with your Microsoft account to access files and collaborate with your team.
          </p>
        </div>

        {/* Button Section - 24px horizontal, 16px top, 24px bottom */}
        <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '24px' }}>
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 transition-colors duration-200"
            style={{
              backgroundColor: '#0D4689',
              color: 'white',
              borderRadius: '100px',
              padding: '12px 16px',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A3766'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0D4689'}
          >
            <LogIn style={{ height: '16px', width: '16px' }} />
            <span 
              style={{ 
                fontFamily: 'Work Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '24px'
              }}
            >
              Sign in with Microsoft
            </span>
          </button>
        </div>

        {/* Footer Note */}
        <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '16px' }}>
          <p 
            style={{ 
              fontFamily: 'Mundial, sans-serif',
              color: '#999999',
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '16px',
              margin: 0
            }}
          >
            Access restricted to authorized personnel
          </p>
        </div>
      </div>
    </div>
  );
}
