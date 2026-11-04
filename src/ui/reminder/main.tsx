import { render } from 'preact';
import '../style.css';

const App = () => (
  <main class="p-4">
    <h1 class="text-lg font-bold">Promemoria</h1>
    <p class="text-sm opacity-70">Finestra promemoria: da implementare.</p>
  </main>
);

render(<App />, document.getElementById('app')!);
