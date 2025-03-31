'use client';

import { useEffect, useState } from 'react';
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
  Nom: string;
  Prénom: string;
  Email: string;
  Téléphone: string;
  'Conférence': string;
  'Date de la conférence': string;
  'Date d\'inscription': string;
}

export default function ParticipantTable() {
  const [participants, setParticipants] = useState<ParticipantWithConference[]>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [participantsRes, conferencesRes] = await Promise.all([
          fetch('/api/admin/participants'),
          fetch('../api/conferences')
        ]);

        const participantsData = await participantsRes.json();
        const conferencesData = await conferencesRes.json();

        participantsData.sort((a: ParticipantWithConference, b: ParticipantWithConference) => 
          a.nom.localeCompare(b.nom));

        setParticipants(participantsData);
        setDates(conferencesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const transformToCSVData = (data: ParticipantWithConference[]): CSVParticipant[] => {
    return data.map(participant => ({
      Nom: participant.nom,
      Prénom: participant.prenom,
      Email: participant.email,
      Téléphone: participant.telephone,
      'Conférence': participant.conference.titre,
      'Date de la conférence': new Date(participant.conference.date).toLocaleDateString('fr-FR'),
      'Date d\'inscription': new Date(participant.createdAt).toLocaleDateString('fr-FR')
    }));
  };

  const filteredParticipants = participants.filter(participant => {
    if (!selectedDate) return true;
    return new Date(participant.conference.date).toISOString().split('T')[0] === selectedDate;
  });

  const handleExport = () => {
    if (filteredParticipants.length === 0) {
      alert("Aucun participant à exporter");
      return;
    }
    exportToCSV(transformToCSVData(filteredParticipants), 'participants');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="grid w-full sm:max-w-sm items-center gap-1.5">
          <Label htmlFor="date-filter">Filtrer par date</Label>
          <select
            id="date-filter"
            className="border rounded p-2 w-full"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">Toutes les dates</option>
            {dates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
        </div>
        <Button 
          onClick={handleExport}
          disabled={loading || filteredParticipants.length === 0}
          className="w-full sm:w-auto"
        >
          {loading ? 'Chargement...' : 'Exporter en CSV'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Conférence</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Chargement en cours...</TableCell>
              </TableRow>
            ) : filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {selectedDate ? 'Aucun participant pour cette date' : 'Aucun participant trouvé'}
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.nom}</TableCell>
                  <TableCell>{participant.prenom}</TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.telephone}</TableCell>
                  <TableCell>{participant.conference.titre}</TableCell>
                  <TableCell>
                    {new Date(participant.conference.date).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}