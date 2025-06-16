# Compomint VS Code Extension - 이미지 생성 가이드

## 📸 스크린샷 생성 방법

### 1. HTML 데모 파일 사용
`generate-images.html` 파일을 브라우저에서 열어서 각 섹션을 스크린샷으로 캡처할 수 있습니다.

### 2. 필요한 이미지들

#### 📋 overview.png (추천 크기: 800x600)
- HTML 파일의 `#overview` 섹션을 캡처
- 확장 기능의 전체적인 개요를 보여주는 이미지

#### 🌈 syntax-highlighting.gif (추천 크기: 800x400) 
- HTML 파일의 `#syntax-highlighting` 섹션을 캡처
- Compomint 구문 강조 기능을 보여주는 이미지

#### 👁️ template-preview.gif (추천 크기: 800x500)
- HTML 파일의 `#template-preview` 섹션을 캡처  
- 템플릿 미리보기 기능을 보여주는 이미지

#### ⚠️ validation.png (추천 크기: 800x400)
- HTML 파일의 `#validation` 섹션을 캡처
- 템플릿 유효성 검사 기능을 보여주는 이미지

### 3. 브라우저 스크린샷 도구 사용법

#### Chrome/Edge:
1. F12 개발자 도구 열기
2. Console 탭에서 다음 코드 실행:
```javascript
// 특정 섹션만 캡처하기 위한 스타일 조정
document.querySelectorAll('.demo-container').forEach((el, i) => {
    if (i !== 0) el.style.display = 'none'; // 첫 번째만 표시
});
```

#### Firefox:
1. 주소창에 `about:debugging` 입력
2. "이 Firefox" → "전체 페이지 스크린샷" 사용

### 4. 온라인 도구 사용 (권장)

다음 온라인 도구들을 사용하여 HTML을 이미지로 변환할 수 있습니다:

- **HTML/CSS to Image API**: htmlcsstoimage.com
- **URL to Image**: urltoimage.com  
- **Web Screenshot**: web-capture.net

### 5. 스크린샷 최적화

캡처 후 다음과 같이 최적화하세요:

```bash
# PNG 최적화 (optional)
pngquant --quality=80-95 image.png

# GIF 최적화 (optional) 
gifsicle -O3 --lossy=80 image.gif
```

### 6. 파일 저장 위치

생성된 이미지들을 다음 위치에 저장하세요:

```
images/
├── overview.png
├── syntax-highlighting.gif  
├── template-preview.gif
└── validation.png
```

### 7. README.md 업데이트

이미지 생성 후 README.md에서 플레이스홀더 텍스트를 이미지 링크로 교체하세요:

```markdown
![Overview](images/overview.png)
![Syntax Highlighting](images/syntax-highlighting.gif)
![Template Preview](images/template-preview.gif)
![Validation](images/validation.png)
```

## 🎨 대안: 이미지 없이 배포

이미지 생성이 어려운 경우, 현재 상태의 텍스트 설명만으로도 마켓플레이스에 배포할 수 있습니다. 추후 업데이트를 통해 이미지를 추가할 수 있습니다.

## 📝 참고사항

- 이미지 파일 크기는 각각 200KB 이하로 유지하는 것을 권장합니다
- GIF 파일은 실제 기능 동작을 보여주는 애니메이션이 효과적입니다
- VS Code의 다크 테마 색상을 사용하여 일관성을 유지하세요