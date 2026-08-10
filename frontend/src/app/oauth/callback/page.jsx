import { Suspense } from "react";
import OAuthCallbackClient from "./OAuthCallbackClient";

export default function Page() {
  return (
    <Suspense fallback={<p>로그인 처리 중...</p>}>
      <OAuthCallbackClient />
    </Suspense>
  );
}