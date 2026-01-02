import React, { useState } from 'react';

interface BodyPart {
  id: string;
  name: string;
  d: string; // SVG path data
}

interface BodyMapWidgetProps {
  onSelect: (part: string) => void;
}

export const BodyMapWidget: React.FC<BodyMapWidgetProps> = ({ onSelect }) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const bodyParts: BodyPart[] = [
    { id: 'head', name: 'Head', d: 'M100,50 C100,25 140,25 140,50 C140,75 100,75 100,50 Z' },
    { id: 'chest', name: 'Chest', d: 'M80,80 L160,80 L150,150 L90,150 Z' },
    { id: 'l_arm', name: 'Left Arm', d: 'M80,80 L50,150 L70,160 L90,100 Z' },
    { id: 'r_arm', name: 'Right Arm', d: 'M160,80 L190,150 L170,160 L150,100 Z' },
    { id: 'abdomen', name: 'Abdomen', d: 'M90,150 L150,150 L140,200 L100,200 Z' },
    { id: 'legs', name: 'Legs', d: 'M100,200 L140,200 L130,300 L110,300 Z' }
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
      <h4 className="text-sm font-bold text-slate-700 mb-2">Where does it hurt?</h4>
      <svg width="240" height="320" viewBox="0 0 240 320" className="cursor-pointer">
        {/* Silhouette Outline */}
        <g stroke="#cbd5e1" strokeWidth="2" fill="none">
           {/* Simplified outline for context */}
           <path d="M120,20 C150,20 150,60 150,70 L180,80 L200,160 L180,170 L160,120 L150,200 L150,300 L130,300 L130,220 L110,220 L110,300 L90,300 L90,200 L80,120 L60,170 L40,160 L60,80 L90,70 C90,60 90,20 120,20 Z" />
        </g>

        {/* Interactive Zones */}
        {bodyParts.map((part) => (
          <path
            key={part.id}
            d={part.d}
            fill={hoveredPart === part.id ? '#3b82f6' : 'transparent'}
            fillOpacity={hoveredPart === part.id ? 0.2 : 0}
            stroke={hoveredPart === part.id ? '#2563eb' : 'transparent'}
            strokeWidth="2"
            onMouseEnter={() => setHoveredPart(part.id)}
            onMouseLeave={() => setHoveredPart(null)}
            onClick={() => onSelect(part.name)}
            className="transition-all duration-200"
          />
        ))}
        
        {/* Labels */}
        {hoveredPart && (
          <text x="120" y="310" textAnchor="middle" className="text-xs font-bold fill-slate-600">
            {bodyParts.find(p => p.id === hoveredPart)?.name}
          </text>
        )}
      </svg>
      <p className="text-xs text-slate-400 mt-2">Click to select area</p>
    </div>
  );
};
