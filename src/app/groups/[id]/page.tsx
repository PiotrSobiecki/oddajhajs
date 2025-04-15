"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaUserPlus,
  FaCog,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";

// Definiujemy typy zamiast importować z @prisma/client
interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
}

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  isActive: boolean;
  joinedAt: Date;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  groupId: string;
  paidById: string | null;
  isComplexPayment: boolean;
}

// Rozszerzone typy dla pełnych danych
type FullGroupMember = GroupMember & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

type FullGroup = Group & {
  members: FullGroupMember[];
  expenses: Expense[];
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export default function GroupPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const [group, setGroup] = useState<FullGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [email, setEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error";
  }>({
    message: "",
    visible: false,
    type: "success",
  });

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetchGroupDetails();
    }
  }, [status, params.id]);

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/groups/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd pobierania danych grupy");
      }
      const data = await response.json();
      setGroup(data);
    } catch (err: any) {
      setError(err.message || "Wystąpił nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${params.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name: memberName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Błąd podczas dodawania członka grupy"
        );
      }

      // Odśwież listę członków
      await fetchGroupDetails();
      setEmail("");
      setMemberName("");
      setShowAddMemberForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      message,
      visible: true,
      type,
    });

    // Automatycznie ukrywamy toast po 5 sekundach
    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
      }));
    }, 5000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-xl text-white">Ładowanie...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex justify-center py-12">
        <div className="max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Wymagane logowanie
          </h1>
          <p className="mb-6 text-gray-300">
            Musisz się zalogować, aby zobaczyć tę grupę rozliczeń.
          </p>
          <div className="flex justify-center">
            <Link
              href="/login"
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Przejdź do logowania
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-12">
        <div className="max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-red-500">Błąd</h1>
          <p className="mb-6 text-gray-300">{error}</p>
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Wróć do panelu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex justify-center py-12">
        <div className="max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Grupa nie znaleziona
          </h1>
          <p className="mb-6 text-gray-300">
            Grupa o podanym identyfikatorze nie istnieje lub nie masz do niej
            dostępu.
          </p>
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Wróć do panelu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = session?.user?.id === group.creatorId;

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <FaArrowLeft /> Wróć do listy grup
          </Link>
        </div>
        <div>
          {isCreator && (
            <Link
              href={`/groups/${group.id}/manage`}
              className="flex items-center gap-2 px-4 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FaCog /> Zarządzaj grupą
            </Link>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{group.name}</h1>
        {group.description && (
          <p className="mt-2 text-gray-400">{group.description}</p>
        )}
      </div>

      <div className="mb-8">
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Ekipa</h2>
            {isCreator && (
              <button
                onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaUserPlus className="text-xs" /> Dodaj
              </button>
            )}
          </div>

          {showAddMemberForm && (
            <div className="p-4 mb-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">
                  Dodaj ziomka do ekipy
                </h3>
                <button
                  onClick={() => setShowAddMemberForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={addMember} className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1 text-sm font-medium text-gray-300"
                  >
                    Email ziomka
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="przyklad@email.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="memberName"
                    className="block mb-1 text-sm font-medium text-gray-300"
                  >
                    Ksywka (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    id="memberName"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full p-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Imię i nazwisko"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Jeśli ziomek jeszcze nie ma konta, stworzymy mu
                    automatycznie.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(false)}
                    className="px-3 py-1 text-sm text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Dodawanie..." : "Dodaj ziomka"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
              >
                <div className="flex items-center gap-3">
                  {member.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.user.image}
                      alt={member.user.name || ""}
                      className="object-cover w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full">
                      {member.user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {member.user.name || "Użytkownik"}
                      {member.user.id === group.creatorId && (
                        <span className="ml-2 text-xs text-blue-400">
                          (twórca)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{member.user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {group.expenses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href={
              group.members.length >= 2 ? `/groups/${group.id}/expenses` : "#"
            }
            className={`flex items-center justify-center py-3 text-lg font-medium text-white ${
              group.members.length >= 2
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-600/50 cursor-not-allowed"
            } rounded-lg transition-colors`}
            onClick={(e) => {
              if (group.members.length < 2) {
                e.preventDefault();
                showToast(
                  "Do działania z wydatkami potrzeba co najmniej 2 ziomków w ekipie",
                  "error"
                );
              }
            }}
            aria-disabled={group.members.length < 2}
          >
            Teraz wrzucamy wydatki! →
          </Link>
          <Link
            href={
              group.members.length >= 2
                ? `/groups/${group.id}/expenses#rozliczenia`
                : "#"
            }
            className={`flex items-center justify-center py-3 text-lg font-medium text-white ${
              group.members.length >= 2
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-purple-600/50 cursor-not-allowed"
            } rounded-lg transition-colors`}
            onClick={(e) => {
              if (group.members.length < 2) {
                e.preventDefault();
                showToast(
                  "Do działania z rozliczeniami potrzeba co najmniej 2 członków grupy",
                  "error"
                );
              }
            }}
            aria-disabled={group.members.length < 2}
          >
            Pokaż rozliczenia →
          </Link>
        </div>
      ) : (
        <div className="mb-8">
          <Link
            href={
              group.members.length >= 2 ? `/groups/${group.id}/expenses` : "#"
            }
            className={`flex items-center justify-center w-full py-3 text-lg font-medium text-white ${
              group.members.length >= 2
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-600/50 cursor-not-allowed"
            } rounded-lg transition-colors`}
            onClick={(e) => {
              if (group.members.length < 2) {
                e.preventDefault();
                showToast(
                  "Do działania z wydatkami potrzeba co najmniej 2 ziomków w ekipie",
                  "error"
                );
              }
            }}
            aria-disabled={group.members.length < 2}
          >
            Teraz wrzucamy wydatki! →
          </Link>
        </div>
      )}

      {/* Toast notification */}
      {toast.visible && (
        <div
          className={`fixed bottom-8 inset-x-0 mx-auto max-w-md z-50 flex items-center justify-center gap-3 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white px-8 py-4 rounded-lg shadow-xl animate-bounceIn`}
        >
          {toast.type === "success" ? (
            <FaCheckCircle className="text-2xl text-white" />
          ) : (
            <FaExclamationTriangle className="text-2xl text-white" />
          )}
          <span className="text-lg font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Zamknij powiadomienie"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
export const dynamicParams = true;
