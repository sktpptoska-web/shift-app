"use client";
import { useState, FormEvent } from "react";
import type { License, Staff } from "@/types/staff";

const LICENSES: License[] = [
  "チーフ","サブチーフ","トレーニング","ウェルカム",
  "ベーシック","トレーニー","研修生","ヘルプ","タイミー",
];

type Props = {
  onAdd: (staff: Staff) => void;
};

export default function StaffForm({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [license, setLicense] = useState<License>("ウェルカム");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: crypto.randomUUID(),   // 仮ID。後でHUEIDに差し替え可
      name: name.trim(),
      license,
    });

    setName("");
    setLicense("ウェルカム");
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
      <input
        type="text"
        placeholder="氏名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding:"8px 10px", border:"1px solid #ccc", borderRadius:8 }}
      />
      <select
        value={license}
        onChange={(e) => setLicense(e.target.value as License)}
        style={{ padding:"8px 10px", border:"1px solid #ccc", borderRadius:8 }}
      >
        {LICENSES.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <button
        type="submit"
        style={{
          padding:"8px 14px", border:"none", borderRadius:8,
          background:"#111827", color:"#fff", cursor:"pointer"
        }}
      >
        追加
      </button>
    </form>
  );
}
