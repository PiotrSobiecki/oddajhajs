import { NextResponse } from "next/server";

// Endpoint do ręcznego rozpoczęcia procesu uwierzytelniania Google OAuth
// Służy jako alternatywa dla problematycznego endpointu NextAuth
export async function GET(request: Request) {
  try {
    // Pobierz zmienne środowiskowe
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const nextAuthUrl = process.env.NEXTAUTH_URL || "";

    // Sprawdź, czy mamy potrzebne dane
    if (!clientId) {
      return NextResponse.json(
        {
          error: "Brak GOOGLE_CLIENT_ID w zmiennych środowiskowych",
        },
        { status: 500 }
      );
    }

    // Wykryj bazowy URL
    const url = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");

    // Preferuj adres z nagłówków
    let baseUrl = "";
    if (forwardedProto && forwardedHost) {
      baseUrl = `${forwardedProto}://${forwardedHost}`;
    } else if (nextAuthUrl) {
      baseUrl = nextAuthUrl;
    } else {
      baseUrl = url.origin;
    }

    // Pobierz parametry z URL
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";

    // Ustal adres przekierowania (callback) - użyj URL, który jest oficjalnie skonfigurowany w Google
    const googleCallbackUrl = `${baseUrl}/api/auth/callback/google`;

    // Generowanie losowego stanu dla bezpieczeństwa
    const state = Math.random().toString(36).substring(2, 15);

    // Zapisz callbackUrl w stanie, aby można go było wykorzystać po powrocie z Google
    const encodedState = Buffer.from(
      JSON.stringify({
        callbackUrl: callbackUrl,
        randomState: state,
        ts: Date.now(),
      })
    ).toString("base64");

    // Parametry dla Google OAuth
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: googleCallbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state: encodedState,
      prompt: "consent",
      access_type: "offline",
    });

    // Budowanie adresu URL do Google OAuth
    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log(
      "Ręczny endpoint Google OAuth - przekierowuje na:",
      googleOAuthUrl
    );
    console.log("- Callback URL:", googleCallbackUrl);
    console.log("- Lokalny callbackUrl po powrocie:", callbackUrl);

    // Przekieruj użytkownika na stronę uwierzytelniania Google
    return NextResponse.redirect(googleOAuthUrl);
  } catch (error) {
    console.error("Błąd podczas tworzenia adresu URL dla Google OAuth:", error);
    return NextResponse.json(
      {
        error: "Błąd podczas tworzenia URL dla Google OAuth",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
