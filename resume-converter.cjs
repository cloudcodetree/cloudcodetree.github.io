#!/usr/bin/env node
/**
 * Resume converter script
 * Converts markdown to styled HTML/DOCX that matches the web version
 */

const fs = require('fs');
const path = require('path');

// Extract CSS styles from the web version
const webStyles = `
<style>
/* Resume Styles - Matching Web Version */
body {
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: white;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1976d2;
  text-align: center;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0288d1;
  text-align: center;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  border-bottom: 2px solid rgba(25, 118, 210, 0.3);
  padding-bottom: 4px;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #0288d1;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

p {
  margin-bottom: 1rem;
  text-align: left;
}

ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

strong {
  font-weight: 600;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ddd;
}

.contact-info {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.section {
  margin-bottom: 2rem;
}

.experience-item {
  margin-bottom: 1.5rem;
}

.job-title {
  font-weight: 600;
  color: #0288d1;
}

.job-details {
  font-style: italic;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .two-column {
    grid-template-columns: 1fr;
  }
}

/* Print styles */
@media print {
  body {
    font-size: 11px;
    line-height: 1.4;
  }
  
  h1 { font-size: 18px; }
  h2 { font-size: 14px; }
  h3 { font-size: 12px; }
  h4 { font-size: 11px; }
  
  .section {
    margin-bottom: 1rem;
  }
  
  .experience-item {
    margin-bottom: 0.8rem;
  }
}
</style>
`;

// Function to convert markdown to styled HTML
function convertToHTML() {
  const markdownPath = './public/resume/chris-harper-resume.md';
  const outputPath = './chris-harper-resume-styled.html';
  
  if (!fs.existsSync(markdownPath)) {
    console.error('Markdown file not found:', markdownPath);
    return;
  }
  
  const markdownContent = fs.readFileSync(markdownPath, 'utf8');
  
  // Basic markdown to HTML conversion
  let htmlContent = markdownContent
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\*\*(.+)\*\*$/gm, '<h2>$1</h2>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+)\*\*$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>');
  
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chris Harper - Resume</title>
  ${webStyles}
</head>
<body>
  <div class="header">
    <h1>CHRIS HARPER</h1>
    <h2>Senior Software Engineering Leader | Cloud Architect | Engineering Manager</h2>
    <div class="contact-info">
      📍 Austin Metropolitan Area • 🔗 linkedin.com/in/cloudcodetree • 📧 Contact via cloudcodetree.com
    </div>
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>`;
  
  fs.writeFileSync(outputPath, fullHTML);
  console.log('✅ HTML resume created:', outputPath);
  console.log('💡 Next steps:');
  console.log('   1. Open in browser to verify formatting');
  console.log('   2. Print to PDF or use pandoc to convert to Word:');
  console.log('      pandoc chris-harper-resume-styled.html -o resume.docx');
}

// Function to create a pandoc command
function generatePandocCommand() {
  const command = `
# Install pandoc first:
# brew install pandoc (Mac) or apt install pandoc (Linux)

# Convert markdown to Word with styling:
pandoc public/resume/chris-harper-resume.md \\
  --from markdown \\
  --to docx \\
  --output chris-harper-resume.docx \\
  --reference-doc=custom-reference.docx \\
  --toc \\
  --highlight-style tango

# Or convert to HTML first, then to Word:
pandoc public/resume/chris-harper-resume.md \\
  --from markdown \\
  --to html \\
  --css resume-styles.css \\
  --standalone \\
  --output chris-harper-resume.html

pandoc chris-harper-resume.html \\
  --from html \\
  --to docx \\
  --output chris-harper-resume.docx
`;
  
  console.log('📋 Pandoc conversion commands:');
  console.log(command);
}

// Main execution
if (require.main === module) {
  console.log('🔄 Converting resume...');
  
  // Check which approach to use
  const args = process.argv.slice(2);
  
  if (args.includes('--html')) {
    convertToHTML();
  } else if (args.includes('--pandoc')) {
    generatePandocCommand();
  } else {
    console.log('Usage:');
    console.log('  node resume-converter.js --html     # Create styled HTML');
    console.log('  node resume-converter.js --pandoc   # Show pandoc commands');
    console.log('');
    console.log('🎯 Recommended workflow:');
    console.log('  1. node resume-converter.js --html');
    console.log('  2. Open chris-harper-resume-styled.html in browser');
    console.log('  3. Print → Save as PDF or use pandoc for Word');
  }
}

module.exports = { convertToHTML, generatePandocCommand };