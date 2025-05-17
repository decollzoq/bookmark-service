import apiClient from './apiClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  // 필요한 다른 응답 필드 추가
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// 인증 관련 서비스
const authService = {
  // 로그인
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    
    // 토큰 저장
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  },
  
  // 회원가입
  register: async (data: RegisterRequest): Promise<string> => {
    const response = await apiClient.post<string>('/users/register', data);
    return response.data;
  },
  
  // 토큰 재발급
  reissueToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/reissue', { refreshToken });
    
    // 새 토큰 저장
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  },
  
  // 로그아웃
  logout: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  // 인증 상태 확인
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  }
};

export default authService; 