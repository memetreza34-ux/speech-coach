import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlayCircle, Star, Video, MessageSquare, Lightbulb, ChevronLeft, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AcademyScreen = () => {
  const navigate = useNavigate();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(false);

  const categories = [
    {
      title: "Rhetorik & Struktur",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      lessons: [
        { title: "Die 3-Sekunden Pause", practiceMode: "/record/impromptu", duration: "2 Min", type: "read", content: "Die Pause ist das mächtigste Werkzeug in der Rhetorik.\n\nViele Anfänger haben Angst vor Stille und füllen sie mit 'Ähm' oder 'Also'. Eine bewusste Pause von 3 Sekunden nach einem wichtigen Statement gibt dem Publikum Zeit, das Gesagte zu verarbeiten.\n\nTipp für dein nächstes Training: Zähle im Kopf langsam '21, 22, 23', bevor du den nächsten Punkt beginnst. Du wirst sofort souveräner wirken." },
        { title: "Den Elevator Pitch aufbauen", practiceMode: "/record/elevator_pitch", duration: "4 Min", type: "video", videoId: "-FOCpMAww28", content: "Ein guter Pitch braucht genau drei Dinge:\n\n1. Den Hook: Eine steile These oder eine überraschende Frage, die sofort Aufmerksamkeit weckt.\n2. Den Value: Welches Problem löst du, und warum bist du der Einzige, der das kann?\n3. Den Ask: Was willst du von der Person gegenüber?\n\nWer länger als 60 Sekunden braucht, hat sein Thema oft selbst noch nicht ganz durchdrungen. Versuche es direkt in der Arena unter 'Präsentationen' aus!" },
        { title: "STAR-Methode für HR-Fragen", practiceMode: "/record/interview", duration: "3 Min", type: "read", content: "Situation, Task, Action, Result.\n\nWenn du im Bewerbungsgespräch nach Fehlern oder Konflikten gefragt wirst, antworte immer in dieser Struktur.\n\n- Situation: Was war das Problem?\n- Task: Was war deine Aufgabe?\n- Action: Wie hast du gehandelt?\n- Result: Was war das (positive) Lernergebnis?\n\nSo bleibst du immer professionell und lösungsorientiert." },
        { title: "Pyramiden-Prinzip (Minto)", duration: "5 Min", type: "read", content: "Fange immer mit der Kernbotschaft an! Im B2B-Umfeld haben Manager keine Zeit für lange Vorgeschichten.\n\nErkläre erst das 'Was' (das Ergebnis), dann das 'Wie' (deine Argumente) und erst ganz am Schluss das 'Warum' (die Details).\n\nDrehe deine Sätze einfach mal um. Statt: 'Weil die Kosten steigen, müssen wir X tun' sagst du: 'Wir müssen X tun, weil die Kosten steigen.'" },
        { title: "Storytelling: Die Heldenreise", practiceMode: "/record/presentation", duration: "6 Min", type: "video", videoId: "-FOCpMAww28", content: "Jede gute Präsentation erzählt eine Geschichte.\n\nDer größte Fehler im Sales: Das eigene Produkt als Helden darzustellen.\n\nFalsch: Mach den Kunden zum Helden deiner Geschichte. Dein Produkt ist nur das 'magische Schwert', das du ihm reichst, damit er den Drachen (sein Business-Problem) besiegen kann." }
      ]
    },
    {
      title: "Körpersprache & Stimme",
      icon: Video,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      lessons: [
        { title: "Wohin mit den Händen?", duration: "3 Min", type: "video", videoId: "Ks-_Mh1QhMc", content: "Die Grundregel lautet: Hände immer sichtbar halten, idealerweise locker auf Bauchnabelhöhe. Die 'Merkel-Raute' ist ein bekanntes Extrem, zeigt aber die Kernidee: Eine neutrale Ruheposition.\n\nVermeide zwingend verschränkte Arme (Abwehr) oder Hände in den Hosentaschen (Desinteresse).\n\nNutze deine Hände aktiv, um Dimensionen (groß/klein) oder Zahlenstrukturen (Erstens, Zweitens) zu unterstreichen." },
        { title: "Blickkontakt in Videocalls", duration: "2 Min", type: "read", content: "Der größte Fehler in Zoom oder Teams: Du schaust auf die Gesichter der anderen auf deinem Bildschirm.\n\nSchau stattdessen direkt oben in die Kameralinse! Nur wenn du in die Linse schaust, fühlt sich dein Gegenüber wirklich angesehen. Blende zur Not dein eigenes Videobild aus, um nicht ständig dich selbst zu beobachten." },
        { title: "Bauchatmung gegen Nervosität", duration: "5 Min", type: "read", content: "Atme tief in den Bauch (das Zwerchfell), nicht oben in die Brust.\n\nBrustatmung ist eine Stressreaktion des Körpers und macht deine Stimme dünn und zittrig. Wenn du tief in den Bauch atmest, senkt das deinen Puls sofort und gibt deiner Stimme mehr Volumen, Resonanz und Ruhe." },
        { title: "Lautstärkedynamik & Monotonie", practiceMode: "/record/impromptu", duration: "4 Min", type: "video", videoId: "eIho2S0ZahI", content: "Wer monoton spricht, schläfert sein Publikum ein.\n\nDu kannst drei Dinge variieren:\n1. Lautstärke\n2. Sprechtempo\n3. Tonhöhe\n\nWerde ganz leise, um ein 'Geheimnis' zu teilen, und werde etwas lauter und energischer, wenn du deine Kernbotschaft verkündest." }
      ]
    },
    {
      title: "Verhandlung & Sales",
      icon: Target,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
      lessons: [
        { title: "Einwände als Chancen nutzen", practiceMode: "/interview/sales_objection", duration: "4 Min", type: "video", videoId: "eIho2S0ZahI", content: "Ein Kunde sagt 'Zu teuer'. Panik?\n\nNein! 'Zu teuer' bedeutet fast immer nur: 'Ich sehe den Wert für mich noch nicht ganz'.\n\nGehe nicht in die Defensive. Frage stattdessen nach: 'Verstehe ich absolut. Ist es das generelle Budget, oder sind Sie sich noch unsicher, wann sich die Lösung für Sie rechnet?'" },
        { title: "Nie die erste Zahl nennen?", practiceMode: "/record/negotiation", duration: "3 Min", type: "read", content: "Sollte man in Gehaltsverhandlungen abwarten?\n\nVerhandlungs-Experten sagen oft das Gegenteil: Wer die erste Zahl nennt, setzt den 'Anker'. Das Gehirn des Gegenübers orientiert sich unterbewusst immer an dieser ersten Zahl.\n\nEs kann also sehr vorteilhaft sein, selbstbewusst zuerst eine etwas höhere, aber realistische Zahl in den Raum zu stellen." }
      ]
    },
    {
      title: "Psychologie & Mindset",
      icon: Lightbulb,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      lessons: [
        { title: "Das Imposter-Syndrom besiegen", duration: "4 Min", type: "read", content: "'Ich gehöre hier nicht hin. Die merken bald, dass ich keine Ahnung habe.'\n\nViele sehr erfolgreiche Menschen kennen diesen Gedanken. Akzeptiere, dass Aufregung einfach nur bedeutet, dass dir die Sache wichtig ist. Niemand erwartet Perfektion von dir – sie erwarten Leidenschaft für dein Thema." },
        { title: "Blackout! Was nun?", practiceMode: "/record/toastmasters", duration: "3 Min", type: "video", videoId: "Ks-_Mh1QhMc", content: "Ein Blackout passiert den Besten. Was hilft?\n\nTrick 1: Trink langsam einen Schluck Wasser. Das kauft dir 5 Sekunden Zeit.\nTrick 2: Sprich es offen an! 'Jetzt habe ich glatt den Faden verloren – wo war ich gerade stehen geblieben?' Das macht extrem sympathisch, weil es menschlich ist." }
      ]
    }
  ];

  return (
    <motion.div 
      className="flex flex-col min-h-screen bg-slate-50 px-6 py-10 pb-28 overflow-y-auto"
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-1">Akademie</h1>
          <p className="text-sm text-slate-500 font-medium">Lerne die Theorie der Rhetorik.</p>
        </div>
      </div>

      <div 
        className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 mb-8 text-white shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
        onClick={() => {
          setSelectedLesson(categories[0].lessons[4]);
          setPlayingVideo(false);
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-300" />
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-100">Meisterklasse</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Die Kunst des Storytellings</h2>
          <p className="text-sm text-indigo-100 mb-4 line-clamp-2">Lerne, wie du mit einer packenden Einleitung das Publikum fesselst.</p>
          <div className="bg-white/20 hover:bg-white text-white hover:text-indigo-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full inline-flex items-center gap-2 transition-colors">
            <PlayCircle size={16} /> Kurs Starten
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-20">
          <MessageSquare size={120} />
        </div>
      </div>

      <div className="space-y-8">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.bgColor} ${cat.color}`}>
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{cat.title}</h3>
              </div>
              <div className="space-y-3">
                {cat.lessons.map((lesson, lIdx) => (
                  <button 
                    key={lIdx} 
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setPlayingVideo(false);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0">
                        {lesson.type === 'video' ? <PlayCircle size={18} /> : <BookOpen size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 mb-0.5">{lesson.title}</div>
                        <div className="text-xs text-slate-500 font-medium">{lesson.duration} • {lesson.type === 'video' ? 'Video' : 'Artikel'}</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-100 flex items-center justify-center text-transparent group-hover:border-indigo-200 group-hover:text-indigo-500 transition-colors shrink-0">
                      <ChevronLeft size={14} className="rotate-180" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lesson Reader Modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div 
            className="fixed inset-0 z-50 bg-white overflow-y-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <button 
                onClick={() => {
                  setSelectedLesson(null);
                  setPlayingVideo(false);
                }} 
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="font-bold text-slate-800 text-sm truncate px-4">{selectedLesson.title}</div>
              <div className="w-10"></div>
            </div>

            <div className="px-6 py-8 pb-32 max-w-2xl mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-2 text-indigo-600 mb-4 text-xs font-bold tracking-widest uppercase">
                  {selectedLesson.type === 'video' ? <PlayCircle size={16} /> : <BookOpen size={16} />}
                  <span>{selectedLesson.type === 'video' ? 'Video-Lektion' : 'Experten-Artikel'} • {selectedLesson.duration}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 leading-tight">{selectedLesson.title}</h1>
              </div>

              {selectedLesson.type === 'video' && (
                <div className="w-full aspect-video bg-slate-900 rounded-3xl mb-10 flex items-center justify-center relative overflow-hidden shadow-xl shadow-slate-200 group border border-slate-800">
                  {!playingVideo ? (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={() => setPlayingVideo(true)}
                    >
                      <img src={`https://img.youtube.com/vi/${selectedLesson.videoId || 'eIho2S0ZahI'}/maxresdefault.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" alt="Video Thumbnail" />
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent group-hover:from-indigo-600/60 transition-colors"></div>
                      <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                        <PlayCircle size={32} className="text-white ml-1" />
                      </div>
                      <div className="absolute bottom-4 left-4 text-white text-xs font-bold tracking-wider opacity-80 z-10">VIDEO ABSPIELEN</div>
                    </div>
                  ) : (
                    <iframe 
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${selectedLesson.videoId || 'eIho2S0ZahI'}?autoplay=1`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  )}
                </div>
              )}

              <div className="prose prose-slate prose-lg">
                {selectedLesson.content.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={idx} className="list-disc pl-5 mb-6 space-y-2 text-slate-700 font-medium">
                        {paragraph.split('\n').map((item, i) => (
                          <li key={i}>{item.replace('- ', '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (paragraph.match(/^\d\./)) {
                    return (
                      <ol key={idx} className="list-decimal pl-5 mb-6 space-y-2 text-slate-700 font-medium">
                        {paragraph.split('\n').map((item, i) => (
                          <li key={i}>{item.replace(/^\d\.\s/, '')}</li>
                        ))}
                      </ol>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-700 leading-relaxed mb-6 font-medium text-[17px]">
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              <div className="mt-16 p-8 bg-indigo-50 border border-indigo-100 rounded-3xl text-center">
                <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Target size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Bereit für die Praxis?</h3>
                <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">Wende das Gelernte direkt in der Trainings-Arena an und hol dir das Feedback der KI.</p>
                <button 
                  onClick={() => {
                    const route = selectedLesson.practiceMode || '/arena';
                    setSelectedLesson(null);
                    navigate(route);
                  }}
                  className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform w-full sm:w-auto"
                >
                  {selectedLesson.practiceMode ? 'Jetzt üben' : 'Zur Arena wechseln'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
