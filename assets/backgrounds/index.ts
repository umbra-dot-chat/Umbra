/**
 * Embedded background images for virtual-background video effects.
 *
 * Each background is an SVG data URI so it loads instantly with zero
 * network requests and works on all platforms (web, iOS, Android, desktop).
 */

// ── Helper ──────────────────────────────────────────────────────────────

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

// ── Backgrounds ─────────────────────────────────────────────────────────

/** Warm, professional office with bookshelves and soft lighting. */
export const bgOffice = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8dcc8"/>
      <stop offset="100%" stop-color="#d4c4a8"/>
    </linearGradient>
    <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6b4226"/>
      <stop offset="100%" stop-color="#4a2e1a"/>
    </linearGradient>
  </defs>
  <!-- Wall -->
  <rect width="1280" height="720" fill="url(#wall)"/>
  <!-- Baseboard -->
  <rect y="650" width="1280" height="70" fill="#5c4a3a"/>
  <!-- Bookshelf left -->
  <rect x="40" y="80" width="280" height="560" rx="6" fill="#7a5c3e"/>
  <rect x="50" y="90" width="260" height="2" fill="#5c4a3a"/>
  <!-- Shelf boards -->
  <rect x="46" y="210" width="268" height="8" fill="#6b4c34"/>
  <rect x="46" y="340" width="268" height="8" fill="#6b4c34"/>
  <rect x="46" y="470" width="268" height="8" fill="#6b4c34"/>
  <!-- Books row 1 -->
  <rect x="56" y="100" width="22" height="106" rx="2" fill="#c0392b"/>
  <rect x="82" y="110" width="18" height="96" rx="2" fill="#2c3e50"/>
  <rect x="104" y="95" width="24" height="111" rx="2" fill="#27ae60"/>
  <rect x="132" y="105" width="20" height="101" rx="2" fill="#8e44ad"/>
  <rect x="156" y="100" width="16" height="106" rx="2" fill="#d4a017"/>
  <rect x="176" y="108" width="22" height="98" rx="2" fill="#2980b9"/>
  <rect x="202" y="96" width="18" height="110" rx="2" fill="#c0392b"/>
  <rect x="224" y="104" width="24" height="102" rx="2" fill="#1a5276"/>
  <rect x="252" y="100" width="20" height="106" rx="2" fill="#7d6608"/>
  <rect x="276" y="110" width="18" height="96" rx="2" fill="#6c3483"/>
  <!-- Books row 2 -->
  <rect x="56" y="225" width="26" height="110" rx="2" fill="#1a5276"/>
  <rect x="86" y="230" width="20" height="105" rx="2" fill="#a93226"/>
  <rect x="110" y="222" width="22" height="113" rx="2" fill="#1e8449"/>
  <rect x="136" y="228" width="18" height="107" rx="2" fill="#6c3483"/>
  <rect x="158" y="225" width="24" height="110" rx="2" fill="#b7950b"/>
  <rect x="186" y="232" width="20" height="103" rx="2" fill="#2e4053"/>
  <rect x="210" y="226" width="22" height="109" rx="2" fill="#c0392b"/>
  <rect x="236" y="230" width="18" height="105" rx="2" fill="#117a65"/>
  <rect x="258" y="225" width="26" height="110" rx="2" fill="#7b241c"/>
  <!-- Books row 3 -->
  <rect x="56" y="355" width="20" height="110" rx="2" fill="#d4a017"/>
  <rect x="80" y="360" width="24" height="105" rx="2" fill="#2c3e50"/>
  <rect x="108" y="352" width="18" height="113" rx="2" fill="#c0392b"/>
  <rect x="130" y="358" width="22" height="107" rx="2" fill="#1a5276"/>
  <rect x="156" y="355" width="16" height="110" rx="2" fill="#6c3483"/>
  <rect x="176" y="362" width="24" height="103" rx="2" fill="#27ae60"/>
  <rect x="204" y="356" width="20" height="109" rx="2" fill="#a93226"/>
  <rect x="228" y="360" width="22" height="105" rx="2" fill="#b7950b"/>
  <rect x="254" y="355" width="20" height="110" rx="2" fill="#2e4053"/>
  <!-- Bookshelf right -->
  <rect x="960" y="80" width="280" height="560" rx="6" fill="#7a5c3e"/>
  <rect x="966" y="210" width="268" height="8" fill="#6b4c34"/>
  <rect x="966" y="340" width="268" height="8" fill="#6b4c34"/>
  <rect x="966" y="470" width="268" height="8" fill="#6b4c34"/>
  <!-- Right shelf books -->
  <rect x="976" y="100" width="22" height="106" rx="2" fill="#2980b9"/>
  <rect x="1002" y="108" width="18" height="98" rx="2" fill="#c0392b"/>
  <rect x="1024" y="95" width="24" height="111" rx="2" fill="#7d6608"/>
  <rect x="1052" y="105" width="20" height="101" rx="2" fill="#27ae60"/>
  <rect x="1076" y="100" width="16" height="106" rx="2" fill="#8e44ad"/>
  <rect x="1096" y="110" width="22" height="96" rx="2" fill="#1a5276"/>
  <rect x="1122" y="96" width="18" height="110" rx="2" fill="#d4a017"/>
  <rect x="1144" y="104" width="24" height="102" rx="2" fill="#a93226"/>
  <rect x="1172" y="100" width="20" height="106" rx="2" fill="#2c3e50"/>
  <rect x="1196" y="108" width="22" height="98" rx="2" fill="#6c3483"/>
  <!-- Window center -->
  <rect x="440" y="60" width="400" height="340" rx="8" fill="#87CEEB" opacity="0.6"/>
  <rect x="440" y="60" width="400" height="340" rx="8" fill="none" stroke="#8b7355" stroke-width="12"/>
  <line x1="640" y1="60" x2="640" y2="400" stroke="#8b7355" stroke-width="6"/>
  <line x1="440" y1="230" x2="840" y2="230" stroke="#8b7355" stroke-width="6"/>
  <!-- Sky through window -->
  <rect x="446" y="66" width="188" height="158" rx="2" fill="#87CEEB"/>
  <rect x="646" y="66" width="188" height="158" rx="2" fill="#87CEEB"/>
  <circle cx="540" cy="120" r="30" fill="#fff" opacity="0.7"/>
  <circle cx="720" cy="140" r="22" fill="#fff" opacity="0.5"/>
  <!-- Desk surface -->
  <rect x="360" y="500" width="560" height="30" rx="4" fill="url(#desk)"/>
  <rect x="380" y="530" width="12" height="120" fill="#4a2e1a"/>
  <rect x="900" y="530" width="12" height="120" fill="#4a2e1a"/>
  <!-- Plant -->
  <rect x="870" y="440" width="40" height="60" rx="4" fill="#8B4513"/>
  <circle cx="890" cy="420" r="35" fill="#228B22"/>
  <circle cx="870" cy="405" r="25" fill="#2ecc71"/>
  <circle cx="910" cy="410" r="28" fill="#1e8449"/>
  <!-- Lamp -->
  <rect x="400" y="400" width="8" height="100" fill="#333"/>
  <ellipse cx="404" cy="395" rx="35" ry="20" fill="#f5deb3"/>
  <ellipse cx="404" cy="395" rx="33" ry="18" fill="#ffeaa7" opacity="0.6"/>
  <!-- Warm light overlay -->
  <rect width="1280" height="720" fill="#f5deb3" opacity="0.08"/>
</svg>
`);

/** Lush green nature scene with mountains and sky. */
export const bgNature = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a90d9"/>
      <stop offset="60%" stop-color="#87CEEB"/>
      <stop offset="100%" stop-color="#b8dff0"/>
    </linearGradient>
    <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5b7553"/>
      <stop offset="100%" stop-color="#3d5a3d"/>
    </linearGradient>
    <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a6741"/>
      <stop offset="100%" stop-color="#2d4a2d"/>
    </linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>
  </defs>
  <!-- Sky -->
  <rect width="1280" height="720" fill="url(#sky)"/>
  <!-- Clouds -->
  <ellipse cx="200" cy="120" rx="100" ry="40" fill="#fff" opacity="0.8"/>
  <ellipse cx="260" cy="110" rx="70" ry="35" fill="#fff" opacity="0.7"/>
  <ellipse cx="800" cy="80" rx="120" ry="45" fill="#fff" opacity="0.6"/>
  <ellipse cx="880" cy="70" rx="80" ry="30" fill="#fff" opacity="0.7"/>
  <ellipse cx="1100" cy="140" rx="90" ry="35" fill="#fff" opacity="0.5"/>
  <!-- Sun -->
  <circle cx="1050" cy="100" r="50" fill="#FFD700" opacity="0.4"/>
  <circle cx="1050" cy="100" r="35" fill="#FFF8DC" opacity="0.6"/>
  <!-- Far mountains -->
  <polygon points="0,450 200,250 400,420 500,300 700,400 900,280 1100,380 1280,300 1280,500 0,500" fill="url(#mtn1)" opacity="0.7"/>
  <!-- Near mountains -->
  <polygon points="0,500 150,350 350,480 550,340 750,450 950,320 1150,420 1280,380 1280,550 0,550" fill="url(#mtn2)"/>
  <!-- Rolling hills -->
  <ellipse cx="200" cy="580" rx="350" ry="120" fill="#43a047"/>
  <ellipse cx="700" cy="600" rx="400" ry="140" fill="#388e3c"/>
  <ellipse cx="1100" cy="570" rx="350" ry="130" fill="#2e7d32"/>
  <!-- Grass foreground -->
  <rect y="580" width="1280" height="140" fill="url(#grass)"/>
  <!-- Trees -->
  <rect x="180" y="380" width="16" height="80" fill="#5d4037"/>
  <polygon points="188,280 140,400 236,400" fill="#2e7d32"/>
  <polygon points="188,310 150,390 226,390" fill="#388e3c"/>
  <rect x="800" y="400" width="14" height="70" fill="#5d4037"/>
  <polygon points="807,310 765,420 849,420" fill="#1b5e20"/>
  <polygon points="807,340 775,410 839,410" fill="#2e7d32"/>
  <rect x="1050" y="390" width="18" height="90" fill="#5d4037"/>
  <polygon points="1059,280 1005,420 1113,420" fill="#2e7d32"/>
  <polygon points="1059,310 1015,400 1103,400" fill="#388e3c"/>
  <!-- Flowers -->
  <circle cx="300" cy="640" r="5" fill="#e91e63"/>
  <circle cx="320" cy="650" r="4" fill="#ff9800"/>
  <circle cx="500" cy="635" r="5" fill="#e91e63"/>
  <circle cx="700" cy="645" r="4" fill="#fdd835"/>
  <circle cx="900" cy="640" r="5" fill="#e91e63"/>
  <circle cx="1000" cy="650" r="4" fill="#ff9800"/>
</svg>
`);

/** Abstract geometric pattern with vibrant colors. */
export const bgAbstract = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="abg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="50%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f3460"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#abg)"/>
  <!-- Large shapes -->
  <polygon points="0,0 400,0 200,300" fill="#e94560" opacity="0.3"/>
  <polygon points="1280,0 880,0 1080,350" fill="#533483" opacity="0.3"/>
  <polygon points="0,720 500,720 250,400" fill="#0f3460" opacity="0.4"/>
  <polygon points="1280,720 800,720 1040,380" fill="#e94560" opacity="0.2"/>
  <!-- Circles -->
  <circle cx="640" cy="360" r="200" fill="#533483" opacity="0.2"/>
  <circle cx="640" cy="360" r="140" fill="#e94560" opacity="0.15"/>
  <circle cx="640" cy="360" r="80" fill="#0f3460" opacity="0.3"/>
  <circle cx="200" cy="500" r="120" fill="#e94560" opacity="0.15"/>
  <circle cx="1080" cy="200" r="150" fill="#533483" opacity="0.15"/>
  <!-- Floating shapes -->
  <rect x="100" y="100" width="80" height="80" rx="8" fill="#e94560" opacity="0.2" transform="rotate(30 140 140)"/>
  <rect x="900" y="500" width="100" height="100" rx="10" fill="#533483" opacity="0.2" transform="rotate(-20 950 550)"/>
  <rect x="600" y="80" width="60" height="60" rx="6" fill="#0f3460" opacity="0.3" transform="rotate(45 630 110)"/>
  <rect x="400" y="550" width="70" height="70" rx="7" fill="#e94560" opacity="0.15" transform="rotate(15 435 585)"/>
  <!-- Lines -->
  <line x1="0" y1="200" x2="1280" y2="500" stroke="#e94560" stroke-width="1" opacity="0.2"/>
  <line x1="0" y1="500" x2="1280" y2="200" stroke="#533483" stroke-width="1" opacity="0.2"/>
  <line x1="300" y1="0" x2="600" y2="720" stroke="#0f3460" stroke-width="1" opacity="0.3"/>
  <line x1="980" y1="0" x2="680" y2="720" stroke="#e94560" stroke-width="1" opacity="0.2"/>
  <!-- Dots -->
  <circle cx="150" cy="300" r="4" fill="#e94560" opacity="0.5"/>
  <circle cx="350" cy="150" r="3" fill="#533483" opacity="0.5"/>
  <circle cx="550" cy="500" r="5" fill="#0f3460" opacity="0.4"/>
  <circle cx="750" cy="250" r="3" fill="#e94560" opacity="0.5"/>
  <circle cx="950" cy="450" r="4" fill="#533483" opacity="0.5"/>
  <circle cx="1100" cy="100" r="3" fill="#0f3460" opacity="0.4"/>
  <circle cx="400" cy="650" r="4" fill="#e94560" opacity="0.3"/>
  <circle cx="850" cy="600" r="3" fill="#533483" opacity="0.4"/>
</svg>
`);

/** Smooth color gradient (purple to blue to teal). */
export const bgGradient = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="25%" stop-color="#764ba2"/>
      <stop offset="50%" stop-color="#6b73e0"/>
      <stop offset="75%" stop-color="#48c6ef"/>
      <stop offset="100%" stop-color="#6f86d6"/>
    </linearGradient>
    <radialGradient id="g2" cx="0.3" cy="0.7" r="0.8">
      <stop offset="0%" stop-color="#f093fb" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#f093fb" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g3" cx="0.8" cy="0.2" r="0.6">
      <stop offset="0%" stop-color="#4facfe" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#4facfe" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g1)"/>
  <rect width="1280" height="720" fill="url(#g2)"/>
  <rect width="1280" height="720" fill="url(#g3)"/>
</svg>
`);

/** Solid dark background. */
export const bgSolidDark = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="sd" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#2d2d3a"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sd)"/>
</svg>
`);

/** Solid light background. */
export const bgSolidLight = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="sl" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#f8f9fa"/>
      <stop offset="100%" stop-color="#e9ecef"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sl)"/>
</svg>
`);

/** Beach / coastal scene with sunset. */
export const bgBeach = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff7e5f"/>
      <stop offset="40%" stop-color="#feb47b"/>
      <stop offset="70%" stop-color="#ffcf8a"/>
      <stop offset="100%" stop-color="#a8d8ea"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e86ab"/>
      <stop offset="100%" stop-color="#1b4965"/>
    </linearGradient>
  </defs>
  <!-- Sky -->
  <rect width="1280" height="720" fill="url(#bsky)"/>
  <!-- Sun -->
  <circle cx="640" cy="280" r="70" fill="#FFD700" opacity="0.7"/>
  <circle cx="640" cy="280" r="50" fill="#FFF8DC" opacity="0.8"/>
  <!-- Sun reflection glow -->
  <ellipse cx="640" cy="280" rx="200" ry="80" fill="#FFD700" opacity="0.1"/>
  <!-- Ocean -->
  <rect y="400" width="1280" height="200" fill="url(#sea)"/>
  <!-- Waves -->
  <path d="M0,420 Q160,400 320,420 Q480,440 640,420 Q800,400 960,420 Q1120,440 1280,420 L1280,450 Q1120,430 960,450 Q800,470 640,450 Q480,430 320,450 Q160,470 0,450 Z" fill="#3498db" opacity="0.4"/>
  <path d="M0,450 Q160,435 320,450 Q480,465 640,450 Q800,435 960,450 Q1120,465 1280,450 L1280,480 Q1120,465 960,480 Q800,495 640,480 Q480,465 320,480 Q160,495 0,480 Z" fill="#2980b9" opacity="0.3"/>
  <!-- Beach sand -->
  <path d="M0,580 Q320,560 640,570 Q960,580 1280,565 L1280,720 L0,720 Z" fill="#f4d03f"/>
  <path d="M0,600 Q320,585 640,595 Q960,605 1280,590 L1280,720 L0,720 Z" fill="#dbb739"/>
  <!-- Palm tree -->
  <path d="M200,300 Q210,450 220,580" stroke="#5d4037" stroke-width="14" fill="none"/>
  <path d="M200,300 Q280,260 350,290" stroke="#2e7d32" stroke-width="8" fill="none"/>
  <path d="M200,300 Q120,260 60,300" stroke="#388e3c" stroke-width="8" fill="none"/>
  <path d="M200,300 Q240,220 300,230" stroke="#1b5e20" stroke-width="7" fill="none"/>
  <path d="M200,300 Q170,230 120,240" stroke="#2e7d32" stroke-width="7" fill="none"/>
  <path d="M200,300 Q220,210 260,200" stroke="#388e3c" stroke-width="6" fill="none"/>
  <!-- Clouds -->
  <ellipse cx="900" cy="120" rx="100" ry="30" fill="#fff" opacity="0.4"/>
  <ellipse cx="960" cy="115" rx="60" ry="25" fill="#fff" opacity="0.3"/>
  <ellipse cx="300" cy="150" rx="80" ry="25" fill="#fff" opacity="0.3"/>
</svg>
`);

/** City skyline at dusk. */
export const bgCity = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c0c1d"/>
      <stop offset="40%" stop-color="#1a1a3e"/>
      <stop offset="70%" stop-color="#2d1b69"/>
      <stop offset="100%" stop-color="#e94560"/>
    </linearGradient>
  </defs>
  <!-- Night sky -->
  <rect width="1280" height="720" fill="url(#csky)"/>
  <!-- Stars -->
  <circle cx="100" cy="50" r="1.5" fill="#fff" opacity="0.8"/>
  <circle cx="250" cy="80" r="1" fill="#fff" opacity="0.6"/>
  <circle cx="400" cy="30" r="1.5" fill="#fff" opacity="0.7"/>
  <circle cx="550" cy="60" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="700" cy="40" r="1.5" fill="#fff" opacity="0.8"/>
  <circle cx="850" cy="70" r="1" fill="#fff" opacity="0.6"/>
  <circle cx="1000" cy="45" r="1.5" fill="#fff" opacity="0.7"/>
  <circle cx="1150" cy="55" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="180" cy="120" r="1" fill="#fff" opacity="0.4"/>
  <circle cx="500" cy="100" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="800" cy="110" r="1.5" fill="#fff" opacity="0.6"/>
  <circle cx="1100" cy="90" r="1" fill="#fff" opacity="0.4"/>
  <!-- Ground -->
  <rect y="580" width="1280" height="140" fill="#0a0a15"/>
  <!-- Buildings -->
  <rect x="40" y="320" width="80" height="260" fill="#1a1a2e"/>
  <rect x="140" y="250" width="100" height="330" fill="#16213e"/>
  <rect x="260" y="380" width="70" height="200" fill="#1a1a2e"/>
  <rect x="350" y="200" width="90" height="380" fill="#0f3460"/>
  <rect x="460" y="300" width="110" height="280" fill="#1a1a2e"/>
  <rect x="590" y="150" width="80" height="430" fill="#16213e"/>
  <rect x="690" y="280" width="100" height="300" fill="#1a1a2e"/>
  <rect x="810" y="220" width="90" height="360" fill="#0f3460"/>
  <rect x="920" y="340" width="80" height="240" fill="#1a1a2e"/>
  <rect x="1020" y="260" width="110" height="320" fill="#16213e"/>
  <rect x="1150" y="300" width="90" height="280" fill="#1a1a2e"/>
  <!-- Windows (lit up) -->
  <rect x="55" y="340" width="10" height="12" fill="#fdd835" opacity="0.7"/>
  <rect x="85" y="360" width="10" height="12" fill="#fdd835" opacity="0.5"/>
  <rect x="55" y="400" width="10" height="12" fill="#fdd835" opacity="0.6"/>
  <rect x="85" y="420" width="10" height="12" fill="#fdd835" opacity="0.4"/>
  <rect x="165" y="270" width="12" height="14" fill="#fdd835" opacity="0.7"/>
  <rect x="195" y="300" width="12" height="14" fill="#fdd835" opacity="0.5"/>
  <rect x="165" y="350" width="12" height="14" fill="#fdd835" opacity="0.6"/>
  <rect x="195" y="380" width="12" height="14" fill="#fdd835" opacity="0.4"/>
  <rect x="165" y="430" width="12" height="14" fill="#fdd835" opacity="0.7"/>
  <rect x="370" y="220" width="12" height="14" fill="#fdd835" opacity="0.6"/>
  <rect x="400" y="260" width="12" height="14" fill="#fdd835" opacity="0.5"/>
  <rect x="370" y="320" width="12" height="14" fill="#fdd835" opacity="0.7"/>
  <rect x="400" y="380" width="12" height="14" fill="#fdd835" opacity="0.4"/>
  <rect x="370" y="440" width="12" height="14" fill="#fdd835" opacity="0.6"/>
  <rect x="605" y="170" width="10" height="12" fill="#fdd835" opacity="0.7"/>
  <rect x="635" y="210" width="10" height="12" fill="#fdd835" opacity="0.5"/>
  <rect x="605" y="260" width="10" height="12" fill="#fdd835" opacity="0.6"/>
  <rect x="635" y="310" width="10" height="12" fill="#fdd835" opacity="0.4"/>
  <rect x="605" y="370" width="10" height="12" fill="#fdd835" opacity="0.7"/>
  <rect x="635" y="420" width="10" height="12" fill="#fdd835" opacity="0.5"/>
  <rect x="830" y="240" width="12" height="14" fill="#fdd835" opacity="0.6"/>
  <rect x="860" y="290" width="12" height="14" fill="#fdd835" opacity="0.5"/>
  <rect x="830" y="350" width="12" height="14" fill="#fdd835" opacity="0.7"/>
  <rect x="860" y="410" width="12" height="14" fill="#fdd835" opacity="0.4"/>
  <rect x="1045" y="280" width="12" height="14" fill="#fdd835" opacity="0.6"/>
  <rect x="1075" y="320" width="12" height="14" fill="#fdd835" opacity="0.5"/>
  <rect x="1045" y="380" width="12" height="14" fill="#fdd835" opacity="0.7"/>
  <rect x="1075" y="440" width="12" height="14" fill="#fdd835" opacity="0.4"/>
  <!-- Road -->
  <rect y="600" width="1280" height="120" fill="#1a1a2e"/>
  <rect y="656" width="1280" height="4" fill="#fdd835" opacity="0.3"/>
</svg>
`);
