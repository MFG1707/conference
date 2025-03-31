'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToCSV } from "@/lib/utils";
import { Participant, Conference } from "@prisma/client";

interface ParticipantWithConference extends Participant {
  conference: Conference;
}

interface CSVParticipant {
  [key: string]: string;
  Nom: string;
  Prénom: string;
  Email: string;
  Téléphone: string;
  'Titre Conférence': string;
  'Date Conférence': string;
  'Date Inscription': string;
}

const formatDate = (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...options
    });
  } catch {
    return 'N/A';
  }
};

export default function ParticipantTable() {
  const [state, setState] = useState<{
    participants: ParticipantWithConference[];
    conferences: Conference[];
    loading: boolean;
    error: string | null;
  }>({
    participants: [],
    conferences: [],
    loading: true,
    error: null
  });

  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [participantsRes, conferencesRes] = await Promise.all([
        fetch('/api/admin/participants'),
        fetch('/api/conferences')
      ]);

      if (!participantsRes.ok) throw new Error('Failed to load participants');
      if (!conferencesRes.ok) throw new Error('Failed to load conferences');

      const [participantsData, conferencesData] = await Promise.all([
        participantsRes.json(),
        conferencesRes.json()
      ]);

      participantsData.sort((a: ParticipantWithConference, b: ParticipantWithConference) => 
        a.nom.localeCompare(b.nom));

      setState({
        participants: participantsData,
        conferences: conferencesData,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const transformToCSVData = useCallback((data: ParticipantWithConference[]): CSVParticipant[] => {
    return data.map(participant => ({
      Nom: participant.nom || 'N/A',
      Prénom: participant.prenom || 'N/A',
      Email: participant.email || 'N/A',
      Téléphone: participant.telephone || 'N/A',
      'Titre Conférence': participant.conference?.titre || 'N/A',
      'Date Conférence': participant.conference?.date 
        ? formatDate(participant.conference.date)
        : 'N/A',
      'Date Inscription': participant.createdAt
        ? formatDate(participant.createdAt)
        : 'N/A'
    }));
  }, []);

  const filteredParticipants = useCallback(() => {
    if (!selectedDate) return state.participants;
    return state.participants.filter(participant => 
      participant.conference?.date 
        ? new Date(participant.conference.date).toISOString().split('T')[0] === selectedDate
        : false
    );
  }, [state.participants, selectedDate]);

  const handleExport = useCallback(() => {
    const currentParticipants = filteredParticipants();
    if (currentParticipants.length === 0) {
      alert("Aucun participant disponible pour l'export");
      return;
    }
    exportToCSV(transformToCSVData(currentParticipants), `participants_${formatDate(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}`);
  }, [filteredParticipants, transformToCSVData]);

  const renderTableBody = () => {
    const currentParticipants = filteredParticipants();

    if (state.loading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span>Chargement des participants...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (state.error) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8 text-destructive">
            Erreur: {state.error}
          </TableCell>
        </TableRow>
      );
    }

    if (currentParticipants.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
            {selectedDate 
              ? 'Aucun participant inscrit pour cette conférence' 
              : 'Aucun participant trouvé'}
          </TableCell>
        </TableRow>
      );
    }

    return currentParticipants.map((participant) => (
      <TableRow key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <TableCell className="font-medium">{participant.nom}</TableCell>
        <TableCell>{participant.prenom}</TableCell>
        <TableCell className="text-blue-600 dark:text-blue-400">
          <a href={`mailto:${participant.email}`} className="hover:underline">
            {participant.email}
          </a>
        </TableCell>
        <TableCell>
          <a href={`tel:${participant.telephone}`} className="hover:underline">
            {participant.telephone}
          </a>
        </TableCell>
        <TableCell>{participant.conference?.titre}</TableCell>
        <TableCell className="text-right">
          {participant.conference?.date 
            ? formatDate(participant.conference.date, {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })
            : 'N/A'}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="grid w-full sm:max-w-md items-center gap-1.5">
          <Label htmlFor="date-filter">Filtrer par date de conférence</Label>
          <select
            id="date-filter"
            className="border rounded-md p-2 w-full bg-background"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={state.loading}
          >
            <option value="">Toutes les conférences</option>
            {state.conferences.map(conference => (
              <option 
                key={conference.id} 
                value={new Date(conference.date).toISOString().split('T')[0]}
              >
                {formatDate(conference.date, {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })} - {conference.titre}
              </option>
            ))}
          </select>
        </div>
        
        <Button 
          onClick={handleExport}
          disabled={state.loading || filteredParticipants().length === 0}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {state.loading ? 'Chargement...' : '📤 Exporter en CSV'}
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="w-[150px]">Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Conférence</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableBody()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}