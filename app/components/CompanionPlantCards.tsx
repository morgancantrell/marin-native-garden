import React from 'react';
import { CompanionGroup } from '@/lib/companion-plants';

interface CompanionPlantCardsProps {
  groups: CompanionGroup[];
}

export default function CompanionPlantCards({ groups }: CompanionPlantCardsProps) {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Companion Plant Groups</h3>
      <p className="text-sm text-gray-600 mb-6">
        These plants naturally grow together in Marin County, creating thriving ecosystems that support wildlife and require minimal maintenance.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.slice(0, 4).map((group, index) => (
          <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h4>
            <p className="text-sm text-gray-700 mb-4">{group.description}</p>
            
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-800 mb-2">Plants in this group:</h5>
              <div className="flex flex-wrap gap-2">
                {group.plants.map((plant, plantIndex) => (
                  <span 
                    key={plantIndex}
                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {plant}
                  </span>
                ))}
              </div>
            </div>
            
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Why Plant Groups Matter</h4>
        <p className="text-xs text-blue-800">
          Native plants have co-evolved over millennia with specific soil fungi, insects, and other plants. 
          By planting them in natural groups, you create cooperative networks that reduce stress, 
          attract beneficial wildlife, improve soil health, and minimize the need for water and maintenance.
        </p>
      </div>
    </div>
  );
}
