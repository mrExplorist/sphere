import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="mx-auto py-10">
        <p className="text-center text-xs">&copy; {new Date().getFullYear()} Sphere, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
