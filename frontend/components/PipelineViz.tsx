"use client";

const NODES = [
  "01 extract",
  "02 validate",
  "03 profile",
  "04 match",
  "05 score",
  "06 explain",
];

interface Props {
  activeIndex: number; // which node is currently running (-1 = idle, 6 = done)
}

export function PipelineViz({ activeIndex }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap my-5">
      {NODES.map((node, i) => {
        const isDone = activeIndex > i;
        const isActive = activeIndex === i;

        return (
          <div key={node} className="flex items-center gap-1.5">
            <span
              className={`
                text-[10px] px-2.5 py-1 rounded border tracking-wide font-mono
                transition-all duration-300
                ${isActive ? "border-[#7F77DD] bg-[#EEEDFE] text-[#3C3489]" : ""}
                ${isDone ? "border-[#1D9E75] bg-[#E1F5EE] text-[#085041]" : ""}
                ${!isActive && !isDone ? "border-[rgba(26,20,16,0.12)] text-[rgba(26,20,16,0.4)]" : ""}
              `}
            >
              {node}
            </span>
            {i < NODES.length - 1 && (
              <span className="text-[11px] text-[rgba(26,20,16,0.3)]">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
