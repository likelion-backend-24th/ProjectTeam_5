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
    </main>
  )
  
}