import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/groups/[id]/expenses - pobierz wydatki grupy
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

    // Pobierz członków grupy, aby mieć mapowanie memberId -> userId
    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId: id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Utwórz mapę memberId -> userId dla łatwiejszego dostępu
    const memberIdToUserId = new Map<string, string>();
    groupMembers.forEach((m) => {
      memberIdToUserId.set(m.id, m.user.id);
    });

    // Pobierz wydatki grupy
    const expenses = await prisma.expense.findMany({
      where: {
        groupId: id,
      },
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
      orderBy: {
        date: "desc",
      },
    });

    // Przekształć dane do formatu wymaganego przez klienta
    const formattedExpenses = expenses.map((expense) => {
      // Dla standardowych wydatków (nie złożonych płatności)
      if (!expense.isComplexPayment) {
        return {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
          paidBy: expense.paidBy?.user.id,
          splitBetween: expense.splitBetween.map(
            (split) => split.member.user.id
          ),
          isComplexPayment: false,
        };
      }
      // Dla złożonych płatności
      else {
        return {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
          paidBy: "", // Puste dla złożonych płatności
          splitBetween: expense.splitBetween.map(
            (split) => split.member.user.id
          ),
          isComplexPayment: true,
          payments: expense.payments.map((payment) => {
            // Tutaj mapujemy memberId na userId dla płatności złożonych
            const userId = memberIdToUserId.get(payment.memberId);
            return {
              personId: userId, // Używamy userId zamiast memberId
              amount: payment.amount,
            };
          }),
        };
      }
    });

    return NextResponse.json(formattedExpenses);
  } catch (error) {
    console.error("Błąd podczas pobierania wydatków grupy:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania wydatków grupy" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/expenses - dodaj wydatek do grupy
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

    // Sprawdź, czy wszystkie osoby biorące udział w wydatku są członkami grupy
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

    // Utwórz wydatek w bazie danych
    let newExpense: any;

    if (isComplexPayment) {
      // Dla złożonych płatności
      newExpense = await prisma.expense.create({
        data: {
          description,
          amount,
          groupId: id,
          isComplexPayment: true,
          date: new Date(),
          splitBetween: {
            create: splitBetweenMemberIds.map((memberId: string) => ({
              member: {
                connect: { id: memberId },
              },
            })),
          },
          // Dodamy płatności po utworzeniu wydatku
        },
      });

      // Dodaj płatności
      const paymentPromises = payments.map(
        (payment: { personId: string; amount: number }) => {
          const memberId = getMemberIdByUserId(payment.personId);
          if (!memberId) {
            throw new Error("Nieznany członek grupy");
          }

          return prisma.payment.create({
            data: {
              expenseId: newExpense.id,
              memberId,
              amount: payment.amount,
            },
          });
        }
      );

      await Promise.all(paymentPromises);
    } else {
      // Dla standardowych płatności
      const paidByMemberId = getMemberIdByUserId(paidBy);
      if (!paidByMemberId) {
        return NextResponse.json(
          { error: "Osoba płacąca nie jest członkiem grupy" },
          { status: 400 }
        );
      }

      newExpense = await prisma.expense.create({
        data: {
          description,
          amount,
          groupId: id,
          paidById: paidByMemberId,
          isComplexPayment: false,
          date: new Date(),
          splitBetween: {
            create: splitBetweenMemberIds.map((memberId: string) => ({
              member: {
                connect: { id: memberId },
              },
            })),
          },
        },
      });
    }

    // Pobierz utworzony wydatek z wszystkimi powiązanymi danymi
    const createdExpense = await prisma.expense.findUnique({
      where: { id: newExpense.id },
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

    if (!createdExpense) {
      throw new Error("Nie udało się utworzyć wydatku");
    }

    // Przekształć dane do formatu wymaganego przez klienta
    const formattedExpense = {
      id: createdExpense.id,
      description: createdExpense.description,
      amount: createdExpense.amount,
      date: createdExpense.date,
      paidBy: createdExpense.paidBy?.user.id || "",
      splitBetween: createdExpense.splitBetween.map(
        (split) => split.member.user.id
      ),
      isComplexPayment: createdExpense.isComplexPayment,
      payments: createdExpense.isComplexPayment
        ? createdExpense.payments.map((payment) => {
            const member = allMembers.find((m) => m.id === payment.memberId);
            return {
              personId: member?.userId || "",
              amount: payment.amount,
            };
          })
        : undefined,
    };

    return NextResponse.json(formattedExpense, { status: 201 });
  } catch (error) {
    console.error("Błąd podczas dodawania wydatku:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas dodawania wydatku" },
      { status: 500 }
    );
  }
}
