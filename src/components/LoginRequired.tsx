import React from 'react';
import { Button } from './ui/button';
import { LogIn, Shield, Cloud } from 'lucide-react';

/**
 * Full-page component shown to unauthenticated users.
 * Prompts users to sign in with Microsoft Entra ID.
 */
export function LoginRequired() {
  const handleSignIn = () => {
    window.location.href = '/.auth/login/aad?post_login_redirect_uri=/amos-cloudstore';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D4689]/5 via-background to-[#1F4074]/5 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <img 
            src="data:image/svg+xml,%3csvg%20width='37'%20height='28'%20viewBox='0%200%2037%2028'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M36.52%2013.28L35.67%2013.22C32.33%2012.98%2032.4%209.96001%2032.4%209.96001C32.46%206.25001%2030.33%200.34%2021.99%200H7.56L7.35999%200.720001H19.46C20.69%200.750001%2021.55%201.64001%2021.14%203.10001L18.97%2010.98C18.15%2013.34%2015.98%2013.22%2015.98%2013.22C13.76%2013.03%2014.38%2010.93%2014.38%2010.93L15.37%207.31C15.68%206.08%2014.81%205.5%2014.05%205.48H6.03998L5.83997%206.2H9.27002C10.53%206.23%2010.8%207.17%2010.58%208.02C10.58%208.02%2010.15%209.51999%209.64996%2011.4C9.15996%2013.22%207.46998%2013.27%207.22998%2013.27H3.89001L3.65997%2014.12H6.82001C7.18001%2014.12%208.89001%2014.19%208.38%2016.01C7.84%2017.9%207.45001%2019.39%207.45001%2019.39C7.20001%2020.24%206.42001%2021.17%205.14001%2021.21H1.70001L1.51001%2021.94H9.52997C10.3%2021.92%2011.49%2021.34%2011.87%2020.1L12.86%2016.5C12.86%2016.5%2013.39%2014.39%2015.72%2014.2C15.72%2014.2%2017.96%2014.08%2017.48%2016.44L15.32%2024.32C14.92%2025.78%2013.56%2026.69%2012.33%2026.7H0.209961L0%2027.43H14.45C22.98%2027.08%2028.36%2021.18%2030.35%2017.46C30.35%2017.46%2031.95%2014.43%2035.43%2014.2L36.29%2014.14C36.29%2014.14%2036.35%2014.14%2036.37%2014.09C36.42%2013.94%2036.57%2013.37%2036.58%2013.33C36.58%2013.29%2036.58%2013.29%2036.54%2013.28'%20fill='%230D4689'/%3e%3c/svg%3e"
            alt="AMOS Logo"
            className="h-7 w-auto"
          />
          <h1 className="text-xl font-semibold text-[#0D4689]">AMOS CloudStore</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-xl border p-8 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#0D4689]/10 flex items-center justify-center">
                <Cloud className="w-10 h-10 text-[#0D4689]" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2">Welcome to AMOS CloudStore</h2>
            <p className="text-muted-foreground mb-8">
              Secure file storage and management for Malaysia Airlines Engineering.
            </p>

            {/* Sign In Button */}
            <Button 
              onClick={handleSignIn}
              size="lg"
              className="w-full bg-[#0D4689] hover:bg-[#0D4689]/90 text-white"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Microsoft
            </Button>

            {/* Security Note */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secured with Microsoft Entra ID</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Only Malaysia Airlines employees can access this application.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Malaysia Airlines. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
