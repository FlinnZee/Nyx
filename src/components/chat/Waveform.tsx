export default function Waveform({
  peaks,
  progress = 0,
  height = 30,
  color = "currentColor",
  dim = "rgba(255,255,255,0.28)",
}: {
  peaks: number[];
  progress?: number;
  height?: number;
  color?: string;
  dim?: string;
}) {
  const played = Math.floor(progress * peaks.length);
  return (
    <div className="flex items-center gap-[2px]" style={{ height }}>
      {peaks.map((p, i) => (
        <span
          key={i}
          className="w-[3px] shrink-0 rounded-full transition-colors"
          style={{
            height: `${Math.max(10, p * 100)}%`,
            background: i <= played ? color : dim,
          }}
        />
      ))}
    </div>
  );
}
