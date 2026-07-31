import { getHealth } from "@/lib/api";

export default async function  Home() {
  let backendStatus;

  try{
    backendStatus = await getHealth();
  } catch (error) {
    backendStatus = "fail";
  }

  return (
    <main>
      <h1>backendStatus</h1>
      <p>{backendStatus}</p>

      <a
        href="https://api-findanswer.example.com/swagger-ui/index.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        Swagger API 문서
      </a>
    </main>
  )
  
}