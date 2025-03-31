import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ParticipantTable from "./components/ParticipantTable";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord Administrateur</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Participants aux conférences</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantTable />
        </CardContent>
      </Card>
    </div>
  );
}