"use client";
import { useState } from "react";

type Form = {
  employee_id: string;
  employee_name: string;
  license: string;
};

const LICENSES = [
  "未設定",
  "研修生",
  "トレーニー",
  "ベーシック",
  "ウェルカム",
  "トレーニング",
  "サブチーフ",
  "チーフ",
  "ヘルプ",
  "タイミー",
];

export default function EmployeeForm() {
  const [form, setForm] = useState<Form>({
    employee_id: "",
    employee_name: "",
    license: "未設定",
  });
  const [msg, setMsg] = useState("");

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!form.employee_name || !form.employee_id) {
      setMsg("社員IDと名前を入れてください。");
      return;
    }

    // 既存の /api/employee へ「1件だけ rows で送る」
    const res = await fetch("/api/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: [
          {
            employee_id: form.employee_id.trim(),
            employee_name: form.employee_name.trim(),
            license: form.license.trim() || "未設定",
          },
        ],
      }),
    });

    const json = await res.json();
    if (json?.ok) {
      setMsg("登録しました！");
      setForm({ employee_id: "", employee_name: "", license: "未設定" });
    } else {
      setMsg(`登録に失敗：${json?.error ?? "不明なエラー"}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="section">
      <div className="form-row">
        <label>社員ID（例：EMP001）</label>
        <input className="input" type="text" value={form.employee_id} onChange={set("employee_id")} />
      </div>

      <div className="form-row">
        <label>名前</label>
        <input className="input" type="text" value={form.employee_name} onChange={set("employee_name")} />
      </div>

      <div className="form-row">
        <label>ライセンス</label>
        <select className="input" value={form.license} onChange={set("license")}>
          {LICENSES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="button-row">
        <button className="btn btn-primary" type="submit">
          登録
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => setForm({ employee_id: "", employee_name: "", license: "未設定" })}
        >
          クリア
        </button>
      </div>

      {msg && <p className="success">{msg}</p>}
    </form>
  );
}
