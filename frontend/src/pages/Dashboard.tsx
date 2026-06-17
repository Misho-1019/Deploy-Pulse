import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h2>
      <p className="mt-2 text-gray-500">Your monitors will appear here.</p>
    </div>
  );
}
