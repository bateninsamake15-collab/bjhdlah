import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { demandesAPI, elevesAPI, busAPI, trajetsAPI, notificationsAPI, facturesAPI, inscriptionsAPI } from '../services/apiService';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ClipboardList, ArrowLeft, Search, CheckCircle, XCircle, 
  Eye, User, Bus, MapPin, Filter, Calendar, Info, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminInscriptions() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('En attente');
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [montantFacture, setMontantFacture] = useState(500);
  const [motifRefus, setMotifRefus] = useState('');
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (!session) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [demandesRes, elevesRes, busesRes, trajetsRes, inscriptionsRes] = await Promise.all([
        demandesAPI.getAll(),
        elevesAPI.getAll(),
        busAPI.getAll(),
        trajetsAPI.getAll(),
        inscriptionsAPI.getAll()
      ]);
      
      const demandesArray = demandesRes?.data || demandesRes || [];
      const elevesArray = elevesRes?.data || elevesRes || [];
      const busesArray = busesRes?.data || busesRes || [];
      const trajetsArray = trajetsRes?.data || trajetsRes || [];
      const inscriptionsArray = inscriptionsRes?.data || inscriptionsRes || [];
      
      // Filtrer uniquement les demandes d'inscription
      const demandesInscription = demandesArray.filter(d => d.type_demande === 'inscription');
      
      // Enrichir les demandes avec les infos de l'élève
      const demandesWithDetails = demandesInscription.map(d => {
        const eleve = elevesArray.find(e => e.id === d.eleve_id);
        return {
          ...d,
          eleve
        };
      });
      
      setDemandes(demandesWithDetails);
      setEleves(elevesArray);
      setBuses(busesArray);
      setTrajets(trajetsArray);
      setInscriptions(inscriptionsArray);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseDescription = (description) => {
    if (!description) return {};
    try {
      if (typeof description === 'string') {
        return JSON.parse(description);
      }
      return description;
    } catch (e) {
      return {};
    }
  };

  const handleViewDetails = (demande) => {
    setSelectedDemande(demande);
    const desc = parseDescription(demande.description);
    const zoneEleve = desc.zone || demande.eleve?.adresse || '';
    
    // Filtrer les bus disponibles pour la zone de l'élève
    const busesDisponibles = buses.map(bus => {
      const trajet = trajets.find(t => t.id === bus.trajet_id);
      let zonesTrajet = [];
      
      if (trajet?.zones) {
        if (typeof trajet.zones === 'string') {
          try {
            zonesTrajet = JSON.parse(trajet.zones);
          } catch {
            zonesTrajet = trajet.zones.split(',').map(z => z.trim());
          }
        } else if (Array.isArray(trajet.zones)) {
          zonesTrajet = trajet.zones;
        }
      }
      
      // Vérifier si la zone de l'élève correspond aux zones du trajet
      const zoneMatch = !zoneEleve || zonesTrajet.some(zt => 
        zt.toLowerCase().includes(zoneEleve.toLowerCase()) || 
        zoneEleve.toLowerCase().includes(zt.toLowerCase())
      );
      
      // Compter les inscriptions actives pour ce bus
      const elevesInBus = inscriptions.filter(i => 
        i.bus_id === bus.id && (i.statut === 'Active' || i.statut === 'Suspendue')
      ).length;
      
      return {
        ...bus,
        trajet,
        zonesTrajet,
        placesRestantes: bus.capacite - elevesInBus,
        elevesInscrits: elevesInBus,
        zoneMatch
      };
    }).filter(bus => 
      bus.statut === 'Actif' && 
      bus.placesRestantes > 0 && 
      (!zoneEleve || bus.zoneMatch) // Si une zone est spécifiée, filtrer par zone
    );
    
    setAvailableBuses(busesDisponibles);
    setShowDetailsModal(true);
  };

  const handleValidate = async (demande) => {
    if (!selectedDemande) return;
    setProcessing(true);
    setError(null);
    
    try {
      const desc = parseDescription(selectedDemande.description);
      const montant = montantFacture || (desc.abonnement === 'Annuel' ? 4000 : 500);
      
      // Créer la facture
      const factureResponse = await facturesAPI.create({
        demande_id: selectedDemande.id,
        eleve_id: selectedDemande.eleve_id,
        tuteur_id: selectedDemande.tuteur_id,
        montant: montant,
        type_transport: desc.type_transport || ''
      });
      
      if (!factureResponse.success) {
        throw new Error('Erreur lors de la création de la facture');
      }
      
      const facture = factureResponse.data;
      
      // Mettre à jour le statut de la demande
      await demandesAPI.traiter(selectedDemande.id, 'Approuvée', 'Demande approuvée - Facture générée');
      
      // Envoyer notification au tuteur avec la facture
      await notificationsAPI.create({
        destinataire_id: selectedDemande.tuteur_id,
        destinataire_type: 'tuteur',
        titre: 'Inscription validée - Facture disponible',
        message: `Votre demande d'inscription pour ${selectedDemande.eleve?.prenom || ''} ${selectedDemande.eleve?.nom || ''} a été validée. Montant: ${montant} DH. Code de vérification: ${facture.code_verification}. Veuillez procéder au paiement.`,
        type: 'info',
        date: new Date().toISOString()
      });
      
      setShowDetailsModal(false);
      setSelectedDemande(null);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      setError('Erreur lors de la validation: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!selectedDemande || !motifRefus.trim()) {
      setError('Veuillez indiquer le motif du refus');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Mettre à jour le statut de la demande
      await demandesAPI.traiter(selectedDemande.id, 'Rejetée', motifRefus);
      
      // Mettre à jour le statut de l'élève si existe
      if (selectedDemande.eleve_id) {
        try {
          await elevesAPI.update(selectedDemande.eleve_id, {
            statut: 'Refusé'
          });
        } catch (e) {
          console.warn('Erreur lors de la mise à jour de l\'élève:', e);
        }
      }
      
      // Envoyer notification au tuteur
      await notificationsAPI.create({
        destinataire_id: selectedDemande.tuteur_id,
        destinataire_type: 'tuteur',
        titre: 'Inscription refusée',
        message: `Votre demande d'inscription pour ${selectedDemande.eleve?.prenom || ''} ${selectedDemande.eleve?.nom || ''} a été refusée. Motif: ${motifRefus}`,
        type: 'alerte',
        date: new Date().toISOString()
      });
      
      setShowRefuseModal(false);
      setSelectedDemande(null);
      setMotifRefus('');
      await loadData();
    } catch (err) {
      console.error('Erreur lors du refus:', err);
      setError('Erreur lors du refus: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredDemandes = demandes.filter(d => {
    const matchSearch = 
      d.eleve?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.eleve?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.eleve?.adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.eleve?.classe?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'all' || d.statut === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (statut) => {
    const styles = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Approuvée': 'bg-green-100 text-green-700',
      'Rejetée': 'bg-red-100 text-red-700'
    };
    return styles[statut] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ClipboardList className="w-7 h-7" />
              Gestion des Demandes d'Inscription
            </h1>
            <p className="text-blue-100 mt-1">
              {demandes.length} demande(s) d'inscription • {demandes.filter(d => d.statut === 'En attente').length} en attente
            </p>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, prénom, adresse ou classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-12 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Approuvée">Approuvée</SelectItem>
                  <SelectItem value="Rejetée">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100">
            {filteredDemandes.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune demande d'inscription trouvée</p>
              </div>
            ) : (
              filteredDemandes.map((demande) => {
                const desc = parseDescription(demande.description);
                return (
                  <div key={demande.id} className="p-6 hover:bg-amber-50/50 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-7 h-7 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {demande.eleve?.prenom || ''} {demande.eleve?.nom || 'N/A'}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            {demande.eleve?.classe && <span>{demande.eleve.classe}</span>}
                            {desc.zone && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {desc.zone}
                                </span>
                              </>
                            )}
                            {desc.type_transport && (
                              <>
                                <span>•</span>
                                <span>Transport: {desc.type_transport}</span>
                              </>
                            )}
                            {desc.abonnement && (
                              <>
                                <span>•</span>
                                <span>Abonnement: {desc.abonnement}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(demande.date_creation), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusBadge(demande.statut)}`}>
                          {demande.statut}
                        </span>

                        {demande.statut === 'En attente' && (
                          <>
                            <Button
                              onClick={() => handleViewDetails(demande)}
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Détails
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedDemande(demande);
                                setShowRefuseModal(true);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Refuser
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal Détails avec Bus Disponibles */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-500" />
                Détails de la demande d'inscription
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations élève */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Informations de l'élève</h3>
                {selectedDemande.eleve && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Nom complet:</span>
                      <p className="font-medium">{selectedDemande.eleve.prenom} {selectedDemande.eleve.nom}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Classe:</span>
                      <p className="font-medium">{selectedDemande.eleve.classe || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Adresse:</span>
                      <p className="font-medium">{selectedDemande.eleve.adresse || 'N/A'}</p>
                    </div>
                    {selectedDemande.eleve.date_naissance && (
                      <div>
                        <span className="text-gray-600">Date de naissance:</span>
                        <p className="font-medium">{format(new Date(selectedDemande.eleve.date_naissance), 'dd/MM/yyyy')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Informations demande */}
              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Informations de la demande</h3>
                {(() => {
                  const desc = parseDescription(selectedDemande.description);
                  return (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {desc.type_transport && (
                        <div>
                          <span className="text-gray-600">Type de transport:</span>
                          <p className="font-medium">{desc.type_transport}</p>
                        </div>
                      )}
                      {desc.abonnement && (
                        <div>
                          <span className="text-gray-600">Abonnement:</span>
                          <p className="font-medium">{desc.abonnement}</p>
                        </div>
                      )}
                      {desc.groupe && (
                        <div>
                          <span className="text-gray-600">Groupe:</span>
                          <p className="font-medium">{desc.groupe}</p>
                        </div>
                      )}
                      {desc.zone && (
                        <div>
                          <span className="text-gray-600">Zone:</span>
                          <p className="font-medium">{desc.zone}</p>
                        </div>
                      )}
                      {desc.niveau && (
                        <div>
                          <span className="text-gray-600">Niveau:</span>
                          <p className="font-medium">{desc.niveau}</p>
                        </div>
                      )}
                      {desc.lien_parente && (
                        <div>
                          <span className="text-gray-600">Lien de parenté:</span>
                          <p className="font-medium">{desc.lien_parente}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Bus disponibles */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-500" />
                  Bus disponibles pour cette zone
                </h3>
                {availableBuses.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400">
                    <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun bus disponible pour cette zone</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableBuses.map((bus) => (
                      <div 
                        key={bus.id}
                        className="p-4 rounded-xl border-2 border-gray-200 hover:border-amber-300 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{bus.numero}</h4>
                            <p className="text-sm text-gray-500">{bus.marque} {bus.modele}</p>
                            {bus.trajet && (
                              <p className="text-sm text-gray-400">Trajet: {bus.trajet.nom}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Capacité: {bus.elevesInscrits}/{bus.capacite} • {bus.placesRestantes} places restantes
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Montant de la facture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de la facture (DH)
                </label>
                <Input
                  type="number"
                  value={montantFacture}
                  onChange={(e) => setMontantFacture(parseFloat(e.target.value) || 500)}
                  className="rounded-xl"
                  min="0"
                  step="50"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDemande(null);
                  setMontantFacture(500);
                }}
                className="rounded-xl"
                disabled={processing}
              >
                Annuler
              </Button>
              <Button
                onClick={handleValidate}
                disabled={processing || availableBuses.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider et créer la facture
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Refus */}
      {showRefuseModal && selectedDemande && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-500" />
                Refuser la demande
              </h2>
              <p className="text-gray-500 mt-1">
                {selectedDemande.eleve?.prenom} {selectedDemande.eleve?.nom}
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du refus (obligatoire)
              </label>
              <Textarea
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                className="rounded-xl min-h-[120px]"
                placeholder="Expliquez les raisons du refus..."
                required
              />
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefuseModal(false);
                  setSelectedDemande(null);
                  setMotifRefus('');
                }}
                className="rounded-xl"
                disabled={processing}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRefuse}
                disabled={processing || !motifRefus.trim()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirmer le refus
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
