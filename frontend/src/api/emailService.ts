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
      console.error('인증 코드 요청 실패:', error);
      throw error;
    }
  },
  
  // 인증 코드 확인
  verifyCode: async (email: string, code: string): Promise<string> => {
    try {
      // 백엔드 API 형식에 맞게 수정
      console.log(`이메일 코드 확인 요청: 이메일=${email}, 코드=${code}`);
      const response = await apiClient.post(`/email/verify-code?email=${email}&code=${code}`);
      console.log('인증 코드 확인 응답:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('인증 코드 확인 실패:', error);
      // 에러 응답이 있으면 메시지 추출 시도
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        console.error('서버 에러 응답:', error.response.data);
        throw new Error(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
      }
      throw error;
    }
  }
};

export default emailService; 