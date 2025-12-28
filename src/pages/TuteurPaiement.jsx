import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { facturesAPI, notificationsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, ArrowLeft, CheckCircle, AlertCircle,
  GraduationCap, Bus, Calendar, FileText
} from 'lucide-react';

export default function TuteurPaiement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tuteur, setTuteur] = useState(null);
  const [facture, setFacture] = useState(null);
  const [codeValidation, setCodeValidation] = useState('');
  const [factureId, setFactureId] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('tuteur_session');
    if (!session) {
      navigate(createPageUrl('TuteurLogin'));
      return;
    }
    const tuteurData = JSON.parse(session);
    setTuteur(tuteurData);
    
    // Vérifier si un code est fourni dans l'URL
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCodeValidation(codeFromUrl);
      // La vérification sera faite après que le tuteur soit chargé
    }
  }, [navigate, searchParams]);

  // Vérifier le code une fois le tuteur chargé
  useEffect(() => {
    if (tuteur && codeValidation && !facture && !validating) {
      handleVerifyCode(codeValidation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuteur]);

  const handleVerifyCode = async (code) => {
    if (!code || code.length < 4) {
      setError('Code de vérification invalide');
      return;
    }
    
    setValidating(true);
    setError('');
    
    try {
      const response = await facturesAPI.getByCode(code);
      
      if (response.success && response.data) {
        const factureData = response.data;
        
        // Vérifier que la facture appartient au tuteur connecté (si le tuteur est chargé)
        if (tuteur && factureData.tuteur_id && factureData.tuteur_id !== tuteur.id) {
          setError('Cette facture ne vous appartient pas');
          setFacture(null);
        } else {
          setFacture(factureData);
          setFactureId(factureData.id);
        }
      } else {
        setError('Code de vérification invalide ou facture déjà payée');
        setFacture(null);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError('Erreur lors de la vérification du code. Veuillez réessayer.');
      setFacture(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!facture || !codeValidation) {
      setError('Veuillez d\'abord vérifier votre code de vérification');
      return;
    }
    
    if (codeValidation.length < 4) {
      setError('Code de validation invalide');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Valider le paiement avec le code (l'API sélectionnera automatiquement un bus)
      const response = await facturesAPI.validerPaiement(codeValidation);
      
      if (response.success) {
        // Notifier le tuteur
        if (tuteur) {
          await notificationsAPI.create({
            destinataire_id: tuteur.id,
            destinataire_type: 'tuteur',
            titre: 'Paiement confirmé',
            message: `Votre paiement de ${facture.montant} DH pour ${facture.eleve_prenom} ${facture.eleve_nom} a été confirmé. L'élève a été affecté au bus ${response.data?.bus_numero || 'assigné'}.`,
            type: 'info',
            date: new Date().toISOString()
          });
        }
        
        setSuccess(true);
        setTimeout(() => {
          navigate(createPageUrl('TuteurDashboard'));
        }, 3000);
      } else {
        setError(response.message || 'Erreur lors de la validation du paiement');
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      setError('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Paiement réussi !</h2>
          <p className="text-gray-500 mb-4">
            Votre paiement a été confirmé et l'inscription a été validée.
          </p>
          <p className="text-sm text-gray-400">Redirection vers le tableau de bord...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500">
            <button
              onClick={() => navigate(createPageUrl('TuteurDashboard'))}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-7 h-7" />
              Validation du paiement
            </h1>
          </div>

          <div className="p-6">
            {!facture ? (
              <>
                {/* Étape 1: Vérification du code */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Étape 1: Vérifier votre code de facture
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Entrez le code de vérification fourni par l'école après le paiement de votre facture.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
                  <Label className="text-gray-700 font-medium mb-2 block">
                    Code de vérification
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      value={codeValidation}
                      onChange={(e) => setCodeValidation(e.target.value.toUpperCase())}
                      placeholder="Entrez le code (ex: ABC12345)"
                      className="h-12 rounded-xl text-center text-xl tracking-widest font-mono flex-1"
                      maxLength={20}
                    />
                    <Button
                      type="button"
                      onClick={() => handleVerifyCode(codeValidation)}
                      disabled={validating || !codeValidation || codeValidation.length < 4}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 px-6"
                    >
                      {validating ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Vérifier'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ce code vous a été communiqué après le paiement de votre facture à l'école
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Étape 2: Affichage de la facture et confirmation */}
                <div className="mb-6">
                  <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 font-medium">Code vérifié avec succès</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    Détails de la facture
                  </h3>
                </div>

                {/* Informations élève */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-amber-500" />
                    Informations de l'élève
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nom complet:</span>
                      <p className="font-medium">{facture.eleve_prenom} {facture.eleve_nom}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Classe:</span>
                      <p className="font-medium">{facture.classe || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Détails du paiement */}
                <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-amber-500" />
                    Détails de la facture
                  </h3>
                  <div className="space-y-3">
                    {facture.type_transport && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type de transport:</span>
                        <span className="font-medium">{facture.type_transport}</span>
                      </div>
                    )}
                    <div className="border-t border-amber-200 pt-3 flex justify-between">
                      <span className="text-lg font-semibold text-gray-800">Montant:</span>
                      <span className="text-2xl font-bold text-amber-600">{facture.montant} DH</span>
                    </div>
                    {facture.date_creation && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Date de création:</span>
                        <span>{new Date(facture.date_creation).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <Label className="text-gray-700 font-medium mb-2 block">
                      Code de vérification (confirmé)
                    </Label>
                    <Input
                      value={codeValidation}
                      readOnly
                      className="h-12 rounded-xl text-center text-xl tracking-widest font-mono bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Confirmer le paiement
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
