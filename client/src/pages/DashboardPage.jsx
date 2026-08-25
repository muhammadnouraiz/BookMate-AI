import AppointmentList from '../components/appointments/AppointmentList';

export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold mb-6">My appointments</h1>
      <AppointmentList />
    </div>
  );
}