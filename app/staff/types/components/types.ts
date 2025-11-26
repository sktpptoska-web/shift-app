// app/staff/types/types.ts

// ライセンス種別
export type License =
  | 'チーフ'
  | 'セクションリーダー'
  | 'サブチーフ'
  | 'トレーナー'
  | 'ウェルカム'
  | 'ベーシック'

// スタッフ1人分の型
export type Staff = {
  id: string
  name: string
  license: License
}
