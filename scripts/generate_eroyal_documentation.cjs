const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const assetDir = path.join(docsDir, 'eroyal_documentation_assets');
const buildDir = path.join(docsDir, '.eroyal_docx_build');
const mediaDir = path.join(buildDir, 'word', 'media');
const markdownPath = path.join(docsDir, 'eRoyal_Project_Documentation.md');
const docxPath = path.join(docsDir, 'eRoyal_Final_Project_Documentation.docx');

fs.mkdirSync(docsDir, { recursive: true });
fs.rmSync(assetDir, { recursive: true, force: true });
fs.mkdirSync(assetDir, { recursive: true });
fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(mediaDir, { recursive: true });
fs.mkdirSync(path.join(buildDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(buildDir, 'docProps'), { recursive: true });
fs.mkdirSync(path.join(buildDir, 'word', '_rels'), { recursive: true });

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mdEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function svgText(text, x, y, width, options = {}) {
  const {
    size = 24,
    weight = 600,
    fill = '#0f172a',
    anchor = 'middle',
    lineHeight = 1.18,
  } = options;
  const maxChars = Math.max(8, Math.floor(width / (size * 0.52)));
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * size * lineHeight) / 2;
  return `<text x="${x}" y="${startY}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * lineHeight}">${xmlEscape(l)}</tspan>`)
    .join('')}</text>`;
}

function svgBox(x, y, w, h, text, fill = '#f8fafc', stroke = '#0d9488', options = {}) {
  const rx = options.rx ?? 18;
  const textColor = options.textColor ?? '#0f172a';
  const size = options.size ?? 24;
  const weight = options.weight ?? 700;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>${svgText(text, x + w / 2, y + h / 2 + size * 0.34, w - 28, { size, weight, fill: textColor })}`;
}

function svgActor(x, y, label) {
  return `
    <circle cx="${x}" cy="${y}" r="24" fill="#0d9488"/>
    <line x1="${x}" y1="${y + 24}" x2="${x}" y2="${y + 86}" stroke="#0f766e" stroke-width="8" stroke-linecap="round"/>
    <line x1="${x - 42}" y1="${y + 48}" x2="${x + 42}" y2="${y + 48}" stroke="#0f766e" stroke-width="8" stroke-linecap="round"/>
    <line x1="${x}" y1="${y + 86}" x2="${x - 38}" y2="${y + 142}" stroke="#0f766e" stroke-width="8" stroke-linecap="round"/>
    <line x1="${x}" y1="${y + 86}" x2="${x + 38}" y2="${y + 142}" stroke="#0f766e" stroke-width="8" stroke-linecap="round"/>
    ${svgText(label, x, y + 185, 180, { size: 22, weight: 700 })}
  `;
}

function svgArrow(x1, y1, x2, y2, label = '') {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="4" marker-end="url(#arrow)"/>
    ${label ? svgText(label, midX, midY - 10, Math.abs(x2 - x1) + 120, { size: 16, weight: 600, fill: '#334155' }) : ''}
  `;
}

function svgShell(title, body, width = 1200, height = 720) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
        <path d="M2,2 L10,6 L2,10 Z" fill="#334155"/>
      </marker>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.15"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    <rect x="28" y="24" width="${width - 56}" height="${height - 48}" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
    ${svgText(title, width / 2, 76, width - 120, { size: 34, weight: 800, fill: '#0f172a' })}
    ${body}
  </svg>`;
}

const diagrams = [
  {
    key: 'project_schedule',
    title: 'Project Scheduling',
    caption: 'Figure 1: Project scheduling for eRoyal',
    svg: svgShell('Project Scheduling', `
      ${svgBox(80, 150, 180, 70, 'Requirement Study', '#ecfeff', '#0891b2', { size: 21 })}
      ${svgBox(310, 150, 170, 70, 'SRS and Planning', '#f0fdf4', '#16a34a', { size: 21 })}
      ${svgBox(530, 150, 170, 70, 'UI Design', '#fff7ed', '#ea580c', { size: 21 })}
      ${svgBox(750, 150, 170, 70, 'Implementation', '#eff6ff', '#2563eb', { size: 21 })}
      ${svgBox(970, 150, 150, 70, 'Testing', '#fef2f2', '#dc2626', { size: 21 })}
      ${svgArrow(260, 185, 310, 185)}
      ${svgArrow(480, 185, 530, 185)}
      ${svgArrow(700, 185, 750, 185)}
      ${svgArrow(920, 185, 970, 185)}
      ${svgBox(180, 315, 220, 62, 'Firebase Setup', '#eef2ff', '#4f46e5', { size: 20 })}
      ${svgBox(440, 315, 250, 62, 'Role Based Modules', '#f0fdfa', '#0d9488', { size: 20 })}
      ${svgBox(730, 315, 260, 62, 'Documentation and Review', '#fdf4ff', '#c026d3', { size: 20 })}
      ${svgArrow(400, 346, 440, 346)}
      ${svgArrow(690, 346, 730, 346)}
      ${svgBox(130, 500, 930, 78, 'Iterative improvements were made after testing billing, complaints, marketplace, vehicle logs, storage rules, and role based navigation.', '#ffffff', '#94a3b8', { size: 22, weight: 600 })}
    `),
  },
  {
    key: 'system_architecture',
    title: 'System Architecture',
    caption: 'Figure 2: eRoyal system architecture',
    svg: svgShell('System Architecture', `
      ${svgBox(70, 165, 190, 85, 'Admin User', '#ecfeff', '#0d9488')}
      ${svgBox(70, 315, 190, 85, 'Resident User', '#eff6ff', '#2563eb')}
      ${svgBox(70, 465, 190, 85, 'Security Staff', '#fff7ed', '#ea580c')}
      ${svgBox(390, 250, 270, 150, 'Expo React Native App Expo Router TypeScript', '#ffffff', '#0f766e', { size: 23 })}
      ${svgBox(790, 120, 250, 72, 'Firebase Auth', '#f0fdfa', '#0d9488', { size: 22 })}
      ${svgBox(790, 230, 250, 72, 'Cloud Firestore', '#eef2ff', '#4f46e5', { size: 22 })}
      ${svgBox(790, 340, 250, 72, 'Firebase Storage', '#fff7ed', '#ea580c', { size: 22 })}
      ${svgBox(790, 450, 250, 72, 'Cloud Functions', '#fef2f2', '#dc2626', { size: 22 })}
      ${svgBox(790, 560, 250, 72, 'Gemini AI API', '#fdf4ff', '#c026d3', { size: 22 })}
      ${svgArrow(260, 207, 390, 285, 'manage')}
      ${svgArrow(260, 357, 390, 325, 'use services')}
      ${svgArrow(260, 507, 390, 365, 'gate entry')}
      ${svgArrow(660, 300, 790, 156, 'login')}
      ${svgArrow(660, 315, 790, 266, 'data')}
      ${svgArrow(660, 330, 790, 376, 'images')}
      ${svgArrow(660, 345, 790, 486, 'admin tasks')}
      ${svgArrow(660, 360, 790, 596, 'assistant OCR')}
    `),
  },
  {
    key: 'use_case',
    title: 'Use Case Diagram',
    caption: 'Figure 3: eRoyal use case diagram',
    svg: svgShell('Use Case Diagram', `
      ${svgActor(125, 140, 'Admin')}
      ${svgActor(125, 385, 'Resident')}
      ${svgActor(1080, 265, 'Security')}
      <rect x="310" y="120" width="575" height="460" rx="28" fill="#ffffff" stroke="#0d9488" stroke-width="4"/>
      ${svgText('eRoyal App', 598, 165, 300, { size: 28, weight: 800, fill: '#0f766e' })}
      ${svgBox(360, 205, 205, 58, 'Manage Users', '#f0fdfa', '#0d9488', { size: 20 })}
      ${svgBox(615, 205, 205, 58, 'Generate Bills', '#eff6ff', '#2563eb', { size: 20 })}
      ${svgBox(360, 295, 205, 58, 'Resolve Complaints', '#fff7ed', '#ea580c', { size: 20 })}
      ${svgBox(615, 295, 205, 58, 'Approve Listings', '#fdf4ff', '#c026d3', { size: 20 })}
      ${svgBox(360, 390, 205, 58, 'View Announcements', '#ecfeff', '#0891b2', { size: 20 })}
      ${svgBox(615, 390, 205, 58, 'Pay Bills', '#f0fdf4', '#16a34a', { size: 20 })}
      ${svgBox(360, 485, 205, 58, 'Post Complaint', '#fef2f2', '#dc2626', { size: 20 })}
      ${svgBox(615, 485, 205, 58, 'Log Vehicle Entry Exit', '#fff7ed', '#ea580c', { size: 19 })}
      ${svgArrow(190, 210, 360, 232)}
      ${svgArrow(190, 210, 615, 232)}
      ${svgArrow(190, 210, 360, 323)}
      ${svgArrow(190, 210, 615, 323)}
      ${svgArrow(190, 455, 360, 418)}
      ${svgArrow(190, 455, 615, 418)}
      ${svgArrow(190, 455, 360, 512)}
      ${svgArrow(1018, 335, 820, 512)}
    `),
  },
  {
    key: 'agile_model',
    title: 'Agile Process Model',
    caption: 'Figure 4: Agile process model used for eRoyal',
    svg: svgShell('Agile Process Model', `
      ${svgBox(500, 145, 200, 70, 'Plan', '#ecfeff', '#0891b2')}
      ${svgBox(760, 270, 210, 70, 'Design', '#f0fdf4', '#16a34a')}
      ${svgBox(690, 475, 210, 70, 'Develop', '#eff6ff', '#2563eb')}
      ${svgBox(300, 475, 210, 70, 'Test', '#fef2f2', '#dc2626')}
      ${svgBox(230, 270, 210, 70, 'Review', '#fff7ed', '#ea580c')}
      ${svgArrow(700, 180, 760, 304)}
      ${svgArrow(865, 340, 795, 475)}
      ${svgArrow(690, 510, 510, 510)}
      ${svgArrow(405, 475, 335, 340)}
      ${svgArrow(440, 304, 500, 180)}
      ${svgBox(470, 305, 260, 95, 'Repeat for each module: users, bills, complaints, marketplace, vehicles, AI assistant', '#ffffff', '#94a3b8', { size: 20, weight: 600 })}
    `),
  },
  {
    key: 'er_model',
    title: 'Data Model',
    caption: 'Figure 5: ER model for Firestore collections',
    svg: svgShell('Data Model', `
      ${svgBox(485, 130, 230, 70, 'users', '#f0fdfa', '#0d9488')}
      ${svgBox(115, 270, 215, 70, 'bills', '#eff6ff', '#2563eb')}
      ${svgBox(360, 270, 215, 70, 'complaints', '#fff7ed', '#ea580c')}
      ${svgBox(625, 270, 215, 70, 'listings', '#fdf4ff', '#c026d3')}
      ${svgBox(875, 270, 215, 70, 'registeredVehicles', '#ecfeff', '#0891b2', { size: 21 })}
      ${svgBox(250, 455, 215, 70, 'vehicleLogs', '#fef2f2', '#dc2626')}
      ${svgBox(510, 455, 215, 70, 'announcements', '#f0fdf4', '#16a34a', { size: 21 })}
      ${svgBox(770, 455, 215, 70, 'notifications', '#eef2ff', '#4f46e5', { size: 21 })}
      ${svgArrow(485, 165, 330, 305, 'residentId')}
      ${svgArrow(530, 200, 465, 270, 'residentId')}
      ${svgArrow(670, 200, 715, 270, 'postedBy')}
      ${svgArrow(715, 165, 875, 305, 'residentId')}
      ${svgArrow(600, 200, 358, 455, 'residentId')}
      ${svgArrow(715, 200, 770, 455, 'userId')}
      ${svgArrow(600, 200, 617, 455, 'createdBy')}
    `),
  },
  {
    key: 'dfd',
    title: 'Data Flow Model',
    caption: 'Figure 6: Level 0 data flow diagram',
    svg: svgShell('Data Flow Model', `
      ${svgBox(70, 145, 180, 72, 'Admin', '#f0fdfa', '#0d9488')}
      ${svgBox(70, 325, 180, 72, 'Resident', '#eff6ff', '#2563eb')}
      ${svgBox(70, 505, 180, 72, 'Security', '#fff7ed', '#ea580c')}
      ${svgBox(430, 245, 330, 190, 'eRoyal Mobile Web Application', '#ffffff', '#0f766e', { size: 26 })}
      ${svgBox(925, 125, 205, 72, 'Auth Store', '#ecfeff', '#0891b2')}
      ${svgBox(925, 265, 205, 72, 'Firestore Data', '#eef2ff', '#4f46e5')}
      ${svgBox(925, 405, 205, 72, 'Storage Files', '#fff7ed', '#ea580c')}
      ${svgBox(925, 545, 205, 72, 'AI Service', '#fdf4ff', '#c026d3')}
      ${svgArrow(250, 181, 430, 290, 'admin commands')}
      ${svgArrow(250, 361, 430, 340, 'requests')}
      ${svgArrow(250, 541, 430, 390, 'gate logs')}
      ${svgArrow(760, 290, 925, 161, 'credentials')}
      ${svgArrow(760, 322, 925, 301, 'records')}
      ${svgArrow(760, 354, 925, 441, 'images')}
      ${svgArrow(760, 386, 925, 581, 'chat OCR')}
    `),
  },
  {
    key: 'login_sequence',
    title: 'Login Sequence',
    caption: 'Figure 7: Login and role routing sequence',
    svg: svgShell('Login Sequence', `
      ${svgText('User', 150, 150, 130, { size: 23, weight: 800 })}
      ${svgText('Login Screen', 380, 150, 190, { size: 23, weight: 800 })}
      ${svgText('AuthContext', 620, 150, 190, { size: 23, weight: 800 })}
      ${svgText('Firebase', 850, 150, 160, { size: 23, weight: 800 })}
      ${svgText('Router', 1050, 150, 140, { size: 23, weight: 800 })}
      ${[150, 380, 620, 850, 1050].map(x => `<line x1="${x}" y1="180" x2="${x}" y2="610" stroke="#94a3b8" stroke-width="3" stroke-dasharray="8 8"/>`).join('')}
      ${svgArrow(150, 235, 380, 235, 'email password')}
      ${svgArrow(380, 295, 620, 295, 'login()')}
      ${svgArrow(620, 355, 850, 355, 'signInWithEmailAndPassword')}
      ${svgArrow(850, 415, 620, 415, 'uid')}
      ${svgArrow(620, 475, 850, 475, 'read users/{uid}')}
      ${svgArrow(620, 535, 1050, 535, 'admin resident security route')}
    `),
  },
  {
    key: 'billing_sequence',
    title: 'Billing Sequence',
    caption: 'Figure 8: Billing and payment verification sequence',
    svg: svgShell('Billing Sequence', `
      ${svgText('Admin', 130, 145, 120, { size: 23, weight: 800 })}
      ${svgText('Billing Service', 380, 145, 210, { size: 23, weight: 800 })}
      ${svgText('Firestore', 630, 145, 160, { size: 23, weight: 800 })}
      ${svgText('Resident', 875, 145, 160, { size: 23, weight: 800 })}
      ${svgText('Storage', 1070, 145, 130, { size: 23, weight: 800 })}
      ${[130, 380, 630, 875, 1070].map(x => `<line x1="${x}" y1="178" x2="${x}" y2="615" stroke="#94a3b8" stroke-width="3" stroke-dasharray="8 8"/>`).join('')}
      ${svgArrow(130, 230, 380, 230, 'generate monthly bills')}
      ${svgArrow(380, 292, 630, 292, 'read residents, complaints, dues')}
      ${svgArrow(380, 354, 630, 354, 'batch create bills')}
      ${svgArrow(630, 416, 875, 416, 'bill visible as Unpaid')}
      ${svgArrow(875, 478, 1070, 478, 'upload proof image')}
      ${svgArrow(875, 540, 630, 540, 'status Pending')}
      ${svgArrow(130, 602, 630, 602, 'verify -> Paid')}
    `),
  },
  {
    key: 'complaint_sequence',
    title: 'Complaint Sequence',
    caption: 'Figure 9: Complaint lifecycle sequence',
    svg: svgShell('Complaint Sequence', `
      ${svgText('Resident', 145, 150, 160, { size: 23, weight: 800 })}
      ${svgText('Complaint Service', 410, 150, 240, { size: 23, weight: 800 })}
      ${svgText('Firestore', 675, 150, 160, { size: 23, weight: 800 })}
      ${svgText('Storage', 885, 150, 130, { size: 23, weight: 800 })}
      ${svgText('Admin', 1070, 150, 120, { size: 23, weight: 800 })}
      ${[145, 410, 675, 885, 1070].map(x => `<line x1="${x}" y1="180" x2="${x}" y2="610" stroke="#94a3b8" stroke-width="3" stroke-dasharray="8 8"/>`).join('')}
      ${svgArrow(145, 240, 410, 240, 'submit complaint')}
      ${svgArrow(410, 305, 675, 305, 'transaction counter C001')}
      ${svgArrow(410, 370, 675, 370, 'create Pending complaint')}
      ${svgArrow(410, 435, 885, 435, 'background photo upload')}
      ${svgArrow(1070, 500, 675, 500, 'In Progress or Resolved')}
      ${svgArrow(1070, 565, 675, 565, 'optional charge to bill')}
    `),
  },
  {
    key: 'vehicle_state',
    title: 'Vehicle State Model',
    caption: 'Figure 10: Vehicle gate state model',
    svg: svgShell('Vehicle State Model', `
      ${svgBox(85, 305, 210, 86, 'Registered Vehicle', '#ecfeff', '#0891b2')}
      ${svgBox(380, 205, 210, 86, 'Entry Logged', '#f0fdfa', '#16a34a')}
      ${svgBox(380, 425, 210, 86, 'Visitor Entry', '#fff7ed', '#ea580c')}
      ${svgBox(690, 315, 210, 86, 'Active Inside', '#eff6ff', '#2563eb')}
      ${svgBox(975, 315, 150, 86, 'Exited', '#fef2f2', '#dc2626')}
      ${svgArrow(295, 348, 380, 248, 'plate lookup')}
      ${svgArrow(295, 348, 380, 468, 'visitor data')}
      ${svgArrow(590, 248, 690, 348, 'exitTime null')}
      ${svgArrow(590, 468, 690, 348, 'exitTime null')}
      ${svgArrow(900, 358, 975, 358, 'exit scan')}
      ${svgBox(415, 575, 380, 70, 'Vehicle logs remain as audit records and are visible to admin, security, and relevant residents.', '#ffffff', '#94a3b8', { size: 20, weight: 600 })}
    `),
  },
];

const contents = [];
const figures = [];

function add(type, value, extra = {}) {
  contents.push({ type, value, ...extra });
}

function addFigure(key) {
  const figure = diagrams.find(d => d.key === key);
  figures.push(figure);
  add('image', figure.key, { caption: figure.caption });
}

function addBullets(items) {
  for (const item of items) add('bullet', item);
}

function addNumbered(items) {
  items.forEach((item, index) => add('p', `${index + 1}. ${item}`));
}

function addTitlePages() {
  add('title', 'Final Year Project Report');
  add('center', 'on');
  add('title', 'eRoyal Housing Society Management System');
  add('center', 'Submitted By');
  add('center', '[Your Roll Number]        [Your Name]');
  add('center', '');
  add('center', 'In Partial Fulfillment of');
  add('center', 'The Requirements for the Degree of');
  add('center', 'Bachelor of Science in Software Engineering');
  add('center', '');
  add('center', 'Supervised by: [Supervisor Name]');
  add('center', 'Department of Computer Sciences');
  add('center', '[University Name]');
  add('center', 'Session: 2022-2026');
  add('pageBreak');
  add('h1', 'Dedication');
  add('p', 'I dedicate this project report to my parents, teachers, supervisor, and friends who supported me throughout the development of this project. Their guidance, patience, and encouragement helped me complete the eRoyal Housing Society Management System with confidence and consistency.');
  add('p', 'This work is also dedicated to the academic environment that helped me understand practical software engineering, requirement analysis, mobile application development, cloud database design, testing, and documentation.');
  add('pageBreak');
  add('h1', 'Acknowledgement');
  add('p', 'I am thankful to my supervisor for continuous guidance, useful feedback, and support during the planning, development, and documentation of this project. I am also thankful to the Department of Computer Sciences for providing the opportunity to build a real-world software project.');
  add('p', 'I also acknowledge the support of my family and friends, who encouraged me during research, implementation, testing, and final report preparation. The eRoyal project strengthened my understanding of React Native, Expo, Firebase, TypeScript, role-based access control, and cloud-based mobile app architecture.');
  add('p', 'Regards');
  add('p', '[Your Name]');
  add('pageBreak');
}

function addToc() {
  add('h1', 'Table of Contents');
  [
    'Chapter 1     Introduction and Background',
    '1.1 Statement of Problem Area',
    '1.2 Background History',
    '1.3 Previous and Current Work',
    '1.4 Project Description',
    '1.5 Purpose',
    '1.6 Objectives',
    '1.7 Scope',
    '1.8 Introduction',
    '1.9 Tools and Technologies Used',
    '1.10 Deployment Platform',
    '1.11 Project Scheduling',
    'Chapter 2     Software Requirements Specifications (SRS)',
    '2.1 Functional Requirements',
    '2.2 Nonfunctional Requirements',
    '2.3 Project/Product Feasibility Report',
    'Chapter 3     System Performance Requirements',
    'Chapter 4     System Analysis and Design Overview',
    'Chapter 5     User Interface Design',
    'Chapter 6     System Verification and Validation',
    'Chapter 7     Conclusions',
    'Bibliography and References',
    'Glossary',
  ].forEach(line => add('toc', line));
  add('pageBreak');
  add('h1', 'List of Figures');
  diagrams.forEach(d => add('toc', d.caption));
  add('pageBreak');
  add('h1', 'List of Tables');
  [
    'Table 1: Tools and technologies used',
    'Table 2: Deployment platform',
    'Table 3: Functional requirements',
    'Table 4: Non-functional requirements',
    'Table 5: Feasibility summary',
    'Table 6: Use case descriptions',
    'Table 7: Data dictionary',
    'Table 8: User interface specification',
    'Table 9: Report formats and sample fields',
    'Table 10: Error conditions and system messages',
    'Table 11: Test cases and expected results',
    'Table 12: Glossary',
  ].forEach(line => add('toc', line));
  add('pageBreak');
}

function addChapter1() {
  add('h1', 'Chapter 1');
  add('h1', 'Introduction and Background');
  add('h2', '1.1 Statement of Problem Area');
  add('p', 'Housing societies commonly manage resident records, monthly bills, complaints, announcements, marketplace notices, and gate vehicle entries through paper registers, WhatsApp groups, spreadsheets, or separate manual processes. This creates delays, weak tracking, duplicate work, and limited transparency for residents and management.');
  add('p', 'Residents often need to physically visit the office to ask about bills, submit complaints, confirm payment status, or request society information. Security staff also face difficulty verifying vehicle details quickly when vehicle records are stored manually. Admins have to maintain users, bills, complaint records, marketplace approvals, and announcements in different places, which increases the chance of human error.');
  add('p', 'The eRoyal Housing Society Management System solves this problem by providing one mobile and web application for admins, residents, and security staff. It centralizes authentication, billing, complaint management, announcements, property marketplace, registered vehicles, gate logs, image uploads, and AI-based resident assistance.');

  add('h2', '1.2 Background History');
  add('p', 'The management of modern housing societies is becoming more digital because residents expect fast communication, online records, and transparent service tracking. Traditional manual management methods are slow and difficult to scale when the number of residents, complaints, vehicles, and monthly bills increases.');
  add('p', 'Mobile applications are now widely used for community management because they allow residents to receive notices, upload payment proofs, report issues with photos, and view records at any time. Firebase-based systems are especially useful for such projects because they provide authentication, real-time database updates, file storage, and serverless functions without requiring a separate backend server.');

  add('h2', '1.3 Previous and Current Work');
  add('p', 'Previous society management methods usually depend on paper registers for gate entry, manual billing records, and informal communication channels for announcements. These systems provide limited search, weak security, and poor reporting.');
  add('p', 'Some existing applications provide partial society management features, but many do not combine role-based admin dashboards, resident services, security gate control, Firebase storage, real-time listeners, AI chatbot assistance, and license plate OCR in one project. eRoyal combines these services into a single cross-platform Expo application.');

  add('h2', '1.4 Project Description');
  add('p', 'eRoyal is a housing society management application built using React Native, Expo Router, TypeScript, and Firebase. The system supports three main roles: admin, resident, and security staff. Each role has its own protected routes and dashboard experience.');
  add('p', 'Admins can create users, generate monthly bills, verify payment proofs, resolve complaints, approve marketplace listings, create announcements, and monitor vehicle logs. Residents can view announcements, submit complaints, upload complaint photos, view and pay bills, upload payment proof, register vehicles, view gate logs, post property listings, and use the AI assistant. Security staff can log resident, visitor, and service vehicle entries and exits, use camera-based license plate scanning, and view active vehicles.');
  addFigure('system_architecture');

  add('h2', '1.5 Purpose');
  add('p', 'The purpose of eRoyal is to make society administration faster, more transparent, and easier for residents, admins, and gate security staff. The project reduces manual paperwork and provides a centralized digital platform for all important society workflows.');
  addBullets([
    'Provide a secure role-based login system for admin, resident, and security users.',
    'Allow admins to manage society members, bills, complaints, vehicles, listings, and announcements.',
    'Allow residents to access their own records and submit service requests from the app.',
    'Allow security staff to maintain accurate vehicle entry and exit logs.',
    'Store images such as payment proofs, complaint evidence, marketplace photos, vehicle photos, and profile pictures in Firebase Storage.',
    'Support AI assistance and license plate OCR through the Gemini API.',
  ]);

  add('h2', '1.6 Objectives');
  addBullets([
    'Design and develop a cross-platform housing society management system using Expo and React Native.',
    'Implement Firebase Authentication with role-based routing and route protection.',
    'Create a Firestore database model for users, bills, complaints, listings, vehicles, logs, announcements, counters, and notifications.',
    'Develop an admin module for user management, billing, complaint resolution, marketplace review, announcements, and vehicle monitoring.',
    'Develop a resident module for bills, payment proof upload, complaint submission, vehicle registration, marketplace, announcements, and AI chatbot.',
    'Develop a security module for gate entry, exit logging, active vehicle tracking, visitor handling, image capture, and plate recognition.',
    'Improve performance through real-time Firestore listeners, in-memory cache services, and client-side sorting where suitable.',
    'Protect data through Firestore rules, Storage rules, validation schemas, and role-specific access control.',
  ]);

  add('h2', '1.7 Scope');
  add('p', 'The scope of eRoyal includes the core operations of a residential housing society. The project covers account creation by admin, authenticated access, monthly billing, payment proof verification, complaint management, property marketplace listings, announcements, vehicle registration, gate entry and exit logs, file uploads, and AI assistant support.');
  add('p', 'The project is suitable for a society office, resident mobile users, and gate security staff. It is not a banking system and does not directly process payments; instead, residents upload payment proof and admins verify the proof. It is also not a full ERP system, but it provides the main operational workflows needed for society management.');

  add('h2', '1.8 Introduction');
  add('p', 'eRoyal Housing Society Management System is a practical software engineering project that demonstrates mobile application development, cloud database integration, authentication, file storage, role-based access control, and software testing. The application is built with Expo Router and Firebase, making it suitable for Android, iOS, and web deployment.');

  add('h2', '1.9 Tools and Technologies Used');
  add('table', [
    ['Tool/Technology', 'Use in Project'],
    ['React Native', 'Cross-platform mobile UI development'],
    ['Expo SDK 54', 'Development runtime, routing, build support, camera, image picker, splash screen'],
    ['Expo Router', 'File-based navigation and role-specific route groups'],
    ['TypeScript', 'Static typing for models, services, forms, and contexts'],
    ['Firebase Authentication', 'Email/password login and authenticated sessions'],
    ['Cloud Firestore', 'NoSQL database for users, bills, complaints, listings, vehicles, logs, announcements, notifications'],
    ['Firebase Storage', 'Image uploads for proofs, complaints, vehicles, marketplace, announcements, and profiles'],
    ['Firebase Cloud Functions', 'Admin-only deletion of Firebase Auth users'],
    ['Google Gemini API', 'AI assistant and license plate OCR support'],
    ['Zod', 'Form and input validation schemas'],
    ['React Native Paper and Expo Vector Icons', 'UI components and iconography'],
    ['GitHub', 'Version control and source hosting'],
  ], { caption: 'Table 1: Tools and technologies used' });

  add('h2', '1.10 Deployment Platform');
  add('table', [
    ['Platform', 'Description'],
    ['Android', 'Configured through Expo with package com.eroyal.app'],
    ['iOS', 'Supported through Expo configuration with tablet support'],
    ['Web', 'Static Expo web output configured in app.json'],
    ['Firebase', 'Backend platform for auth, database, storage, rules, and functions'],
    ['EAS', 'Expo Application Services project ID is configured for builds'],
    ['AWS Amplify/Vercel-style static hosting option', 'amplify.yml and web static output are present for web deployment workflows'],
  ], { caption: 'Table 2: Deployment platform' });

  add('h2', '1.11 Project Scheduling');
  add('p', 'The project was completed using an iterative approach. Requirement analysis and Firebase setup were followed by role-based UI development, service implementation, rule configuration, testing, and report preparation.');
  addFigure('project_schedule');
}

function addChapter2() {
  add('h1', 'Chapter 2');
  add('h1', 'Software Requirements Specifications (SRS)');
  add('h2', '2.1 Functional Requirements');
  add('table', [
    ['ID', 'Requirement', 'Description', 'Priority'],
    ['FR-01', 'Login', 'Users must sign in using email and password through Firebase Authentication.', 'High'],
    ['FR-02', 'Role routing', 'System must redirect admin, resident, and security users to their own modules.', 'High'],
    ['FR-03', 'User management', 'Admin can create and view resident, admin, and security accounts.', 'High'],
    ['FR-04', 'Monthly billing', 'Admin can generate monthly bills for all residents or a single resident.', 'High'],
    ['FR-05', 'Payment proof upload', 'Residents can upload bill payment proof images.', 'High'],
    ['FR-06', 'Payment verification', 'Admin can approve or reject uploaded payment proof.', 'High'],
    ['FR-07', 'Complaint submission', 'Residents can create complaints with category, description, and optional photo.', 'High'],
    ['FR-08', 'Complaint resolution', 'Admin can update complaint status, add notes, and add optional charges to bills.', 'High'],
    ['FR-09', 'Marketplace listing', 'Residents can post property sale/rent listings with photos.', 'Medium'],
    ['FR-10', 'Listing approval', 'Admin can approve, reject, deactivate, or review listings.', 'High'],
    ['FR-11', 'Announcements', 'Admin can create announcements and residents can view them.', 'Medium'],
    ['FR-12', 'Vehicle registration', 'Residents can register vehicles and upload vehicle images.', 'High'],
    ['FR-13', 'Gate entry logging', 'Security can log resident, visitor, and service vehicle entry and exit.', 'High'],
    ['FR-14', 'OCR plate scanning', 'Security can use camera OCR to detect vehicle plates through Gemini.', 'Medium'],
    ['FR-15', 'AI assistant', 'Residents can ask society-related questions through the Gemini chatbot.', 'Medium'],
    ['FR-16', 'Notifications', 'System can create bill-related and workflow notifications.', 'Medium'],
  ], { caption: 'Table 3: Functional requirements' });

  add('h2', '2.2 Nonfunctional Requirements');
  add('table', [
    ['Category', 'Requirement'],
    ['Security', 'All protected operations require Firebase Authentication and role checks. Firestore and Storage rules enforce permissions.'],
    ['Performance', 'App uses role-specific real-time contexts and client-side cache to reduce repeated database reads.'],
    ['Reliability', 'Critical billing operations use Firestore batch writes and transactions for counters and bill generation.'],
    ['Usability', 'Role-specific screens, status badges, image pickers, responsive helpers, and clear error messages improve user experience.'],
    ['Maintainability', 'Code is organized into app routes, services, contexts, reusable components, types, and utilities.'],
    ['Portability', 'Expo allows Android, iOS, and web builds from one React Native codebase.'],
    ['Scalability', 'Firestore collections and Firebase Storage can scale without manual server administration.'],
    ['Validation', 'Zod schemas validate email, password, CNIC, house number, bill, complaint, vehicle, and marketplace inputs.'],
  ], { caption: 'Table 4: Non-functional requirements' });

  add('h2', '2.3 Project/Product Feasibility Report');
  add('table', [
    ['Feasibility Type', 'Assessment'],
    ['Technical Feasibility', 'The project is technically feasible because Expo, React Native, Firebase, and TypeScript are mature and widely supported.'],
    ['Operational Feasibility', 'The system matches real housing society workflows for admin, resident, and security users.'],
    ['Legal and Ethical Feasibility', 'The system uses authenticated access and rule-based restrictions. Sensitive data such as user profiles and payment proof images are protected by Firebase rules.'],
    ['Economic Feasibility', 'Firebase and Expo provide low-cost development and hosting options suitable for academic and small society deployments.'],
    ['Schedule Feasibility', 'The modular structure allows independent development and testing of auth, billing, complaints, marketplace, and gate modules.'],
    ['Motivational Feasibility', 'The project solves a visible real-world problem and is useful for residents, admins, and security staff.'],
    ['Information Feasibility', 'Required data is clearly represented in Firestore collections and TypeScript interfaces.'],
    ['Specification Feasibility', 'Requirements are measurable through functional tests such as login, bill generation, complaint resolution, and gate entry logging.'],
  ], { caption: 'Table 5: Feasibility summary' });
}

function addChapter3() {
  add('h1', 'Chapter 3');
  add('h1', 'System Performance Requirements');
  add('h2', '3.1 Efficiency');
  add('p', 'The application improves efficiency by using persistent real-time listeners in AppDataContext, AdminDataContext, and SecurityDataContext. Screens read already loaded data from context instead of repeatedly calling Firestore on each navigation. Billing generation also fetches residents and existing bills in parallel where possible.');
  add('h2', '3.2 Reliability');
  add('p', 'The system uses Firestore transactions for complaint number counters and batch writes for monthly bill generation. This helps prevent incomplete writes and inconsistent data when multiple documents must be updated together.');
  add('h2', '3.3 Security');
  add('p', 'Security is implemented through Firebase Authentication, role-based route guards, Firestore rules, Storage rules, role-specific collections, and admin-only Cloud Functions. Users can only perform operations allowed by their role.');
  add('h2', '3.4 Maintainability');
  add('p', 'The codebase separates UI screens from services, contexts, reusable components, utility functions, and TypeScript types. This makes it easier to modify one module without affecting unrelated modules.');
  add('h2', '3.5 Modification');
  add('p', 'New features can be added by creating a service, TypeScript type, screen route, and rules update. Existing modules such as listings, vehicles, complaints, and bills already follow this pattern.');
  add('h2', '3.6 Portability');
  add('p', 'The Expo configuration supports Android, iOS, and web. The project uses a single TypeScript React Native codebase and Firebase cloud services, so it does not depend on one local server platform.');
}

function addChapter4() {
  add('h1', 'Chapter 4');
  add('h1', 'System Analysis and Design Overview');
  add('h2', '4.1 Use Case Diagrams');
  add('p', 'The main actors are Admin, Resident, and Security Staff. Admin manages the society, Resident uses services, and Security Staff handles gate operations.');
  addFigure('use_case');
  add('table', [
    ['Use Case', 'Actor', 'Typical Flow', 'Alternate Flow'],
    ['Login', 'All users', 'Enter email and password, Firebase verifies, app fetches role, route opens.', 'Invalid credentials show an error and user remains on login screen.'],
    ['Generate Monthly Bills', 'Admin', 'Select month and base charges, system generates bills for residents.', 'Existing bills are skipped to avoid duplication.'],
    ['Submit Complaint', 'Resident', 'Enter title, category, description, optional photo, system creates complaint number.', 'Photo upload can fail in background while complaint record remains saved.'],
    ['Verify Payment', 'Admin', 'Open pending bills, inspect proof, approve or reject.', 'Rejected proof resets bill to Unpaid.'],
    ['Log Vehicle Entry', 'Security', 'Scan/enter plate, select resident or visitor, save entry.', 'If OCR fails, plate can be entered manually.'],
  ], { caption: 'Table 6: Use case descriptions' });

  add('h2', '4.2 Software Process Model');
  add('p', 'The Agile iterative model was used because modules could be developed and tested independently. Authentication and Firebase setup were implemented first, followed by admin, resident, and security workflows.');
  addFigure('agile_model');

  add('h2', '4.3 Data Model');
  add('p', 'The project uses Firestore as a NoSQL database. Each document is connected through UID fields such as residentId, postedBy, createdBy, loggedBy, userId, and billId.');
  addFigure('er_model');
  add('h3', '4.3.1 ER Model');
  add('p', 'The ER model shows how users connect to bills, complaints, marketplace listings, registered vehicles, vehicle logs, announcements, and notifications. In Firestore, these are separate collections connected through ID fields rather than relational foreign keys.');
  add('h3', '4.3.2 System Data Dictionary');
  add('table', [
    ['Collection', 'Main Fields', 'Purpose'],
    ['users', 'uid, name, email, houseNo, cnic, role, profilePictureUrl, createdAt, createdBy', 'Unified user profiles for admin, resident, and security roles.'],
    ['residents/admins/security_staff', 'uid, name, email, role, houseNo, cnic, createdAt', 'Legacy role-specific profile collections kept for compatibility.'],
    ['bills', 'residentId, residentName, houseNo, month, breakdown, amount, dueDate, status, proofUrl, verifiedBy', 'Monthly bills and payment verification workflow.'],
    ['complaints', 'complaintNumber, title, description, category, imageUrl, status, residentId, resolutionNotes, chargeAmount', 'Resident complaints and admin resolution tracking.'],
    ['listings', 'type, price, size, location, contact, description, photos, status, postedBy, reviewedBy', 'Property sale/rent marketplace with admin approval.'],
    ['registeredVehicles', 'vehicleNo, type, color, imageUrl, residentId, residentName, houseNo', 'Resident vehicle registry.'],
    ['vehicleLogs', 'vehicleNo, type, entryTime, exitTime, residentId, houseNo, visitorName, purpose, photoUrl, exitPhotoUrl', 'Gate entry and exit audit records.'],
    ['announcements', 'title, message, priority, imageUrls, createdBy, createdByName, createdAt', 'Official notices created by admin.'],
    ['notifications', 'userId, title, message, type, isRead, relatedId, createdAt', 'In-app workflow notifications.'],
    ['counters', 'count', 'Auto-increment support for complaint numbers.'],
  ], { caption: 'Table 7: Data dictionary' });

  add('h2', '4.4 Behavioral Models');
  add('h3', '4.4.1 Data Flow Models');
  add('p', 'Data flows from role-specific screens to service functions and then to Firebase services. Images are stored in Firebase Storage while metadata and workflow statuses are stored in Firestore.');
  addFigure('dfd');
  add('h3', '4.4.2 System Sequence Models');
  add('p', 'The following sequence models explain authentication, billing, complaint management, and vehicle gate processes.');
  addFigure('login_sequence');
  addFigure('billing_sequence');
  addFigure('complaint_sequence');

  add('h2', '4.5 Object Models');
  add('p', 'The object model is represented through TypeScript interfaces. Main entities include User, Bill, Complaint, Listing, VehicleLog, RegisteredVehicle, Notification, and ApiResponse. These interfaces keep service and UI code consistent.');
  add('h3', '4.5.1 State Models');
  add('p', 'Important workflow states include Bill status (Draft, Unpaid, Pending, Paid), Complaint status (Pending, In Progress, Resolved), Listing status (Pending, Approved, Rejected, Sold, Inactive), and Vehicle state (registered, entered, active inside, exited).');
  addFigure('vehicle_state');
  add('h3', '4.5.2 Class Inheritance Model');
  add('p', 'The project uses React components, hooks, contexts, and TypeScript interfaces rather than a deep class inheritance hierarchy. ErrorBoundary is a class component, while most business logic is organized as service functions.');

  add('h2', '4.6 Implementation Languages');
  addBullets([
    'TypeScript is used for the Expo app, services, contexts, components, and validation.',
    'JavaScript is used for helper scripts such as admin claim setup and project scripts.',
    'Firebase Rules language is used for Firestore and Storage security rules.',
    'JSON is used for Expo, Firebase, EAS, TypeScript, and package configuration files.',
  ]);

  add('h2', '4.7 Required Support Software');
  addBullets([
    'Node.js and npm for project dependency installation and scripts.',
    'Expo CLI for running Android, iOS, and web development builds.',
    'Firebase project with Authentication, Firestore, Storage, and Functions enabled.',
    'Gemini API key for chatbot and OCR features.',
    'Android Studio or Expo Go for mobile testing.',
    'Modern browser for web testing.',
  ]);
}

function addChapter5() {
  add('h1', 'Chapter 5');
  add('h1', 'User Interface Design');
  add('h2', '5.1 User Interface Specification');
  add('p', 'The eRoyal interface uses a teal primary color, refined grey surfaces, status colors, responsive spacing, reusable cards, buttons, inputs, avatars, status badges, loading states, and role-specific navigation stacks.');
  add('table', [
    ['Module', 'Screens', 'Main UI Functions'],
    ['Authentication', 'Login, Forgot Password', 'Email/password login, password reset, role-based redirect.'],
    ['Admin', 'Dashboard, Users, Bills, Complaints, Marketplace, Announcements, Vehicles', 'Statistics, management lists, create forms, detail pages, approvals, verification.'],
    ['Resident', 'Home, Bills, Complaints, Marketplace, Vehicles, Announcements, Chatbot, Change Password', 'Quick actions, personal records, uploads, listings, vehicle registration, AI help.'],
    ['Security', 'Gate Entry', 'Resident entry, visitor entry, exit tab, active vehicles, camera capture, OCR.'],
    ['Common Components', 'Button, Card, Input, Avatar, StatusBadge, SkeletonLoader, ImagePicker, ErrorBoundary', 'Reusable design and error handling elements.'],
  ], { caption: 'Table 8: User interface specification' });

  add('h3', '5.1.1 User Interface Designs');
  add('p', 'The admin dashboard provides navigation cards for user management, bills, complaints, marketplace, vehicle logs, and announcements. The resident home screen displays greeting, profile avatar, unpaid bill count, complaint status, vehicle summary, quick links, and settings. The security screen is optimized for gate use with tabs for resident entry, visitor entry, and exit processing.');
  add('h3', '5.1.2 Report Formats/Sample Data');
  add('p', 'The system stores structured data in Firestore and displays list/detail views. Example reports include bill status lists, pending payment proofs, complaint queues, marketplace approval queues, and vehicle log history.');
  add('table', [
    ['Report/View', 'Sample Fields'],
    ['Bill Details', 'Resident name, house number, month, base charges, complaint charges, previous dues, amount, due date, status, proof image.'],
    ['Complaint Details', 'Complaint number, title, category, description, resident name, house number, status, image, notes, charge amount.'],
    ['Vehicle Log', 'Vehicle number, type, entry time, exit time, resident/visitor details, purpose, logged by, gate photo.'],
    ['Marketplace Listing', 'Type, price, size, location, contact, description, photos, status, reviewer, rejection reason.'],
  ], { caption: 'Table 9: Report formats and sample fields' });

  add('h2', '5.2 User Support');
  add('p', 'User support is provided through clear forms, validation errors, status badges, loading indicators, image previews, confirmation alerts, and an AI assistant for resident guidance. Admin and security users are guided through specialized dashboards rather than generic menus.');
  add('h3', '5.2.1 Online Help Material');
  add('p', 'The resident AI assistant can answer society-related questions about bills, complaints, gate security, vehicles, marketplace rules, announcements, and app navigation. The README and docs folder also provide setup and testing guidance.');
  add('h3', '5.2.2 Error Conditions and System Messages');
  add('table', [
    ['Condition', 'System Message/Handling'],
    ['Invalid login', 'Displays invalid email or password error and keeps user on login page.'],
    ['Missing resident house number', 'Create user form requires house number for resident role.'],
    ['Duplicate vehicle number', 'Vehicle service rejects already registered normalized plate number.'],
    ['Payment proof rejected', 'Bill proof fields are cleared and status returns to Unpaid.'],
    ['Missing Gemini API key', 'AI and OCR services return configuration error or skip OCR safely.'],
    ['Unauthorized access', 'Route guard redirects user to the correct role area or login screen.'],
    ['Image too large or invalid type', 'Firebase Storage rules reject invalid uploads.'],
  ], { caption: 'Table 10: Error conditions and system messages' });
}

function addChapter6() {
  add('h1', 'Chapter 6');
  add('h1', 'System Verification and Validation');
  add('h2', '6.1 Items/Functions to be Tested');
  addBullets([
    'Authentication for admin, resident, and security roles.',
    'Admin user creation and role-specific profile writing.',
    'Monthly bill generation, payment proof upload, and admin verification.',
    'Complaint creation, status update, resolution notes, and complaint charges.',
    'Marketplace listing creation, approval, rejection, inactive, and sold workflows.',
    'Announcement creation and resident announcement display.',
    'Vehicle registration, duplicate plate detection, entry logging, exit logging, and active vehicle list.',
    'Firebase Firestore rules and Firebase Storage rules.',
    'AI assistant and OCR fallback behavior.',
  ]);

  add('h2', '6.2 Description of Test Cases');
  add('table', [
    ['Test ID', 'Test Case', 'Input/Steps', 'Expected Result'],
    ['TC-01', 'Admin login', 'Login with valid admin credentials.', 'Admin dashboard opens.'],
    ['TC-02', 'Create resident', 'Admin enters name, email, password, resident role, house number.', 'Resident auth account and Firestore profile are created.'],
    ['TC-03', 'Create security account', 'Admin creates security user.', 'Security account can access gate entry only.'],
    ['TC-04', 'Generate bill', 'Admin selects month and base charges.', 'Bills are created for residents and duplicates are skipped.'],
    ['TC-05', 'Resident payment proof', 'Resident opens bill and uploads proof image.', 'Bill status changes to Pending.'],
    ['TC-06', 'Verify payment', 'Admin approves pending proof.', 'Bill status changes to Paid and verification fields are saved.'],
    ['TC-07', 'Submit complaint', 'Resident submits complaint with category and optional photo.', 'Complaint number is generated and status is Pending.'],
    ['TC-08', 'Resolve complaint', 'Admin adds notes and resolves complaint.', 'Complaint status becomes Resolved and optional charge is handled.'],
    ['TC-09', 'Post listing', 'Resident posts property listing with photos.', 'Listing status starts as Pending.'],
    ['TC-10', 'Approve listing', 'Admin approves pending listing.', 'Listing becomes visible as Approved.'],
    ['TC-11', 'Security gate entry', 'Security enters or scans vehicle number and logs entry.', 'VehicleLog document is created with entryTime.'],
    ['TC-12', 'Vehicle exit', 'Security selects active vehicle and logs exit.', 'exitTime is updated and vehicle leaves active list.'],
  ], { caption: 'Table 11: Test cases and expected results' });

  add('h2', '6.3 Justification of Test Cases');
  add('p', 'The selected test cases cover all critical workflows of the system: login, role access, user management, billing, payments, complaints, marketplace, announcements, vehicle security, image upload, and Firebase-backed data updates. These cases validate both functional behavior and role-based restrictions.');
  add('h2', '6.4 Test Run Procedures and Results');
  add('p', 'Testing can be performed by running the Expo development server, creating one admin account, creating test resident and security accounts, and then executing each workflow from the Testing Guide. Successful completion means users are routed correctly, Firestore documents are created or updated, Storage images are uploaded, and dashboards show updated live data.');
}

function addChapter7() {
  add('h1', 'Chapter 7');
  add('h1', 'Conclusions');
  add('h2', '7.1 Summary');
  add('p', 'The eRoyal Housing Society Management System successfully digitizes the main operations of a housing society. It provides secure login, admin management, resident self-service, security gate control, image upload workflows, Firebase cloud storage, Firestore database records, and AI support in one Expo application.');
  add('p', 'The project demonstrates practical software engineering concepts including SRS preparation, modular architecture, UI design, validation, cloud database modeling, role-based security, testing, and deployment planning.');

  add('h2', '7.2 Problems Encountered and Solved');
  addBullets([
    'Role-based routing was solved by using AuthContext and route group checks in the root layout.',
    'Repeated Firestore reads were reduced by using AppDataContext, AdminDataContext, and SecurityDataContext with onSnapshot listeners.',
    'Billing consistency was improved using batch writes, previous dues logic, complaint charge integration, and duplicate bill checks.',
    'Image upload delays were reduced by saving records first and uploading photos in the background for complaints, listings, and announcements.',
    'Vehicle number mismatches were reduced by normalizing house numbers and vehicle numbers before search and storage.',
    'User creation without logging out the admin was solved by using a temporary secondary Firebase app with in-memory auth persistence.',
    'Data protection was improved through Firestore rules, Storage rules, and Cloud Function admin checks.',
  ]);

  add('h2', '7.3 Suggestions for Better Approaches to Project');
  addBullets([
    'Add automated unit and integration tests for services and validation schemas.',
    'Add admin analytics charts for bills, complaints, vehicles, and listings.',
    'Add push notifications for bill generation, payment verification, complaint updates, and visitor entry.',
    'Use a dedicated backend API for complex reporting if data volume becomes very large.',
    'Add CI/CD workflows to run lint, build, and tests before release.',
  ]);

  add('h2', '7.4 Suggestions for Future Extensions to Project');
  addBullets([
    'Online payment gateway integration instead of manual proof upload.',
    'Visitor pre-approval by residents before a guest reaches the gate.',
    'QR-based resident and visitor entry passes.',
    'Advanced admin reporting and export to PDF/Excel.',
    'Multilingual interface for English and Urdu users.',
    'Push notifications and SMS alerts.',
    'Maintenance staff module for assigning and tracking complaint work orders.',
    'Backup and audit dashboard for admin actions.',
  ]);
}

function addReferencesAndGlossary() {
  add('h1', 'Bibliography and References');
  addNumbered([
    'React Native Documentation. https://reactnative.dev/docs/getting-started',
    'Expo Documentation. https://docs.expo.dev/',
    'Expo Router Documentation. https://docs.expo.dev/router/introduction/',
    'Firebase Authentication Documentation. https://firebase.google.com/docs/auth',
    'Cloud Firestore Documentation. https://firebase.google.com/docs/firestore',
    'Firebase Storage Documentation. https://firebase.google.com/docs/storage',
    'Firebase Cloud Functions Documentation. https://firebase.google.com/docs/functions',
    'TypeScript Documentation. https://www.typescriptlang.org/docs/',
    'Zod Documentation. https://zod.dev/',
    'Google Generative AI Documentation. https://ai.google.dev/',
    'GitHub Repository: https://github.com/mudassarbajwa49/eRoyal',
  ]);

  add('pageBreak');
  add('h1', 'Glossary');
  add('table', [
    ['Term', 'Meaning'],
    ['eRoyal', 'Housing society management application developed in this project.'],
    ['Admin', 'User role responsible for management, billing, complaints, listings, announcements, and monitoring.'],
    ['Resident', 'Society member who can view bills, submit complaints, register vehicles, and use resident services.'],
    ['Security Staff', 'Gate user responsible for vehicle entry and exit logging.'],
    ['Firebase Auth', 'Authentication service used for email/password login.'],
    ['Firestore', 'Firebase NoSQL cloud database used for app records.'],
    ['Firebase Storage', 'Cloud file storage used for images and proofs.'],
    ['Cloud Functions', 'Serverless backend used for privileged admin operations.'],
    ['Expo Router', 'File-based navigation system for the React Native app.'],
    ['Bill Status', 'Workflow state such as Draft, Unpaid, Pending, or Paid.'],
    ['Complaint Status', 'Workflow state such as Pending, In Progress, or Resolved.'],
    ['Listing Status', 'Marketplace review state such as Pending, Approved, Rejected, Sold, or Inactive.'],
    ['VehicleLog', 'Gate entry/exit record for a resident, visitor, or service vehicle.'],
    ['OCR', 'Optical character recognition used to detect license plate text from camera images.'],
    ['RBAC', 'Role-based access control that limits each user to permitted actions.'],
    ['SRS', 'Software Requirements Specifications.'],
  ], { caption: 'Table 12: Glossary' });
}

addTitlePages();
addToc();
addChapter1();
addChapter2();
addChapter3();
addChapter4();
addChapter5();
addChapter6();
addChapter7();
addReferencesAndGlossary();

async function writeDiagrams() {
  for (const diagram of diagrams) {
    const svgPath = path.join(assetDir, `${diagram.key}.svg`);
    const pngPath = path.join(assetDir, `${diagram.key}.png`);
    fs.writeFileSync(svgPath, diagram.svg, 'utf8');
    await sharp(Buffer.from(diagram.svg)).png().toFile(pngPath);
    fs.copyFileSync(pngPath, path.join(mediaDir, `${diagram.key}.png`));
  }
}

function markdownTable(rows) {
  const header = `| ${rows[0].map(mdEscape).join(' | ')} |`;
  const sep = `| ${rows[0].map(() => '---').join(' | ')} |`;
  const body = rows.slice(1).map(row => `| ${row.map(mdEscape).join(' | ')} |`).join('\n');
  return `${header}\n${sep}\n${body}`;
}

function writeMarkdown() {
  const lines = [];
  for (const item of contents) {
    switch (item.type) {
      case 'title':
        lines.push(`# ${item.value}`, '');
        break;
      case 'h1':
        lines.push(`# ${item.value}`, '');
        break;
      case 'h2':
        lines.push(`## ${item.value}`, '');
        break;
      case 'h3':
        lines.push(`### ${item.value}`, '');
        break;
      case 'center':
      case 'p':
      case 'toc':
        if (item.value) lines.push(String(item.value), '');
        break;
      case 'bullet':
        lines.push(`- ${item.value}`);
        break;
      case 'table':
        if (item.caption) lines.push(`**${item.caption}**`, '');
        lines.push(markdownTable(item.value), '');
        break;
      case 'image': {
        const diagram = diagrams.find(d => d.key === item.value);
        lines.push(`![${diagram.title}](eroyal_documentation_assets/${diagram.key}.png)`, '');
        lines.push(`*${item.caption}*`, '');
        break;
      }
      case 'pageBreak':
        lines.push('---', '');
        break;
      default:
        break;
    }
  }
  fs.writeFileSync(markdownPath, lines.join('\n'), 'utf8');
}

const imageRels = [];
function relIdForImage(key) {
  let rel = imageRels.find(r => r.key === key);
  if (!rel) {
    rel = { key, id: `rId${imageRels.length + 1}` };
    imageRels.push(rel);
  }
  return rel.id;
}

function runXml(text, options = {}) {
  const bold = options.bold ? '<w:b/>' : '';
  const italic = options.italic ? '<w:i/>' : '';
  const size = options.size ? `<w:sz w:val="${options.size}"/>` : '';
  const color = options.color ? `<w:color w:val="${options.color}"/>` : '';
  return `<w:r><w:rPr>${bold}${italic}${size}${color}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}

function paraXml(text, style = 'Normal', options = {}) {
  const align = options.align ? `<w:jc w:val="${options.align}"/>` : '';
  const spacing = options.spacingAfter === 0 ? '<w:spacing w:after="0"/>' : '<w:spacing w:after="160"/>';
  const indent = options.indent ? `<w:ind w:left="${options.indent}"/>` : '';
  const styleTag = style ? `<w:pStyle w:val="${style}"/>` : '';
  const runOptions = {
    bold: options.bold,
    italic: options.italic,
    size: options.size,
    color: options.color,
  };
  return `<w:p><w:pPr>${styleTag}${align}${spacing}${indent}</w:pPr>${runXml(text, runOptions)}</w:p>`;
}

function pageBreakXml() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function cellXml(text, header = false) {
  const fill = header ? '<w:shd w:fill="D9EDEB"/>' : '';
  const parts = String(text ?? '').split('\n');
  return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>${fill}</w:tcPr>${parts.map(p => paraXml(p, 'TableText', { bold: header, spacingAfter: 0 })).join('')}</w:tc>`;
}

function tableXml(rows) {
  return `<w:tbl>
    <w:tblPr>
      <w:tblStyle w:val="TableGrid"/>
      <w:tblW w:w="0" w:type="auto"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
    </w:tblPr>
    ${rows.map((row, rowIndex) => `<w:tr>${row.map(cell => cellXml(cell, rowIndex === 0)).join('')}</w:tr>`).join('')}
  </w:tbl>${paraXml('', 'Normal', { spacingAfter: 0 })}`;
}

function imageXml(key, caption) {
  const relId = relIdForImage(key);
  const figure = diagrams.find(d => d.key === key);
  const idNum = imageRels.findIndex(r => r.key === key) + 1;
  const cx = Math.round(6.25 * 914400);
  const cy = Math.round(3.75 * 914400);
  return `
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr>
    <w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${cx}" cy="${cy}"/>
          <wp:effectExtent l="0" t="0" r="0" b="0"/>
          <wp:docPr id="${idNum}" name="${xmlEscape(figure.title)}"/>
          <wp:cNvGraphicFramePr/>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic>
                <pic:nvPicPr>
                  <pic:cNvPr id="${idNum}" name="${xmlEscape(key)}.png"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="${relId}"/>
                  <a:stretch><a:fillRect/></a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>
  </w:p>
  ${paraXml(caption, 'Caption', { align: 'center', italic: true })}`;
}

function documentXml() {
  const body = [];
  for (const item of contents) {
    switch (item.type) {
      case 'title':
        body.push(paraXml(item.value, 'Title', { align: 'center' }));
        break;
      case 'center':
        body.push(paraXml(item.value, 'Normal', { align: 'center' }));
        break;
      case 'h1':
        body.push(paraXml(item.value, 'Heading1'));
        break;
      case 'h2':
        body.push(paraXml(item.value, 'Heading2'));
        break;
      case 'h3':
        body.push(paraXml(item.value, 'Heading3'));
        break;
      case 'p':
      case 'toc':
        body.push(paraXml(item.value, 'Normal'));
        break;
      case 'bullet':
        body.push(paraXml(`- ${item.value}`, 'Normal', { indent: 420 }));
        break;
      case 'table':
        if (item.caption) body.push(paraXml(item.caption, 'Caption', { italic: true }));
        body.push(tableXml(item.value));
        break;
      case 'image':
        body.push(imageXml(item.value, item.caption));
        break;
      case 'pageBreak':
        body.push(pageBreakXml());
        break;
      default:
        break;
    }
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
    xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:w10="urn:schemas-microsoft-com:office:word"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
    xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
    xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
    xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
    xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
    xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
    xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
    mc:Ignorable="w14 wp14">
    <w:body>
      ${body.join('\n')}
      <w:sectPr>
        <w:pgSz w:w="12240" w:h="15840"/>
        <w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
      </w:sectPr>
    </w:body>
  </w:document>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
      <w:name w:val="Normal"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Title">
      <w:name w:val="Title"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:before="240" w:after="240"/></w:pPr>
      <w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="0F766E"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading1">
      <w:name w:val="heading 1"/>
      <w:basedOn w:val="Normal"/>
      <w:next w:val="Normal"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:before="260" w:after="180"/><w:outlineLvl w:val="0"/></w:pPr>
      <w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="0F172A"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
      <w:name w:val="heading 2"/>
      <w:basedOn w:val="Normal"/>
      <w:next w:val="Normal"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:before="220" w:after="140"/><w:outlineLvl w:val="1"/></w:pPr>
      <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0D9488"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
      <w:name w:val="heading 3"/>
      <w:basedOn w:val="Normal"/>
      <w:next w:val="Normal"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:before="180" w:after="120"/><w:outlineLvl w:val="2"/></w:pPr>
      <w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="334155"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Caption">
      <w:name w:val="Caption"/>
      <w:basedOn w:val="Normal"/>
      <w:qFormat/>
      <w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="TableText">
      <w:name w:val="Table Text"/>
      <w:basedOn w:val="Normal"/>
      <w:rPr><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr>
    </w:style>
  </w:styles>`;
}

function writeDocxParts() {
  const docXml = documentXml();
  fs.writeFileSync(path.join(buildDir, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Default Extension="png" ContentType="image/png"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
    <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  </Types>`, 'utf8');

  fs.writeFileSync(path.join(buildDir, '_rels', '.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  </Relationships>`, 'utf8');

  fs.writeFileSync(path.join(buildDir, 'word', 'document.xml'), docXml, 'utf8');
  fs.writeFileSync(path.join(buildDir, 'word', 'styles.xml'), stylesXml(), 'utf8');
  fs.writeFileSync(path.join(buildDir, 'word', 'settings.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/></w:settings>`, 'utf8');

  fs.writeFileSync(path.join(buildDir, 'word', '_rels', 'document.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
    ${imageRels.map(rel => `<Relationship Id="${rel.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${rel.key}.png"/>`).join('\n')}
  </Relationships>`, 'utf8');

  const now = new Date().toISOString();
  fs.writeFileSync(path.join(buildDir, 'docProps', 'core.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dc:title>eRoyal Final Year Project Documentation</dc:title>
    <dc:subject>Housing Society Management System</dc:subject>
    <dc:creator>Codex</dc:creator>
    <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
    <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
    <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
  </cp:coreProperties>`, 'utf8');
  fs.writeFileSync(path.join(buildDir, 'docProps', 'app.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <Application>Codex Documentation Generator</Application>
    <DocSecurity>0</DocSecurity>
    <ScaleCrop>false</ScaleCrop>
    <Company>eRoyal</Company>
  </Properties>`, 'utf8');
}

(async () => {
  await writeDiagrams();
  writeMarkdown();
  writeDocxParts();
  console.log(JSON.stringify({
    markdownPath,
    docxBuildDir: buildDir,
    docxPath,
    diagrams: diagrams.length,
    paragraphsAndBlocks: contents.length,
  }, null, 2));
})();
