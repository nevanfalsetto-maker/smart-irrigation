"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

interface SoilData {
  id: number;
  humidity: number;
  status: string;
  temperature: number;
  status_pompa: "ON" | "OFF";
  created_at: string;
}

type PumpState = "ON" | "OFF" | "AUTO";

export default function Home() {
  const [data, setData] = useState<SoilData | null>(null);
  const [pumpState, setPumpState] = useState<PumpState | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const getData = async () => {
    try {
      const { data: res } = await supabase
        .from("soil_system")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: pumpRes } = await supabase
        .from("pump_control")
        .select("status")
        .eq("id", 1)
        .single();

      if (res && res.length > 0) setData(res[0]);

      if (pumpRes && !loading) {
        setPumpState(pumpRes.status as PumpState);
      }

      setLastUpdate(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const setPump = async (newState: PumpState) => {
    if (loading) return;
    const prev = pumpState;
    setPumpState(newState);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("pump_control")
        .update({ status: newState })
        .eq("id", 1);
      if (error) {
        console.error(error);
        setPumpState(prev);
      }
    } catch (err) {
      console.error(err);
      setPumpState(prev);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      // Fetch all historical data from Supabase
      const { data: allData, error } = await supabase
        .from("soil_system")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!allData || allData.length === 0) {
        alert("Tidak ada data untuk diekspor.");
        return;
      }

      // Map rows to clean display format
      const rows = allData.map((row: SoilData) => ({
        "No.": row.id,
        "Tanggal & Waktu": new Date(row.created_at).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        "Kelembaban (%)": row.humidity,
        Status: row.status,
        "Suhu (°C)": Number(row.temperature.toFixed(1)),
        "Status Pompa": row.status_pompa,
      }));

      const wb = XLSX.utils.book_new();

      // Build full sheet as AOA: title, subtitle, blank, header, data rows
      const headerKeys = [
        "No.",
        "Tanggal & Waktu",
        "Kelembaban (%)",
        "Status",
        "Suhu (°C)",
        "Status Pompa",
      ];
      const dataRows = rows.map((r) => Object.values(r));
      const sheetAoa = [
        ["Smart Irrigation — Riwayat Data Sensor"],
        [
          `Diekspor: ${new Date().toLocaleString("id-ID")}   |   Total: ${rows.length} data`,
        ],
        [],
        headerKeys,
        ...dataRows,
      ];
      const ws = XLSX.utils.aoa_to_sheet(sheetAoa);

      // Column widths
      ws["!cols"] = [
        { wch: 6 }, // No.
        { wch: 22 }, // Tanggal & Waktu
        { wch: 16 }, // Kelembaban
        { wch: 16 }, // Status Tanah
        { wch: 12 }, // Suhu
        { wch: 14 }, // Status Pompa
      ];

      // Merge title across all columns (A1:F1)
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      ];

      // Style helpers — openpyxl isn't available in browser;
      // SheetJS CE supports basic cell-level styles via write options
      const titleCell = ws["A1"];
      const subtitleCell = ws["A2"];

      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 14, color: { rgb: "1E293B" } },
          alignment: { horizontal: "left", vertical: "center" },
        };
      }

      if (subtitleCell) {
        subtitleCell.s = {
          font: { sz: 10, color: { rgb: "64748B" }, italic: true },
          alignment: { horizontal: "left" },
        };
      }

      // Style the header row (row index 3 in 0-based = row 4 in Excel)
      headerKeys.forEach((_, colIdx) => {
        const cellAddr = XLSX.utils.encode_cell({ r: 3, c: colIdx });
        if (ws[cellAddr]) {
          ws[cellAddr].s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
            fill: { fgColor: { rgb: "1E3A5F" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              bottom: { style: "medium", color: { rgb: "334155" } },
            },
          };
        }
      });

      // Style data rows — alternate shading + center alignment
      rows.forEach((_, rowIdx) => {
        const excelRow = rowIdx + 4; // data starts at row index 4 (Excel row 5)
        const isEven = rowIdx % 2 === 0;
        headerKeys.forEach((_, colIdx) => {
          const cellAddr = XLSX.utils.encode_cell({ r: excelRow, c: colIdx });
          if (ws[cellAddr]) {
            ws[cellAddr].s = {
              fill: { fgColor: { rgb: isEven ? "F8FAFC" : "FFFFFF" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              },
            };
          }
        });
      });

      XLSX.utils.book_append_sheet(wb, ws, "Data Sensor");

      // ── Summary sheet ──────────────────────────────────
      const humidityValues = allData.map((r: SoilData) => r.humidity);
      const tempValues = allData.map((r: SoilData) => r.temperature);
      const avgHumidity =
        humidityValues.reduce((a: number, b: number) => a + b, 0) /
        humidityValues.length;
      const avgTemp =
        tempValues.reduce((a: number, b: number) => a + b, 0) /
        tempValues.length;
      const keringCount = allData.filter(
        (r: SoilData) => r.status === "Kering",
      ).length;
      const basahCount = allData.filter(
        (r: SoilData) => r.status === "Basah",
      ).length;
      const pumpOnCount = allData.filter(
        (r: SoilData) => r.status_pompa === "ON",
      ).length;
      const pumpOffCount = allData.filter(
        (r: SoilData) => r.status_pompa === "OFF",
      ).length;

      const summaryRows = [
        ["Smart Irrigation — Ringkasan Statistik"],
        [`Diekspor: ${new Date().toLocaleString("id-ID")}`],
        [],
        ["Metrik", "Nilai"],
        ["Total Data", rows.length],
        ["Rata-rata Kelembaban (%)", Number(avgHumidity.toFixed(1))],
        ["Kelembaban Minimum (%)", Math.min(...humidityValues)],
        ["Kelembaban Maksimum (%)", Math.max(...humidityValues)],
        ["Rata-rata Suhu (°C)", Number(avgTemp.toFixed(1))],
        ["Suhu Minimum (°C)", Number(Math.min(...tempValues).toFixed(1))],
        ["Suhu Maksimum (°C)", Number(Math.max(...tempValues).toFixed(1))],
        ["Jumlah Kering", keringCount],
        ["Jumlah Basah", basahCount],
        ["Pompa ON", pumpOnCount],
        ["Pompa OFF", pumpOffCount],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 18 }];
      wsSummary["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

      // Generate filename with timestamp
      const ts = new Date()
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");

      XLSX.writeFile(wb, `smart_irrigation_${ts}.xlsx`, {
        bookType: "xlsx",
        cellStyles: true,
      });
    } catch (err) {
      console.error("Export error:", err);
      alert("Gagal mengekspor data. Coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    getData();
    const interval = setInterval(getData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const getHumidityBadge = (status: string) => {
    switch (status) {
      case "Kering":
        return { bg: "#FAECE7", color: "#993C1D", label: "Tidak Lembab" };
      case "Basah":
        return { bg: "#E6F1FB", color: "#185FA5", label: "Lembab" };
      default:
        return { bg: "#EAF3DE", color: "#3B6D11", label: status };
    }
  };

  const getTemperatureColor = (v: number) => {
    if (v >= 32) return "#dc2626";
    if (v >= 26) return "#f59e0b";
    return "#2563eb";
  };

  const badge = getHumidityBadge(data?.status ?? "");
  const tempColor = data ? getTemperatureColor(data.temperature) : "#94a3b8";

  const pumpColor =
    pumpState === "ON"
      ? "#16a34a"
      : pumpState === "AUTO"
        ? "#2563eb"
        : "#64748b";

  const pumpDotColor =
    pumpState === "ON"
      ? "#22c55e"
      : pumpState === "AUTO"
        ? "#60a5fa"
        : "#475569";

  const btnStyle = (state: PumpState): React.CSSProperties => {
    const active = pumpState === state;
    const colors: Record<
      PumpState,
      { bg: string; border: string; color: string }
    > = {
      ON: { bg: "#dcfce7", border: "#86efac", color: "#166534" },
      OFF: { bg: "#f1f5f9", border: "#cbd5e1", color: "#334155" },
      AUTO: { bg: "#dbeafe", border: "#93c5fd", color: "#1e40af" },
    };
    return {
      flex: 1,
      padding: "9px 0",
      border: `0.5px solid ${active ? colors[state].border : "#e2e8f0"}`,
      borderRadius: 8,
      background: active ? colors[state].bg : "#fff",
      color: active ? colors[state].color : "#64748b",
      fontFamily: "'DM Mono', monospace",
      fontSize: 13,
      fontWeight: 500,
      cursor: loading ? "not-allowed" : "pointer",
      letterSpacing: "0.05em",
      transition: "all 0.15s ease",
      opacity: loading ? 0.6 : 1,
    };
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        padding: "2rem 1rem 3rem",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(34,197,94,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 18 }}>🌱</span>
            </div>
            <div>
              <h1
                style={{
                  color: "#f1f5f9",
                  fontSize: 16,
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                Smart Irrigation
              </h1>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
                  }}
                />
                Live monitoring
              </p>
            </div>
          </div>

          {/* ── Export Button ── */}
          <button
            onClick={exportToExcel}
            disabled={exporting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              borderRadius: 8,
              border: "0.5px solid rgba(34,197,94,0.35)",
              background: exporting
                ? "rgba(34,197,94,0.05)"
                : "rgba(34,197,94,0.12)",
              color: exporting ? "#4ade80" : "#86efac",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              fontWeight: 500,
              cursor: exporting ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
              transition: "all 0.15s ease",
              opacity: exporting ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 14 }}>{exporting ? "⏳" : "📊"}</span>
            {exporting ? "Mengekspor..." : "Export Excel"}
          </button>
        </div>

        {/* ── Row 1 ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {/* Humidity Card */}
          <div style={card}>
            <p style={label}>Humidity</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 30,
                  fontWeight: 400,
                  color: "#f1f5f9",
                  lineHeight: 1,
                }}
              >
                {data?.humidity ?? "—"}
              </span>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>%</span>
            </div>
            {data?.status && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  background: badge.bg,
                  color: badge.color,
                }}
              >
                {badge.label}
              </span>
            )}
          </div>

          {/* Temperature Card */}
          <div style={card}>
            <p style={label}>Temperature</p>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 30,
                  fontWeight: 400,
                  color: tempColor,
                  lineHeight: 1,
                }}
              >
                {data?.temperature.toFixed(1) ?? "—"}
              </span>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>°C</span>
            </div>
          </div>
        </div>

        {/* ── Pump Card ── */}
        <div style={card}>
          <p style={label}>Kontrol Pompa</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 26,
                fontWeight: 400,
                color: pumpColor,
                letterSpacing: "0.04em",
              }}
            >
              {pumpState ?? "—"}
            </span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: pumpDotColor,
                display: "inline-block",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPump("ON")} style={btnStyle("ON")}>
              ON
            </button>
            <button onClick={() => setPump("OFF")} style={btnStyle("OFF")}>
              OFF
            </button>
            <button onClick={() => setPump("AUTO")} style={btnStyle("AUTO")}>
              AUTO
            </button>
          </div>
        </div>

        {/* ── Last Update ── */}
        {lastUpdate && (
          <p
            style={{
              fontSize: 11,
              color: "#475569",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Terakhir diperbarui: {lastUpdate}
          </p>
        )}
      </div>
    </main>
  );
}

// ── Shared Styles ────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(30,41,59,0.8)",
  border: "0.5px solid rgba(148,163,184,0.12)",
  borderRadius: 14,
  padding: "1rem 1.1rem",
  backdropFilter: "blur(8px)",
};

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#475569",
  marginBottom: 10,
};
