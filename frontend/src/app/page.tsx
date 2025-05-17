'use client';

import { useState, useEffect } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import Link from 'next/link';
import { Bookmark, Category } from '@/types';

export default function Home() {
  const { 
    bookmarks, 
    categories, 
    toggleFavorite, 
    deleteBookmark, 
    createShareLink,
    currentUser,
    getUserBookmarks,
    getUserCategories,
    loadUserBookmarks,
    loadUserCategories
  } = useBookmarkStore();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIntegrated, setShowIntegrated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // 컴포넌트 마운트 시 백엔드에서 북마크 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (currentUser) {
          await loadUserBookmarks();
          await loadUserCategories();
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, loadUserBookmarks, loadUserCategories]);
  
  // 사용자의 북마크와 카테고리 가져오기
  const userBookmarks = getUserBookmarks();
  const userCategories = getUserCategories();
  
  // 즐겨찾기 북마크
  const favoriteBookmarks = userBookmarks
    .filter(b => b.isFavorite)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // 최근 추가된 북마크
  const recentBookmarks = [...userBookmarks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  
  // 카테고리별 북마크
  const categoryBookmarks = activeCategory 
    ? userBookmarks.filter(bookmark => {
        const category = userCategories.find(c => c.id === activeCategory);
        if (!category) return false;
        
        return bookmark.tagList.some(bookmarkTag => 
          category.tagList.some(categoryTag => categoryTag.id === bookmarkTag.id)
        );
      })
    : userBookmarks;
  
  // 검색 필터링된 북마크
  const filteredCategoryBookmarks = categoryBookmarks.filter(bookmark => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
  return (
      bookmark.title.toLowerCase().includes(term) || 
      bookmark.url.toLowerCase().includes(term) ||
      (bookmark.description?.toLowerCase().includes(term) || false)
    );
  });
  
  const handleShareBookmark = (bookmark: Bookmark) => {
    const shareLink = createShareLink({ bookmarkId: bookmark.id });
    const fullShareUrl = `${window.location.origin}/share/${shareLink.uuid}`;
    
    if (!navigator.clipboard) {
      alert(`클립보드 API를 사용할 수 없습니다. 수동으로 복사해주세요: ${fullShareUrl}`);
      return;
    }
    
    try {
      navigator.clipboard.writeText(fullShareUrl)
        .then(() => {
          alert('북마크 링크가 클립보드에 복사되었습니다.');
        })
        .catch((error) => {
          console.error('클립보드 복사 실패:', error);
          alert(`북마크 링크: ${fullShareUrl} (수동으로 복사해주세요)`);
        });
    } catch (err) {
      console.error('클립보드 API 오류:', err);
      alert(`북마크 링크: ${fullShareUrl} (수동으로 복사해주세요)`);
    }
  };
  
  // 북마크 렌더링 함수
  const renderBookmarkItem = (bookmark: Bookmark) => (
    <div key={bookmark.id} className="flex items-center py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center flex-1">
        <button
          onClick={() => toggleFavorite(bookmark.id)}
          className="mr-3 w-6 h-6 flex items-center justify-center"
        >
          {bookmark.isFavorite ? (
            <span key={`fav-star-${bookmark.id}`} className="text-yellow-400 text-xl">★</span>
          ) : (
            <span key={`fav-star-empty-${bookmark.id}`} className="text-gray-300 text-xl">☆</span>
          )}
        </button>
        <div className="flex-1 truncate">
          <a 
            href={bookmark.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 hover:underline font-medium block truncate font-['Poppins']"
          >
            {bookmark.title}
          </a>
        </div>
      </div>
      <div className="flex ml-2">
        <Link
          key={`edit-${bookmark.id}`}
          href={`/bookmark/edit/${bookmark.id}`}
          className="p-1.5 text-gray-600 hover:text-gray-900"
          title="수정"
        >
          ✎
        </Link>
        <button
          key={`share-${bookmark.id}`}
          onClick={() => handleShareBookmark(bookmark)}
          className="p-1.5 text-gray-600 hover:text-gray-900 mx-1"
          title="링크 복사"
        >
          🔗
        </button>
        <button
          key={`delete-${bookmark.id}`}
          onClick={() => {
            if (window.confirm(`"${bookmark.title}" 북마크를 삭제하시겠습니까?`)) {
              deleteBookmark(bookmark.id);
            }
          }}
          className="p-1.5 text-gray-600 hover:text-red-600"
          title="삭제"
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full font-['Poppins']">
      {/* 헤더 - 그레이 톤으로 변경 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6 shadow-sm">
        {/* 검색 및 버튼 영역 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <span className="mr-2 text-gray-700 font-medium">통합</span>
            <label className="inline-flex items-center cursor-pointer">
              <div 
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                  showIntegrated ? 'bg-green-500' : 'bg-gray-200'
                }`}
                onClick={() => setShowIntegrated(!showIntegrated)}
              >
                <div 
                  className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                    showIntegrated ? 'translate-x-5' : ''
                  }`}
                ></div>
              </div>
            </label>
          </div>
          
          <Link
            href="/bookmark/add"
            className="px-3 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-800 flex items-center justify-center"
          >
            <span className="text-lg font-bold">+</span>
            <span className="ml-1">북마크 추가</span>
          </Link>
          
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">🔎</span>
            </div>
            <input
              type="text"
              placeholder="북마크 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
            />
          </div>
        </div>
      </div>
      
      {/* 로딩 표시기 */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-gray-700">북마크를 불러오는 중...</span>
        </div>
      )}
      
      {/* 로그인 안된 경우 로그인 권장 메시지 */}
      {!currentUser && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-amber-800">
            북마크와 카테고리를 관리하려면 <Link href="/login" className="font-bold underline">로그인</Link>이 필요합니다.
          </p>
        </div>
      )}
      
      {/* 북마크 데이터 없음 표시 */}
      {!isLoading && currentUser && userBookmarks.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
          <p className="text-blue-800 mb-3 font-medium text-lg">북마크가 없습니다</p>
          <p className="text-blue-700 mb-4">북마크를 추가하여 사이트를 저장하고 관리할 수 있습니다.</p>
          <Link
            href="/bookmark/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
          >
            첫 북마크 추가하기
          </Link>
        </div>
      )}
      
      {/* 메인 콘텐츠 영역 - 북마크가 있을 경우에만 표시 */}
      {!isLoading && userBookmarks.length > 0 && (
        <>
      {/* 메인 콘텐츠 영역 - 좌우 분할 (그레이 톤으로 변경) */}
      <div className="flex gap-6 mb-6">
        {/* 좌측 - 즐겨찾기 */}
        <div className="w-1/2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <h2 className="font-bold flex items-center font-['Montserrat']">
              <span className="mr-2 text-yellow-400">⭐</span>
              즐겨찾기
            </h2>
          </div>
          
          <div className="p-2">
            {favoriteBookmarks.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                {currentUser ? '즐겨찾기한 북마크가 없습니다.' : '로그인 후 이용할 수 있습니다.'}
              </div>
            ) : (
              favoriteBookmarks.map(renderBookmarkItem)
            )}
          </div>
        </div>
        
        {/* 우측 - 최근 추가된 북마크 */}
        <div className="w-1/2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <h2 className="font-bold flex items-center font-['Montserrat']">
              <span className="mr-2 text-blue-400">⏱️</span>
              최근 추가된 북마크
            </h2>
          </div>
          
          <div className="p-2">
            {recentBookmarks.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                {currentUser ? '최근 추가된 북마크가 없습니다.' : '로그인 후 이용할 수 있습니다.'}
              </div>
            ) : (
              recentBookmarks.map(renderBookmarkItem)
            )}
          </div>
        </div>
      </div>
      
      {/* 카테고리 탭 영역 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-3 font-medium whitespace-nowrap ${
                activeCategory === null
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              전체
            </button>
            
            {userCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-3 font-medium whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'border-b-2 border-amber-500 text-amber-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {category.title}
              </button>
            ))}
            
            <Link
              href="/category/add"
              className="px-4 py-3 text-gray-500 hover:text-gray-700 whitespace-nowrap flex items-center"
            >
              <span className="mr-1">+</span>
              카테고리 추가
            </Link>
          </div>
        </div>
        
        <div className="p-4">
          {filteredCategoryBookmarks.length === 0 ? (
            <div className="py-6 text-center text-gray-500">
              {searchTerm ? (
                <p>검색 결과가 없습니다.</p>
              ) : currentUser ? (
                <div>
                  <p className="mb-2">북마크가 없습니다.</p>
                  <Link 
                    href="/bookmark/add" 
                    className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                  >
                    북마크 추가하기
                  </Link>
                </div>
              ) : (
                <p>로그인 후 이용할 수 있습니다.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCategoryBookmarks.map(renderBookmarkItem)}
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
