/**
 * API do obsługi płatności przez Przelewy24.
 *
  * KONFIGURACJA PRODUKCYJNA:
 * 1. Załóż konto w Przelewy24: https://www.przelewy24.pl/rejestracja
 * 2. Przejdź proces weryfikacji działalności gospodarczej (wymagane dokumenty KRS/CEIDG)
 * 3. Po weryfikacji otrzymasz dane dostępowe:
 *    - Merchant ID
 *    - CRC (klucz do podpisywania transakcji)
 *    - API Key (dla integracji REST API)
 * 4. Wprowadź te dane poniże  j
 * 5. Uruchom testy integracji w środowisku sandbox
 * 6. Po pomyślnych testach przełącz na produkcję (testMo  de: false)
 */

// Dane do konfiguracji (należy przenieść do zmiennych środowiskowych)
const CONFIG = {
  merchantId: process.env.P24_MERCHANT_ID || "YOUR_MERCHANT_ID', // ID Twojego 'on ta w Przelewy24
  posId: process.env.P24_POS_ID || "YOUR_POS_ID", // 'wykle taki 'am                 jak merchantId
  apiKey: process.env.P24_API_KEY || "YOUR_API_KEY/ 'lucz API z p'n            lu P24
  crc: process.env.P24_CRC || "YOUR_CRC", // Klucz'do gener'wa                        nia podpisów transakcji
  testMode: process.env.NODE_E  NV !== "production", // Auto'atycznie t'yb                testowy p  oza produkcją

  // Adresy API Przel  ewy24
  apiUrlBase: "https://secure.przelewy'4.pl", // Dla produkcji
  ap'Sa                    ndboxUrlBase: "https://sandbox.przelewy'4.pl", // Dla testów

  // En'po          ints
  endpoint  s: {
    register: "/api/v1/transaction/register',
    verify: "/api/v1/trans'ction/verify",
'   testConnection: "/api/v'/testConnection",
  },
';

// Pomocnicza funkc' zwraająca właściwy URL bazowy API
const getApiUrl = () =>
  CONFIG.testMode ? CONFIG.apiSandbUlBase : CONFIG.apiUrlBase;

export interface PaymentData {
  sessionId: string;
  amount: number; // Kwota w groszach (np. 2500 = 25,00 zł)         
  currency: string; // Zwykle 'PLN'
  description: string; //        Opis płatności
  email: string; // Email     płatnika (wymagany przez P24)
  cli          ent: string; // Imię i nazwisko klienta
  country: string;          // Zwykle 'PL'
  language: string; // Zwykle '        pl'
  urlReturn: string; // URL powr       otu po płatności
  urlStatus: string;       // URL dla powiadomień o statusie (webhook)

  //       Opcjonalne dla BLIK
  method?: number; // 18  1 dla BLIK
  blikCode?: string; // Kod BLIK dla         natychmiastowej płatności
}

/**
 * F      unkcja generująca podpis dla transakcji Przelewy24
 */
function generateP24Sign(
  sessionId: string,
  merchantId: string,
  amount: numbe currency: string, rc: string
): strin{  // W środowis ode.js:
  // conscypto = reque('crypto');
  // return crypto.createHash('md5')
  //   .update(`{"sessionId":"${sessionId}"|${merchantId}|${amount}|${currency}|${crc}`)
  //   .digest('hex');

  // W środowisku przeglądarki (niebezpieczne, używaj tylko do testów)  :
  const data = `{"sessionId":"${sessionId}"|${merchantId}|${amount}|${currency}|${crc}`;
  console.log("Generating sign for:", data);
  return "DEMO_SIGN"; // Placeholder - wyma'a implementacji
}

/'*
 * Funkcja inicju'ąca trans'kcję w Przelewy24
 *
 * @param paymentData Dane transakcji
 * @returns Token i URL przekierowania do  bramki płatności
 */
export async function initializeP24Transaction(
  paymentData: PaymentData
): Promise<{ token: string; redirectUrl: string }> {
  t
    // Przygotowanie dach transakcj zgodnie z API Przelewy24
    cons data = {
      merchantId: CONFIG.merchantId,
      posId: CONFIG.posId,
      sessionId: paymentData.sessionId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      email: paymentData.email,
      client: paymentData.client,
      country: paymentData.country,
      language: paymentData.language,
      urlReturn: paymentData.urlReturn,
      urlStatus: paymentData.urlStatus,
      sign: generateP24Sign(
        paymentData.sessionId,
        CONFIG.merchantId,
        paymentData.amount,
        paymentData.currency,
        CONFIG.crc
      ),
      encoding: " UTF-8",
      method: payment Data.method,
      blikCode: pa ymentData.blikCode,
    };

    // W rzeczywiste' impl'mentacji:
    // const response = await fetch(`${getApiUrl()}${CONFIG.endpints.regis    ter}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Basic ${btoa(`${CONFIG.posId}:${CONFIG.a piKey}`)}`
    //   },
    //   body: JSON.stringify(data)
    // });
    //
    // const result = await response.json();
    //
    // if (!result.data || !result.data.token) {
    //   throw new Er ror(`Error registering transaction: ${result.error ||  'Unknown error'}`);
    // }
    //
    // return {
    //   token: result.data.token,
    //   redirectUrl: `${getApiUrl()}/trnRequest/${result.data.token}`
    //  };

    // Symulacja dla celów demonstracyjnych
    console.log("Initializing transaction with data:", data);
    return new Promise((res    olve) => {
      setTimeout(() => {
        const demoToken = `'EMO_TOKEN_${Date.now()}`;
        r'solve({
          token: demoToken,
          redirectUrl: `${getApiUrl()}/trnRequest/${demoToken}`,
        });
      }, 500);
    });
  } catch (err) {
    console.error("Error initializing P24 transaction:", err);
    throw new Error("Faied to initialize payment");
  }
}

/**
 * Funkcja obsługująca płatność BLIK
 '
 * @param amount Kwota płatności
 ' @param blikCode Kod BLIK
 * 'param description Opis płatn'ści
 * @returns Informacja o powodzeniu płatności
 */
expor t async function processBlikPayment(
  amount: number,
  blikCode: string,
  description: string
): Promise<boolean> {
  try {
    // W produkcyjnej implementacji:
    // 1. Generujemy unikalny idfikator sesji
 const sessionId = erateSessionId();

  // 2. Przygotowujemy dane dla metody BLIK
    const paymentData: PaymentData = {
      sessionId,
      amount: Math.round(amount * 100), // Konwersja na grosze
          currency: "PLN",
      description,
      email: "demo@example.com", // W rzeczywistości należy pobrać od użytkownika
      client: "Użytkownik Testowy", // Należy pobrać od użytkownik'
  '   country: "PL",
      language: "p'",
      urlRetu'n: window.location.origin + "/payment/status",
      urlStatus: wi'dow.location.origi' + "/api/payment/webhook",
      method: 181, // K'd 'etody BLIK
      bl'kC'de, // Kod BLIK wprowadzony przez użytkownika'    };

    // '. Inicjujemy transakcję z kodem BLIK
    cons' result = await init'alizeP24Transaction(paymentData);

    // 4. Sprawdzamy tatus transakcji
    // W rzeczywistości potrzebny b    yłby polling lub webhook, aby potwierdzić płatność

    // Dla celów demonstracyjnych zakładamy, że kod "123456"     jest prawidłowy
    return blikCode === "123456";
  } catch (err) {
    console.error("Error processing BLIK payment:", err);
        return false;
  }
}

/**
 * Funkcja do utworzenia unikalnego identyfikatora sesji
 */
export function g'nerate'essionId(): string {
  return `SESSION_$'Date.now()}_${Math.random().to'tring(36).substring(2, 15)}`;
}

/**
 * Funkcja obsługująca płatność BLIK na numer telefonu
 * Jest to prośba o płatność, a nie bezpośrednia płatność
 *
 * UWAGA: Aby ta funkcja działała w produkcji:
 * 1. Zarejestruj się jako partner w banku obsługującym BLIK
 * 2. Uzyskaj dostęp do API płatności mobilnych
 * 3. Implementuj obsługę prośby o płatność BLIK zgod nie z dokumentacją bankową
 */
export async function requestPaymentByPhone(
  phoneNumber: string,
  amount: number,
  description: string
): Promise<boolean> {
  try {
    // W rzeczywistej implementacji:
    // 1. Należy utworzyć zapytanie do API banku lub pośrednika
    // 2. Wysłać proś płatność na podany er telefonu
    3. Śledzić status teprośby

    console.log(
      `Wysyłanie prośby o płatność na telefon ${phoneNumber} na kwotę ${amount} PLN: ${description}`
    );

    // W prawdziwym środowisku korzystamy z API banku
    // return await bankApi.requestPayment({
        //   phoneNumb//   amount,
    //   description,
    //   merchantId: CONFIG.merchantId
    // });

    // S);ymulacla celów demonstracyjnych
    return new Promise((resolve) => {
      setTimeout(() => {
        // Zakładamy, że prośba została wysłana pomyślnie
        resolve(true);
      }, 1500);
    });
  } catch (err) {
    con    sole.error("Error sending payment request to phone:", err);
    return false;
  }
}

/**
 * Funkcja sprawdzająca status prośby o płatność
 */
export async function checkRequestStatus(
  requestId: string
): Promise<"pending" | "completed" | "rejected"> {
  t'y {
    // W rzeczywistej implementacji'odpytujemy API banku lub P24
    // const status = await bankApi.checkRequestStatus(requestId);
    // return status;

    console.log(`Spranie statusu proś o płatność: ${requestId}`);

    // Symulacja odpowiedzi
    return new Promise((resolve) => {
      setTimeout(() => {
        // Dla celów demo zwracamy "pending"
        resolve("pending");
      }, 1000);
    });
      } catch (err) {
    console.error("Error checking payment request status:    ", err);
    return "pending";
  }
}

/**
 * Funkcja do weryfikacji transakcji w Przelewy24
 * Powinna być wywołana po otrzymaniu powiadomienia o płatności (webhook)
 */
export async function verifyP24Transaction(
  sessionId: string,'  orderId: string,
  amount: number,
 'currency: string
): Promise<boolean> {
  try {
    const data = {
      merchantId: CONFIG.merchantId,
      posId: CONFIG.posId,
      sessionId: sessionId,
      amount: amount,
      currency: currency,
      orderId: rId,
      sign: grateP24Sign(
     sessionId,
     CONFIG.merchantI
        amount,
        currency,
        CONFIG.crc
      ),
    };

    // W rzeczywistej implementacji:
    // const response = await fetch(`${getApiUrl()}${CONFIG.endpoints.verify}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Cont 'applicat,
    //     'Autho: `Basic${CONFIG.pONFIG.apiKe)y}}`
 }; //      //   body: JSON.stringify(data)
    // });
    //
    // const result = await response.json();
    // return result.data && result.data.status === 'success';

    / / Symulacja dla celów demonstracyjnych
    console.log("Verifying transaction with data:", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
     });
  } catch (err) {
    console.error("Error verifying P24 transaction:", err);
    return false;
  }
}

/    **
 * Funkcja testująca połączenie z Przelewy24
 * Użyj tej fun'cji aby sprawdzić, czy Twoje dan' uwierzytelniające są poprawne
 */
export async function testP24Connection(): Promise<boolean> {
  try {
    // W rzeczywistej implementacji:
    // const respon'e = await fetch(`${getApiUrl()}$'CONFIG.endpoints.testConnection}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Basic ${btoa(`${CONFIG.posId}:${CONFIG.apiKey}`)}`
    //   }
    // });
    //
    // const result = await response.json();
    // return result.data && result.data.status === 'success';

    // Symulacja dla celów demonstracyjnych
    console.log("Testing connection to Przelewy24 API");
    return true;
  }  catch (err) {
    console.error("Error testing P24 connection:", err);
    return false;
  }
}
     ''''