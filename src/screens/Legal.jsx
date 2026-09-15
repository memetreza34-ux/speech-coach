import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Page = ({ title, content }) => {
  const navigate = useNavigate();
  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50 px-6 py-10" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
      <div className="max-w-md mx-auto w-full">
        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 text-sm font-medium mb-8">
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
  <Page title="Datenschutzerklärung" content={<>
    <p>Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
    <p>Die Nutzung unserer App ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis.</p>
  </>} />
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
