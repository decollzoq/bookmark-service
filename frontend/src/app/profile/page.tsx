'use client';

import { useState, useEffect } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { FaPencilAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, deleteAccount } = useBookmarkStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info', text: string }>({ type: '' as any, text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');

  // 사용자 정보 불러오기
  useEffect(() => {
    if (currentUser) {
      // localStorage에서 저장된 이메일 가져오기
      const storedEmail = localStorage.getItem('userEmail');

      setUsername(currentUser.username);
      
      // 저장된 이메일이 있으면 그것을 사용, 없으면 currentUser.email 사용
      setEmail(storedEmail || currentUser.email);
      setNewUsername(currentUser.username);
    }
  }, [currentUser]);

  // 닉네임 변경 시작
  const handleEditUsername = () => {
    setIsEditingUsername(true);
  };

  // 닉네임 변경 취소
  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setNewUsername(username);
  };

  // 닉네임 변경 제출
  const handleSubmitUsername = async () => {
    if (!newUsername.trim()) {
      setMessage({ type: 'error', text: '닉네임은 비워둘 수 없습니다.' });
      return;
    }

    setIsLoading(true);
    try {
      // 백엔드 API 호출 제거, 로컬 상태만 업데이트
      setUsername(newUsername);
      setIsEditingUsername(false);
      setMessage({ type: 'success', text: '닉네임이 성공적으로 변경되었습니다.' });
      
      // 현재 사용자 정보 업데이트
      useBookmarkStore.setState((state) => ({
        currentUser: {
          ...state.currentUser!,
          username: newUsername
        }
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 변경 제출
  const handleSubmitPasswordChange = async () => {
    // 유효성 검사
    if (!currentPassword) {
      setMessage({ type: 'error', text: '현재 비밀번호를 입력해주세요.' });
      return;
    }
    if (!newPassword) {
      setMessage({ type: 'error', text: '새 비밀번호를 입력해주세요.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setIsLoading(true);
    try {
      // 백엔드 API 구현이 없으므로 임시 메시지만 표시
      setMessage({ type: 'info', text: '현재 백엔드 API가 준비되지 않아 비밀번호를 변경할 수 없습니다.' });
      
      // 상태 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 계정 탈퇴 실행
  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      setMessage({ type: 'error', text: '비밀번호를 입력해주세요.' });
      return;
    }

    if (!window.confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다.')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteAccount(deleteAccountPassword);
      
      // 계정 탈퇴 성공 시 홈 페이지로 리다이렉트
      router.push('/');
    } catch (error: any) {
      setMessage({ type: 'error', text: `계정 탈퇴 실패: ${error.message}` });
      setShowDeleteAccountModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="mb-4">회원정보를 보려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">회원정보</h1>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'error' 
            ? 'bg-red-100 text-red-700' 
            : message.type === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              이메일
            </label>
            <div className="bg-gray-100 p-3 rounded">{email}</div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              닉네임
            </label>
            
            {isEditingUsername ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="border border-gray-300 rounded p-2 mr-2 flex-grow"
                  placeholder="새 닉네임"
                />
                <button
                  onClick={handleSubmitUsername}
                  disabled={isLoading}
                  className="bg-green-500 text-white p-2 rounded-full mr-2"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={handleCancelEditUsername}
                  className="bg-red-500 text-white p-2 rounded-full"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="bg-gray-100 p-3 rounded flex-grow">{username}</div>
                <button
                  onClick={handleEditUsername}
                  className="ml-2 text-gray-600 hover:text-blue-600"
                >
                  <FaPencilAlt />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">비밀번호 변경</h2>
          
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 mb-4"
          >
            비밀번호 변경하기
          </button>
          
          {isChangingPassword && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border border-gray-300 rounded p-2 w-full"
                  placeholder="현재 비밀번호"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border border-gray-300 rounded p-2 w-full"
                  placeholder="새 비밀번호 (6자 이상)"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-gray-300 rounded p-2 w-full"
                  placeholder="새 비밀번호 확인"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setIsChangingPassword(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitPasswordChange}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  변경하기
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 회원 탈퇴 섹션 추가 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">계정 탈퇴</h2>
          
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <p className="text-red-700 mb-4">
              계정을 탈퇴하면 모든 북마크, 카테고리, 태그 등 사용자 데이터가 즉시 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
            
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              계정 탈퇴하기
            </button>
          </div>
        </div>
      </div>
      
      {/* 계정 탈퇴 모달 */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">계정 탈퇴</h3>
            
            <p className="mb-4 text-red-600">
              정말로 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 즉시 삭제됩니다.
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="border border-gray-300 rounded p-2 w-full"
                placeholder="현재 비밀번호 입력"
              />
              <p className="text-sm text-gray-500 mt-1">
                계정 탈퇴를 진행하려면 현재 비밀번호를 입력하세요.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPassword('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                {isLoading ? '처리 중...' : '계정 탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 