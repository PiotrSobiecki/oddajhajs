"use client";

import React from "react";
import {
  FaTimes,
  FaMoneyBillWave,
  FaUserFriends,
  FaHandshake,
  FaBeer,
  FaPizzaSlice,
} from "react-icons/fa";

interface IntroPopupProps {
  onClose: () => void;
}

export default function IntroPopup({ onClose }: IntroPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Witaj w oddajhajs.org! 💸
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Zamknij"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <FaMoneyBillWave className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Wyciągaj hajs od znajomych jak profesjonalista!
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Melanż stulecia? Wyjazd z ziomeczkami? Zamówione 8 kebsów po
              imprezie? Ktoś wyciągnął kartę, ktoś nie pamięta ile dał, a ktoś
              zapomniał portfela... Klasyk! 🤦‍♂️
            </p>

            <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
              <p className="text-gray-700 dark:text-gray-200 font-medium">
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  oddajhajs.org
                </span>{" "}
                to aplikacja dla tych, którzy chcą się rozliczyć z koleżkami i
                koleżankami:
              </p>
              <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <FaPizzaSlice className="mt-1 mr-2 text-blue-500" />
                  <span>
                    Wrzucasz wszystkie wydatki z imprezy - nawet te, których
                    nikt nie pamięta 🍕
                  </span>
                </li>
                <li className="flex items-start">
                  <FaBeer className="mt-1 mr-2 text-blue-500" />
                  <span>
                    Zaznaczasz kto pił, jadł i bawił się za cudzesy 🍻
                  </span>
                </li>
                <li className="flex items-start">
                  <FaHandshake className="mt-1 mr-2 text-blue-500" />
                  <span>
                    My liczymy kto komu ile ma oddać - bez waszych kreatywnych
                    interpretacji
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-gray-600 dark:text-gray-300">
              Zero rejestracji, zero logowania, zero komplikacji - za to 100%
              skuteczności w rozliczeniu kasy ze znajomymi, którzy "zapomną
              oddać" albo "nie pamiętają że byli nam coś winni". Teraz macie
              wszystko czarno na białym! 😎
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Dawaj, odzyskajmy ten hajs!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
