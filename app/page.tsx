"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  conferenceId: string;
}

interface Conference {
  id: string;
  date: Date;
  titre: string;
}

export default function ConferenceRegistration() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>();

  const [conferences, setConferences] = useState<Conference[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await axios.get<Conference[]>("/api/conferences");
        setConferences(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des conférences", error);
        setMessage({ text: "Erreur lors du chargement des conférences", type: 'error' });
      }
    };

    fetchConferences();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await axios.post("/api/register", data);
      setMessage({ text: response.data.message, type: 'success' });
      reset();
    } catch (error) {
      console.error("Erreur lors de l'inscription", error);
      setMessage({
        text: axios.isAxiosError(error) 
          ? error.response?.data?.message || "Une erreur est survenue" 
          : "Une erreur est survenue",
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Colonne de gauche - Logo seulement */}
        <div className="w-full md:w-1/4 flex justify-center md:justify-start">
          <div className="bg-white p-6 rounded-xl shadow-lg sticky top-4 h-fit">
            <div className="w-[300px] h-[180px] relative"> {/* Taille agrandie 6x */}
              <Image
                src="/images/carretudiant.jpg"
                alt="Logo Carrefour Étudiant"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Colonne de droite - Tout le contenu */}
        <div className="w-full md:w-3/4">
          {/* En-tête */}
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Carrefour Étudiant International
            </h1>
            <p className="text-lg text-gray-600">
              Ouvrez les portes de votre avenir académique à l'étranger
            </p>
          </header>

          {/* Formulaire */}
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Inscription à la Conférence
              </CardTitle>
              <CardDescription className="text-gray-600">
                Réservez votre place pour découvrir les opportunités d'études à l'international
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {message && (
                <div className={`mb-6 p-4 rounded-lg text-center ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-gray-700">Nom*</Label>
                    <Input
                      id="nom"
                      {...register("nom", { required: "Le nom est obligatoire" })}
                      placeholder="Votre nom"
                      className="border-gray-300 focus:border-blue-500"
                    />
                    {errors.nom && (
                      <p className="text-sm text-red-600">{errors.nom.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-gray-700">Prénom*</Label>
                    <Input
                      id="prenom"
                      {...register("prenom", { required: "Le prénom est obligatoire" })}
                      placeholder="Vos prénoms"
                      className="border-gray-300 focus:border-blue-500"
                    />
                    {errors.prenom && (
                      <p className="text-sm text-red-600">{errors.prenom.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { 
                      required: "L'email est obligatoire",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Adresse email invalide"
                      }
                    })}
                    placeholder="votre@email.com"
                    className="border-gray-300 focus:border-blue-500"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-gray-700">Téléphone*</Label>
                  <Input
                    id="telephone"
                    {...register("telephone", { 
                      required: "Le téléphone est obligatoire",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Numéro de téléphone invalide (10 chiffres)"
                      }
                    })}
                    placeholder="0197979797 par exemple"
                    className="border-gray-300 focus:border-blue-500"
                  />
                  {errors.telephone && (
                    <p className="text-sm text-red-600">{errors.telephone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Conférence*</Label>
                  <Controller
                    name="conferenceId"
                    control={control}
                    rules={{ required: "Veuillez sélectionner une conférence" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder="Sélectionnez une date de conférence" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {conferences.map((conference) => (
                            <SelectItem 
                              key={conference.id} 
                              value={conference.id}
                              className="hover:bg-blue-50"
                            >
                              <div className="flex items-center">
                                <span>
                                  {new Date(conference.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })} - {conference.titre}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.conferenceId && (
                    <p className="text-sm text-red-600">{errors.conferenceId.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement en cours...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      S'inscrire à la conférence
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <footer className="mt-12 text-center text-gray-600">
            <p>© {new Date().getFullYear()} Carrefour Étudiant International - Tous droits réservés</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
