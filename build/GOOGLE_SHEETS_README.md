# Google Sheets Orders 데이터 다운로더

이 스크립트는 Google Sheets의 Orders 시트 데이터를 엑셀 파일로 다운로드하는 파이썬 프로그램입니다.

## 📋 기능

-   Google Sheets API를 통한 안전한 데이터 접근
-   Orders 시트의 모든 데이터를 엑셀 파일로 저장
-   타임스탬프가 포함된 파일명으로 저장
-   데이터 미리보기 및 통계 정보 제공

## 🚀 설치 및 설정

### 1. 필요한 라이브러리 설치

```bash
pip install -r requirements.txt
```

또는 개별 설치:

```bash
pip install pandas gspread google-auth openpyxl
```

### 2. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Google Sheets API 활성화:
    - "API 및 서비스" → "라이브러리" → "Google Sheets API" 검색 후 활성화

### 3. 서비스 계정 생성

1. "API 및 서비스" → "사용자 인증 정보" → "사용자 인증 정보 만들기" → "서비스 계정"
2. 서비스 계정 이름 입력 (예: "sheets-downloader")
3. "키 만들기" → "JSON" 선택
4. 다운로드된 JSON 파일을 `credentials.json`으로 이름 변경
5. `credentials.json` 파일을 이 스크립트와 같은 폴더에 저장

### 4. Google Sheets 권한 설정

1. 대상 Google Sheets 파일 열기
2. "공유" 버튼 클릭
3. `credentials.json` 파일의 `client_email` 값을 복사
4. 해당 이메일 주소를 편집자 권한으로 추가

## 📖 사용법

### 기본 실행

```bash
python google_sheets_downloader.py
```

### 실행 결과

성공적으로 실행되면 다음과 같은 정보가 출력됩니다:

```
🚀 Google Sheets Orders 데이터 다운로더
==================================================
📥 Orders 시트 데이터를 가져오는 중...
✅ 성공적으로 다운로드 완료!
📁 파일명: orders_data_20250108_143022.xlsx
📊 데이터 행 수: 150
📋 컬럼 수: 12

📋 데이터 미리보기:
   주문ID                    조리원ID    PIN  상품명  수량   단가     총액
0  order_1754656587413_16yd0lgq5  테스트  190293  엠보 손수건  2  36300  72600
1  order_1754656876162_ofa8guy97  테스트  190193  속싸개  4   4000  16000
...

🎉 작업이 완료되었습니다!
```

## 📁 출력 파일

-   파일명 형식: `orders_data_YYYYMMDD_HHMMSS.xlsx`
-   위치: 스크립트와 같은 폴더
-   형식: Excel 파일 (.xlsx)

## 🔧 문제 해결

### 1. credentials.json 파일이 없다는 오류

```
❌ credentials.json 파일이 없습니다!
```

**해결방법:**

-   Google Cloud Console에서 서비스 계정 키를 다운로드
-   파일명을 `credentials.json`으로 변경
-   스크립트와 같은 폴더에 저장

### 2. Orders 시트를 찾을 수 없다는 오류

```
❌ 'Orders' 시트를 찾을 수 없습니다!
```

**해결방법:**

-   Google Sheets 파일에 'Orders' 시트가 있는지 확인
-   시트명이 정확히 'Orders'인지 확인 (대소문자 구분)

### 3. 권한 오류

```
❌ 오류 발생: 403 Forbidden
```

**해결방법:**

-   Google Sheets 파일에 서비스 계정 이메일을 편집자로 추가
-   `credentials.json`의 `client_email` 값을 확인하여 올바른 이메일을 추가했는지 확인

### 4. 라이브러리 설치 오류

```
❌ 필요한 라이브러리가 설치되지 않았습니다!
```

**해결방법:**

```bash
pip install pandas gspread google-auth openpyxl
```

## 📊 데이터 구조

다운로드되는 데이터는 다음과 같은 컬럼을 포함합니다:

-   주문ID
-   조리원ID
-   PIN
-   상품명
-   수량
-   단가
-   총액
-   날짜
-   배송지
-   수취인
-   연락처

## 🔒 보안 주의사항

-   `credentials.json` 파일은 민감한 정보를 포함하므로 안전하게 보관
-   Git 등에 업로드하지 않도록 주의
-   필요시 `.gitignore`에 `credentials.json` 추가

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.


