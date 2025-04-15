import { NextResponse } from "next/server";

// Ten endpoint służy do obsługi callbacków z Google OAuth
// Jest używany zamiast problematycznego callbacka NextAuth
export async function GET(request: Request) {
  try {
    // Pobierz parametry z URL
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("Callback Handler - parametry:", {
      code: !!code,
      state: !!state,
      error,
    });

    // Pobierz zmienne środowiskowe
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL || "";

    // Jeśli jest błąd, przekieruj na stronę logowania z komunikatem
    if (error) {
      console.log("Callback Handler - otrzymano błąd:", error);
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=google&details=${error}`
      );
    }

    // Jeśli brak kodu autoryzacyjnego, również przekieruj z błędem
    if (!code) {
      console.log("Callback Handler - brak kodu autoryzacyjnego");
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=OAuthCallback&details=Brak_kodu_autoryzacyjnego`
      );
    }

    // Jeśli brak state, również przekieruj z błędem
    if (!state) {
      console.log("Callback Handler - brak parametru state");
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=OAuthCallback&details=Brak_parametru_state`
      );
    }

    // Zdekoduj stan, aby uzyskać oryginalny callbackUrl
    let stateObj;
    try {
      stateObj = JSON.parse(Buffer.from(state, "base64").toString());
      console.log("Callback Handler - dekodowany stan:", stateObj);
    } catch (e) {
      console.error("Callback Handler - błąd dekodowania stanu:", e);
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=OAuthCallback&details=Nieprawidłowy_format_state`
      );
    }

    // Pobierz callbackUrl ze stanu
    const callbackUrl = stateObj.callbackUrl || "/dashboard";

    // Teraz wymieniamy kod autoryzacyjny na token dostępu
    // UWAGA: To powinno być bezpieczne, ponieważ wykonywane jest po stronie serwera
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const redirectUri = `${nextAuthUrl}/api/auth/callback/google`;

    // Upewnij się, że zmienne nie są undefined
    if (!clientId || !clientSecret) {
      console.error("Callback Handler - brak wymaganych danych do autoryzacji");
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=OAuthCallback&details=Brak_danych_klienta_OAuth`
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    console.log("Callback Handler - wymieniam kod na token");
    console.log("- URL przekierowania:", redirectUri);

    // Wykonaj zapytanie do Google, aby uzyskać token
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokenData = await response.json();

    // Sprawdź, czy otrzymaliśmy token dostępu
    if (!response.ok || !tokenData.access_token) {
      console.error(
        "Callback Handler - błąd wymiany kodu na token:",
        tokenData
      );
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=OAuthCallback&details=Błąd_wymiany_kodu_na_token`
      );
    }

    console.log("Callback Handler - token uzyskany pomyślnie");

    // Pobierz dane użytkownika z Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userData = await userInfoResponse.json();

    // Sprawdź, czy otrzymaliśmy dane użytkownika
    if (!userInfoResponse.ok || !userData.email) {
      console.error(
        "Callback Handler - błąd pobierania danych użytkownika:",
        userData
      );
      return NextResponse.redirect(
        `${nextAuthUrl}/login?error=OAuthCallback&details=Błąd_pobierania_danych_użytkownika`
      );
    }

    console.log("Callback Handler - dane użytkownika pobrane pomyślnie:", {
      email: userData.email,
      name: userData.name,
      imageExists: !!userData.picture,
    });

    // W tym miejscu powinniśmy zapisać dane użytkownika w bazie danych
    // i utworzyć sesję. Jednak, ponieważ tylko testujemy logowanie,
    // przekierujemy na stronę dashboard z informacją o sukcesie.

    // W normalnej implementacji użylibyśmy tutaj NextAuth do utworzenia sesji
    // Dla uproszczenia testów, po prostu przekierujemy na stronę dashboard

    return NextResponse.redirect(
      `${nextAuthUrl}${callbackUrl}?loginSuccess=true&email=${encodeURIComponent(
        userData.email
      )}`
    );
  } catch (error) {
    console.error("Callback Handler - krytyczny błąd:", error);

    const nextAuthUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    return NextResponse.redirect(
      `${nextAuthUrl}/login?error=OAuthCallback&details=Nieoczekiwany_błąd`
    );
  }
}
