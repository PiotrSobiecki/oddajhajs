import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/members - pobierz członków grupy
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
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            isActive: true,
          },
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
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie została znaleziona" },
        { status: 404 }
      );
    }

    // Sprawdź, czy użytkownik ma dostęp do grupy
    const isCreator = group.creatorId === session.user.id;
    const isMember = group.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isCreator && !isMember) {
      return NextResponse.json(
        { error: "Brak dostępu do tej grupy" },
        { status: 403 }
      );
    }

    return NextResponse.json(group.members);
  } catch (error) {
    console.error("Błąd podczas pobierania członków grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania członków grupy" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/members - dodaj członka do grupy
export async function POST(
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
      include: {
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie została znaleziona" },
        { status: 404 }
      );
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Tylko twórca grupy może dodawać członków" },
        { status: 403 }
      );
    }

    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email jest wymagany" },
        { status: 400 }
      );
    }

    // Sprawdź, czy użytkownik istnieje
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Jeśli użytkownik nie istnieje, automatycznie go utwórz
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0], // Użyj podanej nazwy lub części adresu email jako nazwy
        },
      });
    }

    // Sprawdź, czy użytkownik jest już członkiem grupy
    const existingMember = group.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      if (existingMember.isActive) {
        return NextResponse.json(
          { error: "Użytkownik jest już członkiem tej grupy" },
          { status: 400 }
        );
      } else {
        // Reaktywuj członka
        const updatedMember = await prisma.groupMember.update({
          where: { id: existingMember.id },
          data: { isActive: true },
        });
        return NextResponse.json(updatedMember);
      }
    }

    // Dodaj nowego członka
    const newMember = await prisma.groupMember.create({
      data: {
        group: {
          connect: { id },
        },
        user: {
          connect: { id: user.id },
        },
      },
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
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Błąd podczas dodawania członka grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas dodawania członka grupy" },
      { status: 500 }
    );
  }
}
