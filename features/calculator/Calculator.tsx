"use client";

import { FormEvent, useState } from "react";

const operations = [
  { symbol: "+", label: "Add" },
  { symbol: "−", label: "Subtract" },
  { symbol: "×", label: "Multiply" },
  { symbol: "÷", label: "Divide" },
] as const;

type Operation = (typeof operations)[number]["label"];

const operationBySymbol: Record<(typeof operations)[number]["symbol"], Operation> = {
  "+": "Add",
  "−": "Subtract",
  "×": "Multiply",
  "÷": "Divide",
};

export default function Calculator() {
  const [firstNumber, setFirstNumber] = useState("");
  const [secondNumber, setSecondNumber] = useState("");
  const [operation, setOperation] = useState<Operation>("Add");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!firstNumber.trim() || !secondNumber.trim()) {
      setError("Enter both numbers.");
      return;
    }

    const first = Number(firstNumber);
    const second = Number(secondNumber);
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      setError("Enter valid numbers.");
      return;
    }

    if (operation === "Divide" && second === 0) {
      setError("Cannot divide by zero.");
      return;
    }

    const nextResult =
      operation === "Add"
        ? first + second
        : operation === "Subtract"
          ? first - second
          : operation === "Multiply"
            ? first * second
            : first / second;

    if (!Number.isFinite(nextResult)) {
      setError("The result is outside the supported range.");
      return;
    }

    setResult(nextResult);
  }

  function clear() {
    setFirstNumber("");
    setSecondNumber("");
    setOperation("Add");
    setResult(null);
    setError("");
  }

  return (
    <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
      <form onSubmit={calculate} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-gray-700">
            First number
            <input
              type="number"
              step="any"
              value={firstNumber}
              onChange={(event) => setFirstNumber(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-gray-700">
            Second number
            <input
              type="number"
              step="any"
              value={secondNumber}
              onChange={(event) => setSecondNumber(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            Operation
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {operations.map(({ symbol, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-pressed={operation === label}
                onClick={() => setOperation(operationBySymbol[symbol])}
                className={`rounded-md border px-3 py-2 text-xl font-semibold transition-colors ${
                  operation === label
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-gray-300 bg-white text-teal-800 hover:bg-teal-50"
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800"
          >
            Calculate
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {result !== null && (
        <p aria-live="polite" className="mt-5 border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-500">Result</span>
          <output className="mt-1 block break-all text-2xl font-bold text-teal-800">
            {result}
          </output>
        </p>
      )}
    </section>
  );
}
