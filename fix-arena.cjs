const fs = require('fs');
let code = fs.readFileSync('src/screens/Arena.jsx', 'utf8');

// Add states for deleting
code = code.replace(/const \[showCustomModal, setShowCustomModal\] = useState\(false\);/, `const [showCustomModal, setShowCustomModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);`);

// Add handleDeleteCustom
const deleteFunc = `
  const handleDeleteCustom = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Möchtest du dieses eigene Szenario wirklich löschen?')) return;
    setDeletingId(id);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(\`/api/custom-modes/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || 'Fehler beim Löschen.', 'error');
        return;
      }
      setLocalProfile({ customModes: customModes.filter(m => m.id !== id) });
      addToast('Szenario gelöscht.', 'success');
    } catch (err) {
      addToast('Netzwerkfehler beim Löschen.', 'error');
    } finally {
      setDeletingId(null);
    }
  };
`;
code = code.replace(/return \(/, deleteFunc + '\n  return (');

// Add delete button
code = code.replace(/<div className=\{\`h-28 w-full bg-gradient-to-br \$\{mode\.color\} p-4 flex flex-col justify-between relative\`\}>\n\s*<IconComponent className="text-white\/80" size=\{24\} \/>/g, 
`<div className={\`h-28 w-full bg-gradient-to-br \${mode.color} p-4 flex flex-col justify-between relative\`}>
                      <div className="flex justify-between items-start">
                        <IconComponent className="text-white/80" size={24} />
                        <button 
                          onClick={(e) => handleDeleteCustom(e, mode.id)}
                          disabled={deletingId === mode.id}
                          className="p-1 rounded-md hover:bg-white/20 transition-colors text-white/70 hover:text-white disabled:opacity-50"
                        >
                          {deletingId === mode.id ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.Trash2 size={16} />}
                        </button>
                      </div>`);

fs.writeFileSync('src/screens/Arena.jsx', code);
