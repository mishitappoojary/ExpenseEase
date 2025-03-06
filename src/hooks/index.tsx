import React from 'react';
import { PlaidServiceProvider } from './useplaidService'; // Updated to use PlaidService

const HooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <PlaidServiceProvider>{children}</PlaidServiceProvider>;
};

export default HooksProvider;