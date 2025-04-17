import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/user/update - aktualizacja danych użytkownika
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  try {
    const { displayName } = await request.json();

    if (!displayName || displayName.trim() === "") {
      return NextResponse.json(
        { error: "Nazwa użytkownika jest wymagana" },
        { status: 400 }
      );
    }

    // Aktualizacja nazwy użytkownika w bazie danych
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: displayName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Błąd podczas aktualizacji danych użytkownika:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji danych użytkownika" },
      { status: 500 }
    );
  }
}
