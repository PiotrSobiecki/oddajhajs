import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Ta funkcja czyści wszystkie cookies związane z sesją
export async function GET(request: Request) {
  const cookieStore = cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);

  // Licznik usuniętych cookies
  let deletedCount = 0;

  // Usuń wszystkie cookies związane z next-auth
  for (const name of cookieNames) {
    if (name.includes("next-auth")) {
      cookieStore.delete(name);
      deletedCount++;
    }
  }

  // Przygotuj URL do przekierowania na Google OAuth
  const baseUrl = new URL(request.url).origin;
  const googleSignInUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=/dashboard&reset=true`;

  // Odpowiedź z informacją i przekierowaniem
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Resetowanie sesji</title>
      <meta http-equiv="refresh" content="5;url=${googleSignInUrl}">
      <style>
        body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f0f0f0; padding: 20px; border-radius: 10px; }
        .btn { display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Resetowanie sesji</h1>
        <p>Usunięto ${deletedCount} cookies związanych z sesją.</p>
        <p>Za 5 sekund zostaniesz przekierowany na stronę logowania Google...</p>
        <p>Jeśli przekierowanie nie nastąpi automatycznie, kliknij przycisk poniżej:</p>
        <a class="btn" href="${googleSignInUrl}">Zaloguj się przez Google</a>
      </div>
    </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
