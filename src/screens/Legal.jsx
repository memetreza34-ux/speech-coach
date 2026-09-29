import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useGoBack } from '../useGoBack';

const Page = ({ title, content }) => {
  const goBack = useGoBack('/');
  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50 px-6 py-10" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <div className="max-w-md mx-auto w-full">
        <button onClick={goBack} className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 text-sm font-medium mb-8">
          <ChevronLeft size={18} /> Zurück
        </button>
        <h1 className="text-3xl font-serif text-slate-900 mb-6">{title}</h1>
        <div className="prose prose-slate prose-sm text-slate-700">
          <p className="italic text-slate-500 mb-6">Hinweis: Dies ist ein Platzhalter-Text für Demonstrationszwecke und nicht rechtlich geprüft.</p>
          {content}
        </div>
      </div>
    </motion.div>
  );
};

export const PrivacyScreen = () => (
  <Page title="Datenschutzerklärung" content={<div className="space-y-4">
    {/* Beschreibt die Datenflüsse, die der Code tatsächlich hat. Ersetzt keine rechtliche Prüfung. */}
    <p><strong>Verantwortlich:</strong> siehe Impressum.</p>
    <p><strong>Anmeldung:</strong> Du meldest dich mit deinem Google-Konto über Firebase Authentication (Google) an. Dabei verarbeiten wir Name, E-Mail-Adresse und eine Nutzer-ID.</p>
    <p><strong>Gespeicherte Daten:</strong> In Google Cloud Firestore speichern wir deine Profilangaben (Name, Rolle, Alter, Interessen, Trainingsziel), deine Trainings-Sessions (Transkript, Messwerte, KI-Feedback), deine eigenen Szenarien und tägliche Nutzungszähler.</p>
    <p><strong>Spracherkennung:</strong> Die Live-Transkription nutzt die Spracherkennung deines Browsers. Je nach Browser wird das Audio dafür an dessen Anbieter übertragen (z. B. Google bei Chrome, Apple bei Safari).</p>
    <p><strong>Audioaufnahme:</strong> Die Aufnahme zum Nachhören bleibt in deinem Browser und wird nicht hochgeladen.</p>
    <p><strong>KI-Auswertung:</strong> Für Feedback, Live-Gespräche, Langzeitanalyse und Persona senden wir Transkript, Messwerte und deine Profilangaben (Name, Rolle, Alter, Interessen) an die Google Gemini API.</p>
    <p><strong>Kamera (Pro, optional):</strong> Ist die Kamera an, gehen bis zu fünf Standbilder pro Antwort zur Auswertung der Körpersprache an die Google Gemini API. Die App speichert diese Bilder nicht.</p>
    <p><strong>Löschen:</strong> Im Profil kannst du jederzeit deine Trainingsdaten oder deinen gesamten Account löschen.</p>
  </div>} />
);

export const ImprintScreen = () => (
  <Page title="Impressum" content={<>
    <p>Angaben gemäß § 5 DDG</p>
    <p>Speech Coach Demo<br />Musterstraße 123 (Demo)<br />12345 Musterstadt (Demo)</p>
    <p>Vertreten durch: Max Mustermann</p>
    <p>Kontakt:<br />E-Mail: kontakt@speechcoach-demo.com</p>
  </>} />
);

export const TermsScreen = () => (
  <Page title="Nutzungsbedingungen" content={<>
    <p>Mit der Nutzung von Speech Coach erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.</p>
    <p>Die App und alle darin enthaltenen Inhalte werden "wie besehen" zur Verfügung gestellt. Wir übernehmen keine Gewährleistung für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte und KI-Bewertungen.</p>
  </>} />
);
