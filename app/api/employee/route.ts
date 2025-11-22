import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const toHHMM = (v?: any) => {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{1,4}$/.test(s)) { const n = s.padStart(4,"0"); return `${n.slice(0,2)}:${n.slice(2)}`; }
  const m = s.match(/^(\d{1,2})[:：]?(\d{1,2})?$/);
  return m ? `${m[1].padStart(2,"0")}:${(m[2]??"00").padStart(2,"0")}` : s;
};

export async function GET() {
  try {
    const list = await prisma.employee.findMany({ orderBy: { employee_id: "asc" } });
    return NextResponse.json(list);
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { rows?: any[] };
    const rows = body?.rows ?? [];
    if (!rows.length) return NextResponse.json({ ok:false, error:"rows is empty" }, { status:400 });

    let count = 0;
    for (let i=0;i<rows.length;i++){
      const r = rows[i];
      const employee_name = String(r.employee_name ?? r.氏名 ?? r.name ?? r.名前 ?? "").trim();
      if (!employee_name) continue;

      // IDが無ければ仮ID
      const employee_id = String(r.employee_id ?? r.社員ID ?? "").trim() || `TMP-${Date.now()}-${i}`;
      const license = String(r.license ?? r.ライセンス ?? r.スキル ?? "未設定").trim();
      const dateStr = String(r.date ?? r.日付 ?? r.勤務日 ?? "").trim();
      const dateISO = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : new Date().toISOString().slice(0,10);
      const start = toHHMM(r.start_time ?? r.開始 ?? r["勤務開始"] ?? r.start ?? r.出勤 ?? "");
      const end   = toHHMM(r.end_time   ?? r.終了 ?? r["勤務終了"] ?? r.end   ?? r.退勤 ?? "");

      await prisma.employee.upsert({
        where: { employee_id },
        update: { employee_name, license },
        create: { employee_id, employee_name, license },
      });

      if (start || end) {
        await prisma.daily_shift.create({
          data: {
            employee_id,
            date: new Date(`${dateISO}T00:00:00`),
            start_time: start,
            end_time: end,
          },
        });
      }
      count++;
    }
    return NextResponse.json({ ok:true, count });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message }, { status:500 });
  }
}
