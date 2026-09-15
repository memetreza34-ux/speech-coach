const fs = require('fs');

let code = fs.readFileSync('src/screens/Academy.jsx', 'utf8');

// The new categories array code
const newCategoriesCode = `const categories = [
    {
      title: "Rhetorik & Struktur",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      lessons: [
        { title: "Die 3-Sekunden Pause", practiceMode: "/record/impromptu", duration: "2 Min", type: "read", content: "Die Pause ist das mächtigste Werkzeug in der Rhetorik.\\n\\nViele Anfänger haben Angst vor Stille und füllen sie mit 'Ähm' oder 'Also'. Eine bewusste Pause von 3 Sekunden nach einem wichtigen Statement gibt dem Publikum Zeit, das Gesagte zu verarbeiten.\\n\\nTipp für dein nächstes Training: Zähle im Kopf langsam '21, 22, 23', bevor du den nächsten Punkt beginnst. Du wirst sofort souveräner wirken." },
        { title: "Das KISS-Prinzip", practiceMode: "/record/impromptu", duration: "3 Min", type: "read", content: "Keep It Short and Simple.\\n\\nEiner der häufigsten Fehler: Wir wollen zu klug klingen und benutzen komplizierte Schachtelsätze.\\n\\nDas Gehirn des Zuhörers schaltet bei Fremdwörtern und langen Sätzen ab. Nutze kurze Hauptsätze. Ein Gedanke pro Satz." },
        { title: "Den Elevator Pitch aufbauen", practiceMode: "/record/elevator_pitch", duration: "4 Min", type: "video", videoId: "-FOCpMAww28", content: "Ein guter Pitch braucht genau drei Dinge:\\n\\n1. Den Hook: Eine steile These oder eine überraschende Frage, die sofort Aufmerksamkeit weckt.\\n2. Den Value: Welches Problem löst du, und warum bist du der Einzige, der das kann?\\n3. Den Ask: Was willst du von der Person gegenüber?\\n\\nWer länger als 60 Sekunden braucht, hat sein Thema oft selbst noch nicht ganz durchdrungen. Versuche es direkt in der Arena unter 'Präsentationen' aus!" },
        { title: "STAR-Methode für HR-Fragen", practiceMode: "/record/interview", duration: "3 Min", type: "read", content: "Situation, Task, Action, Result.\\n\\nWenn du im Bewerbungsgespräch nach Fehlern oder Konflikten gefragt wirst, antworte immer in dieser Struktur.\\n\\n- Situation: Was war das Problem?\\n- Task: Was war deine Aufgabe?\\n- Action: Wie hast du gehandelt?\\n- Result: Was war das (positive) Lernergebnis?\\n\\nSo bleibst du immer professionell und lösungsorientiert." },
        { title: "Pyramiden-Prinzip (Minto)", duration: "5 Min", type: "read", content: "Fange immer mit der Kernbotschaft an! Im B2B-Umfeld haben Manager keine Zeit für lange Vorgeschichten.\\n\\nErkläre erst das 'Was' (das Ergebnis), dann das 'Wie' (deine Argumente) und erst ganz am Schluss das 'Warum' (die Details).\\n\\nDrehe deine Sätze einfach mal um. Statt: 'Weil die Kosten steigen, müssen wir X tun' sagst du: 'Wir müssen X tun, weil die Kosten steigen.'" },
        { title: "Storytelling: Die Heldenreise", practiceMode: "/record/presentation", duration: "6 Min", type: "video", videoId: "-FOCpMAww28", content: "Jede gute Präsentation erzählt eine Geschichte.\\n\\nDer größte Fehler im Sales: Das eigene Produkt als Helden darzustellen.\\n\\nFalsch: Mach den Kunden zum Helden deiner Geschichte. Dein Produkt ist nur das 'magische Schwert', das du ihm reichst, damit er den Drachen (sein Business-Problem) besiegen kann." }
      ]
    },
    {
      title: "Körpersprache & Stimme",
      icon: Video,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      lessons: [
        { title: "Wohin mit den Händen?", duration: "3 Min", type: "video", videoId: "Ks-_Mh1QhMc", content: "Die Grundregel lautet: Hände immer sichtbar halten, idealerweise locker auf Bauchnabelhöhe. Die 'Merkel-Raute' ist ein bekanntes Extrem, zeigt aber die Kernidee: Eine neutrale Ruheposition.\\n\\nVermeide zwingend verschränkte Arme (Abwehr) oder Hände in den Hosentaschen (Desinteresse).\\n\\nNutze deine Hände aktiv, um Dimensionen (groß/klein) oder Zahlenstrukturen (Erstens, Zweitens) zu unterstreichen." },
        { title: "Die Power Pose (Amy Cuddy)", duration: "4 Min", type: "read", content: "Deine Körperhaltung beeinflusst deine Hormone.\\n\\nWenn du dich groß machst (Beine breit, Arme in die Hüften – die 'Wonder Woman' Pose), sinkt dein Cortisolspiegel (Stress) und dein Testosteronspiegel (Dominanz/Selbstbewusstsein) steigt.\\n\\nMache diese Pose für 2 Minuten vor deinem nächsten wichtigen Gespräch im Badezimmer. Es wirkt Wunder." },
        { title: "Blickkontakt in Videocalls", duration: "2 Min", type: "read", content: "Der größte Fehler in Zoom oder Teams: Du schaust auf die Gesichter der anderen auf deinem Bildschirm.\\n\\nSchau stattdessen direkt oben in die Kameralinse! Nur wenn du in die Linse schaust, fühlt sich dein Gegenüber wirklich angesehen. Blende zur Not dein eigenes Videobild aus, um nicht ständig dich selbst zu beobachten." },
        { title: "Bauchatmung gegen Nervosität", duration: "5 Min", type: "read", content: "Atme tief in den Bauch (das Zwerchfell), nicht oben in die Brust.\\n\\nBrustatmung ist eine Stressreaktion des Körpers und macht deine Stimme dünn und zittrig. Wenn du tief in den Bauch atmest, senkt das deinen Puls sofort und gibt deiner Stimme mehr Volumen, Resonanz und Ruhe." },
        { title: "Lautstärkedynamik & Monotonie", practiceMode: "/record/impromptu", duration: "4 Min", type: "video", videoId: "eIho2S0ZahI", content: "Wer monoton spricht, schläfert sein Publikum ein.\\n\\nDu kannst drei Dinge variieren:\\n1. Lautstärke\\n2. Sprechtempo\\n3. Tonhöhe\\n\\nWerde ganz leise, um ein 'Geheimnis' zu teilen, und werde etwas lauter und energischer, wenn du deine Kernbotschaft verkündest." }
      ]
    },
    {
      title: "Verhandlung & Sales",
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      lessons: [
        { title: "Einwände als Chancen nutzen", practiceMode: "/interview/sales_objection", duration: "4 Min", type: "video", videoId: "eIho2S0ZahI", content: "Ein Kunde sagt 'Zu teuer'. Panik?\\n\\nNein! 'Zu teuer' bedeutet fast immer nur: 'Ich sehe den Wert für mich noch nicht ganz'.\\n\\nGehe nicht in die Defensive. Frage stattdessen nach: 'Verstehe ich absolut. Ist es das generelle Budget, oder sind Sie sich noch unsicher, wann sich die Lösung für Sie rechnet?'" },
        { title: "BATNA: Dein bester Plan B", practiceMode: "/record/negotiation", duration: "3 Min", type: "read", content: "BATNA steht für 'Best Alternative to a Negotiated Agreement'.\\n\\nGehe niemals in eine Verhandlung, ohne deinen Plan B zu kennen. Was passiert, wenn ihr euch nicht einigt?\\n\\nWenn dein Plan B stark ist (z.B. du hast ein anderes Jobangebot), strahlst du natürliche Souveränität aus und verhandelst härter." },
        { title: "Nie die erste Zahl nennen?", practiceMode: "/record/negotiation", duration: "3 Min", type: "read", content: "Sollte man in Gehaltsverhandlungen abwarten?\\n\\nVerhandlungs-Experten sagen oft das Gegenteil: Wer die erste Zahl nennt, setzt den 'Anker'. Das Gehirn des Gegenübers orientiert sich unterbewusst immer an dieser ersten Zahl.\\n\\nEs kann also sehr vorteilhaft sein, selbstbewusst zuerst eine etwas höhere, aber realistische Zahl in den Raum zu stellen." }
      ]
    },
    {
      title: "Führung & Feedback",
      icon: MessageSquare,
      color: "text-rose-500",
      bgColor: "bg-rose-100",
      lessons: [
        { title: "Radical Candor (Radikale Offenheit)", practiceMode: "/interview/conflict_resolution", duration: "4 Min", type: "read", content: "Feedback sollte zwei Dinge kombinieren: Persönliche Wertschätzung ('Care personally') und direkte Kritik ('Challenge directly').\\n\\nViele Führungskräfte sind zu nett und vermeiden klare Ansagen (Ruinous Empathy). Andere sind direkt, aber unsympathisch (Obnoxious Aggression).\\n\\nSag direkt, was Sache ist, aber zeige, dass es dir um den Erfolg der Person geht." },
        { title: "Das Sandwich-Prinzip vermeiden", practiceMode: "/record/feedback_review", duration: "3 Min", type: "read", content: "Lob - Kritik - Lob. Das klassische Sandwich.\\n\\nVergiss es! Mitarbeiter durchschauen das sofort. Das Lob wirkt unecht und die Kritik wird verwässert.\\n\\nBesser: Trenne beides. Gib echtes Lob, wenn es angebracht ist. Und wenn es Kritik gibt, sei sachlich, konstruktiv und fokussiere dich auf das gewünschte Verhalten in der Zukunft." }
      ]
    },
    {
      title: "Psychologie & Mindset",
      icon: Lightbulb,
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-100",
      lessons: [
        { title: "Das Imposter-Syndrom besiegen", duration: "4 Min", type: "read", content: "'Ich gehöre hier nicht hin. Die merken bald, dass ich keine Ahnung habe.'\\n\\nViele sehr erfolgreiche Menschen kennen diesen Gedanken. Akzeptiere, dass Aufregung einfach nur bedeutet, dass dir die Sache wichtig ist. Niemand erwartet Perfektion von dir – sie erwarten Leidenschaft für dein Thema." },
        { title: "Growth Mindset (Carol Dweck)", practiceMode: "/record/peptalk", duration: "5 Min", type: "read", content: "Menschen mit einem 'Fixed Mindset' glauben, Talent sei angeboren.\\n\\nMenschen mit einem 'Growth Mindset' wissen: Jede Fähigkeit kann durch Anstrengung erlernt werden. Scheitern ist nicht das Ende, sondern notwendiges Feedback auf dem Weg zur Meisterschaft.\\n\\nRede nicht von 'Ich kann das nicht', sondern von 'Ich kann das NOCH nicht'." },
        { title: "Blackout! Was nun?", practiceMode: "/record/toastmasters", duration: "3 Min", type: "video", videoId: "Ks-_Mh1QhMc", content: "Ein Blackout passiert den Besten. Was hilft?\\n\\nTrick 1: Trink langsam einen Schluck Wasser. Das kauft dir 5 Sekunden Zeit.\\nTrick 2: Sprich es offen an! 'Jetzt habe ich glatt den Faden verloren – wo war ich gerade stehen geblieben?' Das macht extrem sympathisch, weil es menschlich ist." }
      ]
    }
  ];`;

// Get the original content from git to start fresh
const { execSync } = require('child_process');
execSync('git checkout src/screens/Academy.jsx', { stdio: 'ignore' });
code = fs.readFileSync('src/screens/Academy.jsx', 'utf8');

const startIndex = code.indexOf('const categories = [');
const endIndex = code.indexOf('return (', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newCategoriesCode + "\n\n  " + code.substring(endIndex);
  fs.writeFileSync('src/screens/Academy.jsx', code);
  console.log("Replaced categories successfully.");
} else {
  console.log("Could not find categories array bounds.");
}
