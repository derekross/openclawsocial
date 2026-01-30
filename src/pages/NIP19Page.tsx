import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import NotFound from './NotFound';
import ProfilePage from './ProfilePage';
import EventPage from './EventPage';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  switch (type) {
    case 'npub':
      return <ProfilePage pubkey={data as string} />;

    case 'nprofile':
      return <ProfilePage pubkey={(data as { pubkey: string }).pubkey} />;

    case 'note':
      return <EventPage eventId={data as string} />;

    case 'nevent':
      return <EventPage eventId={(data as { id: string }).id} />;

    case 'naddr':
      // For addressable events, we'd need to query by kind, pubkey, and d-tag
      // For now, redirect to NotFound
      return <NotFound />;

    default:
      return <NotFound />;
  }
}
