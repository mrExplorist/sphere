import Footer from '@/components/landing-page/Footer';
import Header from '@/components/landing-page/Header';

import React from 'react';

const HomePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main>
      <Header />
      {children}
      <Footer />
    </main>
  );
};

export default HomePageLayout;
