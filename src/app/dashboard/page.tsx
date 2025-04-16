"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaTrash,
  FaUsers,
  FaUserEdit,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import Footer from "@/components/Footer";
import Instructions from "@/components/Instructions";

// Definiuję własny typ Group zamiast importować z Prisma, aby uniknąć błędów
type Group = {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // ID grupy do usunięcia
  const [showInstructions, setShowInstructions] = useState(false);
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
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchGroups();
    }
  }, [status, router]);

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

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        showToast(
          "Nie udało się pobrać grup. Spróbuj odświeżyć stronę!",
          "error"
        );
      }
    } catch (error) {
      console.error("Błąd pobierania grup:", error);
      showToast("Wystąpił błąd podczas pobierania grup", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      if (response.ok) {
        setNewGroupName("");
        setNewGroupDescription("");
        setShowNewGroupForm(false);
        fetchGroups();
        showToast("Ekipa została stworzona! 🎉", "success");
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Coś poszło nie tak przy tworzeniu ekipy"
        );
      }
    } catch (error: any) {
      console.error("Błąd tworzenia grupy:", error);
      showToast(
        error.message || "Wystąpił błąd podczas tworzenia grupy",
        "error"
      );
    }
  };

  const initDeleteGroup = (groupId: string) => {
    setConfirmDelete(groupId);
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchGroups();
        showToast("Grupa została usunięta. Nie ma już śladu! 👋", "success");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nie udało się wywalić grupy");
      }
    } catch (error: any) {
      console.error("Błąd usuwania grupy:", error);
      showToast(
        error.message || "Wystąpił błąd podczas usuwania grupy",
        "error"
      );
    } finally {
      setConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-xl text-white">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Moje ekipy do rozliczeń 🤝
          </h1>
          <p className="text-gray-400">Tu ogarniasz hajs ze swoimi ziomkami.</p>
        </div>
        <div>
          <button
            onClick={() => setShowNewGroupForm(true)}
            className="flex items-center justify-center gap-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors sm:px-4 sm:py-2"
          >
            <FaPlus className="w-5 h-5 m-3 sm:m-0" />
            <span className="hidden sm:inline">Utwórz nową grupę</span>
          </button>
        </div>
      </div>

      {showNewGroupForm && (
        <div className="p-6 mb-8 bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Utwórz nową ekipę
            </h2>
            <button
              onClick={() => setShowNewGroupForm(false)}
              className="text-gray-400 hover:text-white"
            >
              &times;
            </button>
          </div>
          <form onSubmit={createGroup} className="space-y-4">
            <div>
              <label
                htmlFor="groupName"
                className="block mb-1 text-sm font-medium text-gray-300"
              >
                Nazwa ekipy
              </label>
              <input
                type="text"
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="np. Majówka 2023 🏖️"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="groupDescription"
                className="block mb-1 text-sm font-medium text-gray-300"
              >
                O co chodzi? (opcjonalnie)
              </label>
              <textarea
                id="groupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Np. Wyjazd na majówkę, 5 osób, dużo piwa 🍻"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewGroupForm(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Utwórz grupę
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Potwierdzenie usunięcia grupy */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-md mx-4">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Na pewno chcesz to zrobić?
            </h2>
            <p className="mb-6 text-gray-300">
              Czy na serio chcesz usunąć tę ekipę? Wszystko zniknie, nie da się
              tego cofnąć!
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Anuluj
              </button>
              <button
                onClick={() => deleteGroup(confirmDelete)}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Usuń ekipę
              </button>
            </div>
          </div>
        </div>
      )}

      {groups.length > 0 ? (
        <div
          className={`grid gap-4 ${
            groups.length === 1 ? "" : "sm:grid-cols-2"
          }`}
        >
          {groups.map((group) => (
            <div
              key={group.id}
              className="p-6 bg-gray-800 rounded-lg shadow-md hover:bg-gray-750 transition-colors"
            >
              <h3 className="mb-2 text-xl font-medium text-white">
                {group.name}
              </h3>
              {group.description && (
                <p className="mb-4 text-sm text-gray-400">
                  {group.description}
                </p>
              )}
              <div className="flex mt-4 space-x-2">
                <Link
                  href={`/groups/${group.id}`}
                  className="flex items-center justify-center flex-1 gap-1 px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <FaUsers className="text-sm" /> Otwórz
                </Link>
                <Link
                  href={`/groups/${group.id}/manage`}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                  title="Zarządzaj grupą"
                >
                  <FaUserEdit className="text-sm" />
                </Link>
                <button
                  onClick={() => initDeleteGroup(group.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-red-400"
                  title="Usuń grupę"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-800 rounded-lg shadow-md">
          <h3 className="mb-2 text-xl font-medium text-white">
            Nie masz jeszcze żadnej ekipy 😢
          </h3>
          <p className="mb-4 text-gray-400">
            Stwórz swoją pierwszą ekipę i zacznij ogarniać hajs ze znajomymi! 🚀
          </p>
        </div>
      )}

      <div className="mt-12 mb-4 text-center">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Wróć do klasycznego trybu (bez logowania).
        </Link>
      </div>

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

      {showInstructions && <Instructions onClose={handleCloseInstructions} />}
    </div>
  );
}
