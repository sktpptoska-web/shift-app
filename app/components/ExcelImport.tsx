"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelImport(){
  const [rows,setRows] = useState<any[]>([]);
  const [msg,setMsg] = useState("");

  const onFile = (file: File)=>{
    setMsg("");
    const r = new FileReader();
    r.onload = e=>{
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data,{ type:"array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      // 氏名 / 開始 / 終了 をゆるく拾う
      const normalized = json.map((x:any)=>({
        employee_name: String(x.氏名 ?? x.name ?? x["名前"] ?? "").trim(),
        start_time: String(x.開始 ?? x["勤務開始"] ?? x.start ?? "").trim(),
        end_time:   String(x.終了 ?? x["勤務終了"] ?? x.end   ?? "").trim(),
        // あれば使う（無ければサーバで仮ID）
        employee_id: String(x.employee_id ?? x.社員ID ?? "").trim(),
        license: String(x.license ?? x.ライセンス ?? x.スキル ?? "").trim(),
        date: String(x.date ?? x.日付 ?? x.勤務日 ?? "").trim(),
      })).filter((r)=>r.employee_name);
      setRows(normalized);
    };
    r.readAsArrayBuffer(file);
  };

  const register = async ()=>{
    const res = await fetch("/api/employee",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ rows }) });
    const j = await res.json().catch(()=>({ ok:false, error:"invalid json" }));
    setMsg(j.ok ? `登録完了：${j.count}件` : `登録失敗：${j.error||"不明"}`);
  };

  return (
    <div className="section">
      <p className="note">1枚目のシートを読み込みます。最低限「氏名・開始・終了」があればOK。</p>
      <input className="input" type="file" accept=".xls,.xlsx" onChange={(e)=> e.target.files?.[0] && onFile(e.target.files[0])} />
      {!!rows.length && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>氏名</th><th>開始</th><th>終了</th></tr></thead>
              <tbody>{rows.slice(0,30).map((r,i)=>(<tr key={i}><td>{r.employee_name}</td><td>{r.start_time}</td><td>{r.end_time}</td></tr>))}</tbody>
            </table>
          </div>
          <button className="btn btn-primary" onClick={register}>この内容で登録する</button>
          {msg && <p className="success">{msg}</p>}
        </>
      )}
    </div>
  );
}
