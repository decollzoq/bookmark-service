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
            await logout();
            return;
          }
          
          // localStorage에서 저장된 이메일 가져오기
          const userEmail = safeGetItem('userEmail');
          if (!userEmail) {
            await logout();
            return;
          }
          
          // 토큰에서 정보 추출
          const userId = decoded.sub || 'user-id';
          // 토큰에서 닉네임 정보 추출 - 백엔드에서 설정한 nickname 필드를 우선 사용
          const nickname = decoded.nickname || decoded.username;
          
          // 직접 사용자 정보 구성
          const userFromEmail = {
            id: userId,
            username: nickname || userEmail, // nickname을 username 필드에 매핑, 없는 경우에만 이메일 사용
            email: userEmail
          };
          
          // 사용자 정보 설정
          useBookmarkStore.setState({ currentUser: userFromEmail });
        } catch (decodeError) {
          // 오류 발생 시 로그아웃
          await logout();
        }
      } catch (error) {
      }
    };
    
    initAuth();
  }, [currentUser, logout]);
  
  return <>{children}</>;
} 