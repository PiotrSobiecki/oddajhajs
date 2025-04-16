import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">
            Strona nie znaleziona
          </h1>
          <p className="mt-2 text-gray-400">
            Nie można odnaleźć strony, której szukasz.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
