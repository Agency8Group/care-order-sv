# 조리원 주문 시스템 - 기술 문서

## 개요

조리원 주문 시스템은 Google Apps Script를 백엔드로, HTML/JavaScript를 프론트엔드로 구성된 웹 기반 주문 관리 시스템입니다. 조리원별 예산 관리, 주문 처리, 배송 정보 관리 기능을 제공합니다.

## 시스템 아키텍처

### 백엔드 (Google Apps Script)

-   **언어**: JavaScript (Google Apps Script)
-   **데이터베이스**: Google Sheets
-   **배포**: Google Apps Script 웹 앱
-   **API**: RESTful API (GET 요청 기반)

### 프론트엔드 (HTML/JavaScript)

-   **언어**: HTML5, CSS3, JavaScript (ES6+)
-   **배포**: 정적 웹 호스팅 (Netlify 등)
-   **통신**: Fetch API, JSONP
-   **UI**: 반응형 웹 디자인

## 데이터베이스 구조

### Account 시트 (1번 시트)

| 열  | 필드명     | 타입   | 설명                    |
| --- | ---------- | ------ | ----------------------- |
| 1   | 조리원ID   | String | 고유 식별자             |
| 2   | PIN        | String | 인증 번호               |
| 3   | 월배정금액 | Number | 기본 월 예산            |
| 4   | 마스터금액 | Number | 관리자 전용 예산 (우선) |
| 5   | 배송지     | String | 기본 배송 주소          |
| 6   | 수취인     | String | 수취인 이름             |
| 7   | 연락처     | String | 연락처 정보             |

### Orders 시트 (2번 시트)

| 열  | 필드명   | 타입     | 설명                  |
| --- | -------- | -------- | --------------------- |
| 1   | 주문ID   | String   | 고유 주문 번호        |
| 2   | 조리원ID | String   | 주문자 식별자         |
| 3   | PIN      | String   | 주문 시점 PIN         |
| 4   | 상품명   | String   | 주문 상품명           |
| 5   | 수량     | Number   | 주문 수량             |
| 6   | 단가     | Number   | 상품 단가             |
| 7   | 총액     | Number   | 수량 × 단가           |
| 8   | 날짜     | DateTime | 주문 일시 (한국 시간) |
| 9   | 배송지   | String   | 배송 주소             |
| 10  | 수취인   | String   | 수취인 이름           |
| 11  | 연락처   | String   | 연락처 정보           |

## API 엔드포인트

### 1. 로그인 (action=login)

```javascript
// 요청
{
  "userId": "조리원ID",
  "pin": "PIN번호"
}

// 응답
{
  "status": "success",
  "user": {
    "userId": "조리원ID",
    "pin": "PIN번호",
    "monthlyBudget": 100000,
    "masterBudget": null,
    "deliveryAddress": "배송지",
    "recipient": "수취인",
    "phone": "연락처"
  },
  "budget": {
    "totalBudget": 100000,
    "monthlyTotal": 0,
    "remainingBudget": 100000,
    "isMasterBudget": false,
    "monthlyBudget": 100000,
    "masterBudget": null
  }
}
```

### 2. 주문 처리 (action=order)

```javascript
// 요청
{
  "userId": "조리원ID",
  "pin": "PIN번호",
  "items": [
    {
      "name": "상품명",
      "quantity": 2,
      "price": 10000
    }
  ]
}

// 응답
{
  "status": "success",
  "order": {
    "orderId": "order_1234567890_abc123",
    "userId": "조리원ID",
    "items": [...],
    "totalAmount": 20000,
    "timestamp": "2025-01-XXTXX:XX:XX+09:00"
  },
  "remainingBudget": 80000,
  "budgetInfo": {...}
}
```

### 3. 주문 내역 조회 (action=getOrders)

```javascript
// 요청
{
  "userId": "조리원ID"  // 선택사항
}

// 응답
{
  "status": "success",
  "orders": [
    {
      "orderId": "order_1234567890_abc123",
      "userId": "조리원ID",
      "pin": "PIN번호",
      "itemName": "상품명",
      "quantity": 2,
      "price": 10000,
      "total": 20000,
      "timestamp": "2025-01-XXTXX:XX:XX+09:00",
      "deliveryAddress": "배송지",
      "recipient": "수취인",
      "phone": "연락처"
    }
  ]
}
```

### 4. 예산 정보 조회 (action=getBudget)

```javascript
// 요청
{
  "userId": "조리원ID"
}

// 응답
{
  "status": "success",
  "budget": {
    "totalBudget": 100000,
    "monthlyTotal": 20000,
    "remainingBudget": 80000,
    "isMasterBudget": false,
    "monthlyBudget": 100000,
    "masterBudget": null
  }
}
```

## 핵심 기능

### 1. 사용자 인증

-   조리원ID + PIN 조합 검증
-   Account 시트 1열, 2열과 매칭
-   인증 성공 시 사용자 정보 및 예산 반환

### 2. 예산 관리

-   **기본 예산**: 3열 월배정금액
-   **마스터 예산**: 4열 마스터금액 (우선 적용)
-   **자동 초기화**: 매월 1일 4열 자동 삭제
-   **실시간 계산**: 주문 시 즉시 잔액 업데이트

### 3. 주문 처리

-   예산 초과 시 주문 차단
-   주문 완료 후 잔액 표시
-   Orders 시트에 상세 주문 내역 저장
-   배송 정보 자동 포함

### 4. 시간대 처리

-   모든 시간은 한국 시간(UTC+9) 기준
-   월별 계산 정확성 보장
-   매월 1일 00:00 정확한 초기화

## 보안 고려사항

### 1. 데이터 보호

-   민감 정보(PIN, 예산) 노출 방지
-   일반적인 오류 메시지만 표시
-   디버그 정보 제거

### 2. 인증 보안

-   조리원ID + PIN 이중 검증
-   세션 기반 인증
-   로그아웃 시 세션 클리어

### 3. 입력 검증

-   모든 입력값 검증
-   SQL Injection 방지
-   XSS 공격 방지

## 배포 가이드

### 1. Google Apps Script 설정

1. Google Apps Script 프로젝트 생성
2. `google-apps-script.js` 코드 복사
3. `SPREADSHEET_ID` 실제 값으로 변경
4. `testSystem()` 함수 실행하여 테스트
5. 웹 앱으로 배포

### 2. HTML 파일 설정

1. `index.html` 파일 준비
2. `API_URL` 실제 배포 URL로 변경
3. 정적 웹 호스팅 서비스에 업로드

### 3. Google Sheets 설정

1. 새 Google Sheets 생성
2. 시트 이름을 "Account", "Orders"로 설정
3. 헤더 행 자동 생성됨

## 오류 처리

### 1. 네트워크 오류

-   Fetch API 타임아웃 처리
-   재시도 로직 구현
-   사용자 친화적 오류 메시지

### 2. 데이터 오류

-   입력값 검증
-   데이터 형식 검증
-   예산 초과 처리

### 3. 시스템 오류

-   Google Apps Script 오류 로깅
-   사용자에게 적절한 메시지 표시
-   시스템 복구 방안 제공

## 성능 최적화

### 1. 데이터베이스 최적화

-   인덱스 활용 (Google Sheets 자동)
-   불필요한 데이터 조회 최소화
-   배치 처리 활용

### 2. 프론트엔드 최적화

-   이미지 최적화
-   CSS/JS 압축
-   캐싱 전략

### 3. API 최적화

-   응답 데이터 최소화
-   불필요한 API 호출 방지
-   에러 처리 최적화

## 유지보수 가이드

### 1. 정기 점검 항목

-   매월 1일 자동 초기화 확인
-   예산 계산 정확성 검증
-   주문 내역 데이터 무결성 확인

### 2. 백업 전략

-   Google Sheets 정기 백업
-   코드 버전 관리
-   설정 파일 백업

### 3. 업데이트 절차

-   테스트 환경에서 먼저 검증
-   점진적 배포
-   롤백 계획 수립

## 문제 해결

### 1. 로그인 실패

-   조리원ID, PIN 확인
-   Google Sheets 접근 권한 확인
-   네트워크 연결 상태 확인

### 2. 주문 실패

-   예산 잔액 확인
-   상품 정보 정확성 확인
-   시스템 상태 확인

### 3. 데이터 불일치

-   시간대 설정 확인
-   월별 계산 로직 검증
-   데이터베이스 무결성 확인

## 향후 개선 사항

### 1. 기능 개선

-   관리자 대시보드 추가
-   통계 리포트 기능
-   알림 시스템 구현

### 2. 성능 개선

-   캐싱 시스템 도입
-   데이터베이스 최적화
-   API 응답 속도 개선

### 3. 보안 강화

-   2단계 인증 도입
-   데이터 암호화
-   접근 로그 관리

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 8월  
**작성자**: 지윤환  
**검토자**: 지윤환
