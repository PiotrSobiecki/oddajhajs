import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/groups/[id]/expenses/[expenseId] - aktualizacja wydatku
export async function PUT(
  request: Request,
  { params }: { params: { id: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  const { id, expenseId } = params;

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

    // Sprawdź, czy wydatek istnieje i należy do tej grupy
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        groupId: id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Wydatek nie został znaleziony" },
        { status: 404 }
      );
    }

    const data = await request.json();

    const {
      description,
      amount,
      paidBy,
      splitBetween,
      isComplexPayment = false,
      payments = [],
    } = data;

    // Walidacja
    if (!description) {
      return NextResponse.json(
        { error: "Brak opisu wydatku" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Kwota musi być większa od zera" },
        { status: 400 }
      );
    }

    if (!isComplexPayment && !paidBy) {
      return NextResponse.json(
        { error: "Należy wskazać kto zapłacił" },
        { status: 400 }
      );
    }

    if (!splitBetween || splitBetween.length === 0) {
      return NextResponse.json(
        { error: "Należy wskazać kto uczestniczy w wydatku" },
        { status: 400 }
      );
    }

    if (isComplexPayment && (!payments || payments.length === 0)) {
      return NextResponse.json(
        { error: "Należy podać szczegóły złożonej płatności" },
        { status: 400 }
      );
    }

    // Pobierz wszystkich członków grupy
    const allMembers = await prisma.groupMember.findMany({
      where: {
        groupId: id,
        isActive: true,
      },
    });

    const memberIds = allMembers.map((m) => m.id);
    const userIds = allMembers.map((m) => m.userId);

    // Znajdź ID członków grupy na podstawie ID użytkowników
    const getMemberIdByUserId = (userId: string): string | null => {
      const member = allMembers.find((m) => m.userId === userId);
      return member ? member.id : null;
    };

    // Sprawdź czy wszystkie osoby w splitBetween są członkami grupy
    const allUsersInGroup = splitBetween.every((userId: string) =>
      userIds.includes(userId)
    );
    if (!allUsersInGroup) {
      return NextResponse.json(
        { error: "Niektóre osoby nie są członkami grupy" },
        { status: 400 }
      );
    }

    // Przekształć ID użytkowników na ID członków grupy dla splitBetween
    const splitBetweenMemberIds = splitBetween
      .map((userId: string) => getMemberIdByUserId(userId))
      .filter((id: string | null): id is string => id !== null);

    // Rozpocznij transakcję, aby zmiany były atomowe
    await prisma.$transaction(async (tx) => {
      // Usuń istniejące relacje splitBetween
      await tx.expenseSplit.deleteMany({
        where: {
          expenseId,
        },
      });

      // Dla złożonych płatności usuń istniejące płatności
      if (isComplexPayment || existingExpense.isComplexPayment) {
        await tx.payment.deleteMany({
          where: {
            expenseId,
          },
        });
      }

      // Aktualizuj podstawowe dane wydatku
      let updatedExpense = await tx.expense.update({
        where: {
          id: expenseId,
        },
        data: {
          description,
          amount,
          isComplexPayment,
          // Dla złożonych płatności usuwamy paidById
          ...(isComplexPayment ? { paidById: null } : {}),
        },
      });

      // Dla standardowych płatności dodaj paidById
      if (!isComplexPayment) {
        const paidByMemberId = getMemberIdByUserId(paidBy);
        if (!paidByMemberId) {
          throw new Error("Osoba płacąca nie jest członkiem grupy");
        }

        updatedExpense = await tx.expense.update({
          where: {
            id: expenseId,
          },
          data: {
            paidById: paidByMemberId,
          },
        });
      }

      // Dodaj nowe relacje splitBetween
      for (const memberId of splitBetweenMemberIds) {
        await tx.expenseSplit.create({
          data: {
            expenseId,
            memberId,
          },
        });
      }

      // Dla złożonych płatności dodaj nowe płatności
      if (isComplexPayment) {
        for (const payment of payments) {
          const memberId = getMemberIdByUserId(payment.personId);
          if (!memberId) {
            throw new Error("Nieznany członek grupy");
          }

          await tx.payment.create({
            data: {
              expenseId,
              memberId,
              amount: payment.amount,
            },
          });
        }
      }
    });

    // Pobierz zaktualizowany wydatek z wszystkimi powiązanymi danymi
    const updatedExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        paidBy: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        splitBetween: {
          include: {
            member: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!updatedExpense) {
      throw new Error("Nie udało się zaktualizować wydatku");
    }

    // Przekształć dane do formatu wymaganego przez klienta
    const formattedExpense = {
      id: updatedExpense.id,
      description: updatedExpense.description,
      amount: updatedExpense.amount,
      date: updatedExpense.date,
      paidBy: updatedExpense.paidBy?.user.id || "",
      splitBetween: updatedExpense.splitBetween.map(
        (split) => split.member.user.id
      ),
      isComplexPayment: updatedExpense.isComplexPayment,
      payments: updatedExpense.isComplexPayment
        ? updatedExpense.payments.map((payment) => {
            const member = allMembers.find((m) => m.id === payment.memberId);
            return {
              personId: member?.userId || "",
              amount: payment.amount,
            };
          })
        : undefined,
    };

    return NextResponse.json(formattedExpense);
  } catch (error) {
    console.error("Błąd podczas aktualizacji wydatku:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji wydatku" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/expenses/[expenseId] - usunięcie wydatku
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Nie zalogowano" }, { status: 401 });
  }

  const { id, expenseId } = params;

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

    // Sprawdź, czy wydatek istnieje i należy do tej grupy
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        groupId: id,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Wydatek nie został znaleziony" },
        { status: 404 }
      );
    }

    // Usuń wydatek wraz z powiązanymi relacjami (splitBetween, payments)
    // Dzięki relacjom onDelete: Cascade w schemacie, te powiązane rekordy
    // zostaną automatycznie usunięte
    await prisma.expense.delete({
      where: {
        id: expenseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd podczas usuwania wydatku:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania wydatku" },
      { status: 500 }
    );
  }
}
