'use client';

import React, { useState } from 'react';

export default function StaffImport() {
  const [date, setDate] = useState('');
  const [shiftSlot, setShiftSlot] = useState('06-14');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Excelファイルを選択してください');
      return;
    }
    if (!date) {
      alert('日付を選択してください');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('date', date);
      formData.append('shiftSlot', shiftSlot);

      const res = await fetch('/api/import-shift-excel', {
        method: 'POST',
        body: formData,
      });

      // ↓ ここでサーバーから返ってきたエラー内容も拾う
      let json: any = null;
      try {
        json = await res.json();
      } catch (e) {
        // JSON で返ってこなかった場合の保険
        console.error('レスポンスのJSON変換に失敗', e);
      }

      if (!res.ok) {
        console.error(json);
        alert(
          '取り込みに失敗しました。\n' +
            '原因：' +
            (json?.error ?? '不明') +
            '\n' +
            '詳細：' +
            (json?.detail ?? '詳細情報なし')
        );
        setUploading(false);
        return;
      }

      alert(`出勤スタッフを ${json.imported} 件登録しました`);
      if (json.errors && json.errors.length > 0) {
        console.warn('取り込み時の警告:', json.errors);
      }
      setMessage(`登録件数: ${json.imported}件`);
    } catch (e: any) {
      console.error(e);
      alert('サーバーエラーが発生しました：' + (e?.message ?? '不明'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>スタッフ管理システム</h1>

      <h2>📄 Excel一括取り込み（氏名・勤務開始・勤務終了）</h2>
      <p>1枚目のシートを読み込みます。最低限「氏名・開始・終了」があればOK。</p>

      <div style={{ marginBottom: 8 }}>
        <label>
          日付：
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          シフト枠：
          <select
            value={shiftSlot}
            onChange={(e) => setShiftSlot(e.target.value)}
          >
            <option value="06-14">06-14</option>
            <option value="14-23">14-23</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
        />
      </div>

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? '取り込み中…' : 'この内容で取り込み実行'}
      </button>

      {message && <p style={{ marginTop: 8 }}>{message}</p>}

      <p style={{ marginTop: 16 }}>
        自動配置は <code>/assign</code> を開いてください。
      </p>
    </div>
  );
}
