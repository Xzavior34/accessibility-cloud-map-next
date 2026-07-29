"use client";

export function Legend() {
  const items = [
    { color: '#16a34a', label: 'Fully wheelchair accessible' },
    { color: '#f59e0b', label: 'Partially accessible' },
    { color: '#dc2626', label: 'Not accessible' },
    { color: '#6b7280', label: 'Unknown' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2.5 text-xs">
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white shadow-sm shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="shrink-0">⚠</span>
          <span className="text-gray-600">Elevator/escalator disruption</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0">🛗</span>
          <span className="text-gray-600">Elevator / escalator</span>
        </div>
      </div>
    </div>
  );
}