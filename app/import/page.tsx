"use client";
import dynamic from "next/dynamic";

// Simple local EmployeeForm component to avoid missing-module error
function EmployeeForm() {
  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
      <label>
        名前
        <input name="name" type="text" style={{ display: "block", width: "100%", marginTop: 4 }} />
      </label>
      <label>
        メール
        <input name="email" type="email" style={{ display: "block", width: "100%", marginTop: 4 }} />
      </label>
      <button type="submit" style={{ marginTop: 8 }}>
        登録
      </button>
    </form>
  );
}

// dynamic で読み込み、default またはモジュール自身を返す
function ExcelImportPlaceholder() {
  return (
    <div style={{ border: "1px dashed #ccc", padding: 12, borderRadius: 6 }}>
      <p>Excelインポートコンポーネントが見つかりません。ファイルを選択して取り込みます（スタブ）</p>
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        style={{ display: "block", marginTop: 8 }}
      />
    </div>
  );
}

const ExcelImport = dynamic(() => Promise.resolve(ExcelImportPlaceholder), { ssr: false });

export default function HomePage() {
  return (
    <main style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <h1>スタッフ管理システム</h1>

      <section style={{ marginTop: 24 }}>
        <h2>🧑‍🍳 スタッフ登録フォーム</h2>
        <EmployeeForm />
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>📥 Excel一括取り込み</h2>
        <ExcelImport />
      </section>
    </main>
  );
}