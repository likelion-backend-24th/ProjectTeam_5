import { request } from "./client";

// 결제수단 등록 post /api/payment-methods
export function registerPaymentMethod({ cardNickname, brand, last4 }){
    return request("/api/payment-methods", {
        method: "POST",
        body: {cardNickname, brand, last4 },
        fallbackMessage: "결제수단 등록에 실패했습니다.",
    });
}

export function getPaymentMethods(){
    return request("/api/payment-methods",{
        method: "GET",
        fallbackMessage: "결제수단 목록을 불러오지 못했습니다.",
    });
}


export function deletePaymentMethod(id){
    return request("/api/payment-methods/${id}", {
        method:"DELETE",
        fallbackMessage: "결제수단 삭제에 실패했습니다.",
    });
}

export function setDefaultPaymentMethod(id){
    return request("/api/payment-methods/${id}/default", {
        method:"POST",
        fallbackMessage: "대표 결제수단 지정에 실패했습니다."
    });
}