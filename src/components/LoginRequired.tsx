import React from 'react';
import { Button } from './ui/button';
import { LogIn, Shield, Plane } from 'lucide-react';

/**
 * Full-page component shown to unauthenticated users.
 * Aviation Heritage / Art Deco aesthetic - bold, geometric, memorable.
 */
export function LoginRequired() {
  const handleSignIn = () => {
    window.location.href = '/.auth/login/aad?post_login_redirect_uri=/amos-cloudstore';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0D4689] to-[#1a5ba8]">
      {/* Geometric Art Deco Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="art-deco" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M100,0 L150,50 L100,100 L50,50 Z" fill="currentColor" opacity="0.3"/>
              <path d="M0,100 L50,150 L0,200 L-50,150 Z" fill="currentColor" opacity="0.2"/>
              <path d="M200,100 L250,150 L200,200 L150,150 Z" fill="currentColor" opacity="0.2"/>
              <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
              <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
              <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#art-deco)" className="text-white"/>
        </svg>
      </div>

      {/* Diagonal Metallic Accent Strips */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-amber-200/40 via-amber-400/20 to-transparent transform -skew-x-12"
          style={{ animation: 'shimmer 8s ease-in-out infinite' }}
        />
        <div 
          className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-amber-300/30 via-amber-500/15 to-transparent transform skew-x-12"
          style={{ animation: 'shimmer 10s ease-in-out infinite', animationDelay: '2s' }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        
        {/* Animated Plane Icon - Takeoff Motion */}
        <div 
          className="mb-12 relative"
          style={{ 
            animation: 'plane-takeoff 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            animationDelay: '0.3s',
            opacity: 0
          }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl bg-amber-400/30 rounded-full scale-150" />
            
            {/* Icon container with metallic border */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-50/20 to-amber-200/10 border-4 border-amber-300/40 flex items-center justify-center backdrop-blur-sm shadow-2xl">
              <Plane className="w-16 h-16 text-amber-100 transform rotate-45" strokeWidth={1.5} />
              
              {/* Corner accents - Art Deco style */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-300/60 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-300/60 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-300/60 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-300/60 rounded-br-lg" />
            </div>
          </div>
        </div>

        {/* Main Card with Staggered Animations */}
        <div 
          className="w-full max-w-lg relative"
          style={{ 
            animation: 'fade-in-up 1s ease-out forwards',
            animationDelay: '0.8s',
            opacity: 0
          }}
        >
          {/* Card metallic frame */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 via-amber-200/30 to-amber-400/20 rounded-2xl blur-xl" />
          
          <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            
            {/* Top accent bar - geometric */}
            <div className="h-2 bg-gradient-to-r from-[#0D4689] via-amber-400 to-[#0D4689]" />
            
            <div className="p-12 text-center">
              {/* Logo with stagger */}
              <div 
                className="mb-6 flex justify-center"
                style={{ 
                  animation: 'fade-in-up 0.8s ease-out forwards',
                  animationDelay: '1.2s',
                  opacity: 0
                }}
              >
                <img 
                  src="data:image/svg+xml,%3csvg%20width='37'%20height='28'%20viewBox='0%200%2037%2028'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M36.52%2013.28L35.67%2013.22C32.33%2012.98%2032.4%209.96001%2032.4%209.96001C32.46%206.25001%2030.33%200.34%2021.99%200H7.56L7.35999%200.720001H19.46C20.69%200.750001%2021.55%201.64001%2021.14%203.10001L18.97%2010.98C18.15%2013.34%2015.98%2013.22%2015.98%2013.22C13.76%2013.03%2014.38%2010.93%2014.38%2010.93L15.37%207.31C15.68%206.08%2014.81%205.5%2014.05%205.48H6.03998L5.83997%206.2H9.27002C10.53%206.23%2010.8%207.17%2010.58%208.02C10.58%208.02%2010.15%209.51999%209.64996%2011.4C9.15996%2013.22%207.46998%2013.27%207.22998%2013.27H3.89001L3.65997%2014.12H6.82001C7.18001%2014.12%208.89001%2014.19%208.38%2016.01C7.84%2017.9%207.45001%2019.39%207.45001%2019.39C7.20001%2020.24%206.42001%2021.17%205.14001%2021.21H1.70001L1.51001%2021.94H9.52997C10.3%2021.92%2011.49%2021.34%2011.87%2020.1L12.86%2016.5C12.86%2016.5%2013.39%2014.39%2015.72%2014.2C15.72%2014.2%2017.96%2014.08%2017.48%2016.44L15.32%2024.32C14.92%2025.78%2013.56%2026.69%2012.33%2026.7H0.209961L0%2027.43H14.45C22.98%2027.08%2028.36%2021.18%2030.35%2017.46C30.35%2017.46%2031.95%2014.43%2035.43%2014.2L36.29%2014.14C36.29%2014.14%2036.35%2014.14%2036.37%2014.09C36.42%2013.94%2036.57%2013.37%2036.58%2013.33C36.58%2013.29%2036.58%2013.29%2036.54%2013.28'%20fill='%230D4689'/%3e%3c/svg%3e"
                  alt="AMOS Logo"
                  className="h-10 w-auto"
                />
              </div>

              {/* Title with stagger */}
              <h1 
                className="text-4xl font-bold mb-2 text-[#0D4689] tracking-tight"
                style={{ 
                  animation: 'fade-in-up 0.8s ease-out forwards',
                  animationDelay: '1.4s',
                  opacity: 0,
                  fontFamily: 'Mundial, sans-serif',
                  letterSpacing: '-0.02em'
                }}
              >
                AMOS CloudStore
              </h1>
              
              <p 
                className="text-gray-600 mb-4 text-lg font-light"
                style={{ 
                  animation: 'fade-in-up 0.8s ease-out forwards',
                  animationDelay: '1.6s',
                  opacity: 0
                }}
              >
                Engineering Document Management
              </p>

              {/* Divider line - geometric */}
              <div 
                className="flex items-center justify-center gap-4 mb-10"
                style={{ 
                  animation: 'scale-in 0.6s ease-out forwards',
                  animationDelay: '1.8s',
                  opacity: 0
                }}
              >
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-amber-300 to-amber-400" />
                <div className="w-2 h-2 bg-amber-400 rotate-45" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent via-amber-300 to-amber-400" />
              </div>

              {/* Button with hover effect */}
              <div 
                style={{ 
                  animation: 'fade-in-up 0.8s ease-out forwards',
                  animationDelay: '2s',
                  opacity: 0
                }}
              >
                <button
                  onClick={handleSignIn}
                  className="group relative w-full px-8 py-4 bg-[#0D4689] text-white rounded-xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-100"
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  {/* Button content */}
                  <div className="relative flex items-center justify-center gap-3">
                    <LogIn className="w-6 h-6" />
                    <span>Sign in with Microsoft</span>
                  </div>

                  {/* Corner accents on button */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300/40" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300/40" />
                </button>
              </div>

              {/* Security badge */}
              <div 
                className="mt-10 pt-8 border-t border-gray-200/50 flex items-center justify-center gap-2 text-sm text-gray-500"
                style={{ 
                  animation: 'fade-in 0.8s ease-out forwards',
                  animationDelay: '2.2s',
                  opacity: 0
                }}
              >
                <Shield className="w-4 h-4 text-[#0D4689]" />
                <span>Secured with Microsoft Entra ID</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p 
          className="mt-12 text-white/60 text-sm font-light tracking-wide"
          style={{ 
            animation: 'fade-in 1s ease-out forwards',
            animationDelay: '2.4s',
            opacity: 0
          }}
        >
          © {new Date().getFullYear()} Malaysia Airlines Engineering
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes plane-takeoff {
          0% {
            opacity: 0;
            transform: translateY(40px) translateX(-20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scaleX(0);
          }
          100% {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0) scaleY(1);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-10px) scaleY(1.05);
          }
        }
      `}</style>
    </div>
  );
}
