'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  Cog6ToothIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Vue d\'ensemble', href: '/admin/dashboard/overview', icon: ChartBarIcon },
  { name: 'Utilisateurs', href: '/admin/dashboard/users', icon: UsersIcon },
  { name: 'Préinscriptions', href: '/admin/dashboard/preregistrations', icon: UserPlusIcon },
  { name: 'Forfaits', href: '/admin/dashboard/plans', icon: PhoneIcon },
  { name: 'Épargne', href: '/admin/dashboard/savings', icon: CurrencyDollarIcon },
  { name: 'Opérateurs', href: '/admin/dashboard/operators', icon: BuildingOfficeIcon },
  { name: 'Paramètres', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div className={`bg-gray-900 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out flex flex-col`}>
      <div className="flex items-center justify-between h-16 px-4 text-white">
        {!collapsed && <span className="text-xl font-bold">Yamdata Admin</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1 rounded-md hover:bg-gray-700"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      
      <nav className="mt-5 flex-1 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
              `}
            >
              <item.icon
                className={`
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                  mr-3 flex-shrink-0 h-6 w-6
                `}
                aria-hidden="true"
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 