import { NextResponse } from "next/server";

// Endpoint do ręcznego rozpoczęcia procesu uwierzytelniania Google OAuth
// Służy jako alternatywa dla problematycznego endpointu NextAuth
export async function GET(request: Request) {
  try {
    // Pobierz zmienne środowiskowe
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL || "";

    console.log("=== Ręczny endpoint Google OAuth ===");
    console.log("- GOOGLE_CLIENT_ID dostępny:", !!clientId);
    console.log("- GOOGLE_CLIENT_SECRET dostępny:", !!clientSecret);
    console.log("- NEXTAUTH_URL:", nextAuthUrl);

    // Sprawdź, czy mamy potrzebne dane
    if (!clientId) {
      console.error("- Błąd: Brak GOOGLE_CLIENT_ID");
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

    // Wypisz wszystkie nagłówki (dla debugowania)
    console.log("- Nagłówki żądania:");
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    // Preferuj adres z nagłówków
    let baseUrl = "";
    if (forwardedProto && forwardedHost) {
      baseUrl = `${forwardedProto}://${forwardedHost}`;
    } else if (nextAuthUrl) {
      baseUrl = nextAuthUrl;
    } else {
      baseUrl = url.origin;
    }

    console.log("- Bazowy URL (wykryty):", url.origin);
    console.log(
      "- Bazowy URL (z nagłówków):",
      forwardedProto && forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : "brak"
    );
    console.log("- Bazowy URL (z env):", nextAuthUrl);
    console.log("- Bazowy URL (użyty):", baseUrl);

    // Pobierz parametry z URL
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";
    const showDebug = url.searchParams.get("debug") === "true";

    // Ustal adres przekierowania (callback) - użyj URL, który jest oficjalnie skonfigurowany w Google
    const googleCallbackUrl = `${baseUrl}/api/auth/callback/google`;

    // Generowanie losowego stanu dla bezpieczeństwa
    const state = Math.random().toString(36).substring(2, 15);

    // Zapisz callbackUrl w stanie, aby można go było wykorzystać po powrocie z Google
    const stateData = {
      callbackUrl: callbackUrl,
      randomState: state,
      ts: Date.now(),
    };

    const encodedState = Buffer.from(JSON.stringify(stateData)).toString(
      "base64"
    );

    console.log("- Stan OAuth:", stateData);

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

    console.log("- Przekierowuję na:", googleOAuthUrl);
    console.log("- Callback URL:", googleCallbackUrl);
    console.log("- Lokalny callbackUrl po powrocie:", callbackUrl);

    // Jeśli żądany debug, pokaż szczegóły zamiast przekierowania
    if (showDebug) {
      return NextResponse.json({
        googleOAuthUrl,
        googleCallbackUrl,
        callbackUrl,
        stateData,
        baseUrl,
        headers: Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => key.startsWith("x-") || ["host", "referer"].includes(key)
          )
        ),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          NEXTAUTH_URL_SET: !!process.env.NEXTAUTH_URL,
          GOOGLE_CLIENT_ID_CORRECT: clientId?.startsWith("1740500"),
          GOOGLE_CLIENT_SECRET_CORRECT: clientSecret?.startsWith("GOCSPX"),
        },
      });
    }

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
