import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { LogIn } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const handleSignIn = () => {
    // Redirect to Azure AD login
    window.location.href = '/.auth/login/aad?post_login_redirect_uri=/amos-cloudstore';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Sign In to AMOS CloudStore
          </DialogTitle>
          <DialogDescription>
            Sign in with your Malaysia Airlines account to access the file storage system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <Button 
            onClick={handleSignIn}
            className="w-full"
            size="lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign in with Microsoft
          </Button>
          
          <div className="pt-4 border-t text-xs text-gray-500">
            <p className="font-medium mb-1">Admin Access:</p>
            <p>khairulamri.mdsohod@malaysiaairlines.com</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
