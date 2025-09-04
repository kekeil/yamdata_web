'use client';

import { motion } from 'framer-motion';

interface OptimizedLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  showSkeleton?: boolean;
}

export default function OptimizedLoader({ 
  text = 'Chargement...', 
  size = 'md',
  showSkeleton = false 
}: OptimizedLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (showSkeleton) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
        <div className="bg-gray-200 rounded-lg h-64"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`border-4 border-green-200 border-t-green-600 rounded-full ${sizeClasses[size]}`}
      />
      <p className="mt-4 text-gray-600 text-sm">{text}</p>
    </div>
  );
}
