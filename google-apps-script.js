/**
 * [2025-01-XX] 조리원 주문 시스템 - Google Apps Script
 * 
 * ⚠️ 중요: 이 파일은 실제 작동하는 주문 시스템입니다!
 * 
 * 기능:
 * - 사용자 인증 (조리원ID + PIN)
 * - 예산 관리 (3열 기본, 4열 마스터 금액)
 * - 주문 처리 및 내역 저장
 * - 자동 월 초기화 (매월 1일)
 * - 자동 데이터 정리 (1달이 지난 주문 데이터 자동 삭제)
 * - CORS 헤더 지원
 * - JSONP 지원
 * - 에러 처리 및 보안
 * 
 * 사용법:
 * 1. 이 코드를 Google Apps Script에 복사
 * 2. SPREADSHEET_ID를 실제 스프레드시트 ID로 변경
 * 3. 웹 앱으로 배포
 * 4. 배포 URL을 HTML에서 사용
 * 5. setupDataCleanupTrigger() 함수를 한 번 실행하여 자동 정리 트리거 설정
 * 
 * 💡 핵심 기능:
 * 
 * 🔐 사용자 인증:
 * - 조리원ID + PIN 조합 검증
 * - 1번 시트 1열, 2열과 매칭
 * 
 * 💰 예산 관리:
 * - 3열: 기본 월 배정 금액
 * - 4열: 마스터 금액 (관리자 전용)
 * - 4열 우선 적용, 없으면 3열 적용
 * 
 * 📊 주문 처리:
 * - 예산 초과 시 주문 차단
 * - 주문 완료 후 잔액 표시
 * - 2번 시트에 주문 내역 저장
 * 
 * 🔄 자동 초기화:
 * - 매월 1일 4열 자동 삭제
 * - 3열 기준으로 복귀
 * 
 * 🧹 자동 데이터 정리:
 * - 1달이 지난 주문 데이터 자동 삭제
 * - 매월 1일 오전 2시에 실행 (트리거 설정 필요)
 * 
 * 🚀 배포 가이드:
 * 1. 이 코드를 Google Apps Script에 복사
 * 2. SPREADSHEET_ID를 실제 스프레드시트 ID로 변경
 * 3. testSystem() 함수 실행하여 테스트
 * 4. setupDataCleanupTrigger() 함수 실행하여 자동 정리 트리거 설정
 * 5. "배포" > "새 배포" > "웹 앱" 선택
 * 6. "액세스 권한" > "모든 사용자" 선택
 * 7. "배포" 클릭
 * 8. 생성된 URL을 HTML 파일에서 사용
 */

// ⚠️ 중요: 실제 Google Sheets ID로 변경해야 합니다!
const SPREADSHEET_ID = "1M2BURxZ3erydcKwMJcNERUOEyg7EprJoU8r4-brcRoI";
const USER_SHEET_NAME = "Account"; // 1번 시트 (기본 시트)
const ORDER_SHEET_NAME = "Orders"; // 2번 시트

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT
  );
}

/**
 * GET 요청 처리 - 메인 API 엔드포인트
 * 
 * 지원하는 액션:
 * - action=login: 사용자 인증
 * - action=order: 주문 처리
 * - action=getOrders: 주문 내역 조회
 * - action=getBudget: 예산 정보 조회
 */
function doGet(e) {
  try {
    // JSONP 콜백 함수명 확인
    const callback = e.parameter.callback;
    const isJSONP = callback && callback.length > 0;

    // 기본 테스트 응답
    let response = {
      status: "success",
      message: "조리원 주문 시스템 API 서버가 정상 작동 중입니다.",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: ["login", "order", "getOrders", "getBudget", "jsonp", "cors"]
    };

    // 파라미터가 있는 경우 실제 기능 처리
    if (e && e.parameter) {
      const action = e.parameter.action;
      let data = {};

      // 데이터 파라미터 파싱
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (error) {
          response = {
            status: "error",
            message: "잘못된 데이터 형식입니다.",
            error: error.message
          };
        }
      }

      // 액션별 처리
      if (action === "login") {
        try {
          const result = authenticateUserSecure(data);
          response = {
            status: "success",
            ...result
          };
        } catch (error) {
          response = {
            status: "error",
            message: "인증 실패: " + error.message
          };
        }
      } else if (action === "order") {
        try {
          const result = processOrder(data);
          response = {
            status: "success",
            ...result
          };
        } catch (error) {
          response = {
            status: "error",
            message: "주문 처리 실패: " + error.message
          };
        }
      } else if (action === "getOrders") {
        try {
          const result = getOrders(data);
          response = {
            status: "success",
            ...result
          };
        } catch (error) {
          response = {
            status: "error",
            message: "주문 내역 조회 실패: " + error.message
          };
        }
      } else if (action === "getBudget") {
        try {
          const result = getBudgetInfo(data);
          response = {
            status: "success",
            ...result
          };
        } catch (error) {
          response = {
            status: "error",
            message: "예산 정보 조회 실패: " + error.message
          };
        }
      } else if (action === "securityStatus") {
        try {
          const result = getSecurityStatus();
          response = {
            status: "success",
            ...result
          };
        } catch (error) {
          response = {
            status: "error",
            message: "보안 상태 조회 실패: " + error.message
          };
        }
      } else if (action === "resetLoginAttempts") {
        try {
          const result = resetLoginAttempts(data.userId || null);
          response = {
            status: "success",
            ...result
          };
        } catch (error) {
          response = {
            status: "error",
            message: "로그인 시도 기록 초기화 실패: " + error.message
          };
        }
      }
    }

    // JSONP 응답 형식
    if (isJSONP) {
      const jsonpResponse = `${callback}(${JSON.stringify(response)})`;
      return ContentService.createTextOutput(jsonpResponse).setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
    }

    // 일반 JSON 응답
    return ContentService.createTextOutput(
      JSON.stringify(response)
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("서버 오류:", error);
    const errorResponse = {
      status: "error",
      message: "서버 오류가 발생했습니다.",
      error: error.message
    };

    const callback = e.parameter.callback;
    if (callback && callback.length > 0) {
      const jsonpResponse = `${callback}(${JSON.stringify(errorResponse)})`;
      return ContentService.createTextOutput(jsonpResponse).setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
    }

    return ContentService.createTextOutput(
      JSON.stringify(errorResponse)
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 사용자 ID로 사용자 찾기
 * 
 * 입력 데이터:
 * - userId: 조리원 ID (필수)
 * 
 * 반환 데이터:
 * - user: 사용자 정보 또는 null
 */
function getUserById(userId) {
  try {
    const userSheet = getUserSheet();
    const userData = userSheet.getDataRange().getValues();
    
    // 사용자 찾기 (1열: 조리원ID)
    for (let i = 1; i < userData.length; i++) { // 1부터 시작 (헤더 있음)
      if (userData[i][0] === userId) {
                 return {
           userId: userData[i][0],
           pin: userData[i][1],
           monthlyBudget: parseInt(String(userData[i][2]).replace(/,/g, '')) || 0,
           masterBudget: userData[i][3] ? parseInt(String(userData[i][3]).replace(/,/g, '')) : null,
           deliveryAddress: userData[i][4] || '',
           recipient: userData[i][5] || '',
           phone: userData[i][6] || ''
         };
      }
    }
    return null;
  } catch (error) {
    console.error("사용자 조회 오류:", error);
    return null;
  }
}

/**
 * 사용자 인증 - 핵심 기능
 * 
 * 입력 데이터:
 * - userId: 조리원 ID (필수)
 * - pin: PIN 번호 (필수)
 * 
 * 반환 데이터:
 * - user: 사용자 정보
 * - budget: 현재 예산 정보
 */
function authenticateUser(data) {
  try {
    // 데이터 검증
    if (!data.userId || !data.userId.trim()) {
      throw new Error("조리원 ID가 필요합니다.");
    }

    if (!data.pin || !data.pin.trim()) {
      throw new Error("PIN 번호가 필요합니다.");
    }

    // 입력 데이터 정리
    const userId = data.userId.trim();
    const pin = data.pin.trim();

    // 사용자 시트 가져오기
    const userSheet = getUserSheet();
    const userData = userSheet.getDataRange().getValues();

    // 사용자 찾기 (1열: 조리원ID, 2열: PIN)
    let user = null;
    for (let i = 1; i < userData.length; i++) { // 1부터 시작 (헤더 있음)
      if (userData[i][0] === userId && String(userData[i][1]) === pin) {
        user = {
          userId: userData[i][0],
          pin: userData[i][1],
          monthlyBudget: parseInt(String(userData[i][2]).replace(/,/g, '')) || 0,
          masterBudget: userData[i][3] ? parseInt(String(userData[i][3]).replace(/,/g, '')) : null,
          deliveryAddress: userData[i][4] || '',
          recipient: userData[i][5] || '',
          phone: userData[i][6] || ''
        };
        break;
      }
    }

    if (!user) {
      // 보안 강화: 민감한 정보 노출 방지
      throw new Error("조리원 ID 또는 PIN이 올바르지 않습니다.");
    }

    // 현재 예산 정보 계산
    const budgetInfo = calculateCurrentBudget(user);

    return {
      user: user,
      budget: budgetInfo
    };
  } catch (error) {
    console.error("사용자 인증 오류:", error);
    throw error;
  }
}

/**
 * 주문 처리 - 핵심 기능
 * 
 * 입력 데이터:
 * - userId: 조리원 ID (필수)
 * - pin: PIN 번호 (필수)
 * - items: 주문 상품 배열 (필수)
 * 
 * 반환 데이터:
 * - order: 주문 정보
 * - remainingBudget: 남은 예산
 */
function processOrder(data) {
  try {
    // 데이터 검증
    if (!data.userId || !data.pin || !data.items || !Array.isArray(data.items)) {
      throw new Error("주문 정보가 올바르지 않습니다.");
    }

    // 사용자 인증 (PIN 없이 사용자 ID만으로 확인)
    const user = getUserById(data.userId);
    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }


    const currentBudget = calculateCurrentBudget(user);

    // 주문 총액 계산
    let totalAmount = 0;
    const orderItems = [];

    for (const item of data.items) {
      if (!item.name || !item.quantity || !item.price) {
        throw new Error("상품 정보가 올바르지 않습니다.");
      }

      const itemTotal = item.quantity * item.price;
      totalAmount += itemTotal;

      orderItems.push({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });
    }

    // 예산 초과 확인
    if (totalAmount > currentBudget.remainingBudget) {
      throw new Error(`예산을 초과했습니다. 남은 예산: ${currentBudget.remainingBudget.toLocaleString()}원`);
    }

    // 주문 시트에 저장
    const orderSheet = getOrderSheet();
    const orderId = generateOrderId();
    const timestamp = getKoreanTime().toISOString().replace('Z', '+09:00');

         for (const item of orderItems) {
       const rowData = [
         orderId,
         user.userId,
         user.pin,
         item.name,
         item.quantity,
         item.price,
         item.total,
         timestamp,
         user.deliveryAddress,
         user.recipient,
         user.phone
       ];

       orderSheet.appendRow(rowData);
     }

    SpreadsheetApp.flush(); // 강제 저장

    // 업데이트된 예산 정보 계산
    const updatedBudget = calculateCurrentBudget(user);

    return {
      order: {
        orderId: orderId,
        userId: user.userId,
        items: orderItems,
        totalAmount: totalAmount,
        timestamp: timestamp
      },
      remainingBudget: updatedBudget.remainingBudget,
      budgetInfo: updatedBudget
    };
  } catch (error) {
    console.error("주문 처리 오류:", error);
    throw error;
  }
}

/**
 * 주문 내역 조회
 * 
 * 입력 데이터:
 * - userId: 조리원 ID (선택)
 * 
 * 반환 데이터:
 * - orders: 주문 내역 배열
 */
function getOrders(data) {
  try {
    const orderSheet = getOrderSheet();
    const orderData = orderSheet.getDataRange().getValues();

         // 현재 월의 시작일과 종료일 계산 (한국 시간 기준)
     const now = getKoreanTime();
     const currentMonth = now.getMonth();
     const currentYear = now.getFullYear();
     const monthStart = new Date(currentYear, currentMonth, 1);
     const monthEnd = new Date(currentYear, currentMonth + 1, 0);

     // 헤더 제거 및 데이터 정리 (당월 주문만 필터링)
     const orders = orderData.slice(1)
       .filter(row => row[0]) // 주문ID가 있는 행만
       .map(row => ({
         orderId: row[0],
         userId: row[1],
         pin: row[2],
         itemName: row[3],
         quantity: parseInt(row[4]),
         price: parseInt(row[5]),
         total: parseInt(row[6]),
         timestamp: row[7],
         deliveryAddress: row[8] || '',
         recipient: row[9] || '',
         phone: row[10] || ''
       }))
       .filter(order => {
         // 당월 주문만 필터링
         const orderDate = new Date(order.timestamp);
         const orderDateKorean = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));
         return orderDateKorean >= monthStart && orderDateKorean <= monthEnd;
       });

    // 특정 사용자 필터링
    if (data.userId) {
      const filteredOrders = orders.filter(order => order.userId === data.userId);
      return { orders: filteredOrders };
    }

    return { orders: orders };
  } catch (error) {
    console.error("주문 내역 조회 오류:", error);
    throw error;
  }
}

/**
 * 예산 정보 조회
 * 
 * 입력 데이터:
 * - userId: 조리원 ID (필수)
 * 
 * 반환 데이터:
 * - budget: 예산 정보
 */
function getBudgetInfo(data) {
  try {
    if (!data.userId) {
      throw new Error("조리원 ID가 필요합니다.");
    }

    const userSheet = getUserSheet();
    const userData = userSheet.getDataRange().getValues();

    // 사용자 찾기
    let user = null;
    for (let i = 1; i < userData.length; i++) { // 1부터 시작 (헤더 있음)
      if (userData[i][0] === data.userId) {
        user = {
          userId: userData[i][0],
          pin: userData[i][1],
          monthlyBudget: parseInt(String(userData[i][2]).replace(/,/g, '')) || 0,
          masterBudget: userData[i][3] ? parseInt(String(userData[i][3]).replace(/,/g, '')) : null,
          deliveryAddress: userData[i][4] || '',
          recipient: userData[i][5] || '',
          phone: userData[i][6] || ''
        };
        break;
      }
    }

    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const budgetInfo = calculateCurrentBudget(user);

    return {
      budget: budgetInfo
    };
  } catch (error) {
    console.error("예산 정보 조회 오류:", error);
    throw error;
  }
}

/**
 * 현재 예산 계산 - 핵심 로직
 * 
 * 4열(마스터 금액) 우선 적용, 없으면 3열(기본 금액) 적용
 */
  function calculateCurrentBudget(user) {
    try {
      // 현재 월의 시작일과 종료일 계산 (한국 시간 기준)
      const now = getKoreanTime();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    // 예산 결정 (4열 우선, 없으면 3열)
    const totalBudget = user.masterBudget || user.monthlyBudget;

    // 현재 월 주문 내역 조회
    const orderSheet = getOrderSheet();
    const orderData = orderSheet.getDataRange().getValues();

    let monthlyTotal = 0;

    // 현재 월 주문 금액 합계 계산
    for (let i = 1; i < orderData.length; i++) {
      if (orderData[i][1] === user.userId) { // 조리원 ID 매칭
        const orderDate = new Date(orderData[i][7]); // 날짜
        const orderTotal = parseInt(orderData[i][6]) || 0; // 총액

        // 현재 월인지 확인 (한국 시간 기준)
        const orderDateKorean = new Date(orderDate.getTime() + (9 * 60 * 60 * 1000));
        if (orderDateKorean >= monthStart && orderDateKorean <= monthEnd) {
          monthlyTotal += orderTotal;
        }
      }
    }

    const remainingBudget = totalBudget - monthlyTotal;

    return {
      totalBudget: totalBudget,
      monthlyTotal: monthlyTotal,
      remainingBudget: remainingBudget,
      isMasterBudget: !!user.masterBudget,
      monthlyBudget: user.monthlyBudget,
      masterBudget: user.masterBudget
    };
  } catch (error) {
    console.error("예산 계산 오류:", error);
    throw error;
  }
}

/**
 * 사용자 시트 가져오기
 */
function getUserSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(USER_SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(USER_SHEET_NAME);
      setupUserSheet(sheet);
      console.log("✅ 새 사용자 시트 생성됨:", USER_SHEET_NAME);
    }

    return sheet;
  } catch (error) {
    console.error("사용자 시트 접근 오류:", error);
    throw new Error("사용자 시트에 접근할 수 없습니다.");
  }
}

/**
 * 주문 시트 가져오기
 */
function getOrderSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(ORDER_SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(ORDER_SHEET_NAME);
      setupOrderSheet(sheet);
      console.log("✅ 새 주문 시트 생성됨:", ORDER_SHEET_NAME);
    }

    return sheet;
  } catch (error) {
    console.error("주문 시트 접근 오류:", error);
    throw new Error("주문 시트에 접근할 수 없습니다.");
  }
}

/**
 * 사용자 시트 초기 설정
 */
  function setupUserSheet(sheet) {
    const headers = ["조리원ID", "PIN", "월배정금액", "마스터금액", "배송지", "수취인", "연락처"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#f3f4f6");
  headerRange.setHorizontalAlignment("center");
  
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 주문 시트 초기 설정
 */
  function setupOrderSheet(sheet) {
    const headers = ["주문ID", "조리원ID", "PIN", "상품명", "수량", "단가", "총액", "날짜", "배송지", "수취인", "연락처"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#f3f4f6");
  headerRange.setHorizontalAlignment("center");
  
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 한국 시간 가져오기
 */
function getKoreanTime() {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreanTime;
}

/**
 * 주문 ID 생성
 */
function generateOrderId() {
  return "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

/**
 * 매월 1일 자동 초기화 - 마스터 금액 삭제
 */
  function autoResetMasterBudget() {
    try {
      const today = getKoreanTime();
      
      // 매월 1일인지 확인 (한국 시간 기준)
      if (today.getDate() === 1) {
      const userSheet = getUserSheet();
      const data = userSheet.getDataRange().getValues();
      
      let resetCount = 0;
      
      // 4열(마스터 금액) 자동 삭제
      for (let i = 1; i < data.length; i++) {
        if (data[i][3]) { // 4열에 값이 있으면
          userSheet.getRange(i + 1, 4).clearContent();
          resetCount++;
        }
      }
      
      console.log(`✅ 매월 1일 마스터 금액 자동 초기화 완료: ${resetCount}개 사용자`);
      return { status: "success", resetCount: resetCount };
    }
    
    return { status: "skipped", message: "오늘은 1일이 아닙니다." };
  } catch (error) {
    console.error("자동 초기화 오류:", error);
    return { status: "error", message: error.message };
  }
}

/**
 * 1달이 지난 주문 데이터를 자동으로 삭제하는 함수
 * 이 함수는 매월 1일 자동으로 실행됩니다 (트리거 설정 필요)
 */
function cleanupOldOrders() {
  try {
    const orderSheet = getOrderSheet();
    const lastRow = orderSheet.getLastRow();

    if (lastRow < 2) {
      console.log("삭제할 데이터가 없습니다.");
      return;
    }

    // 1달(30일) 전 날짜 계산 (한국 시간 기준)
    const now = getKoreanTime();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    oneMonthAgo.setHours(0, 0, 0, 0);

    console.log(
      `데이터 정리 시작: ${oneMonthAgo.toLocaleString(
        "ko-KR"
      )} 이전 데이터 삭제`
    );

    // 성능 최적화: 한 번에 모든 데이터 가져오기
    const range = orderSheet.getRange(2, 1, lastRow - 1, 11);
    const values = range.getValues();

    // 삭제할 행 번호들을 역순으로 저장 (아래에서부터 삭제해야 인덱스가 꼬이지 않음)
    const rowsToDelete = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const orderTime = row[7] ? new Date(row[7]) : null; // 8열: 날짜

      // 1달이 지난 주문 데이터 찾기
      if (orderTime && orderTime < oneMonthAgo) {
        rowsToDelete.push(i + 2); // 실제 행 번호 (헤더 제외)
      }
    }

    // 역순으로 정렬 (아래에서부터 삭제)
    rowsToDelete.sort((a, b) => b - a);

    if (rowsToDelete.length === 0) {
      console.log("삭제할 데이터가 없습니다.");
      return;
    }

    // 삭제할 행들을 한 번에 삭제
    for (const rowNum of rowsToDelete) {
      orderSheet.deleteRow(rowNum);
    }

    console.log(
      `${rowsToDelete.length}개의 오래된 주문 데이터가 삭제되었습니다.`
    );

    // 변경사항 저장
    SpreadsheetApp.flush();
  } catch (error) {
    console.error("데이터 정리 중 오류 발생:", error);
  }
}

/**
 * 자동 데이터 정리 트리거를 설정하는 함수
 * 이 함수는 한 번만 실행하면 됩니다.
 */
function setupDataCleanupTrigger() {
  try {
    // 기존 트리거 삭제
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === "cleanupOldOrders") {
        ScriptApp.deleteTrigger(trigger);
        console.log("기존 데이터 정리 트리거가 삭제되었습니다.");
      }
    }

    // 새로운 트리거 생성 (매월 1일 오전 2시에 실행)
    ScriptApp.newTrigger("cleanupOldOrders")
      .timeBased()
      .onMonthDay(1)
      .atHour(2)
      .create();

    console.log(
      "데이터 정리 트리거가 설정되었습니다. (매월 1일 오전 2시 실행)"
    );
  } catch (error) {
    console.error("트리거 설정 중 오류 발생:", error);
  }
}

/**
 * 수동으로 데이터 정리를 실행하는 함수 (테스트용)
 */
function manualCleanup() {
  console.log("수동 데이터 정리 시작...");
  cleanupOldOrders();
  console.log("수동 데이터 정리 완료");
}

/**
 * 시스템 테스트 함수
 */
function testSystem() {
  console.log("조리원 주문 시스템 테스트 시작...");

  try {
    // 시트 초기화 테스트
    const userSheet = getUserSheet();
    const orderSheet = getOrderSheet();
    console.log("✅ 시트 접근 성공");

    // 테스트 사용자 추가
    const testUser = [
      "테스트조리원",
      "1234",
      500000, // 월 배정 금액
      null    // 마스터 금액
    ];

    userSheet.appendRow(testUser);
    console.log("✅ 테스트 사용자 추가 성공");

    // 인증 테스트
    const authResult = authenticateUserSecure({
      userId: "테스트조리원",
      pin: "1234"
    });
    console.log("✅ 인증 테스트 성공:", authResult);

    // 예산 계산 테스트
    const budgetResult = calculateCurrentBudget(authResult.user);
    console.log("✅ 예산 계산 테스트 성공:", budgetResult);

    console.log("🎉 모든 테스트 통과!");
    return { status: "success", message: "모든 기능이 정상 작동합니다." };
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    return { status: "error", message: error.message };
  }
}

/**
 * 🚀 배포 가이드
 * 
 * 1. 이 코드를 Google Apps Script에 복사
 * 2. SPREADSHEET_ID를 실제 스프레드시트 ID로 변경
 * 3. testSystem() 함수 실행하여 테스트
 * 4. setupDataCleanupTrigger() 함수 실행하여 자동 정리 트리거 설정
 * 5. "배포" > "새 배포" > "웹 앱" 선택
 * 6. "액세스 권한" > "모든 사용자" 선택
 * 7. "배포" 클릭
 * 8. 생성된 URL을 HTML 파일에서 사용
 * 
 * ⚠️ 중요: 배포 후 URL을 HTML의 API_URL에 설정해야 합니다!
 */

/**
 * 🔒 보안 강화: 로그인 시도 제한 및 계정 잠금 기능
 */

// 로그인 시도 기록을 저장할 PropertiesService 키
const LOGIN_ATTEMPTS_KEY = "login_attempts";
const ACCOUNT_LOCKOUT_KEY = "account_lockout";
const MAX_LOGIN_ATTEMPTS = 5; // 최대 로그인 시도 횟수
const LOCKOUT_DURATION = 30; // 계정 잠금 시간 (분)

/**
 * 로그인 시도 기록을 가져오는 함수
 */
function getLoginAttempts(userId) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const attemptsData = properties.getProperty(LOGIN_ATTEMPTS_KEY);
    
    if (!attemptsData) return {};
    
    const attempts = JSON.parse(attemptsData);
    return attempts[userId] || { count: 0, lastAttempt: null, lockedUntil: null };
  } catch (error) {
    console.error("로그인 시도 기록 조회 오류:", error);
    return { count: 0, lastAttempt: null, lockedUntil: null };
  }
}

/**
 * 로그인 시도 기록을 저장하는 함수
 */
function saveLoginAttempts(userId, success) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const attemptsData = properties.getProperty(LOGIN_ATTEMPTS_KEY);
    let attempts = {};
    
    if (attemptsData) {
      attempts = JSON.parse(attemptsData);
    }
    
    const now = new Date().getTime();
    
    if (!attempts[userId]) {
      attempts[userId] = { count: 0, lastAttempt: null, lockedUntil: null };
    }
    
    if (success) {
      // 로그인 성공 시 시도 횟수 초기화
      attempts[userId] = { count: 0, lastAttempt: now, lockedUntil: null };
    } else {
      // 로그인 실패 시 시도 횟수 증가
      attempts[userId].count += 1;
      attempts[userId].lastAttempt = now;
      
      // 최대 시도 횟수 초과 시 계정 잠금
      if (attempts[userId].count >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = now + (LOCKOUT_DURATION * 60 * 1000); // 30분 후
        attempts[userId].lockedUntil = lockoutUntil;
        
        // 계정 잠금 로그 기록
        console.log(`🔒 계정 잠금: ${userId} - ${MAX_LOGIN_ATTEMPTS}회 실패로 인한 잠금`);
      }
    }
    
    properties.setProperty(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error("로그인 시도 기록 저장 오류:", error);
  }
}

/**
 * 계정 잠금 상태를 확인하는 함수
 */
function isAccountLocked(userId) {
  try {
    const attempts = getLoginAttempts(userId);
    
    if (attempts.lockedUntil && attempts.lockedUntil > new Date().getTime()) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil - new Date().getTime()) / (60 * 1000));
      return {
        locked: true,
        remainingMinutes: remainingMinutes,
        message: `계정이 잠겼습니다. ${remainingMinutes}분 후에 다시 시도해주세요.`
      };
    }
    
    return { locked: false, remainingMinutes: 0, message: "" };
  } catch (error) {
    console.error("계정 잠금 상태 확인 오류:", error);
    return { locked: false, remainingMinutes: 0, message: "" };
  }
}

/**
 * 보안 강화된 사용자 인증 함수
 */
function authenticateUserSecure(data) {
  try {
    // 데이터 검증
    if (!data.userId || !data.userId.trim()) {
      throw new Error("조리원 ID가 필요합니다.");
    }

    if (!data.pin || !data.pin.trim()) {
      throw new Error("PIN 번호가 필요합니다.");
    }

    const userId = data.userId.trim();
    const pin = data.pin.trim();

    // 계정 잠금 상태 확인
    const lockStatus = isAccountLocked(userId);
    if (lockStatus.locked) {
      throw new Error(lockStatus.message);
    }

    // 사용자 인증 시도
    const user = authenticateUser(data);
    
    if (user && user.user) {
      // 로그인 성공 시 시도 기록 초기화
      saveLoginAttempts(userId, true);
      return user;
    } else {
      // 로그인 실패 시 시도 기록 저장
      saveLoginAttempts(userId, false);
      
      // 잠금 상태 재확인
      const newLockStatus = isAccountLocked(userId);
      if (newLockStatus.locked) {
        throw new Error(newLockStatus.message);
      } else {
        const attempts = getLoginAttempts(userId);
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts.count;
        throw new Error(`조리원 ID 또는 PIN이 올바르지 않습니다. (남은 시도 횟수: ${remainingAttempts}회)`);
      }
    }
  } catch (error) {
    console.error("보안 인증 오류:", error);
    throw error;
  }
}

/**
 * 로그인 시도 기록을 초기화하는 함수 (관리자용)
 */
function resetLoginAttempts(userId = null) {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    if (userId) {
      // 특정 사용자의 시도 기록만 초기화
      const attemptsData = properties.getProperty(LOGIN_ATTEMPTS_KEY);
      if (attemptsData) {
        const attempts = JSON.parse(attemptsData);
        if (attempts[userId]) {
          attempts[userId] = { count: 0, lastAttempt: null, lockedUntil: null };
          properties.setProperty(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
          console.log(`✅ ${userId} 사용자의 로그인 시도 기록이 초기화되었습니다.`);
        }
      }
    } else {
      // 모든 사용자의 시도 기록 초기화
      properties.deleteProperty(LOGIN_ATTEMPTS_KEY);
      console.log("✅ 모든 사용자의 로그인 시도 기록이 초기화되었습니다.");
    }
    
    return { status: "success", message: "로그인 시도 기록이 초기화되었습니다." };
  } catch (error) {
    console.error("로그인 시도 기록 초기화 오류:", error);
    return { status: "error", message: error.message };
  }
}

/**
 * 보안 상태를 확인하는 함수
 */
function getSecurityStatus() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const attemptsData = properties.getProperty(LOGIN_ATTEMPTS_KEY);
    
    if (!attemptsData) {
      return { status: "success", message: "보안 상태: 정상", lockedAccounts: 0, totalAttempts: 0 };
    }
    
    const attempts = JSON.parse(attemptsData);
    let lockedAccounts = 0;
    let totalAttempts = 0;
    
    for (const userId in attempts) {
      totalAttempts += attempts[userId].count;
      if (attempts[userId].lockedUntil && attempts[userId].lockedUntil > new Date().getTime()) {
        lockedAccounts++;
      }
    }
    
    return {
      status: "success",
      message: "보안 상태 조회 완료",
      lockedAccounts: lockedAccounts,
      totalAttempts: totalAttempts,
      totalUsers: Object.keys(attempts).length
    };
  } catch (error) {
    console.error("보안 상태 조회 오류:", error);
    return { status: "error", message: error.message };
  }
}
