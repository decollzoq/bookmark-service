'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useBookmarkStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 유효성 검사
    if (!password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    
    if (!token) {
      setError('유효하지 않은 토큰입니다. 다시 비밀번호 찾기를 시도해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 비밀번호 재설정 요청
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('비밀번호 재설정 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 토큰이 없는 경우 오류 표시
  if (!token && !success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">비밀번호 재설정</h1>
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          유효하지 않은 토큰입니다. 다시 비밀번호 찾기를 시도해주세요.
        </div>
        <div className="text-center mt-4">
          <Link href="/forgot-password" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 inline-block">
            비밀번호 찾기로 이동
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">비밀번호 재설정</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p>비밀번호가 성공적으로 재설정되었습니다.</p>
            <p className="mt-2">새 비밀번호로 로그인해주세요.</p>
          </div>
          
          <Link href="/login" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 inline-block mt-4">
            로그인 페이지로 이동
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="새 비밀번호 입력 (최소 8자)"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="비밀번호 재입력"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
          >
            {isLoading ? '처리 중...' : '비밀번호 재설정'}
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