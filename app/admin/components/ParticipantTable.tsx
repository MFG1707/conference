'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ParticipantTable() {
  const [participants, setParticipants] = useState<ParticipantWithConference[]>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadParticipants();
    loadConferenceDates();
  }, []);

  const loadParticipants = async () => {
    try {
      const response = await fetch('/api/admin/participants');
      const data = await response.json();
      data.sort((a: ParticipantWithConference, b: ParticipantWithConference) => a.nom.localeCompare(b.nom));
      setParticipants(data);
    } catch (error) {
      console.error("Erreur lors du chargement des participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConferenceDates = async () => {
    try {
      const response = await fetch('../api/conferences');
      const data = await response.json();
      setDates(data);
    } catch (error) {
      console.error("Erreur lors du chargement des dates des conférences:", error);
    }
  };

  const filteredParticipants = participants.filter(participant => {
    if (!selectedDate) return true;
    return new Date(participant.conference.date).toISOString().split('T')[0] === selectedDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="date-filter">Filtrer par date</Label>
          <select
            id="date-filter"
            className="border rounded p-2"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">Toutes les dates</option>
            {dates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => exportToCSV(filteredParticipants, 'participants')}>Exporter en CSV</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Conférence</TableHead>
            <TableHead>Date de la Conférence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Chargement...</TableCell>
            </TableRow>
          ) : filteredParticipants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Aucun participant trouvé</TableCell>
            </TableRow>
          ) : (
            filteredParticipants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>{participant.nom}</TableCell>
                <TableCell>{participant.prenom}</TableCell>
                <TableCell>{participant.email}</TableCell>
                <TableCell>{participant.telephone}</TableCell>
                <TableCell>{participant.conference.titre}</TableCell>
                <TableCell>{new Date(participant.conference.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
