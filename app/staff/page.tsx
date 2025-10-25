'use client';

import { useMemo, useState } from 'react';

// ライセンス表記はこの8種類を想定（入力はカタカナ・全角半角のゆれをある程度吸収します）
const LICENSES = [
  'チーフ',
  'サブチーフ',
  'トレーニング',
  'ウェルカム',
  'ベーシック',
  'トレーニー',
  '研修生',
  'ヘルプ', // 任意
  'タイミー', // 任意
] as const;

type License = (typeof LICENSES)[number] | string;

type Staff = {
  id: number;
  name: string;
  license: License;
};

type FloorAssignment = {
  floor: 1 | 2 | 3 | 4 | 5;
  members: Staff[];
};

// 画面内だけの色分け（簡易）
const colorByLicense: Record<string, string> = {
  'チーフ': '#1e90ff',       // 青
  'サブチーフ': '#87cefa',   // 水色
  'トレーニング': '#2e8b57', // 緑
  'ウェルカム': '#800080',   // 紫
  'ベーシック': '#ff69b4',   // ピンク
  'トレーニー': '#808080',   // 灰色
  '研修生': '#808080',       // 灰色
  'ヘルプ': '#ffa500',       // 橙
  'タイミー': '#20b2aa',     // 青緑
};

// 各フロアの必要数（仕様に合わせて固定）
const NEEDS = {
  1: { total: 4, chief: 0, sub: 0, training: 0, welcomeMin: 0 },
  2: { total: 12, chief: 1, sub: 1, training: 1, welcomeMin: 2 },
  3: { total: 12, chief: 1, sub: 1, training: 1, welcomeMin: 2 },
  4: { total: 10, chief: 1, sub: 1, training: 1, welcomeMin: 2 },
  5: { total: 10, chief: 1, sub: 1, training: 1, welcomeMin: 2 },
} as const;

// ユーザー入力のライセンス表記を正規化（ゆるめ）
function normalizeLicense(input: string): License {
  const s = input.trim().replace(/\s+/g, '').toLowerCase();
  if (s.includes('chief') || s.includes('ﾁｰﾌ') || s.includes('ちーふ') || s.includes('チーフ')) return 'チーフ';
  if (s.includes('sub') || s.includes('ｻﾌﾞ') || s.includes('サブチ') || s.includes('副') || s.includes('サブ')) return 'サブチーフ';
  if (s.includes('training') || s.includes('ﾄﾚｰﾆﾝｸﾞ') || s.includes('トレーニング') || s === 'トレ' || s === 'とれ') return 'トレーニング';
  if (s.includes('welcome') || s.includes('ｳｪﾙｶﾑ') || s.includes('ウェルカム') || s.includes('we')) return 'ウェルカム';
  if (s.includes('basic') || s.includes('ﾍﾞｰｼｯｸ') || s.includes('ベーシック')) return 'ベーシック';
  if (s.includes('trainee') || s.includes('ﾄﾚｰﾆｰ') || s.includes('トレーニー')) return 'トレーニー';
  if (s.includes('kenshu') || s.includes('研修')) return '研修生';
  if (s.includes('help')) return 'ヘルプ';
  if (s.includes('timee') || s.includes('ﾀｲﾐｰ') || s.includes('タイミー')) return 'タイミー';
  return input; // 不明ならそのまま
}

// ─────────────────────────────────────────────
// ここが “自動配置ロジック（簡易MVP）”
// 仕様の優先配置→ウェルカム→1階→残り の順で割当。足りない場合は警告を返す。
// ─────────────────────────────────────────────
function autoAssign(staffList: Staff[]) {
  const floors: FloorAssignment[] = [
    { floor: 1, members: [] },
    { floor: 2, members: [] },
    { floor: 3, members: [] },
    { floor: 4, members: [] },
    { floor: 5, members: [] },
  ];
  const used = new Set<number>();
  const warn: string[] = [];

  // ヘルパー: 指定ライセンスの未使用メンバーを順に取り出す
  const pick = (license: string, count = 1) => {
    const picked: Staff[] = [];
    for (const s of staffList) {
      if (picked.length >= count) break;
      if (used.has(s.id)) continue;
      if (normalizeLicense(s.license) === license) {
        used.add(s.id);
        picked.push(s);
      }
    }
    return picked;
  };

  // ヘルパー: ライセンス問わず未使用メンバーを追加
  const fillAny = (count: number, filter?: (s: Staff) => boolean) => {
    const picked: Staff[] = [];
    for (const s of staffList) {
      if (picked.length >= count) break;
      if (used.has(s.id)) continue;
      if (!filter || filter(s)) {
        used.add(s.id);
        picked.push(s);
      }
    }
    return picked;
  };

  // 2F〜5F: チーフ→サブチーフ→トレーニング
  for (const f of [2, 3, 4, 5] as const) {
    const need = NEEDS[f];
    const chiefs = pick('チーフ', need.chief);
    if (chiefs.length < need.chief) warn.push(`フロア${f}: チーフが不足（${chiefs.length}/${need.chief}）`);
    floors.find(x => x.floor === f)!.members.push(...chiefs);
  }
  for (const f of [2, 3, 4, 5] as const) {
    const need = NEEDS[f];
    const subs = pick('サブチーフ', need.sub);
    if (subs.length < need.sub) warn.push(`フロア${f}: サブチーフが不足（${subs.length}/${need.sub}）`);
    floors.find(x => x.floor === f)!.members.push(...subs);
  }
  for (const f of [2, 3, 4, 5] as const) {
    const need = NEEDS[f];
    const trainings = pick('トレーニング', need.training);
    if (trainings.length < need.training) warn.push(`フロア${f}: トレーニングが不足（${trainings.length}/${need.training}）`);
    floors.find(x => x.floor === f)!.members.push(...trainings);
  }

  // 2F〜5F: ウェルカム2名ずつ
  for (const f of [2, 3, 4, 5] as const) {
    const need = NEEDS[f];
    const welcomes = pick('ウェルカム', need.welcomeMin);
    if (welcomes.length < need.welcomeMin) warn.push(`フロア${f}: ウェルカムが不足（${welcomes.length}/${need.welcomeMin}）`);
    floors.find(x => x.floor === f)!.members.push(...welcomes);
  }

  // 1F: 4名、空いてるウェルカム優先
  {
    const current = floors.find(x => x.floor === 1)!;
    const needCount = NEEDS[1].total - current.members.length;
    const w = pick('ウェルカム', Math.max(0, needCount));
    current.members.push(...w);
    if (current.members.length < NEEDS[1].total) {
      // 足りない分は他ライセンスで埋める（研修生は2〜3Fへ振る方針なので除外）
      const rest = fillAny(NEEDS[1].total - current.members.length, s => {
        const l = normalizeLicense(s.license);
        return l !== '研修生';
      });
      current.members.push(...rest);
    }
  }

  // 残り枠の充足（2F〜5F）
  for (const f of [2, 3, 4, 5] as const) {
    const floor = floors.find(x => x.floor === f)!;
    const need = NEEDS[f];
    const remain = Math.max(0, need.total - floor.members.length);

    // まずはベーシックを優先
    const basics = pick('ベーシック', remain);
    floor.members.push(...basics);

    // ヘルプ/タイミーは人が少ないフロアを優先（ここでは現在のフロアに追加する簡易処理）
    if (floor.members.length < need.total) {
      const help = pick('ヘルプ', need.total - floor.members.length);
      floor.members.push(...help);
    }
    if (floor.members.length < need.total) {
      const timee = pick('タイミー', need.total - floor.members.length);
      floor.members.push(...timee);
    }

    // まだ不足していたら、研修生は2F or 3Fのみで均し割り
    if (floor.members.length < need.total && (f === 2 || f === 3)) {
      const trainees = pick('トレーニー', need.total - floor.members.length);
      floor.members.push(...trainees);
      const kenshu = pick('研修生', need.total - floor.members.length);
      floor.members.push(...kenshu);
    }

    // それでも足りなければ、未使用の誰でも
    if (floor.members.length < need.total) {
      const any = fillAny(need.total - floor.members.length);
      floor.members.push(...any);
    }
  }

  // 最終チェック（総枠に満たないフロアがあれば警告）
  for (const f of floors) {
    const n = NEEDS[f.floor].total;
    if (f.members.length < n) {
      warn.push(`フロア${f.floor}: 人数不足（${f.members.length}/${n}）`);
    }
  }

  // 研修生は「設定人数に含めない」方針の通知（簡易）
  // 実装としては追加はするが、警告に明示する
  const placedKenshu = floors.flatMap(f => f.members).filter(m => normalizeLicense(m.license) === '研修生');
  if (placedKenshu.length > 0) {
    warn.push(`研修生は人員数に含めない想定です（今回は配置リストに表示のみ）。`);
  }

  return { floors, warn };
}

// ─────────────────────────────────────────────

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');

  const [result, setResult] = useState<ReturnType<typeof autoAssign> | null>(null);

  // 入力しやすいように、よく使うライセンスを選択肢化
  const licenseOptions = useMemo(
    () => ['チーフ', 'サブチーフ', 'トレーニング', 'ウェルカム', 'ベーシック', 'トレーニー', '研修生', 'ヘルプ', 'タイミー'],
    []
  );

  const addStaff = () => {
    if (!name.trim()) {
      alert('名前を入れてください');
      return;
    }
    const normalized = normalizeLicense(license || 'ベーシック');
    const newStaff: Staff = { id: Date.now(), name: name.trim(), license: normalized };
    setStaffList(prev => [...prev, newStaff]);
    setName('');
    setLicense('');
  };

  const runAssign = () => {
    const r = autoAssign(staffList);
    setResult(r);
    if (r.warn.length > 0) {
      // 警告をまとめて表示（UIにも表示します）
      console.warn(r.warn.join('\n'));
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h1>従業員管理ページ（簡易MVP）</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="名前（例: 山田 太郎）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, minWidth: 220 }}
        />
        <input
          list="licenses"
          placeholder="ライセンス（例: ベーシック）"
          value={license}
          onChange={(e) => setLicense(e.target.value)}
          style={{ padding: 8, minWidth: 220 }}
        />
        <datalist id="licenses">
          {licenseOptions.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>

        <button onClick={addStaff} style={{ padding: '8px 16px' }}>追加</button>
      </div>

      <h2 style={{ marginTop: 16 }}>登録スタッフ一覧（{staffList.length}名）</h2>
      <ul style={{ lineHeight: 1.8 }}>
        {staffList.map((s) => (
          <li key={s.id}>
            <span style={{
              display: 'inline-block',
              width: 10, height: 10, borderRadius: 9999, marginRight: 8,
              backgroundColor: colorByLicense[normalizeLicense(s.license)] || '#999'
            }} />
            {s.name}（{normalizeLicense(s.license)}）
          </li>
        ))}
      </ul>

      <hr style={{ margin: '20px 0' }} />
      <button
        onClick={runAssign}
        style={{
          backgroundColor: '#0070f3', color: 'white', padding: '10px 20px',
          borderRadius: 8, border: 'none', cursor: 'pointer'
        }}
      >
        🤖 AIで自動配置
      </button>

      {/* 結果表示 */}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>配置結果</h2>
          {result.warn.length > 0 && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeeba',
              color: '#856404',
              padding: 12, borderRadius: 8, marginBottom: 12
            }}>
              <b>⚠️ 注意/不足:</b>
              <ul style={{ marginTop: 8 }}>
                {result.warn.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {result.floors.map(f => (
              <div key={f.floor} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <h3>フロア {f.floor}（{f.members.length}/{NEEDS[f.floor].total}）</h3>
                <ol style={{ paddingLeft: 18, lineHeight: 1.8 }}>
                  {f.members.map(m => (
                    <li key={m.id}>
                      <span style={{
                        display: 'inline-block',
                        width: 10, height: 10, borderRadius: 9999, marginRight: 8,
                        backgroundColor: colorByLicense[normalizeLicense(m.license)] || '#999'
                      }} />
                      {m.name}（{normalizeLicense(m.license)}）
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default function StaffPage() {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>🍜 シフト管理アプリ（テスト表示）</h1>
      <p>このページが更新されたら、公開URLにも反映されます。</p>
    </div>
  );
}

