export type License =
  | "チーフ"
  | "サブチーフ"
  | "トレーニング"
  | "ウェルカム"
  | "ベーシック"
  | "トレーニー"
  | "研修生"
  | "ヘルプ"
  | "タイミー";

export type Staff = {
  id: string;       // HUEIDでもOK。とりあえず一意ID
  name: string;
  license: License;
};
