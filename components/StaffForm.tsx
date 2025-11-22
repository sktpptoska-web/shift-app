"use client";

import { useState } from "react";

type Staff = {
  name: string;
  license: string;
};

type StaffFormProps = {
  staffs: Staff[];
  setStaffs: React.Dispatch<React.SetStateAction<Staff[]>>;
};

export default function StaffForm({ staffs, setStaffs }: StaffFormProps) {
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !license) return;
    setStaffs([...staffs, { name, license }]);
    setName("");
    setLicense("");
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="ライセンス"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button type="submit">追加</button>
      </form>

      <ul style={{ marginTop: "20px", listStyle: "none", padding: 0 }}>
        {staffs.map((s, i) => (
          <li key={i}>
            {s.name}（{s.license}）
          </li>
        ))}
      </ul>
    </div>
  );
}
