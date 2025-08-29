// 프록시 설정 파일 (보안 강화)
(function() {
    'use strict';
    
    // API 엔드포인트 설정
    const API_CONFIG = {
        endpoint: 'https://script.google.com/macros/s/AKfycbzoFZF8qvHnzi-D_TlRuD0x5cABKGJhIe__z_vRm_jlMsKjB1uVzhEfQlSNly4vC5i9/exec',
        timeout: 30000,
        retries: 3
    };
    
    // 전역 객체에 안전하게 설정
    window.API_CONFIG = Object.freeze(API_CONFIG);
    
    // 개발자 도구에서 숨기기
    Object.defineProperty(window, 'API_CONFIG', {
        enumerable: false,
        configurable: false
    });
})();
