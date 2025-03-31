import React, { ReactNode } from 'react';
import { PlaidServiceProvider } from './useplaidService'; // Ensure correct casing in import

interface HooksProviderProps {
  children: ReactNode;
}

const HooksProvider: React.FC<HooksProviderProps> = ({ children }) => {
  return <PlaidServiceProvider>{children}</PlaidServiceProvider>;
};

export default HooksProvider;
