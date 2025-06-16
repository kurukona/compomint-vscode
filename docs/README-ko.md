# Compomint VSCode 확장 프로그램 문서

## 개요

Compomint VSCode 확장 프로그램은 Compomint 템플릿 기반 컴포넌트 엔진을 위한 종합적인 개발 도구입니다. 이 확장 프로그램은 템플릿 작성, 미리보기, 검증을 쉽게 할 수 있도록 도와줍니다.

## 프로젝트 정보

- **이름**: compomint-vscode
- **표시 이름**: Compomint Template Support
- **버전**: 0.1.0
- **퍼블리셔**: compomint
- **라이선스**: MIT
- **최소 VSCode 버전**: 1.60.0

## 주요 기능

### 1. 구문 강조 (Syntax Highlighting)

Compomint의 특수 템플릿 구문이 HTML 파일에서 아름답게 강조되어 복잡한 컴포넌트를 쉽게 읽고 탐색할 수 있습니다.

#### 지원되는 Compomint 표현식:
- `##=` - 데이터 보간 (interpolation)
- `##-` - HTML 이스케이프 출력
- `##%` - 엘리먼트 삽입
- `##!` - 사전 평가 블록
- `##` - JavaScript 코드 블록
- `###` - 지연 평가 블록
- `##*` - 주석

#### 지원되는 Compomint 속성:
- `data-co-event` - 이벤트 핸들러
- `data-co-named-element` - 명명된 엘리먼트 참조
- `data-co-element-ref` - 엘리먼트 변수 참조
- `data-co-props` - 엘리먼트 속성
- `data-co-load` - 로드 핸들러

### 2. 지능형 코드 완성 (IntelliSense)

타이핑하는 동안 지능적인 제안을 제공합니다:

- Compomint 표현식 및 속성
- 컴포넌트 속성 및 메서드
- 이벤트 핸들러
- 속성 값

트리거 문자: `#`

### 3. 코드 스니펫 (Snippets)

20개 이상의 신중하게 제작된 스니펫으로 개발을 가속화합니다:

| 접두사 | 설명 |
|--------|------|
| `co-template` | 기본 템플릿 구조 |
| `co-template-full` | 모든 섹션이 포함된 포괄적인 템플릿 |
| `co-button` | 버튼 컴포넌트 템플릿 |
| `co-input` | 입력 컴포넌트 템플릿 |
| `co-modal` | 모달 컴포넌트 템플릿 |
| `co-=` | 데이터 보간 |
| `co--` | HTML 이스케이프 |
| `co-%` | 엘리먼트 삽입 |
| `co-!` | 사전 평가 블록 |
| `co-js` | JavaScript 코드 블록 |
| `co-#` | 지연 평가 블록 |
| `co-*` | 주석 |
| `co-if` | if 문 |
| `co-if-else` | if-else 문 |
| `co-foreach` | forEach 루프 |
| `co-event` | 이벤트 핸들러 속성 |
| `co-named-element` | 명명된 엘리먼트 참조 |
| `co-element-ref` | 엘리먼트 변수 참조 |
| `co-i18n` | i18n 정의 |

### 4. 실시간 템플릿 미리보기

VSCode를 떠나지 않고 실시간으로 Compomint 템플릿을 미리보기할 수 있습니다:

- 템플릿의 즉각적인 렌더링 확인
- 템플릿 데이터 편집 및 즉시 결과 확인
- 다양한 데이터 값으로 컴포넌트 테스트
- 문제를 빠르게 디버그

#### 사용 방법:
1. Compomint 템플릿이 포함된 HTML 파일 열기
2. 명령 팔레트에서 "Compomint: Preview Template" 실행
3. JSON 편집기에서 템플릿 데이터 편집
4. "Render Template" 클릭하여 업데이트

### 5. 템플릿 검증

문제가 발생하기 전에 오류를 감지합니다:

- 중복 템플릿 ID 감지
- 스타일 ID 검증
- 불균형 구분자 감지
- 저장 시 자동 검증 (설정 가능)

### 6. 템플릿 생성기

새 템플릿을 즉시 생성합니다:

- 여러 템플릿 유형 지원:
  - 기본 템플릿
  - 버튼 컴포넌트
  - 입력 컴포넌트
  - 모달 컴포넌트
  - 포괄적인 템플릿
- 필요한 모든 섹션이 포함된 적절한 컴포넌트 구조
- 내장된 모범 사례
- 사용자 정의 가능한 템플릿 접두사

#### 사용 방법:
1. 명령 팔레트 열기 (Ctrl+Shift+P / Cmd+Shift+P)
2. "Compomint: Create New Template" 실행
3. 컴포넌트 이름 입력
4. 템플릿 유형 선택
5. 템플릿이 현재 커서 위치에 삽입되거나 새 파일에 생성됨

## 명령어

| 명령어 | 설명 |
|--------|------|
| `Compomint: Preview Template` | 현재 템플릿 미리보기 |
| `Compomint: Validate Template` | 현재 문서의 템플릿 검증 |
| `Compomint: Create New Template` | 새 Compomint 템플릿 생성 |

## 확장 프로그램 설정

| 설정 | 설명 | 기본값 |
|------|------|--------|
| `compomint.validateOnSave` | 저장 시 Compomint 템플릿 검증 | `true` |

## 기술적 구현

### 주요 컴포넌트

1. **CompomintCompletionProvider**: IntelliSense 기능 제공
   - 트리거 문자 '#'에 반응
   - Compomint 표현식 및 속성에 대한 완성 제안

2. **CompomintHoverProvider**: 호버 정보 제공
   - Compomint 표현식에 대한 문서 표시
   - 속성 설명 제공

3. **템플릿 미리보기 시스템**:
   - WebView 패널 사용
   - CDN에서 Compomint 라이브러리 로드
   - 실시간 템플릿 렌더링
   - 오류 처리 및 표시

4. **템플릿 검증 시스템**:
   - 진단 컬렉션 사용
   - 중복 ID 검사
   - 구분자 균형 검사
   - 저장 시 자동 검증

5. **템플릿 생성기**:
   - 5가지 템플릿 유형 지원
   - 사용자 정의 가능한 접두사
   - 적절한 구조와 모범 사례

### 파일 구조

```
compomint-vscode/
├── src/
│   └── extension.ts          # 메인 확장 프로그램 코드
├── syntaxes/
│   └── compomint.tmLanguage.json  # 구문 강조 정의
├── snippets/
│   └── compomint-snippets.json    # 코드 스니펫
├── images/                   # 아이콘 및 이미지
├── package.json             # 확장 프로그램 매니페스트
├── tsconfig.json           # TypeScript 설정
└── webpack.config.js       # Webpack 번들링 설정
```

### 활성화 이벤트

확장 프로그램은 다음 경우에 활성화됩니다:
- HTML 파일을 열 때 (`onLanguage:html`)
- 미리보기 명령 실행 시 (`onCommand:compomint.previewTemplate`)

### 의존성

**런타임 의존성**:
- `cheerio`: HTML 파싱 및 조작

**개발 의존성**:
- TypeScript 및 관련 타입
- ESLint 및 TypeScript ESLint 플러그인
- Webpack 및 ts-loader
- VSCode 테스트 도구

## 개발 및 빌드

### 개발 환경 설정

1. 저장소 클론:
   ```bash
   git clone https://github.com/kurukona/compomint-vscode.git
   cd compomint-vscode
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 모드 실행:
   ```bash
   npm run watch
   ```

4. F5를 눌러 확장 프로그램 디버깅 시작

### 빌드 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run compile` | TypeScript 컴파일 |
| `npm run watch` | 개발 모드 (자동 재컴파일) |
| `npm run package` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |
| `npm run test` | 테스트 실행 |

### 배포

확장 프로그램은 다음 방법으로 배포할 수 있습니다:

1. **VS Code Marketplace**: 
   - `vsce` 도구를 사용하여 패키징 및 게시

2. **VSIX 파일**:
   - `vsce package` 명령으로 VSIX 파일 생성
   - 사용자가 수동으로 설치 가능

## 주요 기능 상세

### Compomint 표현식 지원

확장 프로그램은 모든 Compomint 표현식을 지원합니다:

1. **데이터 보간** (`##=`):
   - JavaScript 표현식의 값을 출력
   - 예: `##=data.title##`

2. **HTML 이스케이프** (`##-`):
   - HTML 이스케이프된 값 출력
   - 예: `##-data.htmlContent##`

3. **엘리먼트 삽입** (`##%`):
   - 컴포넌트, HTML 엘리먼트 또는 문자열 삽입
   - 예: `##%childComponent##`

4. **사전 평가** (`##!`):
   - 템플릿 로드 시 한 번 실행
   - i18n 정의 등에 사용
   - 예: `##! compomint.addI18ns({...}) ##`

5. **지연 평가** (`###`):
   - DOM 삽입 후 실행
   - 초기화 코드에 사용
   - 예: `### console.log('Rendered') ##`

6. **JavaScript 블록** (`##`):
   - 렌더링 중 JavaScript 코드 실행
   - 예: `## let x = 10; ##`

7. **주석** (`##*`):
   - 렌더링된 출력에 포함되지 않는 주석
   - 예: `##* TODO: Add validation ##`

### Compomint 속성 지원

1. **이벤트 핸들러** (`data-co-event`):
   - HTML 엘리먼트에 이벤트 핸들러 연결
   - 예: `data-co-event="##:{click: handleClick}##"`

2. **명명된 엘리먼트** (`data-co-named-element`):
   - 템플릿 스코프에서 엘리먼트에 대한 참조 생성
   - 예: `data-co-named-element="##:'myInput'##"`

3. **엘리먼트 참조** (`data-co-element-ref`):
   - DOM 엘리먼트를 변수에 바인딩
   - 예: `data-co-element-ref="##:inputRef##"`

4. **속성** (`data-co-props`):
   - 엘리먼트에 여러 속성 설정
   - 예: `data-co-props="##:{class: 'active', disabled: true}##"`

5. **로드 핸들러** (`data-co-load`):
   - 엘리먼트가 DOM에 로드될 때 함수 실행
   - 예: `data-co-load="##:initElement##"`

## 향후 계획

- Language Server Protocol (LSP) 구현
- 컴포넌트 의존성 그래프 시각화
- 컴포넌트 문서 자동 생성
- 성능 최적화 제안
- 테스트 템플릿 생성

## 문제 해결

### 일반적인 문제

1. **구문 강조가 작동하지 않음**:
   - HTML 파일인지 확인
   - 확장 프로그램이 활성화되었는지 확인

2. **미리보기가 표시되지 않음**:
   - 파일에 `<template>` 태그가 있는지 확인
   - 템플릿에 유효한 ID가 있는지 확인

3. **코드 완성이 작동하지 않음**:
   - `#` 문자를 입력하여 트리거
   - HTML 파일인지 확인

## 기여하기

기여를 환영합니다! Pull Request를 제출해 주세요.

## 라이선스

이 확장 프로그램은 MIT 라이선스로 배포됩니다.