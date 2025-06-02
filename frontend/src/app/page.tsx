'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import Link from 'next/link';
import { Bookmark, Category, Tag } from '@/types';
import categoryService from '@/api/categoryService';
import bookmarkService from '@/api/bookmarkService';


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
    loadUserCategories,
    getCategoryBookmarks
  } = useBookmarkStore();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIntegrated, setShowIntegrated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryBookmarks, setCategoryBookmarks] = useState<Bookmark[]>([]);
  const [isLoadingCategoryBookmarks, setIsLoadingCategoryBookmarks] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [publicSearchResults, setPublicSearchResults] = useState<Bookmark[]>([]);
  const [isSearchingPublic, setIsSearchingPublic] = useState(false);
  const [publicSearchError, setPublicSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
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
  
  // 카테고리 변경 시 해당 카테고리의 북마크 로드하는 useEffect 추가
  useEffect(() => {
    const fetchCategoryBookmarks = async () => {
      // 선택된 카테고리가 없으면 전체 북마크를 표시
      if (!activeCategory) {
        setCategoryBookmarks(userBookmarks);
        return;
      }
      
      try {
        setIsLoadingCategoryBookmarks(true);
        // 백엔드 API 직접 호출하여 카테고리에 할당된 북마크 가져오기
        const bookmarksData = await categoryService.getBookmarksByCategory(activeCategory);
        
        // API 응답을 프론트엔드 Bookmark 형식으로 변환
        const formattedBookmarks: Bookmark[] = bookmarksData.map(item => {
          // 태그 변환: 백엔드에서 tagNames 필드로 태그 정보가 전달됨
          const tagList: Tag[] = (item.tagNames || []).map(tag => ({
            id: tag.id || `tag-${tag.name || 'unknown'}-${Math.random()}`,
            name: tag.name || '무제 태그',
            userId: currentUser?.id || ''
          }));
          
          return {
            id: item.id,
            title: item.title,
            url: item.url,
            description: item.description || '',
            categoryId: item.categoryId || null,
            tagList: tagList,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            isFavorite: item.favorite || false, // 백엔드 favorite 필드를 isFavorite로 매핑
            userId: currentUser?.id || '',
            integrated: false
          };
        });
        
        setCategoryBookmarks(formattedBookmarks);
      } catch (error) {
        console.error('카테고리 북마크 로드 에러:', error);
        setCategoryBookmarks([]);
      } finally {
        setIsLoadingCategoryBookmarks(false);
      }
    };
    
    fetchCategoryBookmarks();
  }, [activeCategory, currentUser?.id, userBookmarks.length]); // userBookmarks.length 의존성 추가하여 북마크 로드 완료 후 실행
  
  // 내 북마크 검색 결과 계산
  const mySearchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    return userBookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(term) || 
      bookmark.url.toLowerCase().includes(term) ||
      (bookmark.description?.toLowerCase().includes(term) || false)
    );
  }, [searchTerm, userBookmarks]);

  // 공개 북마크 검색 (통합 모드일 때)
  useEffect(() => {
    if (!searchTerm.trim() || !showIntegrated) {
      setPublicSearchResults([]);
      setIsSearchingPublic(false);
      setPublicSearchError(null);
      return;
    }

    const searchPublic = async () => {
      const startTime = Date.now();
      try {
        setIsSearchingPublic(true);
        setPublicSearchError(null);
        
        // 공개 북마크 검색 API 시도
        let results;
        let isUsingFallback = false;
        
        try {
          results = await bookmarkService.searchAllBookmarks(searchTerm);
          console.log('공개 카테고리 검색 결과:', results);
        } catch (apiError: any) {
          console.error('공개 카테고리 검색 API 오류:', apiError);
          // API가 구현되지 않았거나 오류 발생 시 임시 처리
          if (apiError.response?.status === 500 || apiError.response?.status === 404) {
            console.warn('공개 카테고리 검색 API가 아직 구현되지 않았습니다. 기존 API를 사용합니다.');
            setPublicSearchError('공개 카테고리 검색 API 준비 중 (임시로 내 북마크 API 사용)');
            // 기존 검색 API 사용 (임시)
            results = await bookmarkService.searchBookmarks(searchTerm);
            isUsingFallback = true;
          } else {
            throw apiError;
          }
        }
        
        // 백엔드 응답을 프론트엔드 Bookmark 형식으로 변환
        const formattedResults: Bookmark[] = results.map(item => {
          const tagList: Tag[] = (item.tags || item.tagNames || []).map(tag => ({
            id: tag.id || `tag-${Math.random()}`,
            name: tag.name,
            userId: 'public' // 공개 북마크임을 표시
          }));

          return {
            id: `integrated-${item.id}`, // 통합 검색 북마크 ID에 접두사 추가하여 충돌 방지
            title: item.title,
            url: item.url,
            description: item.description || '',
            categoryId: item.categoryId || null,
            tagList: tagList,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            isFavorite: false, // 공개 북마크는 즐겨찾기 불가
            userId: 'public',
            integrated: true // 통합 검색 결과임을 표시
          };
        });
        
        setPublicSearchResults(formattedResults);
      } catch (error) {
        console.error('공개 북마크 검색 오류:', error);
        setPublicSearchResults([]);
        setPublicSearchError('공개 카테고리 검색 중 오류가 발생했습니다');
      } finally {
        // 최소 300ms 로딩 표시 후 종료 (깜빡임 방지)
        const elapsed = Date.now() - startTime;
        const minLoadTime = 300;
        if (elapsed < minLoadTime) {
          setTimeout(() => setIsSearchingPublic(false), minLoadTime - elapsed);
        } else {
          setIsSearchingPublic(false);
        }
      }
    };

    // 디바운싱을 위한 타이머
    const timer = setTimeout(searchPublic, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, showIntegrated]);

  // 최종 검색 결과 (통합 모드에 따라 다름)
  const searchResults = useMemo(() => {
    if (!showIntegrated) {
      return mySearchResults;
    }
    
    // 통합 모드: 내 북마크 + 공개 북마크 (중복 제거 없이 모두 표시)
    const combined = [...mySearchResults, ...publicSearchResults];
    
    return combined;
  }, [mySearchResults, publicSearchResults, showIntegrated]);

  // 검색 결과 표시 상태 관리
  useEffect(() => {
    if (!searchTerm.trim()) {
      setShowSearchResults(false);
    } else {
      setShowSearchResults(true);
    }
  }, [searchTerm]);

  // 검색 상태가 아닐 때만 카테고리 북마크 표시
  const filteredCategoryBookmarks = showSearchResults ? [] : categoryBookmarks;

  // 검색창 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleShareBookmark = async (bookmark: Bookmark) => {
    try {
      const shareLink = await createShareLink({ bookmarkId: bookmark.id });
      const fullShareUrl = `${window.location.origin}/share/${shareLink.uuid}`;
      
      if (!navigator.clipboard) {
        alert(`클립보드 API를 사용할 수 없습니다. 수동으로 복사해주세요: ${fullShareUrl}`);
        return;
      }
      
      navigator.clipboard.writeText(fullShareUrl)
        .then(() => {
          alert('북마크 링크가 클립보드에 복사되었습니다.');
        })
        .catch((error) => {
          alert(`북마크 링크: ${fullShareUrl} (수동으로 복사해주세요)`);
        });
    } catch (err) {
      alert('북마크 공유 링크 생성에 실패했습니다.');
    }
  };
  
  // 즐겨찾기 토글 함수 (categoryBookmarks 상태도 함께 업데이트)
  const handleToggleFavorite = async (bookmarkId: string) => {
    try {
      // 1. 스토어의 toggleFavorite 호출
      await toggleFavorite(bookmarkId);
      
      // 2. categoryBookmarks 상태도 업데이트
      setCategoryBookmarks(prevBookmarks => 
        prevBookmarks.map(bookmark => 
          bookmark.id === bookmarkId 
            ? { ...bookmark, isFavorite: !bookmark.isFavorite }
            : bookmark
        )
      );
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
    }
  };
  
  // 북마크 렌더링 함수
  const renderBookmarkItem = (bookmark: Bookmark) => (
    <div key={bookmark.id} className="flex items-center py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center flex-1">
        <button
          onClick={() => handleToggleFavorite(bookmark.id)}
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
          
          <div className="flex-1 relative" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">🔎</span>
            </div>
            <input
              type="text"
              placeholder="북마크 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm && setShowSearchResults(true)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
            />
            
            {/* 검색 결과 드롭다운 */}
            {showSearchResults && searchTerm && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                {/* 로딩 표시 */}
                {isSearchingPublic && showIntegrated && (
                  <div className="p-3 border-b border-gray-100 bg-blue-50">
                    <div className="flex items-center text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                      공개 카테고리 검색 중...
                    </div>
                  </div>
                )}
                
                {/* 에러 표시 */}
                {publicSearchError && showIntegrated && (
                  <div className="p-3 border-b border-gray-100 bg-yellow-50">
                    <div className="flex items-center text-sm text-yellow-700">
                      <span className="mr-2">⚠️</span>
                      {publicSearchError}
                    </div>
                  </div>
                )}
                
                {/* 검색 모드 표시 */}
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs text-gray-600">
                    {showIntegrated ? '📊 통합 검색: 내 북마크 + 공개 카테고리' : '👤 내 북마크만 검색'}
                  </p>
                </div>

                {searchResults.length === 0 && !isSearchingPublic ? (
                  <div className="p-4 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((bookmark) => (
                      <div key={`${bookmark.id}-${bookmark.userId}`} className="px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <a 
                                href={bookmark.url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-800 hover:text-blue-600 font-medium block truncate"
                                onClick={() => setShowSearchResults(false)}
                              >
                                {bookmark.title}
                              </a>
                              {bookmark.integrated && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  공개 카테고리
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{bookmark.url}</p>
                            {bookmark.description && (
                              <p className="text-xs text-gray-400 truncate mt-1">{bookmark.description}</p>
                            )}
                          </div>
                          <div className="flex ml-2 space-x-1">
                            {/* 내 북마크만 즐겨찾기와 편집 가능 */}
                            {!bookmark.integrated && (
                              <>
                                <button
                                  onClick={() => handleToggleFavorite(bookmark.id)}
                                  className="p-1 text-sm"
                                >
                                  {bookmark.isFavorite ? (
                                    <span className="text-yellow-400">★</span>
                                  ) : (
                                    <span className="text-gray-300">☆</span>
                                  )}
                                </button>
                                <Link
                                  href={`/bookmark/edit/${bookmark.id}`}
                                  className="p-1 text-gray-600 hover:text-gray-900 text-sm"
                                  onClick={() => setShowSearchResults(false)}
                                >
                                  ✎
                                </Link>
                              </>
                            )}
                            {/* 공개 카테고리 북마크는 복사 버튼만 */}
                            {bookmark.integrated && (
                              <button
                                onClick={() => {
                                  // 공개 카테고리 북마크를 내 북마크로 복사하는 기능 (추후 구현 가능)
                                  navigator.clipboard.writeText(bookmark.url);
                                  alert('URL이 클립보드에 복사되었습니다.');
                                }}
                                className="p-1 text-gray-600 hover:text-gray-900 text-sm"
                                title="URL 복사"
                              >
                                📋
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 검색 결과 닫기 버튼 */}
                <div className="p-2 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    검색 결과 닫기
                  </button>
                </div>
              </div>
            )}
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
          {showSearchResults ? (
            <div className="py-6 text-center text-gray-500">
              <p>검색창 위에 검색 결과를 확인하세요.</p>
            </div>
          ) : filteredCategoryBookmarks.length === 0 ? (
            <div className="py-6 text-center text-gray-500">
              {currentUser ? (
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
