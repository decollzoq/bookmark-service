'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useBookmarkStore();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const isActive = (path: string) => pathname === path;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
      setIsUserMenuOpen(false);
    }
  };

  // 사용자 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <nav className="bg-gray-100 text-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">메뉴 열기</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <div className="flex-shrink-0 flex items-center ml-3">
              <Link href="/" className="font-['Montserrat'] text-xl font-bold tracking-wide">
                <span className="font-['Playfair_Display'] italic text-gray-700">Book</span>
                <span className="text-gray-900">Mark</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-700 rounded-md hover:bg-gray-200 font-['Poppins']"
                >
                  <span>{currentUser.username}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      회원정보
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 font-['Poppins']"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 text-sm bg-white text-gray-700 rounded-md hover:bg-gray-100 border border-gray-200 font-['Poppins']"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 border-t border-gray-200">
          <Link
            href="/"
            className={`block px-3 py-2 text-base font-medium font-['Poppins'] ${
              isActive('/') ? 'bg-gray-700 text-white' : 'text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            홈
          </Link>
          
          <Link
            href="/bookmark"
            className={`block px-3 py-2 text-base font-medium font-['Poppins'] ${
              isActive('/bookmark') ? 'bg-gray-700 text-white' : 'text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            내 북마크
          </Link>
          
          <Link
            href="/bookmark/add"
            className={`block px-3 py-2 text-base font-medium font-['Poppins'] ${
              isActive('/bookmark/add') ? 'bg-gray-700 text-white' : 'text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            북마크 추가
          </Link>
          
          <Link
            href="/category"
            className={`block px-3 py-2 text-base font-medium font-['Poppins'] ${
              isActive('/category') ? 'bg-gray-700 text-white' : 'text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            카테고리
          </Link>
        </div>
      </div>
    </nav>
  );
}; 