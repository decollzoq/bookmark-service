'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyEmail, resendVerification } = useBookmarkStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // 유효성 검사
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }
    
    try {
      // 디버깅: API 요청 직접 시도
      console.log('로그인 시도:', { email: formData.email });
      console.log('현재 baseURL 설정:', '/auth');
      
      // 로그인 처리
      await login(formData.email, formData.password);
      
      // 로그인 성공 시 메인 페이지로 리다이렉트
      router.push('/');
    } catch (err) {
      console.error('로그인 오류 상세 정보:', err);
      
      // 디버깅: 오류 객체 자세히 검사
      if (err instanceof Error) {
        console.log('에러 이름:', err.name);
        console.log('에러 메시지:', err.message);
        console.log('에러 스택:', err.stack);
        
        // Axios 오류인 경우 더 자세한 정보 추출
        if (err.name === 'AxiosError') {
          const axiosErr = err as any;
          console.log('Axios 에러 코드:', axiosErr.code);
          console.log('Axios 응답 데이터:', axiosErr.response?.data);
          console.log('Axios 응답 상태:', axiosErr.response?.status);
          console.log('Axios 요청 설정:', axiosErr.config);
        }
        
        // 인증이 필요한 경우
        if (err.message.includes('이메일 인증이 필요합니다')) {
          setNeedVerification(true);
          setMessage('이메일 인증이 필요합니다. 인증 코드를 입력해주세요.');
        } else {
          setError(`오류: ${err.message}`);
        }
      } else {
        setError('로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    if (!formData.verificationCode) {
      setError('인증 코드를 입력해주세요.');
      setIsLoading(false);
      return;
    }
    
    try {
      // 이메일 인증 처리
      await verifyEmail(formData.email, formData.verificationCode);
      
      // 인증 성공, 메인 페이지로 리다이렉트
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('이메일 인증 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    
    try {
      // 인증 코드 재발송
      await resendVerification(formData.email);
      setMessage('인증 코드가 재발송되었습니다. 이메일을 확인해주세요.');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('인증 코드 재발송 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {needVerification ? '이메일 인증' : '로그인'}
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {message}
        </div>
      )}
      
      {!needVerification ? (
        // 로그인 폼
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoComplete="email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoComplete="current-password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
          >
            {isLoading ? '처리 중...' : '로그인'}
          </button>
        </form>
      ) : (
        // 이메일 인증 폼
        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
              인증 코드
            </label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="6자리 인증코드 입력"
            />
            <p className="text-sm text-gray-500 mt-1">
              이메일로 발송된 6자리 인증 코드를 입력하세요
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
          >
            {isLoading ? '처리 중...' : '인증 확인'}
          </button>
          
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-white text-amber-600 border border-amber-500 rounded-lg hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
          >
            인증 코드 재발송
          </button>
        </form>
      )}
      
      <div className="mt-4 text-center text-sm">
        <span className="text-gray-600">계정이 없으신가요?</span>{' '}
        <Link href="/register" className="text-amber-600 hover:underline">
          회원가입
        </Link>
      </div>
      
      <div className="mt-2 text-center text-sm">
        <Link href="/forgot-password" className="text-amber-600 hover:underline">
          비밀번호를 잊으셨나요?
        </Link>
      </div>
    </div>
  );
} 