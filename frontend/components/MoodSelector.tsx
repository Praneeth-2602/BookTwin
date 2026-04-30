"use client";

const MOODS = [
  "Contemplative & slow",
  "Fast-paced & gripping",
  "Funny & light",
  "Dark & unsettling",
  "Mind-expanding",
  "Emotional & moving",
];

interface Props {
  selected: string;
  onChange: (mood: string) => void;
}

export function MoodSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood}
          onClick={() => onChange(selected === mood ? "" : mood)}
          className={`
            px-3 py-2.5 text-[11px] leading-snug border rounded-lg text-center
            transition-all duration-150 font-mono
            ${selected === mood
              ? "border-[#7F77DD] bg-[#EEEDFE] text-[#3C3489]"
              : "border-[rgba(26,20,16,0.15)] text-[rgba(26,20,16,0.55)] hover:border-[rgba(26,20,16,0.35)] hover:text-[rgba(26,20,16,0.8)]"
            }
          `}
        >
          {mood}
        </button>
      ))}
    </div>
  );
}
