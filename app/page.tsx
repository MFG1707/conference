"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        const response = await axios.get("./api/conferences");
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
      const response = await axios.post("./api/register", data);
      setMessage({ text: response.data.message, type: 'success' });
      reset();
    } catch (error: any) {
      console.error("Erreur lors de l'inscription", error);
      setMessage({
        text: error.response?.data?.message || "Une erreur est survenue lors de l'inscription",
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Inscription Conférence 
          </CardTitle>
          <CardTitle className="text-2xl font-bold text-center">
            Carrefour etudiant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-4 p-3 rounded-md text-center ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom*</Label>
              <Input
                id="nom"
                {...register("nom", { required: "Le nom est obligatoire" })}
                placeholder="Votre nom"
              />
              {errors.nom && (
                <p className="text-sm text-red-600">{errors.nom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom*</Label>
              <Input
                id="prenom"
                {...register("prenom", { required: "Le prénom est obligatoire" })}
                placeholder="Vos  prénoms"
              />
              {errors.prenom && (
                <p className="text-sm text-red-600">{errors.prenom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
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
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone*</Label>
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
              />
              {errors.telephone && (
                <p className="text-sm text-red-600">{errors.telephone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Conférence*</Label>
              <Controller
                name="conferenceId"
                control={control}
                rules={{ required: "Veuillez sélectionner une conférence" }}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une date" />
                    </SelectTrigger>
                    <SelectContent>
                      {conferences.map((conference) => (
                        <SelectItem 
                          key={conference.id} 
                          value={conference.id}
                        >
                          {new Date(conference.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })} - {conference.titre}
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
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : "S'inscrire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}