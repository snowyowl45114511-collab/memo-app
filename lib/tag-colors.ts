// タグ作成時に選べるカラープリセット。
// ここに列挙することで Tailwind CSS の purge から保護されます。

export interface ColorPreset {
  name: string;
  color: string;
  bg: string;
  activeBg: string;
  badgeCls: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: "blue",
    color: "text-blue-700",
    bg: "bg-blue-100 hover:bg-blue-200",
    activeBg: "bg-blue-200 ring-2 ring-blue-400 ring-offset-1",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    name: "purple",
    color: "text-purple-700",
    bg: "bg-purple-100 hover:bg-purple-200",
    activeBg: "bg-purple-200 ring-2 ring-purple-400 ring-offset-1",
    badgeCls: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    name: "yellow",
    color: "text-yellow-700",
    bg: "bg-yellow-100 hover:bg-yellow-200",
    activeBg: "bg-yellow-200 ring-2 ring-yellow-400 ring-offset-1",
    badgeCls: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    name: "green",
    color: "text-green-700",
    bg: "bg-green-100 hover:bg-green-200",
    activeBg: "bg-green-200 ring-2 ring-green-400 ring-offset-1",
    badgeCls: "bg-green-100 text-green-800 border-green-200",
  },
  {
    name: "red",
    color: "text-red-700",
    bg: "bg-red-100 hover:bg-red-200",
    activeBg: "bg-red-200 ring-2 ring-red-400 ring-offset-1",
    badgeCls: "bg-red-100 text-red-800 border-red-200",
  },
  {
    name: "orange",
    color: "text-orange-700",
    bg: "bg-orange-100 hover:bg-orange-200",
    activeBg: "bg-orange-200 ring-2 ring-orange-400 ring-offset-1",
    badgeCls: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    name: "pink",
    color: "text-pink-700",
    bg: "bg-pink-100 hover:bg-pink-200",
    activeBg: "bg-pink-200 ring-2 ring-pink-400 ring-offset-1",
    badgeCls: "bg-pink-100 text-pink-800 border-pink-200",
  },
  {
    name: "teal",
    color: "text-teal-700",
    bg: "bg-teal-100 hover:bg-teal-200",
    activeBg: "bg-teal-200 ring-2 ring-teal-400 ring-offset-1",
    badgeCls: "bg-teal-100 text-teal-800 border-teal-200",
  },
];
