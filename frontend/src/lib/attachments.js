import { request } from "./client";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB (백엔드와 동일하게)

// 클라 측 사전 검증 (백엔드와 동일 규칙 — 왕복 낭비 줄이기)
export function validateImage(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`지원하지 않는 형식입니다: ${file.name} (허용: ${ALLOWED_EXTENSIONS.join(", ")})`);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`파일이 너무 큽니다(최대 5MB): ${file.name}`);
  }
}

// ① 백엔드에서 업로드 서명 발급
function createSignature({ filename, fileSize }) {
  return request("/api/attachments/images/signature", {
    method: "POST",
    body: { filename, fileSize },
    fallbackMessage: "이미지 업로드 준비에 실패했습니다.",
  });
}

// ② 발급받은 서명으로 Cloudinary에 직접 업로드
async function uploadToCloudinary(file, sign) {
  // 서명 응답이 예상과 다르면(예: uploadURL 누락) 여기서 실제 내용을 드러낸다.
  if (!sign?.uploadURL) {
    console.error("[attachments] 서명 응답에 uploadURL이 없습니다. 실제 응답:", sign);
    throw new Error("업로드 URL을 받지 못했습니다. 백엔드 서명 응답을 확인하세요.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sign.apiKey);
  formData.append("timestamp", sign.timestamp);
  formData.append("signature", sign.signature);
  formData.append("public_id", sign.publicId);
  // ⚠️ 백엔드가 서명한 파라미터(public_id, timestamp)만 보낸다.
  //    folder 등 서명 안 된 파라미터를 추가하면 서명 불일치로 업로드가 거부됨.

  // Content-Type을 직접 지정하지 않는다(브라우저가 multipart 경계를 자동 설정).
  const res = await fetch(sign.uploadURL, { method: "POST", body: formData });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.message || "이미지 업로드에 실패했습니다.");
  }
  return res.json(); // { secure_url, public_id, ... }
}

// ③ 파일 하나를 업로드하고 컴포넌트가 쓰기 좋은 형태로 반환
export async function uploadImage(file) {
  validateImage(file);
  const sign = await createSignature({ filename: file.name, fileSize: file.size });
  const result = await uploadToCloudinary(file, sign);
  return {
    attachId: sign.attachId,     // 질문 등록 시 백엔드로 보낼 값
    url: result.secure_url,      // 미리보기/표시용 CDN URL
    name: file.name,
  };
}

// 프로필 사진 업로드
export async function uploadProfileImage(file) {
  validateImage(file);

  // 1. 프로필 전용 서명 발급 (파라미터 불필요)
  const sign = await request("/api/attachments/profile-image/signature", {
    method: "POST",
    fallbackMessage: "프로필 이미지 업로드 준비에 실패했습니다.",
  });

  // 2. Cloudinary 업로드
  const result = await uploadToCloudinary(file, sign);

  // 3. 업로드된 URL 반환
  return result.secure_url;
}
