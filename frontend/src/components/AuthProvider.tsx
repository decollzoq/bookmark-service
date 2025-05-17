'use client';

import { useEffect, useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { jwtDecode } from 'jwt-decode';

// 안전한 localStorage 접근
const safeGetItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useBookmarkStore();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // 클라이언트 사이드 표시
    setIsClient(true);
    
    // 로그인 상태 확인 및 복원
    const initAuth = async () => {
      try {
        // 클라이언트 사이드에서만 localStorage 접근
        const accessToken = safeGetItem('accessToken');
        
        // 토큰이 없으면 로그아웃 상태로 간주
        if (!accessToken) {
          return;
        }
        
        // 이미 로그인 상태면 추가 작업 불필요
        if (currentUser) {
          return;
        }

        // 토큰 유효성 검사 (간단한 디코딩)
        try {
          const decoded = jwtDecode(accessToken) as any;
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp && decoded.exp < currentTime) {
            console.log('만료된 토큰, 로그아웃 처리');
            await logout();
            return;
          }
          
          // localStorage에서 저장된 이메일 가져오기
          const userEmail = safeGetItem('userEmail');
          console.log('AuthProvider: 저장된 이메일:', userEmail);
          
          if (!userEmail) {
            console.error('AuthProvider: 저장된 이메일 없음');
            await logout();
            return;
          }
          
          // 토큰에서 ID 추출
          const userId = decoded.sub || 'user-id';
          // 사용자 이름은 이메일의 @ 앞부분
          const username = userEmail.split('@')[0];
          
          // 직접 사용자 정보 구성
          const userFromEmail = {
            id: userId,
            username: username,
            email: userEmail
          };
          
          // 사용자 정보 설정
          useBookmarkStore.setState({ currentUser: userFromEmail });
          console.log('AuthProvider: 로그인 상태 복원:', userFromEmail);
        } catch (decodeError) {
          console.error('토큰 디코딩 실패:', decodeError);
          // 오류 발생 시 로그아웃
          await logout();
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error);
      }
    };
    
    initAuth();
  }, [currentUser, logout]);
  
  return <>{children}</>;
} 