'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
  showIcon?: boolean;
}

export default function BackButton({ 
  label = 'Retour', 
  href,
  className = '',
  showIcon = true
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    >
      {showIcon && <ArrowLeftIcon className="h-4 w-4" />}
      {label}
    </button>
  );
}