
import { RequestForm, FastMatchResult, ChefApplicationForm } from '../types';
import { api } from './storage';

// --- PUBLIC ACTIONS ---

export const submitRequest = async (data: RequestForm): Promise<FastMatchResult> => {
  console.log('[Action] Processing Request:', data.mode);
  
  // Persist to "Light Backend"
  const entity = await api.createRequest(data);

  // Determine Response based on Mode (Logic Simplification)
  // In this "Light Backend" iteration, we store everything.
  // We return different success messages based on mode, but logic is unified.
  
  if (data.mode === 'fast') {
    return {
      success: true,
      mode: 'instant_match', // Preserving UI behavior, but data is just stored
      referenceId: entity.id,
      matchedChef: "Chef Selection Pending" // Placeholder as we removed automation
    };
  } else {
    return { 
      success: true, 
      mode: 'concierge_manual',
      referenceId: entity.id
    };
  }
};

export const submitChefApplication = async (data: ChefApplicationForm) => {
  // We could add a similar storage for applications, but for now just mock
  await new Promise(r => setTimeout(r, 1500));
  return { success: true, id: `CHEF-${Date.now().toString().slice(-6)}` };
};
