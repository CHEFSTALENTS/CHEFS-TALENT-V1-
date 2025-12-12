
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Marker, Label } from '../components/ui';
import { auth } from '../services/storage';
import { Loader2 } from 'lucide-react';

const ChefSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await auth.registerChef(formData);
    setLoading(false);

    if (res.success) {
      navigate('/chef/dashboard');
    } else {
      setError(res.error || "Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      <div className="hidden md:block bg-stone-900 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Kitchen"
        />
        <div className="absolute inset-0 flex items-center justify-center text-white p-12">
          <div className="max-w-md">
             <h2 className="text-4xl font-serif mb-6">L'excellence au service de votre carrière.</h2>
             <p className="text-stone-300 font-light">Rejoignez un réseau exclusif de chefs privés opérant au plus haut niveau de l'industrie.</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-8 md:p-24">
        <div className="w-full max-w-md space-y-8">
           <div className="text-center md:text-left">
             <Marker className="mx-auto md:mx-0" />
             <Label>Candidature Chef</Label>
             <h1 className="text-3xl font-serif text-stone-900 mt-4">Créer votre compte</h1>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Prénom</Label>
                   <Input 
                      required 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Nom</Label>
                   <Input 
                      required 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                   />
                 </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                   type="email" 
                   required 
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input 
                   type="password" 
                   required 
                   value={formData.password}
                   onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 border border-red-100">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Créer mon compte"}
              </Button>

              <div className="text-center pt-4">
                <Link to="/chef/login" className="text-xs text-stone-500 hover:text-stone-900 border-b border-transparent hover:border-stone-900 transition-all">
                  J'ai déjà un compte
                </Link>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default ChefSignup;
