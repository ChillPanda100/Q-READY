import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Track input modality (mouse/touch vs keyboard) so we only show focus rings for keyboard users.
// This complements :focus-visible and provides a fallback for browsers that don't support it.
;(function trackInputModality() {
    const cls = 'using-mouse';
    const add = () => document.body.classList.add(cls);
    const remove = () => document.body.classList.remove(cls);

    // If user presses any key, assume keyboard modality and remove the class
    window.addEventListener('keydown', remove, { capture: true, passive: true });
    // Mouse or touch indicates pointer modality; add the class
    window.addEventListener('mousedown', add, { capture: true, passive: true });
    window.addEventListener('touchstart', add, { capture: true, passive: true });
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
