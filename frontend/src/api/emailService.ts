import apiClient from './apiClient';
import axios, { AxiosError } from 'axios';

// 이메일 인증 관련 서비스
const emailService = {
  // 인증 코드 요청
  sendVerificationCode: async (email: string): Promise<string> => {
    try {
      const response = await apiClient.post(`/email/send-code?email=${email}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // 인증 코드 확인
  verifyCode: async (email: string, code: string): Promise<string> => {
    try {
      // 백엔드 API 형식에 맞게 수정
      const response = await apiClient.post(`/email/verify-code?email=${email}&code=${code}`);
      return response.data;
    } catch (error: unknown) {
      // 에러 응답이 있으면 메시지 추출 시도
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        throw new Error(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
      }
      throw error;
    }
  }
};

export default emailService; 