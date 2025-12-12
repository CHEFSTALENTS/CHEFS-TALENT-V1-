import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../components/ChefLayout';
import { auth } from '../../services/storage';
import { Label, Button, Input, Marker } from '../../components/ui';
import { Loader2, Plus, X, Image as ImageIcon } from 'lucide-react';

const ChefPortfolio = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user && user.profile?.images) {
      setImages(user.profile.images);
    }
  }, []);

  const addImage = () => {
    if (newUrl && !images.includes(newUrl)) {
      const updated = [...images, newUrl];
      setImages(updated);
      setNewUrl('');
      saveImages(updated);
    }
  };

  const removeImage = (url: string) => {
    const updated = images.filter(i => i !== url);
    setImages(updated);
    saveImages(updated);
  };

  const saveImages = async (imgList: string[]) => {
    const user = auth.getCurrentUser();
    if (user) {
      await auth.updateChefProfile(user.id, { images: imgList });
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-4xl">
        <Marker />
        <Label>Visuel</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Portfolio</h1>
        
        <div className="bg-white p-8 border border-stone-200 space-y-8">
           <div className="flex gap-4 items-end">
              <div className="flex-grow space-y-2">
                 <Label>Ajouter une image (URL)</Label>
                 <Input 
                   value={newUrl} 
                   onChange={e => setNewUrl(e.target.value)} 
                   placeholder="https://..." 
                 />
              </div>
              <Button onClick={addImage} disabled={!newUrl} className="mb-0">
                 <Plus className="w-4 h-4 mr-2" /> Ajouter
              </Button>
           </div>

           <div className="bg-stone-50 p-6 border-t border-b border-stone-100">
              <h4 className="text-sm font-medium text-stone-900 mb-2">Conseils Portfolio</h4>
              <p className="text-sm text-stone-500 font-light">
                Privilégiez des photos haute résolution, bien éclairées, mettant en valeur le dressage.
                Évitez les filtres excessifs ou les photos floues. 5 à 10 photos recommandées.
              </p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, idx) => (
                 <div key={idx} className="group relative aspect-square bg-stone-100 overflow-hidden border border-stone-200">
                    <img src={url} alt="Portfolio" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(url)}
                      className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-stone-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <X className="w-4 h-4" />
                    </button>
                 </div>
              ))}
              {images.length === 0 && (
                 <div className="col-span-full py-12 text-center text-stone-400 border border-stone-200 border-dashed">
                    <ImageIcon className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>Aucune image ajoutée.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </ChefLayout>
  );
};

export default ChefPortfolio;