"use client";

type Props = {
  matureHeightFt: number;
  matureWidthFt: number;
  lifespanYears: number;
  scientificName?: string;
  commonName?: string;
};

// Plant shape definitions based on growth patterns
const getPlantShape = (scientificName: string, stage: number) => {
  const name = scientificName.toLowerCase();
  
  // Tree shapes
  if (name.includes('quercus') || name.includes('arbutus') || name.includes('umbellularia')) {
    return 'tree';
  }
  
  // Shrub shapes
  if (name.includes('ceanothus') || name.includes('arctostaphylos') || name.includes('heteromeles')) {
    return 'shrub';
  }
  
  // Grass shapes
  if (name.includes('festuca') || name.includes('nassella') || name.includes('melica') || name.includes('elymus') || name.includes('bromus') || name.includes('koeleria')) {
    return 'grass';
  }
  
  // Vine shapes
  if (name.includes('diplacus') || name.includes('epilobium')) {
    return 'vine';
  }
  
  // Herbaceous shapes
  if (name.includes('achillea') || name.includes('artemisia') || name.includes('baccharis')) {
    return 'herbaceous';
  }
  
  // Default to shrub
  return 'shrub';
};

const renderPlantShape = (shape: string, width: number, height: number, stage: number) => {
  const centerX = width / 2;
  const baseY = height - 2;
  
  switch (shape) {
    case 'tree':
      // Tree silhouette with trunk and canopy
      const trunkWidth = Math.max(2, width * 0.15);
      const canopyHeight = height * 0.7;
      const canopyWidth = width * (0.6 + stage * 0.3);
      
      return (
        <>
          {/* Trunk */}
          <rect 
            x={centerX - trunkWidth/2} 
            y={baseY - height + canopyHeight} 
            width={trunkWidth} 
            height={height - canopyHeight} 
            fill="#8b4513" 
            opacity="0.8"
          />
          {/* Canopy */}
          <ellipse 
            cx={centerX} 
            cy={baseY - height + canopyHeight/2} 
            rx={canopyWidth/2} 
            ry={canopyHeight/2} 
            fill="#22c55e" 
            opacity="0.7"
          />
        </>
      );
      
    case 'shrub':
      // Shrub silhouette - rounded, bushy
      const shrubWidth = width * (0.7 + stage * 0.2);
      return (
        <ellipse 
          cx={centerX} 
          cy={baseY - height/2} 
          rx={shrubWidth/2} 
          ry={height/2} 
          fill="#16a34a" 
          opacity="0.7"
        />
      );
      
    case 'grass':
      // Grass silhouette - narrow, upright
      const grassWidth = width * 0.3;
      const grassHeight = height * (0.8 + stage * 0.2);
      return (
        <ellipse 
          cx={centerX} 
          cy={baseY - grassHeight/2} 
          rx={grassWidth/2} 
          ry={grassHeight/2} 
          fill="#84cc16" 
          opacity="0.7"
        />
      );
      
    case 'vine':
      // Vine silhouette - spreading, climbing
      const vineWidth = width * (0.8 + stage * 0.3);
      const vineHeight = height * (0.6 + stage * 0.2);
      return (
        <ellipse 
          cx={centerX} 
          cy={baseY - vineHeight/2} 
          rx={vineWidth/2} 
          ry={vineHeight/2} 
          fill="#a3e635" 
          opacity="0.7"
        />
      );
      
    case 'herbaceous':
      // Herbaceous silhouette - medium height, spreading
      const herbWidth = width * (0.6 + stage * 0.3);
      const herbHeight = height * (0.7 + stage * 0.2);
      return (
        <ellipse 
          cx={centerX} 
          cy={baseY - herbHeight/2} 
          rx={herbWidth/2} 
          ry={herbHeight/2} 
          fill="#65a30d" 
          opacity="0.7"
        />
      );
      
    default:
      return (
        <ellipse 
          cx={centerX} 
          cy={baseY - height/2} 
          rx={width/2} 
          ry={height/2} 
          fill="#22c55e" 
          opacity="0.7"
        />
      );
  }
};

export default function GrowthVisualizer({ 
  matureHeightFt, 
  matureWidthFt, 
  lifespanYears, 
  scientificName = '',
  commonName = ''
}: Props) {
  const stages = [0.1, 0.25, 0.5, 0.75, 1];
  const houseHeightFt = 12; // single-story reference
  const maxHeightPx = 120;
  const maxWidthPx = 80;
  
  // Better scaling that considers both height and width
  const heightScale = (ft: number) => Math.max(8, Math.min(maxHeightPx, (ft / Math.max(matureHeightFt, houseHeightFt)) * maxHeightPx));
  const widthScale = (ft: number) => Math.max(8, Math.min(maxWidthPx, (ft / Math.max(matureWidthFt, matureHeightFt)) * maxWidthPx));

  const houseH = heightScale(houseHeightFt);
  const houseW = 40; // Fixed house width

  return (
    <div className="flex items-end gap-2">
      {/* House silhouette */}
      <div className="flex flex-col items-center text-[10px] text-neutral-500">
        <svg width={houseW} height={houseH} viewBox={`0 0 ${houseW} ${houseH}`} aria-label="House silhouette">
          <rect x="6" y={houseH - (houseH - 8)} width="28" height={houseH - 8} fill="#9ca3af" />
          <polygon points={`6,${houseH - (houseH - 8)} 20,0 34,${houseH - (houseH - 8)}`} fill="#6b7280" />
        </svg>
        <div>House</div>
      </div>
      
      {/* Plant growth stages */}
      {stages.map((s, i) => {
        const h = heightScale(matureHeightFt * s);
        const w = widthScale(matureWidthFt * s);
        const age = Math.round(lifespanYears * s);
        const plantShape = getPlantShape(scientificName, s);
        
        return (
          <div key={i} className="flex flex-col items-center text-[10px] text-neutral-500">
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`${commonName} at age ${age}`}>
              {renderPlantShape(plantShape, w, h, s)}
            </svg>
            <div>{age}y</div>
          </div>
        );
      })}
    </div>
  );
}
