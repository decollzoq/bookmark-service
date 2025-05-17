'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import emailService from '@/api/emailService';

export default function RegisterPage() {
  const router = useRouter();
  const { register, verifyEmail, resendVerification } = useBookmarkStore();
  
  // 회원가입 단계
  enum RegisterStep {
    EMAIL_INPUT = 1,        // 이메일 입력 단계
    VERIFICATION = 2,       // 이메일 인증 단계
    USER_INFO = 3           // 회원 정보 입력 단계
  }

  const [currentStep, setCurrentStep] = useState<RegisterStep>(RegisterStep.EMAIL_INPUT);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 이메일 인증 코드 요청
  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      setIsLoading(false);
      return;
    }
    
    try {
      // 실제 API 호출로 변경
      console.log('인증 코드 요청:', formData.email);
      
      await emailService.sendVerificationCode(formData.email);
      
      // 인증 코드 입력 단계로 이동
      setCurrentStep(RegisterStep.VERIFICATION);
      setMessage('인증 코드가 이메일로 발송되었습니다. 이메일을 확인해주세요.');
      setIsVerificationSent(true);
    } catch (err) {
      console.error('인증 코드 요청 오류:', err);
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        
        // 데이터베이스 관련 오류 처리
        if (errorMessage.includes('duplicate') || errorMessage.includes('중복')) {
          setError('이미 해당 이메일로 인증 코드가 발송되었습니다. 이메일을 확인하거나 잠시 후 다시 시도해주세요.');
        } else {
        setError(`오류: ${err.message}`);
        }
      } else {
        setError('인증 코드 요청 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 이메일 인증 코드 확인
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
      console.log('이메일 인증 시도:', { email: formData.email, code: formData.verificationCode });
      
      // 실제 API 호출로 변경
      await emailService.verifyCode(formData.email, formData.verificationCode);
      
      // 이메일 인증 성공 후 다음 단계로
      setEmailVerified(true);
      setCurrentStep(RegisterStep.USER_INFO);
      setMessage('이메일 인증이 완료되었습니다. 회원 정보를 입력해주세요.');
    } catch (err) {
      console.error('이메일 인증 오류:', err);
      if (err instanceof Error) {
        // 인증 코드 관련 오류 메시지 처리
        const errorMessage = err.message.toLowerCase();
        
        // 중복 결과 에러 처리 (MongoDB non unique result)
        if (errorMessage.includes('non unique result') || errorMessage.includes('non-unique')) {
          setError('이메일 인증 처리 중 문제가 발생했습니다. 인증 코드를 다시 요청해주세요.');
          // 이메일 입력 단계로 돌아가기
          setCurrentStep(RegisterStep.EMAIL_INPUT);
        } else if (errorMessage.includes('일치하지 않') || errorMessage.includes('code mismatch')) {
          setError('인증 코드가 유효하지 않습니다. 다시 확인해주세요.');
        } else if (errorMessage.includes('만료') || errorMessage.includes('expired')) {
          setError('인증 코드가 만료되었습니다. 인증 코드를 다시 요청해주세요.');
        } else {
          setError(`오류: ${err.message}`);
        }
      } else {
        setError('이메일 인증 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 회원 정보 등록 및 최종 회원가입
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    
    // 폼 유효성 검사
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      setIsLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('회원가입 시도:', { username: formData.username, email: formData.email });
      
      // 실제 API 호출로 변경 (자동 로그인 포함)
      await register(formData.email, formData.password, formData.username);
      
      // 회원가입 및 자동 로그인 성공 메시지 표시
      setMessage('회원가입이 완료되었습니다. 메인 페이지로 이동합니다.');
      
      // 잠시 후 메인 페이지로 이동
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('회원가입 오류:', err);
      if (err instanceof Error) {
        setError(`오류: ${err.message}`);
      } else {
        setError('회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 인증 코드 재발송
  const handleResendCode = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    
    try {
      // 인증 코드 재발송 API 호출
      await emailService.sendVerificationCode(formData.email);
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
  
  // 이전 단계로 돌아가기
  const handlePrevStep = () => {
    if (currentStep === RegisterStep.VERIFICATION) {
      setCurrentStep(RegisterStep.EMAIL_INPUT);
    } else if (currentStep === RegisterStep.USER_INFO) {
      setCurrentStep(RegisterStep.VERIFICATION);
    }
    setError(null);
    setMessage(null);
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
      
      {/* 단계 표시 */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex-1 text-center ${currentStep >= RegisterStep.EMAIL_INPUT ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
          1. 이메일 입력
        </div>
        <div className={`flex-1 text-center ${currentStep >= RegisterStep.VERIFICATION ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
          2. 이메일 인증
        </div>
        <div className={`flex-1 text-center ${currentStep >= RegisterStep.USER_INFO ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
          3. 정보 입력
        </div>
      </div>
      
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
      
      {/* 1단계: 이메일 입력 */}
      {currentStep === RegisterStep.EMAIL_INPUT && (
        <form onSubmit={handleRequestVerification} className="space-y-4">
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
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
          >
            {isLoading ? '처리 중...' : '인증 코드 받기'}
          </button>
        </form>
      )}
      
      {/* 2단계: 이메일 인증 */}
      {currentStep === RegisterStep.VERIFICATION && (
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
              maxLength={6}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.email}로 발송된 6자리 인증 코드를 입력하세요
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none"
            >
              이전
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
            >
              {isLoading ? '처리 중...' : '인증 확인'}
            </button>
          </div>
          
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
      
      {/* 3단계: 회원 정보 입력 */}
      {currentStep === RegisterStep.USER_INFO && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              사용자 이름
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoComplete="username"
              required
            />
          </div>
          
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  인증된 이메일: <span className="font-semibold">{formData.email}</span>
                </p>
              </div>
            </div>
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
              autoComplete="new-password"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoComplete="new-password"
              required
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none"
            >
              이전
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50"
            >
              {isLoading ? '처리 중...' : '회원가입 완료'}
            </button>
          </div>
        </form>
      )}
      
      <div className="mt-4 text-center text-sm">
        <span className="text-gray-600">이미 계정이 있으신가요?</span>{' '}
        <Link href="/login" className="text-amber-600 hover:underline">
          로그인
        </Link>
      </div>
    </div>
  );
} 