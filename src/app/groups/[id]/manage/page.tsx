"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaTimes,
  FaTrash,
  FaExclamationTriangle,
  FaUserPlus,
  FaCheckCircle,
} from "react-icons/fa";

type Group = {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  members: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }[];
};

export default function ManageGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
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
    if (status === "authenticated") {
      fetchGroupDetails();
    }
  }, [status]);

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd pobierania danych grupy");
      }
      const groupData = await response.json();
      setGroup(groupData);
      setGroupName(groupData.name);
      setGroupDescription(groupData.description || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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

  const updateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd aktualizacji grupy");
      }

      // Odświeżanie danych
      await fetchGroupDetails();
      showToast("Dane ekipy zostały zaktualizowane!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGroup = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd usuwania grupy");
      }

      router.push("/dashboard");
    } catch (err: any) {
      showToast(err.message, "error");
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      // Najpierw sprawdzamy, czy członek nie jest powiązany z żadnymi wydatkami
      const checkResponse = await fetch(
        `/api/groups/${params.id}/members/${memberId}/check`,
        {
          method: "GET",
        }
      );

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();

        // Jeśli błąd dotyczy powiązania z wydatkami, wyświetlamy specjalną informację
        if (errorData.code === "MEMBER_HAS_EXPENSES") {
          showToast(
            "Tego członka nie można usunąć, ponieważ jest powiązany z wydatkami grupy.",
            "error"
          );
          return;
        }

        throw new Error(errorData.error || "Błąd sprawdzania członka grupy");
      }

      // Jeśli sprawdzenie przeszło pomyślnie, można usunąć członka
      const response = await fetch(
        `/api/groups/${params.id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd usuwania członka grupy");
      }

      showToast("Ziomek usunięty z ekipy! 👋", "success");

      // Wymuszamy pełne odświeżenie danych
      // Dodajemy krótkie opóźnienie, aby dać czas na przetworzenie zmian w bazie danych
      setTimeout(async () => {
        await fetchGroupDetails();

        // Dodatkowo filtrujemy listę członków lokalnie, aby natychmiast odzwierciedlić zmiany
        if (group) {
          setGroup({
            ...group,
            members: group.members.filter((m) => m.id !== memberId),
          });
        }
      }, 300);
    } catch (err: any) {
      showToast(err.message, "error");
      setError(err.message);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setAddingMember(true);
    setMemberError(null);

    try {
      const response = await fetch(`/api/groups/${params.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          name: newMemberName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd dodawania członka grupy");
      }

      showToast("Ziomek dodany do ekipy! 🎉", "success");

      // Odświeżanie danych grupy
      await fetchGroupDetails();
      setNewMemberEmail("");
      setNewMemberName("");
      setShowAddMemberForm(false);
    } catch (err: any) {
      setMemberError(err.message);
      showToast(err.message, "error");
    } finally {
      setAddingMember(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-white">Ładowanie...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md p-8 mx-auto bg-gray-800 rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Wymagane logowanie
        </h1>
        <p className="mb-6 text-gray-300">
          Musisz się zalogować, aby zarządzać tą grupą.
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
    );
  }

  if (error) {
    return (
      <div className="max-w-md p-8 mx-auto bg-gray-800 rounded-lg shadow-lg">
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
    );
  }

  if (!group) {
    return (
      <div className="max-w-md p-8 mx-auto bg-gray-800 rounded-lg shadow-lg">
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
    );
  }

  // Sprawdzenie czy użytkownik jest twórcą grupy
  const isCreator = session?.user?.id === group.creatorId;
  if (!isCreator) {
    return (
      <div className="max-w-md p-8 mx-auto bg-gray-800 rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-red-500">Brak dostępu</h1>
        <p className="mb-6 text-gray-300">
          Tylko twórca grupy może zarządzać jej ustawieniami.
        </p>
        <div className="flex justify-center">
          <Link
            href={`/groups/${params.id}`}
            className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Wróć do grupy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/groups/${params.id}`}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <FaArrowLeft /> Wróć do grupy
        </Link>
      </div>

      <h1 className="mb-8 text-3xl font-bold text-white">
        Zarządzanie grupą: {group.name}
      </h1>

      <div className="grid gap-8 md:grid-cols-1">
        {/* Informacje o grupie */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Edytuj ekipę
          </h2>
          <form onSubmit={updateGroup}>
            <div className="mb-4">
              <label
                htmlFor="groupName"
                className="block mb-1 text-sm font-medium text-gray-300"
              >
                Nazwa ekipy
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="groupDescription"
                className="block mb-1 text-sm font-medium text-gray-300"
              >
                O co chodzi? (opcjonalnie)
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
            </div>
          </form>
        </div>

        {/* Zarządzanie członkami */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Ziomki w ekipie
            </h2>
            <button
              onClick={() => setShowAddMemberForm(true)}
              className="flex items-center gap-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <FaUserPlus className="mr-1" /> Dodaj
            </button>
          </div>

          {/* Formularz dodawania nowego członka */}
          {showAddMemberForm && (
            <div className="p-4 mb-6 bg-gray-700 rounded-lg">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-medium text-white">
                  Dodaj nowego ziomka
                </h3>
                <button
                  onClick={() => setShowAddMemberForm(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={addMember}>
                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Email ziomka
                  </label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="przykład@email.com"
                    className="w-full p-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Ksywka (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Imię i nazwisko"
                    className="w-full p-2 text-white bg-gray-600 border border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <p className="mb-4 text-xs text-gray-400">
                  Jeśli użytkownik jeszcze nie korzysta z aplikacji, zostanie
                  automatycznie utworzony.
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(false)}
                    className="px-4 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-500"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={addingMember || !newMemberEmail}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingMember ? "Dodajemy..." : "Dodaj ziomka"}
                  </button>
                </div>

                {memberError && (
                  <p className="mt-2 text-sm text-red-400">{memberError}</p>
                )}
              </form>
            </div>
          )}

          <div className="space-y-3">
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
                      className="object-cover w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full">
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
                {member.user.id !== group.creatorId && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                    title="Usuń członka"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Usuwanie grupy */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-red-500">
            Niebezpieczna strefa
          </h2>
          <p className="mb-4 text-gray-300">
            Usunięcie grupy jest operacją nieodwracalną. Wszystkie dane związane
            z tą grupą, w tym rozliczenia i członkowie, zostaną trwale usunięte.
          </p>

          {showDeleteConfirm ? (
            <div className="p-4 mb-4 border border-red-500 rounded-md bg-red-900/30">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="flex-shrink-0 text-2xl text-red-500" />
                <div>
                  <h3 className="mb-2 font-semibold text-white">
                    Czy na pewno chcesz usunąć tę grupę?
                  </h3>
                  <p className="mb-4 text-sm text-gray-300">
                    Ta operacja jest nieodwracalna i spowoduje utratę wszystkich
                    danych związanych z grupą.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-500"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={deleteGroup}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Usuwanie..." : "Tak, usuń grupę"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={deleteGroup}
              className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <FaTrash /> Usuń grupę
            </button>
          )}
        </div>
      </div>

      {/* Toast powiadomienie */}
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
