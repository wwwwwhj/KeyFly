export function DurationSwitch({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return <div className="duration-control">
    <span>练习时长</span>
    <div className="segmented" role="group" aria-label="练习时长">
      {[30, 60, 120, 0].map(seconds => <button key={seconds} type="button" aria-pressed={value === seconds} disabled={disabled} onClick={() => onChange(seconds)}>{seconds ? `${seconds} 秒` : '全文'}</button>)}
    </div>
  </div>;
}
