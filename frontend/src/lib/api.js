const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL){
    throw new Error("Does not exist API_URL")
}

export async function getHealth() {
    const response = await fetch(`${API_URL}/health`, {
        cache: "no-store",
    });

    if (!response.ok){
        throw new Error("Fail")
    }

    return response.text();
    
}