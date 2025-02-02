import React from 'react';

export default function ErrorBoundary() {
    return (
        <div className="error-container">
            <h2>Une erreur est survenue</h2>
            <p>Veuillez réessayer plus tard.</p>
        </div>
    );
}
