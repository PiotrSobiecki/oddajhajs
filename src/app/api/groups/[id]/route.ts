import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id] - pobierz szczegóły grupy
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  const { id } = params;

  try {
    // Sprawdź, czy użytkownik ma dostęp do grupy
    const member = await prisma.groupMember.findFirst({
      where: {
        groupId: id,
        userId: session.user.id,
        isActive: true,
      },
    });

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        expenses: {
          include: {
            paidBy: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            splitBetween: {
              include: {
                member: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            payments: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie została znaleziona" },
        { status: 404 }
      );
    }

    // Użytkownik musi być członkiem grupy lub jej twórcą
    if (!member && group.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Brak dostępu do tej grupy" },
        { status: 403 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Błąd podczas pobierania szczegółów grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania szczegółów grupy" },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - zaktualizuj grupę
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  const { id } = params;

  try {
    // Sprawdź, czy użytkownik jest twórcą grupy
    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie została znaleziona" },
        { status: 404 }
      );
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Tylko twórca grupy może ją edytować" },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nazwa grupy jest wymagana" },
        { status: 400 }
      );
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Błąd podczas aktualizacji grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji grupy" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - usuń grupę
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  const { id } = params;

  try {
    // Sprawdź, czy użytkownik jest twórcą grupy
    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie została znaleziona" },
        { status: 404 }
      );
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Tylko twórca grupy może ją usunąć" },
        { status: 403 }
      );
    }

    // Usuń wszystkie powiązane rekordy (kaskadowe usuwanie jest zdefiniowane w schemacie)
    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd podczas usuwania grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania grupy" },
      { status: 500 }
    );
  }
}
