// app/api/import-shift-excel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// "06-14" / "14-23" の時間帯（分単位）
const SLOT_RANGES: Record<string, { start: number; end: number }> = {
  '06-14': { start: 6 * 60, end: 14 * 60 },
  '14-23': { start: 14 * 60, end: 23 * 60 },
}

// "06:00 15:00" / "22:00 +08:00" をパースして分に変換
function parseTimeRange(text: string) {
  if (!text) return null

  const m = String(text)
    .trim()
    .match(/(\d{2}):(\d{2})\s+(\+?)(\d{2}):(\d{2})/)
  if (!m) return null

  const [, sh, sm, plus, eh, em] = m
  const startMinutes = parseInt(sh) * 60 + parseInt(sm)
  let endMinutes = parseInt(eh) * 60 + parseInt(em)
  if (plus === '+') {
    // 「+08:00」は翌日扱い
    endMinutes += 24 * 60
  }

  const startStr = `${sh}:${sm}`
  const endStr = `${eh}:${em}`

  return { startMinutes, endMinutes, startStr, endStr }
}

// 指定スロットと勤務時間が1分でもかぶっていれば true
function isInSlot(
  range: { start: number; end: number },
  startMinutes: number,
  endMinutes: number
) {
  return endMinutes > range.start && startMinutes < range.end
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const dateStr = formData.get('date') as string | null
    const shiftSlot = formData.get('shiftSlot') as string | null

    if (!file) {
      return NextResponse.json(
        { ok: false, message: 'ファイルが送信されていません。' },
        { status: 400 }
      )
    }

    if (!dateStr || !shiftSlot) {
      return NextResponse.json(
        { ok: false, message: '日付またはシフト枠が指定されていません。' },
        { status: 400 }
      )
    }

    const slotRange = SLOT_RANGES[shiftSlot]
    if (!slotRange) {
      return NextResponse.json(
        { ok: false, message: `未知のシフト枠です: ${shiftSlot}` },
        { status: 400 }
      )
    }

    // Excel を読み込み
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // 2枚目のシート（【日次シフト（ライン別）】～）を使用
    const sheetName = workbook.SheetNames[1] ?? workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as any[][]

    // ヘッダー行を探す（シフト時間帯 / 社員番号 / 氏名）
    const headerRowIndex = rows.findIndex((row) => {
      if (!row) return false
      return (
        row.includes('シフト時間帯') &&
        row.includes('社員番号') &&
        row.includes('氏名')
      )
    })

    if (headerRowIndex === -1) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'ヘッダー行（シフト時間帯・社員番号・氏名）が見つかりませんでした。',
        },
        { status: 400 }
      )
    }

    const headerRow = rows[headerRowIndex]
    const timeCol = headerRow.indexOf('シフト時間帯')
    const empIdCol = headerRow.indexOf('社員番号')
    const nameCol = headerRow.indexOf('氏名')

    const targetDate = new Date(dateStr)

    // まず、同じ日付 & シフト枠のデータを削除
    await prisma.dailyShift.deleteMany({
      where: {
        date: targetDate,
        shiftSlot,
      },
    })

    const createData: {
      date: Date
      shiftSlot: string
      staffName: string
      startTime: string
      endTime: string
    }[] = []

    // データ行を回す（ヘッダーの2行下からが実データ）
    for (let i = headerRowIndex + 2; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue

      const timeCell = row[timeCol]
      const nameCell = row[nameCol]
      const empIdCell = row[empIdCol]

      // 氏名も時間もない行はスキップ
      if (!nameCell || !timeCell) continue

      const parsed = parseTimeRange(timeCell)
      if (!parsed) continue

      const { startMinutes, endMinutes, startStr, endStr } = parsed

      // この行の勤務時間が、指定したシフト枠と重なるか判定
      if (!isInSlot(slotRange, startMinutes, endMinutes)) {
        continue
      }

      createData.push({
        date: targetDate,
        shiftSlot,
        staffName: String(nameCell),
        startTime: startStr,
        endTime: endStr,
      })
    }

    if (createData.length > 0) {
      await prisma.dailyShift.createMany({ data: createData })
    }

    return NextResponse.json({
      ok: true,
      imported: createData.length,
      message: `出勤スタッフを ${createData.length} 件登録しました。`,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      {
        ok: false,
        message: 'サーバーエラーが発生しました。',
        detail: err?.message,
      },
      { status: 500 }
    )
  }
}
