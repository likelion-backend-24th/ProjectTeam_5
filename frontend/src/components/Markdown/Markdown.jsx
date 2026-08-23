"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

// 질문 본문(마크다운)을 렌더링한다.
// ⚠️ 보안: rehype-raw 를 넣지 않는다(넣으면 본문 안 <script> 등이 실행 → XSS).
//    react-markdown 기본값은 raw HTML을 렌더하지 않아 안전하다.
export default function Markdown({ source }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeHighlight]}
    >
      {source || ""}
    </ReactMarkdown>
  );
}
