/* TITAN PRO · Living Mascot System (V7)
 * ------------------------------------------------------------------
 *  SPARTAN-HELMET AI humanoid robot — clearly mechanical, armor
 *  plates, glowing cyan-pink reactor core, antenna, data shard in
 *  right hand, 5-finger mechanical hands, pauldrons, gold belt,
 *  hover feet. Single visor strip eyes with sharp angled pupils.
 *
 *  AUTO-BLINK: per-eye lid groups with proper transform-origin.
 *
 *  Q&A CHAT: draggable glass chat panel, smart-pattern matcher
 *  reads live DOM (KPI values, section titles, account handle).
 *
 *  SPEECH BUBBLE: slow typing 60-80ms/char, visible 4-6s, proper
 *  queue chaining, stop + replay buttons.
 *
 *  MOBILE RESPONSIVE: ≤768px smaller, ≤480px compact bottom-right.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.TitanMascot) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const POS_KEY    = 'titan.mascot.pos.v7';
  const GREET_KEY  = 'titan.greeted.v7';
  const TUTOR_KEY  = 'titan.tutorial.v7';
  const CHAT_KEY   = 'titan.chat.v7';

  /* ============================================================== */
  /* 1. SVG SPRITE — Spartan logo + Spartan robot                   */
  /* ============================================================== */
  const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <linearGradient id="tm-armor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#1a2a36"/>
      <stop offset="0.5"  stop-color="#0d1a22"/>
      <stop offset="1"    stop-color="#04101a"/>
    </linearGradient>
    <linearGradient id="tm-helm-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"    stop-color="#fff4c2"/>
      <stop offset="0.5"  stop-color="#f5c14b"/>
      <stop offset="1"    stop-color="#8b6914"/>
    </linearGradient>
    <linearGradient id="tm-visor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="#04141a"/>
      <stop offset="0.5"  stop-color="#0a2630"/>
      <stop offset="1"    stop-color="#04141a"/>
    </linearGradient>
    <linearGradient id="tm-chest" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"    stop-color="#25f4ee"/>
      <stop offset="0.5"  stop-color="#5be7ff"/>
      <stop offset="1"    stop-color="#fe2c55"/>
    </linearGradient>
    <radialGradient id="tm-eye-glow" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0"    stop-color="#ffffff"/>
      <stop offset="0.3"  stop-color="#a8feff"/>
      <stop offset="0.75" stop-color="#25f4ee"/>
      <stop offset="1"    stop-color="#0a4a55"/>
    </radialGradient>
    <radialGradient id="tm-gold" cx="0.3" cy="0.3" r="0.9">
      <stop offset="0"    stop-color="#fff4c2"/>
      <stop offset="0.45" stop-color="#f5c14b"/>
      <stop offset="1"    stop-color="#8b6914"/>
    </radialGradient>
    <radialGradient id="tm-reactor" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0"    stop-color="#ffffff"/>
      <stop offset="0.2"  stop-color="#a8feff"/>
      <stop offset="0.55" stop-color="#25f4ee"/>
      <stop offset="0.85" stop-color="#fe2c55"/>
      <stop offset="1"    stop-color="#1a0a14"/>
    </radialGradient>
    <radialGradient id="tm-shard" cx="0.3" cy="0.3" r="0.95">
      <stop offset="0"   stop-color="#a8feff"/>
      <stop offset="0.6" stop-color="#25f4ee"/>
      <stop offset="1"   stop-color="#06494f"/>
    </radialGradient>
    <filter id="tm-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tm-strong-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ============== SPARTAN HELMET LOGO (64x64) ============== -->
  <!-- Angular, mechanical, instantly readable as TITAN PRO's face. -->
  <symbol id="titan-face" viewBox="0 0 64 64">
    <!-- Outer halo (subtle) -->
    <circle cx="32" cy="34" r="28" fill="url(#tm-gold)" opacity="0.16" filter="url(#tm-glow)"/>

    <!-- Helmet base shape: angular pentagon -->
    <path d="M14 22 L22 12 L42 12 L50 22 L50 42 L46 52 L18 52 L14 42 Z"
          fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linejoin="round"/>

    <!-- Top crest ridge -->
    <path d="M22 12 L32 6 L42 12" fill="none" stroke="url(#tm-helm-rim)" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="32" cy="6" r="1.6" fill="url(#tm-gold)"/>

    <!-- Cheek guard lines (3 angled strokes each side) -->
    <line x1="14" y1="32" x2="20" y2="34" stroke="url(#tm-helm-rim)" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <line x1="14" y1="38" x2="20" y2="40" stroke="url(#tm-helm-rim)" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <line x1="14" y1="44" x2="20" y2="46" stroke="url(#tm-helm-rim)" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <line x1="50" y1="32" x2="44" y2="34" stroke="url(#tm-helm-rim)" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <line x1="50" y1="38" x2="44" y2="40" stroke="url(#tm-helm-rim)" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <line x1="50" y1="44" x2="44" y2="46" stroke="url(#tm-helm-rim)" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>

    <!-- Visor strip (the face area, dark) -->
    <path d="M18 26 L46 26 L44 40 L20 40 Z" fill="url(#tm-visor)" stroke="url(#tm-helm-rim)" stroke-width="0.8" stroke-linejoin="round"/>

    <!-- T-mark on forehead (above visor) -->
    <path d="M28 16 L36 16 M32 16 L32 22" stroke="url(#tm-gold)" stroke-width="1.4" stroke-linecap="round"/>

    <!-- SHARP EYES (the soul — angular, not round) -->
    <g class="tm-eyes">
      <!-- left eye: angled slash with glow -->
      <path d="M21 32 L28 30 L28 34 Z" fill="url(#tm-eye-glow)" filter="url(#tm-glow)"/>
      <!-- right eye: mirrored slash -->
      <path d="M43 32 L36 30 L36 34 Z" fill="url(#tm-eye-glow)" filter="url(#tm-glow)"/>
      <!-- tiny pupil sparks -->
      <circle cx="24" cy="32" r="0.8" fill="#fff"/>
      <circle cx="40" cy="32" r="0.8" fill="#fff"/>
      <!-- per-eye lid groups for blink (transform-origin = eye center) -->
      <g class="tm-lid-group" style="transform-origin:24px 32px">
        <rect x="20" y="29" width="9" height="6" fill="url(#tm-visor)" opacity="0.96"/>
      </g>
      <g class="tm-lid-group" style="transform-origin:40px 32px">
        <rect x="36" y="29" width="9" height="6" fill="url(#tm-visor)" opacity="0.96"/>
      </g>
    </g>

    <!-- Mouth slit (gold) -->
    <rect x="26" y="44" width="12" height="2" rx="1" fill="url(#tm-gold)"/>
    <line x1="29" y1="46" x2="35" y2="46" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.6"/>

    <!-- Chin plate -->
    <path d="M22 50 L42 50 L38 56 L26 56 Z" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.8" stroke-linejoin="round"/>
  </symbol>

  <!-- ============== SPARTAN AI HUMANOID ROBOT (240x320) ============== -->
  <symbol id="titan-bot" viewBox="0 0 240 320">
    <!-- Antenna -->
    <g class="tm-antenna">
      <line x1="120" y1="14" x2="120" y2="34" stroke="url(#tm-gold)" stroke-width="2.6" stroke-linecap="round"/>
      <circle class="tm-ant-ball" cx="120" cy="12" r="5" fill="url(#tm-gold)" filter="url(#tm-glow)"/>
      <circle cx="119" cy="10" r="1.5" fill="#fff" opacity="0.95"/>
    </g>

    <!-- Floor shadow -->
    <ellipse class="tm-shadow" cx="120" cy="306" rx="56" ry="7" fill="#000" opacity="0.4"/>

    <!-- Hover feet (gold-cyan pods) -->
    <ellipse cx="100" cy="298" rx="16" ry="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.4"/>
    <ellipse cx="140" cy="298" rx="16" ry="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.4"/>
    <circle cx="100" cy="298" r="2.4" fill="url(#tm-gold)"/>
    <circle cx="140" cy="298" r="2.4" fill="url(#tm-gold)"/>
    <ellipse cx="100" cy="298" rx="10" ry="3" fill="#25f4ee" opacity="0.45"/>
    <ellipse cx="140" cy="298" rx="10" ry="3" fill="#25f4ee" opacity="0.45"/>

    <!-- Legs -->
    <rect x="92" y="262" width="16" height="38" rx="4" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
    <rect x="132" y="262" width="16" height="38" rx="4" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
    <rect x="96" y="270" width="8" height="2" fill="url(#tm-helm-rim)" opacity="0.7"/>
    <rect x="136" y="270" width="8" height="2" fill="url(#tm-helm-rim)" opacity="0.7"/>
    <circle cx="100" cy="278" r="2.6" fill="url(#tm-gold)"/>
    <circle cx="140" cy="278" r="2.6" fill="url(#tm-gold)"/>

    <!-- Waist / belt -->
    <rect x="78" y="252" width="84" height="14" rx="3" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
    <rect x="78" y="256" width="84" height="2.4" fill="url(#tm-gold)"/>
    <polygon points="120,254 124,259 116,259" fill="#fff4c2"/>

    <!-- Pauldrons (shoulder armor) -->
    <g class="tm-pauldron tm-pauldron-l" style="transform-origin:74px 158px">
      <path d="M52 144 Q60 132 82 140 L88 168 Q72 184 56 174 Q44 162 52 144 Z"
            fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linejoin="round"/>
      <line x1="58" y1="152" x2="78" y2="150" stroke="url(#tm-helm-rim)" stroke-width="1" opacity="0.7"/>
      <line x1="60" y1="160" x2="78" y2="158" stroke="url(#tm-helm-rim)" stroke-width="1" opacity="0.7"/>
    </g>
    <g class="tm-pauldron tm-pauldron-r" style="transform-origin:166px 158px">
      <path d="M188 144 Q180 132 158 140 L152 168 Q168 184 184 174 Q196 162 188 144 Z"
            fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linejoin="round"/>
      <line x1="182" y1="152" x2="162" y2="150" stroke="url(#tm-helm-rim)" stroke-width="1" opacity="0.7"/>
      <line x1="180" y1="160" x2="162" y2="158" stroke="url(#tm-helm-rim)" stroke-width="1" opacity="0.7"/>
    </g>

    <!-- Torso / chest with reactor core -->
    <g class="tm-body-grp">
      <path d="M76 172 Q70 158 86 148 L154 148 Q170 158 164 172 L168 244
               Q170 256 152 258 L88 258 Q70 256 72 244 Z"
            fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.6"/>
      <!-- Chest armor plate -->
      <rect x="92" y="170" width="56" height="62" rx="8" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1"/>
      <!-- Reactor core (central) -->
      <g class="tm-reactor">
        <circle cx="120" cy="190" r="18" fill="url(#tm-reactor)" filter="url(#tm-glow)"/>
        <circle cx="120" cy="190" r="12" fill="none" stroke="url(#tm-gold)" stroke-width="1.2"/>
        <circle cx="120" cy="190" r="6" fill="#fff" opacity="0.7"/>
        <circle cx="120" cy="190" r="3" fill="#fff"/>
      </g>
      <!-- T-mark below reactor -->
      <path d="M114 220 L126 220 M120 220 L120 230" stroke="url(#tm-gold)" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Status LEDs (3 rows) -->
      <circle cx="98"  cy="244" r="2" fill="url(#tm-gold)"/>
      <circle cx="106" cy="244" r="2" fill="#25f4ee"/>
      <circle cx="134" cy="244" r="2" fill="#fe2c55"/>
      <circle cx="142" cy="244" r="2" fill="url(#tm-gold)"/>
      <line x1="98" y1="248" x2="142" y2="248" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.5"/>
    </g>

    <!-- LEFT ARM (5-finger hand, ready to wave) -->
    <g class="tm-arm-l" style="transform-origin:82px 170px">
      <!-- shoulder joint -->
      <circle cx="82" cy="170" r="8" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
      <circle cx="82" cy="170" r="3" fill="url(#tm-gold)"/>
      <!-- upper arm -->
      <rect x="68" y="170" width="22" height="36" rx="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
      <line x1="68" y1="180" x2="90" y2="180" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.6"/>
      <line x1="68" y1="192" x2="90" y2="192" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.6"/>
      <!-- elbow joint -->
      <circle cx="79" cy="206" r="6.5" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
      <circle cx="79" cy="206" r="2.4" fill="url(#tm-gold)"/>
      <!-- forearm -->
      <g class="tm-forearm-l" style="transform-origin:79px 206px">
        <rect x="68" y="206" width="22" height="32" rx="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
        <line x1="68" y1="218" x2="90" y2="218" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.6"/>
        <!-- 5-finger mechanical hand -->
        <g class="tm-hand-l" style="transform-origin:79px 248px">
          <!-- palm -->
          <path d="M66 240 Q66 234 72 234 L86 234 Q92 234 92 240 L92 254 Q92 260 86 260 L72 260 Q66 260 66 254 Z"
                fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
          <!-- knuckle ridges -->
          <line x1="68" y1="244" x2="90" y2="244" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.5"/>
          <!-- thumb -->
          <ellipse cx="62" cy="248" rx="4" ry="7" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.8" transform="rotate(-22 62 248)"/>
          <!-- 4 fingers (each with a knuckle joint line) -->
          <rect x="70" y="226" width="3.5" height="10" rx="1.5" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.7"/>
          <line x1="70" y1="231" x2="73.5" y2="231" stroke="url(#tm-helm-rim)" stroke-width="0.4" opacity="0.6"/>
          <rect x="75" y="224" width="3.5" height="12" rx="1.5" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.7"/>
          <line x1="75" y1="229" x2="78.5" y2="229" stroke="url(#tm-helm-rim)" stroke-width="0.4" opacity="0.6"/>
          <rect x="80" y="226" width="3.5" height="10" rx="1.5" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.7"/>
          <line x1="80" y1="231" x2="83.5" y2="231" stroke="url(#tm-helm-rim)" stroke-width="0.4" opacity="0.6"/>
          <rect x="85" y="228" width="3.5" height="8" rx="1.5" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.7"/>
          <!-- palm glow -->
          <ellipse cx="79" cy="252" rx="8" ry="3" fill="#25f4ee" opacity="0.15"/>
        </g>
      </g>
    </g>

    <!-- RIGHT ARM (holds floating data shard) -->
    <g class="tm-arm-r" style="transform-origin:158px 170px">
      <circle cx="158" cy="170" r="8" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
      <circle cx="158" cy="170" r="3" fill="url(#tm-gold)"/>
      <rect x="150" y="170" width="22" height="36" rx="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
      <line x1="150" y1="180" x2="172" y2="180" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.6"/>
      <line x1="150" y1="192" x2="172" y2="192" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.6"/>
      <circle cx="161" cy="206" r="6.5" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
      <circle cx="161" cy="206" r="2.4" fill="url(#tm-gold)"/>
      <g class="tm-forearm-r" style="transform-origin:161px 206px">
        <rect x="150" y="206" width="22" height="32" rx="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
        <!-- 5-finger hand grasping the data shard -->
        <g class="tm-hand-r" style="transform-origin:161px 248px">
          <path d="M148 240 Q148 234 154 234 L168 234 Q174 234 174 240 L174 254 Q174 260 168 260 L154 260 Q148 260 148 254 Z"
                fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
          <line x1="150" y1="244" x2="172" y2="244" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.5"/>
          <!-- thumb (curled inward, grasping) -->
          <ellipse cx="178" cy="246" rx="4" ry="6" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="0.8" transform="rotate(28 178 246)"/>
          <!-- 4 fingers (curled around shard) -->
          <path d="M152 232 Q160 236 160 240" stroke="url(#tm-helm-rim)" stroke-width="2" fill="url(#tm-armor)" stroke-linecap="round"/>
          <path d="M157 230 Q165 234 165 238" stroke="url(#tm-helm-rim)" stroke-width="2" fill="url(#tm-armor)" stroke-linecap="round"/>
          <path d="M162 230 Q170 234 170 238" stroke="url(#tm-helm-rim)" stroke-width="2" fill="url(#tm-armor)" stroke-linecap="round"/>
          <path d="M167 232 Q172 236 172 240" stroke="url(#tm-helm-rim)" stroke-width="2" fill="url(#tm-armor)" stroke-linecap="round"/>
        </g>
        <!-- Floating data shard (held in hand) -->
        <g class="tm-shard">
          <rect x="174" y="220" width="34" height="50" rx="4" fill="#04141a" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
          <rect x="178" y="224" width="26" height="42" rx="2" fill="url(#tm-shard)" filter="url(#tm-glow)"/>
          <rect x="180" y="232" width="3" height="6" fill="#04141a" opacity="0.7"/>
          <rect x="186" y="228" width="3" height="10" fill="#04141a" opacity="0.7"/>
          <rect x="192" y="234" width="3" height="6" fill="#04141a" opacity="0.7"/>
          <rect x="198" y="226" width="3" height="14" fill="#04141a" opacity="0.7"/>
          <circle cx="195" cy="252" r="2" fill="url(#tm-gold)"/>
        </g>
      </g>
    </g>

    <!-- NECK joint -->
    <rect x="110" y="140" width="20" height="12" rx="3" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.2"/>
    <rect x="112" y="146" width="16" height="2" fill="url(#tm-gold)" opacity="0.8"/>
    <circle cx="120" cy="142" r="1.5" fill="#25f4ee"/>

    <!-- HELMET HEAD (Spartan, scaled up version of #titan-face) -->
    <g class="tm-head">
      <!-- Halo -->
      <circle cx="120" cy="86" r="62" fill="url(#tm-gold)" opacity="0.10" filter="url(#tm-glow)"/>
      <!-- Helmet pentagon -->
      <path d="M68 70 L86 38 L154 38 L172 70 L172 116 L162 138 L78 138 L68 116 Z"
            fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- Top crest -->
      <path d="M86 38 L120 18 L154 38" fill="none" stroke="url(#tm-helm-rim)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="120" cy="18" r="3" fill="url(#tm-gold)"/>
      <!-- Antenna mount -->
      <rect x="115" y="34" width="10" height="6" rx="1" fill="url(#tm-helm-rim)" opacity="0.9"/>
      <!-- Cheek guard lines -->
      <g class="tm-cheek-lines">
        <line x1="68" y1="80"  x2="80" y2="84" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
        <line x1="68" y1="92"  x2="80" y2="96" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
        <line x1="68" y1="104" x2="80" y2="108" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
        <line x1="172" y1="80"  x2="160" y2="84" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
        <line x1="172" y1="92"  x2="160" y2="96" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
        <line x1="172" y1="104" x2="160" y2="108" stroke="url(#tm-helm-rim)" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>
      </g>
      <!-- Visor strip (face area, dark) -->
      <path d="M80 76 L160 76 L156 110 L84 110 Z" fill="url(#tm-visor)" stroke="url(#tm-helm-rim)" stroke-width="1" stroke-linejoin="round"/>
      <!-- T-mark on forehead -->
      <path d="M112 50 L128 50 M120 50 L120 64" stroke="url(#tm-gold)" stroke-width="2.2" stroke-linecap="round"/>

      <!-- EYES (sharp angular visor pupils, glowing) -->
      <g class="tm-eyes">
        <!-- left eye -->
        <path class="tm-eye-shape tm-eye-l" d="M90 92 L106 88 L106 100 Z" fill="url(#tm-eye-glow)" filter="url(#tm-strong-glow)"/>
        <circle cx="97" cy="93" r="1.5" fill="#fff"/>
        <!-- right eye -->
        <path class="tm-eye-shape tm-eye-r" d="M150 92 L134 88 L134 100 Z" fill="url(#tm-eye-glow)" filter="url(#tm-strong-glow)"/>
        <circle cx="143" cy="93" r="1.5" fill="#fff"/>
        <!-- sparkles -->
        <circle class="tm-sparkle" cx="92"  cy="86" r="1.5" fill="#fff" opacity="0.9"/>
        <circle class="tm-sparkle" cx="148" cy="86" r="1.5" fill="#fff" opacity="0.9"/>
        <!-- per-eye lid groups (transform-origin = eye center for proper blink) -->
        <g class="tm-lid-group" style="transform-origin:97px 93px">
          <rect x="86" y="86" width="22" height="16" fill="url(#tm-visor)" opacity="0.96"/>
        </g>
        <g class="tm-lid-group" style="transform-origin:143px 93px">
          <rect x="132" y="86" width="22" height="16" fill="url(#tm-visor)" opacity="0.96"/>
        </g>
      </g>

      <!-- Mouth slit -->
      <rect x="110" y="120" width="20" height="3" rx="1" fill="url(#tm-gold)"/>
      <line x1="114" y1="124" x2="126" y2="124" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.5"/>

      <!-- Chin plate -->
      <path d="M86 134 L154 134 L146 148 L94 148 Z" fill="url(#tm-armor)" stroke="url(#tm-helm-rim)" stroke-width="1" stroke-linejoin="round"/>
      <line x1="100" y1="142" x2="140" y2="142" stroke="url(#tm-helm-rim)" stroke-width="0.6" opacity="0.5"/>
    </g>
  </symbol>

  <!-- TITAN FACE (alias for back-compat / topbar) -->
  <symbol id="titan-bot-sm" viewBox="0 0 64 64">
    <use href="#titan-face"/>
  </symbol>
</svg>
`;

  /* ============================================================== */
  /* 2. PERSONALITY + DOM KNOWLEDGE                                 */
  /* ============================================================== */
  const LINES = {
    greet: [
      "Halo! Aku Titan, analis AI pribadimu 👋",
      "Pilih akun di bawah, aku kasih insight-nya.",
      "Tip: pencet ? untuk tanya apa aja, atau R untuk refresh."
    ],
    curious: [
      "Hmm, akun ini menarik banget.",
      "Konten media lokal lagi naik nih.",
      "Aku sempat liat pos viral mereka. Mantap.",
      "Coba cek pos teratasnya, ada yang gila."
    ],
    hype: [
      "Gila sih performa ini! Followers naik terus 🚀",
      "Top-tier. Strategi banget!",
      "Cocok buat benchmark konten lo."
    ],
    sleepy: [
      "Sini, ada yang mau dijelasin?",
      "Aku standby di sini.",
      "Data baru udah masuk. Yuk intip."
    ],
    return: [
      "Aku balik! Lagi ngapain?",
      "Hei! Halo lagi 👋",
      "Wah, ada yang baru nih."
    ],
    leave: [
      "Kok pergi? Aku nunggu ya...",
      "Hati-hati! ✨",
      "Balik lagi ya."
    ],
    success: [
      "Data berhasil diperbarui! ✨",
      "Done! Cek deh hasilnya.",
      "Mantap, semua udah update."
    ],
    error: [
      "Hmm, kayaknya ada masalah...",
      "Waduh error. Sabar ya.",
      "Aku gak bisa ambil datanya."
    ],
    point: [
      "Ini dia! 👉",
      "Lihat yang aku tunjuk!",
      "Coba cek yang ini."
    ],
    subpage: {
      'ardiantanah/ardiantanah-tiktok.html': [
        "ardian.tanah! Mix properti & komedi, kocak banget.",
        "Konten khas Lumajang, vibe-nya asik."
      ],
      'ardiantanah/index.html': [
        "ardiantanah ada di TikTok + IG, lengkap!",
        "Cek performa IG-nya juga, biasanya kuat di Reels."
      ],
      'majangmejeng-ig.html': [
        "majangmejeng_, berita lokal Lumajang.",
        "Liputan viral mereka selalu rame."
      ],
      'majangmejeng/index.html': [
        "majangmejeng_ — jurnalis lokal yang konsisten.",
        "Update tiap hari, perfect buat referensi."
      ],
      'marketing/index.html': [
        "itsnisyananda, kreator marketing aesthetic.",
        "Performanya stabil banget."
      ],
      'marketing/nisyanandaa-instagram.html': [
        "Nisyanandaa, marketing aesthetic IG.",
        "Feed-nya rapi, branding kuat!"
      ],
      'syahfalahproperti-ig/index.html': [
        "Syahfalah Properti, listing properti Lumajang.",
        "Cek harganya, biasanya kompetitif."
      ],
      'syahfalahproperti/index.html': [
        "Syahfalah Properti — rumah subsidi & properti lokal.",
        "Listing lengkap, harga transparan."
      ]
    }
  };

  /* ============================================================== */
  /* 3. STATE                                                       */
  /* ============================================================== */
  const state = {
    mood: 'idle',
    cycleIdx: 0,
    pos: { x: 0, y: 0 },
    target: null,
    speed: 0.4,
    paused: false,
    pauseUntil: 0,
    greeted: sessionStorage.getItem(GREET_KEY) === '1',
    tutorialDone: localStorage.getItem(TUTOR_KEY) === '1',
    typing: false,
    eyes: { x: 0, y: 0 },
    queue: [],
    dragging: false,
    chatOpen: localStorage.getItem(CHAT_KEY) === '1',
    chatHistory: [],
    lastLine: null
  };

  /* ============================================================== */
  /* 4. INJECT SPRITE + CSS                                         */
  /* ============================================================== */
  function injectSprite() {
    if (document.getElementById('tm-sprite')) return;
    const wrap = document.createElement('div');
    wrap.id = 'tm-sprite';
    wrap.innerHTML = SPRITE;
    document.body.appendChild(wrap);
  }

  const CSS = `
/* === Mascot container === */
.titan-mascot {
  position: fixed;
  z-index: 70;
  pointer-events: none;
  width: 180px;
  height: 240px;
  user-select: none;
  touch-action: none;
  will-change: transform;
  filter: drop-shadow(0 18px 36px rgba(37, 244, 238, 0.16))
          drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
  transform: translate3d(0, 0, 0);
  transition: filter 300ms ease, width 300ms ease, height 300ms ease;
  right: 20px;
  bottom: 20px;
}
.titan-mascot svg {
  width: 100%; height: 100%;
  pointer-events: auto;
  cursor: grab;
  overflow: visible;
}
.titan-mascot.dragging svg { cursor: grabbing; }

/* Continuous motion */
.titan-mascot .tm-bot-grp {
  transform-origin: 120px 300px;
  animation: tm-bob 3.6s ease-in-out infinite;
}
@keyframes tm-bob {
  0%, 100% { transform: translateY(0) rotate(0); }
  25%      { transform: translateY(-4px) rotate(-1deg); }
  50%      { transform: translateY(-7px) rotate(0); }
  75%      { transform: translateY(-3px) rotate(1deg); }
}

.titan-mascot .tm-head {
  transform-origin: 120px 90px;
  animation: tm-head-tilt 5s ease-in-out infinite;
}
@keyframes tm-head-tilt {
  0%, 100% { transform: rotate(0); }
  30%      { transform: rotate(-2.5deg) translateY(-1px); }
  70%      { transform: rotate(2deg) translateY(1px); }
}

.titan-mascot .tm-ant-ball {
  transform-origin: 120px 12px;
  animation: tm-antenna-pulse 1.6s ease-in-out infinite;
}
@keyframes tm-antenna-pulse {
  0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 0 #f5c14b); }
  50%      { transform: scale(1.3); filter: drop-shadow(0 0 8px #f5c14b); }
}

.titan-mascot .tm-shadow {
  transform-origin: 120px 306px;
  animation: tm-shadow-pulse 3.6s ease-in-out infinite;
}
@keyframes tm-shadow-pulse {
  0%, 100% { transform: scaleX(1); opacity: 0.4; }
  50%      { transform: scaleX(0.78); opacity: 0.24; }
}

.titan-mascot .tm-hand-l {
  transform-origin: 79px 248px;
  animation: tm-wave 2.4s ease-in-out infinite;
  animation-delay: 1.2s;
}
@keyframes tm-wave {
  0%, 65%, 100% { transform: rotate(0); }
  72%           { transform: rotate(-22deg); }
  80%           { transform: rotate(18deg); }
  88%           { transform: rotate(-12deg); }
}

.titan-mascot .tm-forearm-l {
  animation: tm-forearm-wave 2.4s ease-in-out infinite;
  animation-delay: 1.2s;
}
@keyframes tm-forearm-wave {
  0%, 65%, 100% { transform: rotate(0); }
  72%           { transform: rotate(-8deg); }
  80%           { transform: rotate(6deg); }
}

.titan-mascot .tm-reactor {
  transform-origin: 120px 190px;
  animation: tm-reactor-pulse 2.2s ease-in-out infinite;
}
@keyframes tm-reactor-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50%      { transform: scale(1.06); filter: brightness(1.2); }
}

.titan-mascot .tm-shard {
  transform-origin: 191px 245px;
  animation: tm-shard-float 3.2s ease-in-out infinite;
}
@keyframes tm-shard-float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(-3px) rotate(2deg); }
}

.titan-mascot .tm-sparkle {
  animation: tm-sparkle 2s ease-in-out infinite;
}
.titan-mascot .tm-sparkle:nth-of-type(2) { animation-delay: 0.6s; }
@keyframes tm-sparkle {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50%      { opacity: 0.3; transform: scale(0.6); }
}

/* === Walking animation === */
.titan-mascot.walking .tm-arm-l { animation: tm-leg-swing 0.6s ease-in-out infinite; transform-origin: 82px 170px; }
.titan-mascot.walking .tm-arm-r { animation: tm-leg-swing 0.6s ease-in-out infinite reverse; transform-origin: 158px 170px; }
@keyframes tm-leg-swing {
  0%, 100% { transform: rotate(20deg); }
  50%      { transform: rotate(-20deg); }
}
.titan-mascot.walking .tm-bot-grp {
  animation: tm-walk-bounce 0.4s ease-in-out infinite;
}
@keyframes tm-walk-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
.titan-mascot.walking .tm-hand-l { animation: none; }

/* === Eye shape follows cursor (CSS var) === */
.titan-mascot .tm-eye-shape {
  transform: translate(var(--eye-x, 0px), var(--eye-y, 0px));
  transition: transform 220ms ease-out;
}

/* === AUTO BLINK === */
.titan-mascot .tm-lid-group {
  transform: scaleY(0);
  transform-box: fill-box;
}
.titan-mascot.tm-blinking .tm-lid-group {
  animation: tm-blink 240ms ease-in-out;
}
@keyframes tm-blink {
  0%   { transform: scaleY(0); }
  50%  { transform: scaleY(1); }
  100% { transform: scaleY(0); }
}

/* === Mood: sad === */
.titan-mascot.tm-sad .tm-eye-shape { opacity: 0.5; }
.titan-mascot.tm-sad .tm-hand-l { animation: none; transform: rotate(30deg); transform-origin: 79px 248px; }
.titan-mascot.tm-sad .tm-arm-l { transform: rotate(8deg); transform-origin: 82px 170px; }
.titan-mascot.tm-sad .tm-head { animation: tm-sad-droop 2.4s ease-in-out infinite; }
@keyframes tm-sad-droop {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(3px) rotate(0.5deg); }
}
.titan-mascot.tm-sad .tm-reactor { animation: tm-reactor-dim 2.4s ease-in-out infinite; }
@keyframes tm-reactor-dim {
  0%, 100% { filter: brightness(0.7); }
  50%      { filter: brightness(0.4); }
}

/* === Mood: happy === */
.titan-mascot.tm-happy .tm-reactor { animation: tm-reactor-bright 0.8s ease-in-out infinite; }
@keyframes tm-reactor-bright {
  0%, 100% { filter: brightness(1.2); }
  50%      { filter: brightness(1.6); }
}

.titan-mascot.tm-celebrate .tm-bot-grp { animation: tm-jump 800ms cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes tm-jump {
  0%   { transform: translateY(0) rotate(0); }
  30%  { transform: translateY(-28px) rotate(-5deg); }
  55%  { transform: translateY(-8px) rotate(3deg); }
  100% { transform: translateY(0) rotate(0); }
}

/* === Hidden === */
.titan-mascot.tm-hidden { opacity: 0; }

/* === Speech bubble === */
.titan-bubble {
  position: absolute;
  z-index: 71;
  bottom: 100%;
  right: -20px;
  margin-bottom: 22px;
  width: 320px;
  max-width: 340px;
  min-width: 220px;
  padding: 16px 80px 18px 56px;
  background: linear-gradient(180deg, rgba(20, 24, 36, 0.96), rgba(10, 11, 16, 0.96));
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(245, 193, 75, 0.36);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(37, 244, 238, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: var(--text, #f4f6fb);
  font-family: var(--font-sans, 'Plus Jakarta Sans', sans-serif);
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(10px) scale(0.94);
  transition: opacity 280ms ease, transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.titan-bubble.is-visible { opacity: 1; transform: translateY(0) scale(1); }
.titan-bubble::after {
  content: "";
  position: absolute;
  bottom: -8px;
  right: 40px;
  width: 18px; height: 18px;
  background: linear-gradient(135deg, rgba(20, 24, 36, 0.96), rgba(10, 11, 16, 0.96));
  border-right: 1px solid rgba(245, 193, 75, 0.36);
  border-bottom: 1px solid rgba(245, 193, 75, 0.36);
  transform: rotate(45deg);
}
.titan-bubble .face {
  position: absolute;
  top: 14px; left: 14px;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25f4ee, #5be7ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: #0a0b10;
  box-shadow: 0 2px 8px rgba(37, 244, 238, 0.5);
  font-family: var(--font-display, sans-serif);
}
.titan-bubble .voice {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #25f4ee;
  margin-right: 8px;
  vertical-align: middle;
  opacity: 0;
}
.titan-bubble.is-typing .voice { animation: tm-voice 1.4s ease-in-out infinite; }
@keyframes tm-voice {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1.2); }
}
.titan-bubble .text { display: inline; min-height: 1.2em; }
.titan-bubble.is-typing .text::after {
  content: "▌";
  margin-left: 2px;
  color: #25f4ee;
  animation: tm-caret 800ms steps(1) infinite;
}
@keyframes tm-caret {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.titan-bubble .close,
.titan-bubble .replay {
  position: absolute;
  top: 8px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 0;
  color: var(--text-muted, #8a90a4);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.titan-bubble .close { right: 8px; }
.titan-bubble .replay { right: 38px; }
.titan-bubble .close:hover,
.titan-bubble .replay:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #f4f6fb;
}
.titan-bubble .next {
  position: absolute;
  bottom: 8px; right: 12px;
  background: none;
  border: 0;
  color: #25f4ee;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 150ms;
}
.titan-bubble .next:hover { opacity: 1; }
.titan-bubble .next[hidden] { display: none; }
.titan-bubble .progress {
  position: absolute;
  bottom: 4px; left: 56px; right: 86px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.titan-bubble .progress span {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #25f4ee, #fe2c55);
  border-radius: 2px;
}
.titan-bubble .label {
  position: absolute;
  top: 8px; left: 56px;
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f5c14b;
  opacity: 0.7;
}

.titan-mascot.tm-entering {
  animation: tm-enter 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tm-enter {
  0%   { opacity: 0; transform: translate3d(0, 80px, 0) scale(0.7); }
  60%  { opacity: 1; transform: translate3d(0, -10px, 0) scale(1.05); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

.tm-target-glow { position: relative; }
.tm-target-glow::after {
  content: "";
  position: absolute;
  inset: -8px;
  border: 2px solid #f5c14b;
  border-radius: 16px;
  pointer-events: none;
  animation: tm-target-ring 1.6s ease-in-out infinite;
}
@keyframes tm-target-ring {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.04); }
}

/* === Ask-Titan button on mascot === */
.titan-ask-btn {
  position: absolute;
  bottom: 6px;
  left: -6px;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25f4ee, #5be7ff);
  color: #0a0b10;
  font-size: 18px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(37, 244, 238, 0.4);
  cursor: pointer;
  pointer-events: auto;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}
.titan-ask-btn:hover {
  transform: scale(1.1) rotate(-6deg);
  box-shadow: 0 6px 16px rgba(37, 244, 238, 0.6);
}
.titan-ask-btn:active { transform: scale(0.95); }

/* === Q&A Chat panel === */
.titan-chat {
  position: fixed;
  z-index: 72;
  width: 340px;
  max-width: 90vw;
  height: 460px;
  max-height: 70vh;
  background: linear-gradient(180deg, rgba(20, 24, 36, 0.97), rgba(10, 11, 16, 0.97));
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(245, 193, 75, 0.36);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(37, 244, 238, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: none;
  flex-direction: column;
  overflow: hidden;
  color: #f4f6fb;
  font-family: var(--font-sans, 'Plus Jakarta Sans', sans-serif);
  pointer-events: auto;
}
.titan-chat.is-open { display: flex; }
.titan-chat-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: move;
  background: rgba(255, 255, 255, 0.02);
}
.titan-chat-head .avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25f4ee, #5be7ff);
  display: flex; align-items: center; justify-content: center;
  font-weight: 900;
  color: #0a0b10;
  flex-shrink: 0;
}
.titan-chat-head .title { font-size: 0.9rem; font-weight: 700; }
.titan-chat-head .subtitle { font-size: 0.7rem; color: #8a90a4; }
.titan-chat-head .close-chat {
  margin-left: auto;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 0;
  color: #f4f6fb;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.titan-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
}
.titan-chat-body::-webkit-scrollbar { width: 4px; }
.titan-chat-body::-webkit-scrollbar-thumb { background: rgba(37, 244, 238, 0.3); border-radius: 2px; }
.titan-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 0.85rem;
  line-height: 1.5;
  word-wrap: break-word;
  animation: tm-msg-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tm-msg-in {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.titan-msg.mascot {
  align-self: flex-start;
  background: rgba(37, 244, 238, 0.10);
  border: 1px solid rgba(37, 244, 238, 0.25);
  border-bottom-left-radius: 4px;
}
.titan-msg.user {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(254, 44, 85, 0.20), rgba(245, 193, 75, 0.20));
  border: 1px solid rgba(254, 44, 85, 0.35);
  border-bottom-right-radius: 4px;
  color: #ffe9ed;
}
.titan-msg.typing { color: #8a90a4; font-style: italic; }
.titan-msg.typing::after { content: " ●●●"; animation: tm-typing-dot 1s ease-in-out infinite; }
@keyframes tm-typing-dot {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 1; }
}
.titan-chat-quick {
  padding: 8px 14px;
  display: flex; flex-wrap: wrap; gap: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.titan-chat-quick button {
  background: rgba(37, 244, 238, 0.10);
  border: 1px solid rgba(37, 244, 238, 0.30);
  color: #a8feff;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}
.titan-chat-quick button:hover {
  background: rgba(37, 244, 238, 0.20);
  transform: translateY(-1px);
}
.titan-chat-foot {
  display: flex; gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}
.titan-chat-foot textarea {
  flex: 1;
  resize: none;
  min-height: 38px;
  max-height: 100px;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  color: #f4f6fb;
  font-family: inherit;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 150ms;
}
.titan-chat-foot textarea:focus { border-color: rgba(37, 244, 238, 0.5); }
.titan-chat-foot textarea::placeholder { color: #6a7080; }
.titan-chat-foot button {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #25f4ee, #5be7ff);
  border: 0;
  color: #0a0b10;
  font-size: 18px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  transition: all 150ms;
  flex-shrink: 0;
}
.titan-chat-foot button:hover { transform: scale(1.06); }
.titan-chat-foot button:active { transform: scale(0.94); }

/* === Responsive — Tablet (≤768px) === */
@media (max-width: 768px) {
  .titan-mascot { width: 130px; height: 175px; right: 12px; bottom: 12px; }
  .titan-bubble {
    width: 240px;
    min-width: 160px;
    max-width: 240px;
    font-size: 0.78rem;
    padding: 12px 60px 14px 48px;
  }
  .titan-bubble .face { width: 28px; height: 28px; font-size: 15px; top: 10px; left: 10px; }
  .titan-bubble .label { font-size: 0.55rem; left: 48px; }
  .titan-bubble .close, .titan-bubble .replay { width: 22px; height: 22px; font-size: 12px; }
  .titan-ask-btn { width: 34px; height: 34px; font-size: 16px; }
}

/* === Responsive — Phone (≤480px) === */
@media (max-width: 480px) {
  .titan-mascot { width: 96px; height: 130px; right: 8px; bottom: 8px; }
  .titan-bubble {
    width: 200px;
    max-width: calc(100vw - 110px);
    right: 0;
    font-size: 0.74rem;
    padding: 10px 48px 12px 42px;
  }
  .titan-bubble .face { width: 24px; height: 24px; font-size: 13px; top: 8px; left: 8px; }
  .titan-bubble .label { font-size: 0.5rem; left: 42px; }
  .titan-ask-btn { width: 30px; height: 30px; font-size: 14px; }
  .titan-chat { width: 92vw; height: 70vh; right: 4vw; left: auto; bottom: 8px; }
}

/* === Reduced motion === */
@media (prefers-reduced-motion: reduce) {
  .titan-mascot, .titan-mascot *, .titan-bubble, .titan-bubble *, .titan-chat, .titan-chat * {
    animation-duration: 0.001s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001s !important;
  }
  .titan-mascot { transition: opacity 200ms ease !important; }
}

/* === Topbar face === */
.brand-mark {
  width: 32px; height: 32px;
  filter: drop-shadow(0 1px 4px rgba(37, 244, 238, 0.4));
  flex-shrink: 0;
  display: block;
}
`;

  function injectStyles() {
    if (document.getElementById('tm-style')) return;
    const s = document.createElement('style');
    s.id = 'tm-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ============================================================== */
  /* 5. BUILD DOM                                                   */
  /* ============================================================== */
  let mascot, bubble, bubbleText, bubbleFace, bubbleLabel, bubbleClose, bubbleReplay, bubbleNext, bubbleProgress, groupG;
  let askBtn, chat, chatBody, chatFoot, chatTextarea, chatSend, chatCloseBtn, chatHead;

  function buildMascot() {
    if (mascot) return;
    mascot = document.createElement('div');
    mascot.className = 'titan-mascot tm-hidden tm-entering';
    mascot.setAttribute('role', 'img');
    mascot.setAttribute('aria-label', 'TITAN PRO — maskot AI');
    mascot.innerHTML = `
      <div class="tm-bot-grp">
        <svg viewBox="0 0 240 320" aria-hidden="true" style="overflow:visible">
          <use href="#titan-bot"/>
        </svg>
      </div>
      <button class="titan-ask-btn" type="button" aria-label="Tanya Titan">?</button>
    `;
    document.body.appendChild(mascot);

    bubble = document.createElement('div');
    bubble.className = 'titan-bubble';
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');
    bubble.innerHTML = `
      <span class="face" aria-hidden="true">T</span>
      <span class="label" aria-hidden="true">TITAN PRO</span>
      <span class="voice" aria-hidden="true"></span>
      <span class="text"></span>
      <button class="replay" type="button" aria-label="Ulangi" hidden>↺</button>
      <button class="close" type="button" aria-label="Tutup">×</button>
      <button class="next" type="button" hidden>Lanjut →</button>
      <span class="progress" aria-hidden="true"><span></span></span>
    `;
    mascot.appendChild(bubble);
    bubbleText = bubble.querySelector('.text');
    bubbleFace = bubble.querySelector('.face');
    bubbleLabel = bubble.querySelector('.label');
    bubbleClose = bubble.querySelector('.close');
    bubbleReplay = bubble.querySelector('.replay');
    bubbleNext = bubble.querySelector('.next');
    bubbleProgress = bubble.querySelector('.progress span');

    bubbleClose.addEventListener('click', hideBubble);
    bubbleReplay.addEventListener('click', replayLast);
    bubbleNext.addEventListener('click', nextLine);

    askBtn = mascot.querySelector('.titan-ask-btn');
    askBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openChat();
    });

    groupG = mascot.querySelector('.tm-bot-grp');
  }

  function buildChat() {
    if (chat) return;
    chat = document.createElement('div');
    chat.className = 'titan-chat';
    chat.setAttribute('role', 'dialog');
    chat.setAttribute('aria-label', 'Tanya Titan — chat panel');
    chat.innerHTML = `
      <div class="titan-chat-head">
        <span class="avatar" aria-hidden="true">T</span>
        <span>
          <div class="title">Tanya Titan</div>
          <div class="subtitle">Asisten AI · scoped ke halaman ini</div>
        </span>
        <button class="close-chat" type="button" aria-label="Tutup">×</button>
      </div>
      <div class="titan-chat-body" id="titanChatBody"></div>
      <div class="titan-chat-quick">
        <button type="button" data-q="KPI terbaik?">KPI terbaik?</button>
        <button type="button" data-q="Engagement rate akun ini berapa?">ER-nya berapa?</button>
        <button type="button" data-q="Apa yang bisa kamu analisis?">Apa yang bisa kamu analisis?</button>
        <button type="button" data-q="Jelaskan halaman ini">Tentang halaman ini</button>
      </div>
      <form class="titan-chat-foot">
        <textarea placeholder="Tanya Titan apa aja..." rows="1" aria-label="Pesan"></textarea>
        <button type="submit" aria-label="Kirim">→</button>
      </form>
    `;
    document.body.appendChild(chat);

    chatBody = chat.querySelector('.titan-chat-body');
    chatFoot = chat.querySelector('.titan-chat-foot');
    chatTextarea = chat.querySelector('textarea');
    chatSend = chat.querySelector('button[type="submit"]');
    chatCloseBtn = chat.querySelector('.close-chat');
    chatHead = chat.querySelector('.titan-chat-head');

    chatCloseBtn.addEventListener('click', closeChat);
    chatFoot.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatTextarea.value.trim();
      if (!text) return;
      chatTextarea.value = '';
      autoResize();
      handleUserQuestion(text);
    });
    chatTextarea.addEventListener('input', autoResize);
    chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatFoot.requestSubmit();
      }
    });
    chat.querySelectorAll('.titan-chat-quick button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-q') || btn.textContent;
        handleUserQuestion(q);
      });
    });
    setupChatDrag();
  }

  function autoResize() {
    chatTextarea.style.height = 'auto';
    chatTextarea.style.height = Math.min(100, chatTextarea.scrollHeight) + 'px';
  }

  function setupChatDrag() {
    let dragging = false, startX, startY, origX, origY;
    chatHead.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const r = chat.getBoundingClientRect();
      chat.style.left = r.left + 'px';
      chat.style.top = r.top + 'px';
      chat.style.right = 'auto';
      chat.style.bottom = 'auto';
      origX = r.left; origY = r.top;
      chat.setPointerCapture(e.pointerId);
    });
    chatHead.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      chat.style.left = (origX + dx) + 'px';
      chat.style.top  = (origY + dy) + 'px';
    });
    chatHead.addEventListener('pointerup', (e) => {
      dragging = false;
    });
  }

  /* ============================================================== */
  /* 6. POSITION + PERSISTENCE                                      */
  /* ============================================================== */
  function loadPos() {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }
  function savePos(p) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch {}
  }
  function defaultPos() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 768;
    return isMobile
      ? { x: w - 100, y: h - 140 }
      : { x: w - 220, y: h - 270 };
  }
  function applyPos(p) {
    if (!mascot || !p) return;
    // Use right/bottom (CSS positioning) so it works with drag-from-anywhere
    const w = window.innerWidth, h = window.innerHeight;
    const mw = mascot.offsetWidth || 180;
    const mh = mascot.offsetHeight || 240;
    const right = w - (p.x + mw);
    const bottom = h - (p.y + mh);
    if (right >= 0 && bottom >= 0) {
      mascot.style.right = right + 'px';
      mascot.style.bottom = bottom + 'px';
      mascot.style.left = 'auto';
      mascot.style.top = 'auto';
    }
  }
  function currentPos() {
    const r = mascot.getBoundingClientRect();
    return { x: r.left, y: r.top };
  }
  function setPos(p) {
    applyPos(p);
  }
  function clampPos(p) {
    const w = window.innerWidth, h = window.innerHeight;
    const mw = 180, mh = 240;
    return {
      x: Math.max(8, Math.min(w - mw - 8, p.x)),
      y: Math.max(8, Math.min(h - mh - 8, p.y))
    };
  }

  /* ============================================================== */
  /* 7. EYE TRACKING                                                */
  /* ============================================================== */
  const EYE_RANGE = 4;
  function onMouseMove(e) {
    if (state.dragging || !mascot) return;
    if (state.mood === 'sad') return;
    const cx = e.clientX, cy = e.clientY;
    const r = mascot.getBoundingClientRect();
    if (r.width === 0) return;
    const fx = r.left + r.width * 0.5;
    const fy = r.top  + r.height * 0.28;
    const range = Math.max(r.width, r.height) * 0.7;
    let dx = (cx - fx) / range;
    let dy = (cy - fy) / range;
    const d = Math.hypot(dx, dy);
    if (d > 1) { dx /= d; dy /= d; }
    state.eyes.x = dx * EYE_RANGE;
    state.eyes.y = dy * EYE_RANGE;
    mascot.style.setProperty('--eye-x', state.eyes.x.toFixed(2) + 'px');
    mascot.style.setProperty('--eye-y', state.eyes.y.toFixed(2) + 'px');
  }
  function setupEyeTracking() {
    if (reduced) return;
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMouseMove(e.touches[0]);
    }, { passive: true });
  }

  /* ============================================================== */
  /* 8. AUTO-BLINK (fixed)                                          */
  /* ============================================================== */
  function setupBlink() {
    if (reduced) return;
    function schedule() {
      const delay = 2400 + Math.random() * 3200;
      setTimeout(() => {
        if (!mascot || mascot.classList.contains('tm-hidden')) { schedule(); return; }
        mascot.classList.add('tm-blinking');
        setTimeout(() => mascot.classList.remove('tm-blinking'), 260);
        if (Math.random() < 0.25) {
          setTimeout(() => {
            if (!mascot) return;
            mascot.classList.add('tm-blinking');
            setTimeout(() => mascot.classList.remove('tm-blinking'), 260);
          }, 380);
        }
        schedule();
      }, delay);
    }
    schedule();
  }

  /* ============================================================== */
  /* 9. SPEECH BUBBLE (fixed — slow + queue + longer visible)       */
  /* ============================================================== */
  let typingTimer = null;
  let visibleTimer = null;
  let currentText = '';
  function showLine(text, opts = {}) {
    if (!mascot || !text) return;
    cancelSpeech();
    state.lastLine = text;
    state.lastOpts = { ...opts };
    bubbleReplay.hidden = false;
    bubbleText.textContent = '';
    bubble.classList.remove('done');
    bubble.classList.add('is-visible', 'is-typing');
    bubbleProgress.style.transition = 'none';
    bubbleProgress.style.width = '0%';
    if (bubbleLabel) bubbleLabel.textContent = opts.label || 'TITAN PRO';
    if (opts.queue && opts.queue.length) {
      bubbleNext.hidden = false;
    } else {
      bubbleNext.hidden = true;
    }
    typeSlowly(text, opts);
  }
  function typeSlowly(text, opts) {
    state.typing = true;
    state.mood = 'greeting';
    const dur = opts.duration || 0;
    // Slow typing: 70ms/char (was 40ms) — much more readable
    const charTime = opts.fast ? 30 : 70;
    const totalType = text.length * charTime;
    // Visible time: min 4s, scales with text length
    const visibleMs = dur > 0 ? dur : Math.max(4000, totalType + 3500);

    let i = 0;
    function step() {
      i++;
      bubbleText.textContent = text.slice(0, i);
      if (i < text.length) {
        typingTimer = setTimeout(step, charTime);
      } else {
        bubble.classList.remove('is-typing');
        bubble.classList.add('done');
        state.typing = false;
        state.mood = 'idle';
        // Auto-hide after visibleMs (always at least 4s after typing finishes)
        const typingElapsed = i * charTime;
        const remaining = Math.max(4000, visibleMs - typingElapsed);
        visibleTimer = setTimeout(() => {
          hideBubble();
          // Process queue
          if (state.queue.length > 0) {
            const nxt = state.queue.shift();
            showLine(nxt, { queue: state.queue, ...state.lastOpts });
          }
        }, remaining);
      }
    }
    typingTimer = setTimeout(step, 100);

    // Progress bar over the total visible time
    requestAnimationFrame(() => {
      bubbleProgress.style.transition = `width ${visibleMs}ms linear`;
      bubbleProgress.style.width = '100%';
    });
  }
  function cancelSpeech() {
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    if (visibleTimer) { clearTimeout(visibleTimer); visibleTimer = null; }
    state.typing = false;
  }
  function hideBubble() {
    if (!bubble) return;
    bubble.classList.remove('is-visible', 'is-typing');
    bubbleNext.hidden = true;
  }
  function nextLine() {
    if (state.queue.length === 0) { hideBubble(); return; }
    const nxt = state.queue.shift();
    showLine(nxt, { queue: state.queue, ...state.lastOpts });
  }
  function replayLast() {
    if (state.lastLine) showLine(state.lastLine, state.lastOpts || {});
  }
  function say(text, opts = {}) {
    state.queue = opts.queue || [];
    showLine(text, opts);
  }
  function speakFromPool(pool, opts = {}) {
    if (state.typing) { state.queue.push(...pool); return; }
    if (state.mood !== 'idle' && !opts.force) { state.queue.push(...pool); return; }
    const text = pool[state.cycleIdx++ % pool.length];
    say(text, { queue: pool.slice(state.cycleIdx % pool.length), duration: opts.duration });
  }

  /* ============================================================== */
  /* 10. MOOD                                                       */
  /* ============================================================== */
  function setMood(m) {
    if (!mascot) return;
    mascot.classList.remove('tm-sad', 'tm-happy', 'tm-celebrate');
    state.mood = m;
  }
  function happy() { setMood('happy'); mascot.classList.add('tm-happy'); }
  function sad()   { setMood('sad');   mascot.classList.add('tm-sad'); }
  function celebrate() {
    setMood('happy');
    mascot.classList.add('tm-happy', 'tm-celebrate');
    setTimeout(() => mascot.classList.remove('tm-celebrate'), 850);
  }

  /* ============================================================== */
  /* 11. POINT-TO                                                   */
  /* ============================================================== */
  let pointTargetEl = null;
  function pointTo(selector, line) {
    if (!mascot) return;
    const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!target) return;
    if (state.mood === 'pointing') clearPointTo();
    state.mood = 'pointing';
    target.classList.add('tm-target-glow');
    pointTargetEl = target;
    if (line) say(line, { queue: LINES.point });
    else say(LINES.point[state.cycleIdx++ % LINES.point.length], { queue: LINES.point });
    setTimeout(() => clearPointTo(), 3500);
  }
  function clearPointTo() {
    if (pointTargetEl) pointTargetEl.classList.remove('tm-target-glow');
    pointTargetEl = null;
    if (state.mood === 'pointing') state.mood = 'idle';
  }

  /* ============================================================== */
  /* 12. FREE-ROAM                                                  */
  /* ============================================================== */
  function pickTarget() {
    const w = window.innerWidth, h = window.innerHeight;
    const pad = 24;
    const minX = pad, maxX = w - 180 - pad;
    const minY = pad, maxY = h - 240 - pad;
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    };
  }
  function pickDomTarget() {
    const candidates = [
      ...document.querySelectorAll('.row[data-handle]'),
      ...document.querySelectorAll('.kpi'),
      ...document.querySelectorAll('.section-title'),
      ...document.querySelectorAll('.btn-refresh')
    ];
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - 90,
      y: r.top + r.height / 2 - 120
    };
  }
  function walkTo(x, y) {
    state.target = clampPos({ x, y });
    state.paused = false;
    mascot.classList.add('walking');
  }
  function stopWalking() {
    state.target = null;
    mascot.classList.remove('walking');
  }
  function tickWalk() {
    if (!mascot) return;
    if (state.dragging) return;
    if (!state.target) {
      if (Date.now() < state.pauseUntil) {
        requestAnimationFrame(tickWalk);
        return;
      }
      if (Math.random() < 0.55) {
        const el = pickDomTarget();
        if (el) {
          const c = centerOf(el);
          if (Math.hypot(c.x - state.pos.x, c.y - state.pos.y) > 80) {
            walkTo(c.x, c.y);
            requestAnimationFrame(tickWalk);
            return;
          }
        }
      }
      const t = pickTarget();
      if (Math.hypot(t.x - state.pos.x, t.y - state.pos.y) > 60) {
        walkTo(t.x, t.y);
      } else {
        state.pauseUntil = Date.now() + 3000 + Math.random() * 4000;
      }
      requestAnimationFrame(tickWalk);
      return;
    }
    const dx = state.target.x - state.pos.x;
    const dy = state.target.y - state.pos.y;
    const dist = Math.hypot(dx, dy);
    const SPEED = state.speed * 1.4;
    if (dist < SPEED) {
      setPos(state.target);
      stopWalking();
      onArrive();
      state.pauseUntil = Date.now() + 2500 + Math.random() * 3500;
      requestAnimationFrame(tickWalk);
      return;
    }
    const nx = state.pos.x + (dx / dist) * SPEED;
    const ny = state.pos.y + (dy / dist) * SPEED;
    state.pos = { x: nx, y: ny };
    applyPos(state.pos);
    requestAnimationFrame(tickWalk);
  }
  function onArrive() {
    const cx = state.pos.x + 90;
    const cy = state.pos.y + 120;
    const el = document.elementFromPoint(cx, cy);
    if (el) readElement(el);
  }
  function readElement(el) {
    if (!el) return;
    const kpi = el.closest('.kpi');
    if (kpi) {
      const v = kpi.querySelector('.value')?.textContent?.trim();
      const l = kpi.querySelector('.label')?.textContent?.trim();
      if (v && l) {
        const lines = [
          `KPI ${l}: ${v}. ${commentOnKpi(l, v)}`,
          `${l} tuh ${v}. ${commentOnKpi(l, v)}`,
          `Ini ${v} di ${l}. ${commentOnKpi(l, v)}`
        ];
        say(lines[Math.floor(Math.random() * lines.length)], { duration: 5500, label: 'DATA' });
        return;
      }
    }
    const row = el.closest('.row[data-handle]');
    if (row) {
      const h = row.getAttribute('data-handle') || row.querySelector('.handle')?.textContent?.trim();
      if (h) say(`Akun @${h.replace('@','')}. Mau lihat detailnya?`, { duration: 4500, label: 'AKUN' });
      return;
    }
    const sect = el.closest('.section');
    if (sect) {
      const t = sect.querySelector('.section-title')?.textContent?.trim();
      if (t) say(`Section ${t}. Scroll buat lihat isinya.`, { duration: 4000, label: 'SECTION' });
      return;
    }
    if (el.id === 'refreshBtn' || el.closest('#refreshBtn')) {
      say('Tombol refresh! Pencet untuk ambil data terbaru.', { duration: 4000, label: 'CTA' });
    }
  }
  function commentOnKpi(label, value) {
    const v = value.toLowerCase();
    if (/^\d+(\.\d+)?[km%]?$/.test(value)) {
      if (label.toLowerCase().includes('engagement')) {
        const num = parseFloat(v);
        if (num >= 5) return `Bagus banget, di atas rata-rata!`;
        if (num >= 3) return `Lumayan, bisa di-improve.`;
        return `Agak rendah nih, coba bikin konten yang lebih engaging.`;
      }
      if (label.toLowerCase().includes('follower')) {
        if (v.includes('k') || v.includes('m')) return `Followersnya udah solid!`;
        return `Masih tahap growth nih, semangat!`;
      }
    }
    return 'Menarik nih datanya.';
  }

  /* ============================================================== */
  /* 13. Q&A CHAT — SMART PATTERN MATCHER                           */
  /* ============================================================== */
  function openChat() {
    if (!chat) buildChat();
    if (state.chatOpen) return;
    state.chatOpen = true;
    localStorage.setItem(CHAT_KEY, '1');
    // Position: top-right, below the mascot
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w < 768) {
      chat.style.left = '4vw';
      chat.style.right = '4vw';
      chat.style.bottom = '8px';
      chat.style.top = 'auto';
    } else {
      chat.style.right = '20px';
      chat.style.bottom = '280px';
      chat.style.left = 'auto';
      chat.style.top = 'auto';
    }
    chat.classList.add('is-open');
    if (chatBody && chatBody.children.length === 0) {
      pushMsg('mascot', greetingForChat());
    }
    chatTextarea?.focus();
  }
  function closeChat() {
    state.chatOpen = false;
    localStorage.setItem(CHAT_KEY, '0');
    chat.classList.remove('is-open');
  }
  function pushMsg(role, text) {
    if (!chatBody) return;
    const m = document.createElement('div');
    m.className = 'titan-msg ' + role;
    m.textContent = text;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function greetingForChat() {
    const path = location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
    if (path === 'index.html' || path === '' || (path === 'index.html')) {
      return "Hai! Aku Titan. Tanya aku soal akun di sini, atau klik salah satu quick prompt di bawah.";
    }
    return "Hai! Aku Titan. Tanya aku soal akun ini, atau klik quick prompt di bawah.";
  }
  function handleUserQuestion(q) {
    pushMsg('user', q);
    // Show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'titan-msg mascot typing';
    typingEl.textContent = 'Titan mikir';
    chatBody.appendChild(typingEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    // Delay for "thinking" feel
    setTimeout(() => {
      typingEl.remove();
      const ans = answerQuestion(q);
      pushMsg('mascot', ans);
      // Also say it via bubble
      say(ans, { duration: 6000, label: 'JAWAB' });
    }, 700 + Math.random() * 500);
  }
  function answerQuestion(q) {
    const ql = q.toLowerCase().trim();
    // 1) Greeting / how-are-you
    if (/^(halo|hai|hello|hi|hey|apa kabar|assalamualaikum)/.test(ql)) {
      return pick([
        "Halo! Aku siap. Mau tau apa soal data di sini?",
        "Hai! Lagi apa? Aku standby.",
        "Halo! Yuk intip data bareng."
      ]);
    }
    // 2) Engagement Rate
    if (/(engagement|\ber\b|er\?|er akun|er-nya|er nya)/.test(ql)) {
      const er = findKpi('engagement');
      if (er) {
        return `Engagement rate akun ini: ${er}. ${erComment(er)} Mau tau lebih detail soal ER?`;
      }
      return "Engagement rate adalah persentase interaksi (likes+comments+shares) dibagi followers. Di atas 3% udah bagus, di atas 5% excellent.";
    }
    // 3) Followers
    if (/(follower|followers|ikut|pengikut|jumlah pengikut)/.test(ql)) {
      const f = findKpi('follower');
      if (f) {
        return `Followers akun ini: ${f}. ${fComment(f)} Mau tau growth rate-nya?`;
      }
      return "Followers adalah jumlah orang yang mengikuti akun. Kunci pertumbuhannya: konten konsisten + engagement + niche yang jelas.";
    }
    // 4) Views / tayangan
    if (/(view|tayang|tayangan|jangkauan|reach|impression)/.test(ql)) {
      const v = findKpi('tayangan') || findKpi('view');
      if (v) {
        return `Total tayangan: ${v}. ${vComment(v)}`;
      }
      return "Tayangan = jumlah kali konten dilihat. Untuk Akun kreator, target rata-rata per video 1K-10K udah solid.";
    }
    // 5) Best / top / viral
    if (/(terbaik|teratas|konten terbaik|post teratas|viral|populer|top)/.test(ql)) {
      const top = document.querySelectorAll('.top-table tbody tr td .num, .post-title, .post-link');
      if (top.length) {
        return "Konten teratas biasanya yang views-nya paling tinggi. Cek section 'Post Teratas' di halaman ini — biasanya ada 10 teratas.";
      }
      return "Konten teratas di halaman ini ada di section 'Post Teratas' / 'Top Posts'. Scroll ke bawah untuk lihat.";
    }
    // 6) Account info
    if (/(akun ini|akun siapa|profil|username|niche|@)/.test(ql)) {
      const handle = document.querySelector('h1, .profile-handle, [data-handle]')?.textContent?.trim();
      const nicheRow = findKv('Niche');
      if (handle) {
        return `Akun: ${handle}.${nicheRow ? ` Niche: ${nicheRow}.` : ''} Mau tau detail engagement-nya?`;
      }
    }
    // 7) About this page
    if (/(halaman ini|page ini|web ini|about|tentang)/.test(ql)) {
      return "Halaman ini nunjukin analytics detail akun TikTok/Instagram: profil, post teratas, demografi, engagement. Aku bisa jelasin section manapun.";
    }
    // 8) Help
    if (/(bantu|bisa|fitur|kemampuan|apa yang bisa|fungsi)/.test(ql)) {
      return "Aku bisa: jelasin KPI (ER, followers, views), baca data akun, kasih insight per section, dan rekomend. Tanya aja, atau klik quick prompt.";
    }
    // 9) How to grow
    if (/(cara|tips|trik|gimana|strategi|naikin|tumbuh|growth)/.test(ql)) {
      return "Strategi: 1) Konten konsisten 2-3x/minggu 2) Hook 1 detik pertama yang menarik 3) Balas semua komentar 4) Kolaborasi sama kreator se-niche 5) Pantau analytics & iterate.";
    }
    // 10) Refresh
    if (/(refresh|update|segarkan)/.test(ql)) {
      const btn = document.getElementById('refreshBtn');
      if (btn) {
        btn.click();
        return "Data sedang diperbarui. Tunggu sebentar ya.";
      }
      return "Pencet R untuk refresh, atau klik tombol refresh di pojok kanan atas.";
    }
    // 11) Specific KPI
    const k = findKpiByQuery(ql);
    if (k) {
      return `${k.label}: ${k.value}. Mau konteks lebih lanjut?`;
    }
    // 12) What is / explain
    if (/^(apa itu|jelaskan|arti|definisi|meaning)/.test(ql)) {
      if (/kpi/.test(ql)) return "KPI = Key Performance Indicator. Metrik yang nunjukin performa akun: followers, views, engagement, dll.";
      if (/niche/.test(ql)) return "Niche = topik spesifik yang jadi fokus konten. Misal: properti, komedi, fashion, berita lokal.";
      if (/engagement/.test(ql)) return "Engagement = interaksi user (likes+comments+shares+saves). Dihitung per-follower = ER%.";
    }
    // 13) General fallback
    return pick([
      "Hmm, aku belum ngerti pertanyaannya. Coba tanya soal KPI, followers, ER, atau strategi konten.",
      "Bisa tolong jelasin lebih spesifik? Misal 'ER akun ini berapa?' atau 'Followers-nya berapa?'",
      "Aku bisa bantu jelasin data di halaman ini. Coba tanya 'KPI terbaik?' atau 'Jelaskan halaman ini'."
    ]);
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function findKpi(labelPart) {
    const kpis = document.querySelectorAll('.kpi');
    for (const k of kpis) {
      const l = k.querySelector('.label')?.textContent?.trim()?.toLowerCase() || '';
      if (l.includes(labelPart.toLowerCase())) {
        return k.querySelector('.value')?.textContent?.trim();
      }
    }
    return null;
  }
  function findKpiByQuery(ql) {
    const kpis = document.querySelectorAll('.kpi');
    for (const k of kpis) {
      const l = k.querySelector('.label')?.textContent?.trim()?.toLowerCase() || '';
      if (ql.includes(l.split(' ')[0])) {
        return { label: k.querySelector('.label')?.textContent?.trim(), value: k.querySelector('.value')?.textContent?.trim() };
      }
    }
    return null;
  }
  function findKv(key) {
    const rows = document.querySelectorAll('.kv tr, table tr');
    for (const r of rows) {
      const k = r.querySelector('td:first-child, .k')?.textContent?.trim();
      if (k && k.toLowerCase() === key.toLowerCase()) {
        return r.querySelector('td:last-child, td:nth-child(2)')?.textContent?.trim();
      }
    }
    return null;
  }
  function erComment(er) {
    const n = parseFloat(er);
    if (isNaN(n)) return '';
    if (n >= 5) return 'Di atas rata-rata industri (3%). Performa excellent!';
    if (n >= 3) return 'Lumayan, di atas rata-rata. Bisa di-improve ke 5%+ dengan konten yang lebih engaging.';
    return 'Agak rendah. Coba bikin CTA yang lebih kuat + hook 1 detik pertama yang menarik.';
  }
  function fComment(f) {
    if (typeof f !== 'string') return '';
    if (/[km]$/i.test(f)) return 'Base followers udah solid. Fokus sekarang: retensi & growth rate.';
    if (parseInt(f) < 1000) return 'Masih tahap growth. Konten konsisten + kolab = kunci.';
    return 'Followers stabil. Cek engagement rate untuk tau kualitas audiens.';
  }
  function vComment(v) {
    if (typeof v !== 'string') return '';
    if (/[km]$/i.test(v) || /[km]\b/i.test(v)) return 'Tayangan tinggi — kontennya menarik.';
    return 'Terus naikkan impressions lewat hashtag + jam upload yang tepat.';
  }

  /* ============================================================== */
  /* 14. TUTORIAL                                                   */
  /* ============================================================== */
  function runTutorial() {
    if (state.tutorialDone) return;
    const path = (location.pathname.replace(/^\/|\/$/g, '') || 'index.html').toLowerCase();
    const isHome = path === 'index.html' || path === '';
    const steps = [];
    if (isHome) {
      const firstRow = document.querySelector('[data-handle]');
      const refresh = document.getElementById('refreshBtn');
      steps.push({ text: "Hai! Aku Titan, analis AI-mu 👋 Klik akun di bawah untuk lihat detail.", label: 'TUTORIAL' });
      if (firstRow) steps.push({ selector: firstRow, text: "Coba klik salah satu akun untuk lihat analytics lengkap.", label: 'STEP 1' });
      if (refresh) steps.push({ selector: refresh, text: "Pencet R atau klik refresh untuk ambil data terbaru.", label: 'STEP 2' });
      steps.push({ text: "Mau tanya apa aja? Klik tombol ? di maskot, atau pencet ? di keyboard.", label: 'STEP 3' });
    } else {
      const kpi = document.querySelector('.kpi');
      const firstSection = document.querySelector('.section-title');
      steps.push({ text: "Selamat datang! Aku Titan. Aku bakal bantu kamu jelajah halaman ini.", label: 'TUTORIAL' });
      if (kpi) steps.push({ selector: kpi, text: "Ini KPI utama. Hover aku di salah satu buat aku baca angkanya.", label: 'STEP 1' });
      if (firstSection) steps.push({ selector: firstSection, text: "Gulir ke bawah untuk lihat analisis lengkap per section.", label: 'STEP 2' });
      steps.push({ text: "Atau klik ? di maskot untuk tanya spesifik. Misal: 'ER akun ini berapa?'", label: 'STEP 3' });
    }
    let i = 0;
    function next() {
      if (i >= steps.length) {
        localStorage.setItem(TUTOR_KEY, '1');
        state.tutorialDone = true;
        return;
      }
      const s = steps[i++];
      if (s.selector) pointTo(s.selector, s.text);
      else say(s.text, { duration: 6000, label: s.label });
      setTimeout(next, 7500);
    }
    setTimeout(next, 3000);
  }

  /* ============================================================== */
  /* 15. SCROLL REPORTER                                            */
  /* ============================================================== */
  function setupScrollReporter() {
    if (reduced) return;
    let lastReport = 0;
    let lastScrollY = window.scrollY;
    let docHeight = 0;
    function recompute() {
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    }
    recompute();
    window.addEventListener('resize', recompute);
    let raf = null;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const cur = window.scrollY;
        const dir = cur - lastScrollY;
        if (Math.abs(dir) > 40) {
          const pct = docHeight > 0 ? Math.round((cur / docHeight) * 100) : 0;
          if (Date.now() - lastReport > 10000 && state.mood === 'idle' && !state.typing) {
            if (pct >= 25 && pct < 35) {
              say(`Kamu udah di ${pct}% halaman. Lanjut!`, { duration: 3500, label: 'PROGRESS' });
              lastReport = Date.now();
            } else if (pct >= 55 && pct < 65) {
              say(`Hampir setengah jalan! ${pct}% done.`, { duration: 3500, label: 'PROGRESS' });
              lastReport = Date.now();
            } else if (pct >= 85) {
              say(`Wow, ${pct}%! Hampir selesai!`, { duration: 3500, label: 'PROGRESS' });
              lastReport = Date.now();
            }
          }
        }
        lastScrollY = cur;
      });
    }, { passive: true });
  }

  /* ============================================================== */
  /* 16. DRAGGING                                                   */
  /* ============================================================== */
  function setupDrag() {
    if (reduced) return;
    let startX, startY, origX, origY, didDrag = false;
    function onDown(e) {
      if (e.target.closest('button')) return;
      if (e.button !== undefined && e.button !== 0) return;
      const pt = pointerXY(e);
      startX = pt.x; startY = pt.y;
      const r = mascot.getBoundingClientRect();
      origX = r.left; origY = r.top;
      mascot.classList.add('dragging');
      state.dragging = true;
      stopWalking();
      mascot.setPointerCapture?.(e.pointerId);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
      window.addEventListener('pointercancel', onUp, { once: true });
    }
    function onMove(e) {
      const pt = pointerXY(e);
      const dx = pt.x - startX, dy = pt.y - startY;
      if (!didDrag && Math.hypot(dx, dy) > 6) didDrag = true;
      if (!didDrag) return;
      mascot.style.transition = 'none';
      mascot.style.left = (origX + dx) + 'px';
      mascot.style.top  = (origY + dy) + 'px';
      mascot.style.right = 'auto';
      mascot.style.bottom = 'auto';
    }
    function onUp() {
      mascot.classList.remove('dragging');
      state.dragging = false;
      window.removeEventListener('pointermove', onMove);
      const r = mascot.getBoundingClientRect();
      state.pos = { x: r.left, y: r.top };
      savePos(state.pos);
      if (didDrag) {
        happy();
        const lines = [
          "Oke, aku di sini ya!",
          "Hati-hati ya, jangan jatuhkan aku 😅",
          "Mantap! Posisiku tersimpan.",
          "Wkwk, mau ditaruh dimana nih?"
        ];
        say(lines[Math.floor(Math.random() * lines.length)], { duration: 3500 });
      }
      setTimeout(() => { mascot.style.transition = ''; }, 50);
    }
    function pointerXY(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    mascot.addEventListener('pointerdown', onDown);
    mascot.addEventListener('touchstart', onDown, { passive: true });
  }

  /* ============================================================== */
  /* 17. AWAY / IDLE                                                */
  /* ============================================================== */
  function setupAway() {
    let away = false;
    function leave() {
      if (away) return;
      away = true;
      sad();
      say("Kok pergi? Aku nunggu ya...", { duration: 3000 });
    }
    function back() {
      if (!away) return;
      away = false;
      happy();
      say("Aku balik! Lagi ngapain?", { duration: 3000 });
    }
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', back);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) leave(); else back();
    });
  }
  function setupIdleChatter() {
    function schedule() {
      const delay = 30000 + Math.random() * 30000;
      setTimeout(() => {
        if (!mascot || mascot.classList.contains('tm-hidden')) { schedule(); return; }
        if (state.chatOpen) { schedule(); return; }
        if (state.mood === 'idle' && !state.typing && !state.dragging) {
          const groups = [LINES.curious, LINES.hype, LINES.sleepy];
          speakFromPool(groups[state.cycleIdx++ % groups.length]);
        }
        schedule();
      }, delay);
    }
    schedule();
  }

  /* ============================================================== */
  /* 18. ROW HOVER REACTIONS                                        */
  /* ============================================================== */
  function setupReactions() {
    document.addEventListener('mouseover', (e) => {
      const card = e.target.closest('[data-handle]');
      if (card) reactToCard(card);
      const cta = e.target.closest('[data-cta], .btn-refresh');
      if (cta && !card) ctaReaction(cta);
    });
    document.addEventListener('focusin', (e) => {
      const card = e.target.closest('[data-handle]');
      if (card) reactToCard(card);
    });
  }
  function reactToCard(card) {
    if (state.mood !== 'idle' && state.mood !== 'happy') return;
    const handle = card.getAttribute('data-handle') || '';
    const platform = card.getAttribute('data-platform') || '';
    const path = (location.pathname.replace(/^\/|\/$/g, '') || 'index.html').toLowerCase();
    const subLines = LINES.subpage[path];
    let line;
    if (subLines && Math.random() < 0.6) {
      line = subLines[Math.floor(Math.random() * subLines.length)];
    } else {
      const base = platform === 'tiktok' || platform === 'tt'
        ? "TikTok performanya lagi bagus. Tengok deh."
        : platform === 'instagram' || platform === 'ig'
          ? "Instagram-nya verified — kualitasnya terjaga."
          : "Akun ini menarik banget.";
      line = handle ? base.replace('akun ini', `@${handle}`) : base;
    }
    happy();
    say(line, { duration: 4500, label: 'AKUN' });
    setMood('idle');
  }
  function ctaReaction(cta) {
    if (state.mood !== 'idle') return;
    if (cta.id === 'refreshBtn') {
      const lines = ["Tekan R untuk refresh!", "Pencet aku untuk ambil data baru.", "Refresh?"];
      say(lines[Math.floor(Math.random() * lines.length)], { duration: 3000, label: 'CTA' });
    }
  }

  /* ============================================================== */
  /* 19. R-KEY + ?-KEY                                              */
  /* ============================================================== */
  function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const btn = document.getElementById('refreshBtn');
        if (btn) {
          say("Menyegarkan data…", { duration: 1500, label: 'REFRESH' });
          setTimeout(() => {
            if (Math.random() < 0.8) {
              celebrate();
              say("Data berhasil diperbarui! ✨", { duration: 3500, label: 'SUCCESS' });
            } else {
              sad();
              say("Waduh, kayaknya ada masalah...", { duration: 3500, label: 'ERROR' });
            }
          }, 1200);
        }
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (state.chatOpen) closeChat(); else openChat();
      }
    });
  }

  /* ============================================================== */
  /* 20. CLICK ON MASCOT                                            */
  /* ============================================================== */
  function setupClick() {
    mascot.addEventListener('click', (e) => {
      if (state.dragging) return;
      if (e.target.closest('button')) return;
      e.stopPropagation();
      const groups = [LINES.curious, LINES.hype, LINES.sleepy];
      happy();
      speakFromPool(groups[state.cycleIdx++ % groups.length], { force: true });
    });
  }

  /* ============================================================== */
  /* 21. UPGRADE BRAND MARKS                                        */
  /* ============================================================== */
  function upgradeBrandMarks() {
    document.querySelectorAll('.brand-mark').forEach((el) => {
      const use = el.querySelector('use');
      if (use) {
        const href = use.getAttribute('href') || '';
        if (/#titan-(orb-sm|bot-sm|mark-sm|orb|bot|mark)/.test(href)) {
          use.setAttribute('href', '#titan-face');
        }
      }
    });
    document.querySelectorAll('.profile-mark').forEach((el) => {
      const use = el.querySelector('use');
      if (use) {
        const href = use.getAttribute('href') || '';
        if (/#titan-(mark|orb|bot)/.test(href)) {
          use.setAttribute('href', '#titan-face');
        }
      }
    });
    document.querySelectorAll('.hero-mascot').forEach((el) => {
      const use = el.querySelector('use');
      if (use) {
        const href = use.getAttribute('href') || '';
        if (/#titan-(orb|bot|mark)/.test(href)) {
          use.setAttribute('href', '#titan-face');
        }
      }
    });
  }

  /* ============================================================== */
  /* 22. INIT                                                        */
  /* ============================================================== */
  function init() {
    injectSprite();
    injectStyles();
    buildMascot();
    buildChat();
    upgradeBrandMarks();

    // Position
    state.pos = loadPos() || defaultPos();
    state.pos = clampPos(state.pos);
    applyPos(state.pos);

    setupEyeTracking();
    setupBlink();
    setupDrag();
    setupAway();
    setupIdleChatter();
    setupReactions();
    setupHotkeys();
    setupClick();
    setupScrollReporter();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mascot.classList.remove('tm-hidden');
        setTimeout(() => mascot.classList.remove('tm-entering'), 900);

        if (!state.greeted) {
          state.greeted = true;
          sessionStorage.setItem(GREET_KEY, '1');
          setTimeout(() => {
            say(LINES.greet[0], { queue: LINES.greet.slice(1), duration: 8000, label: 'GREETING' });
            setTimeout(() => runTutorial(), 8500);
          }, 1500);
        } else {
          setTimeout(() => {
            say(LINES.greet[state.cycleIdx++ % LINES.greet.length], { duration: 5000, label: 'WELCOME' });
          }, 1000);
        }
        state.pauseUntil = Date.now() + 2500;
        requestAnimationFrame(tickWalk);
      });
    });

    window.addEventListener('resize', () => {
      // On mobile, mascot uses fixed bottom/right via CSS — no need to reposition
    });
  }

  /* ============================================================== */
  /* 23. PUBLIC API                                                  */
  /* ============================================================== */
  window.TitanMascot = {
    say, happy, sad, celebrate, pointTo,
    openChat, closeChat,
    walkTo(x, y) {
      const t = typeof x === 'number' ? { x, y } : x;
      walkTo(t.x, t.y);
    },
    spin() {
      if (!mascot || reduced) return;
      const grp = mascot.querySelector('.tm-bot-grp');
      if (grp) {
        grp.style.transition = 'transform 700ms linear';
        grp.style.transform = 'rotate(360deg)';
        setTimeout(() => { grp.style.transition = ''; grp.style.transform = ''; }, 750);
      }
    },
    hide() { mascot.classList.add('tm-hidden'); stopWalking(); },
    show() { mascot.classList.remove('tm-hidden'); state.pauseUntil = Date.now(); requestAnimationFrame(tickWalk); },
    get mood() { return state.mood; },
    get pos() { return { ...state.pos }; },
    ask(q) { openChat(); setTimeout(() => handleUserQuestion(q), 200); },
    dispose() {
      mascot?.remove();
      chat?.remove();
      document.getElementById('tm-sprite')?.remove();
      document.getElementById('tm-style')?.remove();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
