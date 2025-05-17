'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';

export function MainNavigation() {
  const pathname = usePathname();
  const { currentUser } = useBookmarkStore();
  
  const navItems = [
    { name: '홈', href: '/' },
    { name: '북마크', href: '/bookmark', authRequired: true },
    { name: '카테고리', href: '/category', authRequired: true },
  ];
  
  return (
    <nav className="bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-10">
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              // 로그인이 필요한 항목인데 로그인하지 않은 경우 표시하지 않음
              if (item.authRequired && !currentUser) return null;
              
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`px-3 py-1 text-sm rounded-md ${
                    isActive 
                      ? 'bg-amber-600 text-white' 
                      : 'text-gray-700 hover:bg-amber-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
} 