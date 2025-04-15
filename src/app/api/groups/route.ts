import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups - pobierz wszystkie grupy użytkownika
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  try {
    // Pobierz grupy utworzone przez użytkownika
    const createdGroups = await prisma.group.findMany({
      where: {
        creatorId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Pobierz grupy, do których użytkownik został dodany
    const memberGroups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
            isActive: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Usuń duplikaty (może być w obu zestawach)
    const allGroupIds = new Set([
      ...createdGroups.map((g) => g.id),
      ...memberGroups.map((g) => g.id),
    ]);

    const allGroups = await prisma.group.findMany({
      where: {
        id: {
          in: Array.from(allGroupIds),
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(allGroups);
  } catch (error) {
    console.error("Błąd podczas pobierania grup:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania grup" },
      { status: 500 }
    );
  }
}

// POST /api/groups - utwórz nową grupę
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany ziom!" },
      { status: 401 }
    );
  }

  try {
    const { name, description } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "No dawaj, nazwa grupy musi być!" },
        { status: 400 }
      );
    }

    // Tworzymy nową grupę i od razu dodajemy twórcę jako pierwszego członka
    const newGroup = await prisma.group.create({
      data: {
        name,
        description,
        creator: {
          connect: {
            id: session.user.id,
          },
        },
        // Dodajemy twórcę jako pierwszego członka grupy
        members: {
          create: {
            userId: session.user.id,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Błąd podczas tworzenia grupy:", error);
    return NextResponse.json(
      { error: "Coś poszło nie tak! Nie udało się stworzyć grupy." },
      { status: 500 }
    );
  }
}
