"use client";

import React from "react";
import { FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-2">OddajHajs.org</h3>
          <p className="text-gray-400 mb-2">
            Aplikacja do rozliczania wydatków grupowych w prosty i intuicyjny
            sposób.
          </p>
          <p className="text-gray-400 mb-2">
            <a
              href="https://www.facebook.com/groups/4079654065600660"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2"
            >
              <FaFacebook /> Dołącz do naszej grupy na Facebooku
            </a>
          </p>
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} | Kontakt:{" "}
            <a
              href="mailto:kontakt@oddajhajs.org"
              className="text-blue-400 hover:text-blue-300"
            >
              kontakt@oddajhajs.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
