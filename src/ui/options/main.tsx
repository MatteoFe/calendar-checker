import { render } from 'preact';
import '../style.css';

const App = () => (
  <main class="p-6 max-w-xl mx-auto">
    <h1 class="text-xl font-bold">Opzioni</h1>
    <p class="text-sm opacity-70">Selezione dei calendari: da implementare.</p>
  </main>
);

render(<App />, document.getElementById('app')!);
