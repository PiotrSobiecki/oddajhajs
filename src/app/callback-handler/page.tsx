export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

// Ta strona służy tylko jako pomost dla przekierowań z Google OAuth
// i nie powinna być wyświetlana użytkownikowi
export default function CallbackHandlerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Jeśli jest kod autoryzacyjny, przekieruj do handlera API
  if (searchParams.code) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") {
        params.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      }
    }

    redirect(`/api/auth/callback-handler?${params.toString()}`);
  }

  // W przeciwnym razie przekieruj na stronę logowania z błędem
  redirect("/login?error=OAuthCallback&details=Nieprawidłowy_callback");
}
