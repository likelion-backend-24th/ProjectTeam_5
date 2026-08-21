import { request } from "./client";
import { getAccessToken } from "./tokenStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

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

// 이미지가 아닌 일반 첨부파일 — 백엔드 AttachmentService.ALLOWED_FILE_EXTENSIONS/MAX_FILE_SIZE와 동일한 규칙.
const ALLOWED_FILE_EXTENSIONS = ["pdf", "zip"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.name} (허용: ${ALLOWED_FILE_EXTENSIONS.join(", ")})`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일이 너무 큽니다(최대 50MB): ${file.name}`);
  }
}

// 이미지와 달리 서명 후 직접 업로드가 아니라, 파일 자체를 우리 서버로 바로 올린다(멀티파트).
export async function uploadFile(file) {
  validateFile(file);

  const token = getAccessToken();

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/attachments/files`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "파일 업로드에 실패했습니다.");
  }

  const data = await res.json(); // { attachId, originalFileName, size }
  return { attachId: data.attachId, name: data.originalFileName, size: data.size };
}

// 첨부파일 다운로드 — 백엔드가 이 엔드포인트를 인증 필요로 막아놨다(anyRequest().authenticated()).
// <a href={downloadUrl}>로 그냥 열면 브라우저가 Authorization 헤더 없이 GET을 보내서 401 →
// 스프링 기본 Whitelabel 에러 페이지가 뜬다. fetch로 토큰을 실어 받은 뒤 blob을 직접 저장해야 한다.
export async function downloadFile(attachId, filename = "download") {
  const token = getAccessToken();

  const res = await fetch(`${API_URL}/api/attachments/files/${attachId}/download`, {
    method: "GET",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "파일 다운로드에 실패했습니다.");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename; // 서버가 넘겨준 originalFileName을 그대로 씀
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
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
