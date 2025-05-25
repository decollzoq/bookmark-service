'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookmarkStore } from '@/store/useBookmarkStore';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useBookmarkStore();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 이메일 유효성 검사
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 비밀번호 찾기 요청
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('비밀번호 찾기 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">비밀번호 찾기</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p>비밀번호 재설정 링크가 이메일로 전송되었습니다.</p>
            <p className="mt-2">이메일을 확인하여 비밀번호를 재설정해주세요.</p>
          </div>
          
          <Link href="/login" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 inline-block mt-4">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="가입한 이메일 주소 입력"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
          >
            {isLoading ? '처리 중...' : '비밀번호 재설정 링크 받기'}
          </button>
          
          <div className="text-center mt-4">
            <Link href="/login" className="text-amber-600 hover:underline text-sm">
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      )}
    </div>
  );
} 