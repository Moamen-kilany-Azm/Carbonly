"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

type Props = { selected: number };

export function YearPicker({ selected }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(year: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(year));
    startTransition(() => router.push(`/dashboard?${params.toString()}`));
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        background: "#f1f5f9",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
      }}
    >
      {YEARS.map((year) => {
        const isSelected = year === selected;
        const isBaseline = year === 2021;
        const isCurrent = year === 2026;

        return (
          <button
            key={year}
            onClick={() => select(year)}
            disabled={pending}
            title={
              isBaseline ? "Baseline year" :
              isCurrent  ? "Current year (Jan–Apr)" :
              undefined
            }
            style={{
              position: "relative",
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: isSelected
                ? "linear-gradient(135deg, #16a34a, #0d9488)"
                : "transparent",
              color: isSelected
                ? "white"
                : isCurrent
                ? "#94a3b8"
                : "#475569",
              fontSize: "0.875rem",
              fontWeight: isSelected ? 700 : 500,
              cursor: pending ? "wait" : "pointer",
              transition: "all 0.14s ease",
              opacity: pending ? 0.6 : 1,
              boxShadow: isSelected
                ? "0 1px 6px rgba(22,163,74,0.3)"
                : "none",
              letterSpacing: isSelected ? "-0.01em" : "normal",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected)
                (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {year}

            {/* Baseline dot */}
            {isBaseline && (
              <span style={{
                position: "absolute",
                top: 3, right: 5,
                width: 5, height: 5,
                borderRadius: "50%",
                background: isSelected ? "rgba(255,255,255,0.7)" : "#22c55e",
                boxShadow: isSelected ? "none" : "0 0 4px #22c55e",
              }} />
            )}

            {/* Current year dot */}
            {isCurrent && (
              <span style={{
                position: "absolute",
                top: 3, right: 5,
                width: 5, height: 5,
                borderRadius: "50%",
                background: isSelected ? "rgba(255,255,255,0.5)" : "#f59e0b",
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
