import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Academy Practice Links', () => {
  it('contains correct practiceMode paths', () => {
    const filePath = path.join(process.cwd(), 'src', 'screens', 'Academy.jsx');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Storytelling
    expect(content).toContain('practiceMode: "/record/storytelling"');
    expect(content).toContain('id: "storytelling-hero-journey"');
    
    // Sales
    expect(content).toContain('practiceMode: "/interview/sales_objection"');
    
    // Radical Candor
    expect(content).toContain('practiceMode: "/interview/conflict_resolution"');
    
    // Masterclass link check
    expect(content).toContain("const storyLesson = categories.flatMap(c => c.lessons).find(l => l.id === 'storytelling-hero-journey');");
  });
});
