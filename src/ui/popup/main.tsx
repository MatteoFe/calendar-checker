import { render } from 'preact';
import '../style.css';

const App = () => (
  <main class="p-4">
    <h1 class="text-lg font-bold">Calendar Checker</h1>
    <p class="text-sm opacity-70">Popup vista mese: da implementare.</p>
  </main>
);

render(<App />, document.getElementById('app')!);
