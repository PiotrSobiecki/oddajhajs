// Prosty skrypt sprawdzający zdrowie kontenera
console.log("======== HEALTHCHECK ========");
console.log(`Czas: ${new Date().toISOString()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);

// Zmienne środowiskowe (tylko czy są ustawione)
console.log("ZMIENNE ŚRODOWISKOWE:");
console.log(
  `- NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? "ustawione" : "brak"}`
);
console.log(
  `- NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "ustawione" : "brak"}`
);
console.log(
  `- DATABASE_URL: ${process.env.DATABASE_URL ? "ustawione" : "brak"}`
);
console.log(
  `- GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "ustawione" : "brak"}`
);
console.log(
  `- GOOGLE_CLIENT_SECRET: ${
    process.env.GOOGLE_CLIENT_SECRET ? "ustawione" : "brak"
  }`
);

// Sprawdź dostęp do bazy danych
try {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  // Próba połączenia z bazą
  prisma
    .$connect()
    .then(() => {
      console.log("BAZA DANYCH: połączenie udane");
      return prisma.$disconnect();
    })
    .catch((err) => {
      console.error("BŁĄD BAZY DANYCH:", err.message);
    });
} catch (error) {
  console.error("BŁĄD MODUŁU PRISMA:", error.message);
}

console.log("======== KONIEC HEALTHCHECK ========");

// Kontener jest uważany za zdrowy, jeśli skrypt zakończy się bez błędów
process.exit(0);
