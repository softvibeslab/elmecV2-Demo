import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ComplianceProvider } from '@/contexts/ComplianceContext';
import { NotificationManager } from '@/components/NotificationToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ContextProvidersProps {
  children: ReactNode;
}

export const ContextProviders: React.FC<ContextProvidersProps> = ({
  children,
}) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <ComplianceProvider>
              {children}
              <NotificationManager />
            </ComplianceProvider>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
