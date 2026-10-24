import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  return (
    <div className="max-w-2xl mx-auto pt-10">
      <div className="glass rounded-2xl p-8 text-center space-y-4">
        <Users className="size-10 text-muted-foreground mx-auto" aria-hidden="true" />
        <h1 className="text-2xl font-bold">User management is not available</h1>
        <p className="text-muted-foreground">
          This deployment runs locally for a single operator and has no user accounts or sign-in. Adding multi-user access would
          require an identity provider (for example Supabase Auth), role-based authorisation on the API, and per-user Row Level
          Security policies.
        </p>
        <Link href="/settings"><Button variant="outline">View system status</Button></Link>
      </div>
    </div>
  );
}
