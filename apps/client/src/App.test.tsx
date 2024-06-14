import { http, HttpResponse } from 'msw';

import App from '@/App';
import { server } from '@/mocks/server';
import { render, screen, userEvent } from '@/tests/test-utils';

describe('Testing App Component', () => {
  it('should render App Component', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /hello world/i }),
    ).toBeInTheDocument();
  });

  it('should click fetch query button and fetch the user', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(/users\/1/, () => {
        return HttpResponse.json({
          id: 26,
          name: 'Marcus Hellams',
          username: 'mhellams',
          email: 'mhellams@hotmail.com',
          phone: '555-555-5555',
          website: 'http://mthdigital.com',
        });
      }),
    );
    render(<App />);
    const button = screen.getByRole('button', { name: /fetch query/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByTestId('fetchedData')).not.toBeInTheDocument();
    await user.click(button);
    expect(await screen.findByTestId('fetchedData')).toBeInTheDocument();
    expect(screen.getByText(/"id": 26/)).toBeInTheDocument();
    expect(screen.getByText(/"name": "marcus hellams"/i)).toBeInTheDocument();
  });
});
