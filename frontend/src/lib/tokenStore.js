// accessToken을 메모리에만 보관한다 — localStorage/sessionStorage에 두지 않는다.
// XSS로 스크립트가 실행되면 localStorage는 그대로 읽히지만, 모듈 스코프 변수는 페이지가 만든
// JS 실행 컨텍스트 밖에서는(예: 별도 요청으로 저장소를 훑는 공격) 애초에 접근할 방법이 없다.
// 새로고침하면 이 값은 사라지는데, 그건 의도된 동작이다 — 복구는 refreshToken(HttpOnly 쿠키)로
// /api/auth/refresh를 호출해서 한다(lib/client.js의 tryRefreshToken, AuthContext의 restoreSession 참고).
let accessToken = null;

// client.js가 401 재시도용 refresh까지 실패해서 세션이 끊겼다고 판단하면 clearAccessToken()을 부른다.
// 그런데 그 시점에 AuthContext의 user 상태는 그대로 남아있어서(둘이 서로 모르는 사이) 화면은 다음 페이지
// 이동 전까지 계속 로그인된 것처럼 보인다 — clearAccessToken()이 일어났다는 걸 AuthContext에 알려주는
// 최소한의 구독 장치. setAccessToken()에서는 안 부른다(로그인 성공 시엔 호출부가 곧바로 user를 세팅하므로
// 여기서 또 알릴 필요가 없다 — 오히려 그 사이에 user가 잠깐 null로 보이는 깜빡임만 생긴다).
const listeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
  listeners.forEach((listener) => listener());
}

// 세션이 끊겼을 때(clearAccessToken) 알림을 받는다. 구독 해제 함수를 반환한다.
export function onSessionCleared(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
