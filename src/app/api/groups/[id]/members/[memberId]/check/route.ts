import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/members/[memberId]/check - sprawdź, czy członek może zostać usunięty
export async function GET(
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

    // Sprawdź, czy członek jest powiązany z jakimikolwiek wydatkami
    // 1. Sprawdź, czy członek jest osobą płacącą
    const paidExpenses = await prisma.expense.count({
      where: {
        groupId: id,
        paidById: memberId,
      },
    });

    // 2. Sprawdź, czy członek uczestniczy w jakimś wydatku
    const participatingExpenses = await prisma.expenseSplit.count({
      where: {
        memberId: memberId,
      },
    });

    // 3. Sprawdź, czy członek ma przypisane jakieś płatności w złożonych wydatkach
    const complexPayments = await prisma.payment.count({
      where: {
        memberId: memberId,
      },
    });

    // Jeśli członek jest powiązany z jakimikolwiek wydatkami, nie może zostać usunięty
    if (paidExpenses > 0 || participatingExpenses > 0 || complexPayments > 0) {
      return NextResponse.json(
        {
          error:
            "Ten członek nie może zostać usunięty, ponieważ jest powiązany z wydatkami",
          code: "MEMBER_HAS_EXPENSES",
          paidExpenses,
          participatingExpenses,
          complexPayments,
        },
        { status: 400 }
      );
    }

    // Jeśli doszliśmy do tego miejsca, członek może zostać usunięty
    return NextResponse.json({ canBeRemoved: true });
  } catch (error) {
    console.error("Błąd podczas sprawdzania członka grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas sprawdzania członka grupy" },
      { status: 500 }
    );
  }
}
