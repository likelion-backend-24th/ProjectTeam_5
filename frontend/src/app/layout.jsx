import Header from "@/components/Header/Header";
import "./globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}