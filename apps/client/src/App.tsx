import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: Address;
  phone: string;
  website: string;
  company: Company;
}

interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}

interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: Geo;
}

interface Geo {
  lat: string;
  lng: string;
}

function App() {
  const [queryEnabled, setQueryEnabled] = useState(false);

  const enableQueryHandler = () => {
    setQueryEnabled((prev) => !prev);
  };

  const { data: user } = useQuery({
    queryKey: ['user'],
    async queryFn() {
      return axios
        .get<User>('https://jsonplaceholder.typicode.com/users/1')
        .then(({ data }) => data);
    },
    enabled: queryEnabled,
  });

  return (
    <main className="prose max-w-none">
      <div className="container mt-16">
        <h1>Hello World</h1>
        <p>
          <Button onClick={enableQueryHandler}>Fetch Query</Button>
        </p>
        {user ? (
          <pre data-testid="fetchedData">{JSON.stringify(user, null, 2)}</pre>
        ) : null}
      </div>
    </main>
  );
}

export default App;
