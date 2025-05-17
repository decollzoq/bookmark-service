# 북마크 서비스

이 프로젝트는 북마크 서비스의 프론트엔드(Next.js)와 백엔드(Spring Boot) 코드를 포함합니다.

## 프로젝트 구조

```
/
├── frontend/            # Next.js 프론트엔드
│   ├── src/             # 소스 코드
│   │   ├── api/         # API 클라이언트 및 서비스
│   │   ├── app/         # Next.js 앱 라우터
│   │   ├── components/  # 리액트 컴포넌트
│   │   └── ...
│   └── ...
├── server/              # Spring Boot 백엔드
│   ├── src/             # 소스 코드
│   │   ├── main/java    # 자바 코드
│   │   └── ...
│   └── ...
└── ...
```

## 필수 요구사항

### 백엔드 실행 요구사항

- Java 17 이상
- Gradle

### 프론트엔드 실행 요구사항

- Node.js 18 이상
- npm 또는 yarn

## 설치 및 실행 방법

### 백엔드 설치 및 실행

1. Java 설치
   - [Java 다운로드](https://www.oracle.com/java/technologies/downloads/) 또는 OpenJDK 설치

2. 백엔드 실행
   ```bash
   cd server
   ./gradlew bootRun
   ```
   - Windows에서는 `./gradlew.bat bootRun` 명령어 사용

3. 기본적으로 백엔드 서버는 http://localhost:8080 에서 실행됩니다.

### 프론트엔드 설치 및 실행

1. 의존성 설치
   ```bash
   cd frontend
   npm install
   ```

2. 개발 서버 실행
   ```bash
   npm run dev
   ```

3. 프론트엔드는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 환경 변수 설정

### 프론트엔드 환경 변수

`frontend/.env.local` 파일에 다음과 같이 설정합니다:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## API 문서

주요 API 엔드포인트는 다음과 같습니다:

### 인증 API

- POST `/auth/login`: 로그인
- POST `/auth/reissue`: 토큰 재발급
- POST `/users/register`: 회원가입

### 북마크 API

- GET `/api/bookmarks`: 모든 북마크 조회
- POST `/api/bookmarks`: 북마크 생성
- PUT `/api/bookmarks/{id}`: 북마크 수정
- DELETE `/api/bookmarks/{id}`: 북마크 삭제
- PATCH `/api/bookmarks/{id}/favorite`: 북마크 즐겨찾기 토글

### 카테고리 API

- GET `/api/categories`: 모든 카테고리 조회
- POST `/api/categories`: 카테고리 생성
- PUT `/api/categories/{id}`: 카테고리 수정
- DELETE `/api/categories/{id}`: 카테고리 삭제
- GET `/api/categories/{id}/bookmarks`: 카테고리에 포함된 북마크 조회

### 태그 API

- GET `/api/tags`: 모든 태그 조회
- POST `/api/tags`: 태그 생성
- PUT `/api/tags/{id}`: 태그 수정
- DELETE `/api/tags/{id}`: 태그 삭제 