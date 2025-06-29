import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-github-light border border-github-border rounded-lg p-6 ${
        hover ? 'hover:border-primary-500 transition-colors cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;