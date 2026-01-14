import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

export function useGameLogic() {
  const context = useContext(GameContext);
  
  // Safety Check: If app crashes here, it means <GameProvider> is missing in App.jsx
  if (!context) {
    console.warn("⚠️ GameLogic disconnected: Provider missing.");
    return {
      tier: 'standard',
      xp: 0,
      hearts: 3,
      completedIds: new Set(),
      completeActivity: () => false,
      gainXp: () => {},
      takeDamage: () => {},
      buyHeart: () => {},
      hasAccess: () => true
    };
  }

  return context;
}