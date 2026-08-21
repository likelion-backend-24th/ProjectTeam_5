import Header from "@/components/Header/Header";
import "./globals.css";
import "highlight.js/styles/github-dark.css"; // 코드블록 문법 하이라이팅 테마
import { AuthProvider } from "@/app/contexts/AuthContext";
import Footer from "@/components/Footer/Footer";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}