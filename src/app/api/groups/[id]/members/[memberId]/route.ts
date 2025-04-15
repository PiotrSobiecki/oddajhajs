import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/groups/[id]/members/[memberId] - usuń członka z grupy
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  const { id, memberId } = params;

  try {
    // Sprawdź, czy użytkownik jest twórcą grupy
    const group = await prisma.group.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupa nie została znaleziona" },
        { status: 404 }
      );
    }

    // Sprawdź, czy usuwający jest twórcą grupy lub usuwa siebie
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Członek nie został znaleziony" },
        { status: 404 }
      );
    }

    const isCreator = group.creatorId === session.user.id;
    const isSelfRemoval = member.userId === session.user.id;

    if (!isCreator && !isSelfRemoval) {
      return NextResponse.json(
        {
          error: "Nie masz uprawnień do usunięcia tego członka z grupy",
        },
        { status: 403 }
      );
    }

    // Nie usuwaj członka, tylko dezaktywuj (soft delete)
    const updatedMember = await prisma.groupMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd podczas usuwania członka grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania członka grupy" },
      { status: 500 }
    );
  }
}
