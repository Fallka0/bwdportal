var INIT = /*INIT*/{"theme": "light", "w": 1440, "h": 900, "page": "home"}/*END*/;
/* bwd Portal sample data: Monday 26 October 2026, 10:20, class IM24b */
var ME = { name: 'Selin Hofer', first: 'Selin', ini: 'SH', cls: 'IM24b', mail: 'selin.hofer@bwdbern.ch', lead: 'R. Keller', prog: 'Informatikmittelschule mit BM Wirtschaft' };
var T = [['1', '08:00', '08:45'], ['2', '08:50', '09:35'], ['3', '09:55', '10:40'], ['4', '10:45', '11:30'], ['5', '11:35', '12:20'], ['6', '13:15', '14:00'], ['7', '14:05', '14:50'], ['8', '15:05', '15:50']];
var S = { SOL: 'SOL', MA: 'Mathematik', DE: 'Deutsch', EN: 'Englisch', FR: 'Französisch', FRW: 'Finanz- und Rechnungswesen', WR: 'Wirtschaft und Recht', GP: 'Geschichte und Politik', IN: 'Informatik', NW: 'Naturwissenschaften', SP: 'Sport' };
var SH = { SOL: 'SOL', MA: 'Mathe', DE: 'Deutsch', EN: 'Englisch', FR: 'Franz', FRW: 'FRW', WR: 'W&R', GP: 'G&P', IN: 'Informatik', NW: 'NW', SP: 'Sport' };
/* week: per day, 8 slots: [subject, room, teacher, state, note] */
var WEEK = [
  { d: 'Mo', n: '26', today: true, s: [['MA', 'A 304', 'KEL', 'past'], ['MA', 'A 304', 'KEL', 'past'], ['EN', 'B 112', 'MOR', 'now'], ['WR', 'B 015', 'BRU', 'chg', 'statt A 207'], ['WR', 'B 015', 'BRU', 'chg', 'statt A 207'], ['DE', 'A 101', 'MAE', 'off'], ['FR', 'A 210', 'DUP'], null] },
  { d: 'Di', n: '27', s: [['IN', 'C 02', 'SCH'], ['IN', 'C 02', 'SCH'], ['FRW', 'A 207', 'BRU'], ['FRW', 'A 207', 'BRU'], ['GP', 'A 101', 'WEB'], null, ['SP', 'Halle 2', 'ZUR'], ['SP', 'Halle 2', 'ZUR']] },
  { d: 'Mi', n: '28', s: [['DE', 'A 101', 'MAE'], ['DE', 'A 101', 'MAE'], ['NW', 'L 3', 'GRA'], ['NW', 'L 3', 'GRA'], ['EN', 'B 112', 'MOR'], null, null, null] },
  { d: 'Do', n: '29', s: [['FR', 'A 210', 'DUP'], ['MA', 'A 304', 'KEL'], ['MA', 'A 304', 'KEL'], ['WR', 'A 207', 'BRU'], ['GP', 'A 101', 'WEB'], ['IN', 'C 02', 'SCH'], ['IN', 'C 02', 'SCH'], null] },
  { d: 'Fr', n: '30', sol: true, s: [['SOL', 'SOL-Tag', ''], ['SOL', 'SOL-Tag', ''], ['SOL', 'SOL-Tag', ''], ['SOL', 'SOL-Tag', ''], ['SOL', 'SOL-Tag', ''], ['SOL', 'SOL-Tag', ''], ['SOL', 'SOL-Tag', ''], null] },
];
var SUBJ = [
  { k: 'IN', avg: 5.6, n: 4, t: 'B. Schneider' }, { k: 'EN', avg: 5.4, n: 3, t: 'J. Moret' }, { k: 'DE', avg: 5.2, n: 3, t: 'C. Mäder' },
  { k: 'GP', avg: 5.1, n: 2, t: 'L. Weber' }, { k: 'FRW', avg: 5.0, n: 3, t: 'T. Brunner' }, { k: 'WR', avg: 4.8, n: 3, t: 'T. Brunner' },
  { k: 'MA', avg: 4.6, n: 3, t: 'R. Keller' }, { k: 'FR', avg: 4.3, n: 2, t: 'A. Dupont' }, { k: 'NW', avg: 3.8, n: 2, t: 'S. Graf' }
];
var RECENT = [['EN', 'Unit 4 Test', '22.10.', 5.5], ['MA', 'Funktionen', '20.10.', 4.5], ['NW', 'Zellbiologie', '16.10.', 3.5]];
var EXAMS = [['Funktionen', 'Di 20.10.2026', 4.5, 1, 4.4], ['Gleichungssysteme', 'Di 22.09.2026', 5.0, 1, 4.7], ['Prozentrechnen', 'Di 01.09.2026', 4.0, 0.5, 4.1]];
var ABS = [
  { d: '22', m: 'Okt', w: 'Do 22.10.', l: '2 Lektionen', subj: 'Französisch, Mathematik', st: 'open', note: 'bis 5.11. entschuldigen' },
  { d: '19', m: 'Okt', w: 'Mo 19.10.', l: '1 Lektion', subj: 'Englisch', st: 'open', note: 'bis 2.11. entschuldigen' },
  { d: '09', m: 'Okt', w: 'Fr 09.10.', l: '4 Lektionen', subj: 'Vormittag', st: 'ok', note: 'Krankheit' },
  { d: '29', m: 'Sep', w: 'Di 29.09.', l: '1 Lektion', subj: 'Sport', st: 'err', note: 'Frist verpasst' },
  { d: '16', m: 'Sep', w: 'Mi 16.09.', l: '2 Lektionen', subj: 'Deutsch', st: 'ok', note: 'Arzttermin' }
];
var AST = { open: ['warn', 'Offen'], ok: ['ok', 'Entschuldigt'], err: ['err', 'Unentschuldigt'], sent: ['info', 'In Prüfung'] };
var DOCS = [
  { g: 'Prüfungspläne', items: [['Prüfungsplan 1. Semester 2026/27', 'PDF', '240 KB', 'aktualisiert 20.10.2026', true], ['Prüfungsplan BM-Abschluss 2027', 'PDF', '180 KB', '01.09.2026']] },
  { g: 'Formulare', items: [['Urlaubsgesuch', 'PDF', '90 KB', 'zum Ausfüllen'], ['Gesuch um Dispensation', 'PDF', '110 KB', 'zum Ausfüllen'], ['Arztzeugnis Vorlage', 'PDF', '60 KB', '']] },
  { g: 'Reglemente', items: [['Absenzenreglement', 'PDF', '320 KB', 'gültig ab 1.8.2026'], ['Promotionsreglement BM', 'PDF', '410 KB', ''], ['Hausordnung', 'PDF', '150 KB', '']] },
  { g: 'Merkblätter', items: [['Merkblatt Nachprüfungen', 'PDF', '120 KB', ''], ['WLAN und Drucken', 'PDF', '200 KB', '']] }
];
/* school service URLs come from deployment config. PLACEHOLDERS except bwdbern.ch: confirm with the school before launch */
var URL = { sharepoint: 'https://bwdbern.sharepoint.com/sites/sol/', moodle: 'https://moodle.bwdbern.ch/', untis: 'https://bwd-bern.webuntis.com/', mediothek: 'https://www.bwdbern.ch/mediothek' };
var LINKS = [
  { g: 'Microsoft 365', items: [['Ou', 'Outlook', 'E-Mail und Kalender', '', 'https://outlook.office.com/mail/'], ['Te', 'Teams', 'Klassen-Teams und Chats', '', 'https://teams.microsoft.com/'], ['OD', 'OneDrive', 'Deine Dateien', '', 'https://www.office.com/launch/onedrive'], ['ON', 'OneNote', 'Notizbücher', '', 'https://www.onenote.com/notebooks']] },
  { g: 'Lernen', items: [['Mo', 'Moodle', 'Kurse und Abgaben', 'l2', URL.moodle]] },
  { g: 'Schule', items: [['Un', 'WebUntis', 'Stundenplan im Original', 'l2', URL.untis], ['bw', 'bwdbern.ch', 'Website der Schule', 'l2', 'https://www.bwdbern.ch/'], ['Me', 'Mediothek', 'Bücher und Medien', 'l2', URL.mediothek]] }
];
/* SOL: Aufträge per Block, Kalender for SOL-Tage, Portfolio with check-in and check-out */
var SOLT = {
  MA: ['R. Keller', [['3.01', 'Repetition Terme II', 90, 100], ['3.02', 'Lineare Optimierung I', 45, 50], ['3.03', 'Lineare Optimierung II', 45, 0], ['3.04', 'Lineare Optimierung III', 45, 0]]],
  EN: ['J. Moret', [['3.01', 'Listening', 45, 100], ['3.02', 'Reading and Use of English', 70, 0], ['3.03', 'Writing Part 2: Article', 50, 0], ['3.04', 'Speaking', 60, 0]]],
  DE: ['C. Mäder', [['3.01', 'Erörterung: Aufbau', 60, 0], ['3.02', 'Argumente belegen', 45, 0], ['3.03', 'Kurzgeschichte analysieren', 90, 0]]],
  FRW: ['T. Brunner', [['3.01', 'Kontenrahmen KMU', 60, 30], ['3.02', 'Abschreibungen', 45, 0]]],
  WR: ['T. Brunner', [['3.01', 'Kaufvertrag', 90, 0]]],
  FR: ['A. Dupont', [['3.01', 'Compréhension orale', 45, 0]]]
};
var PLAN = [['08:00', '08:45', 'MA', '3.02', 'Lineare Optimierung I'], ['08:50', '09:35', 'MA', '3.03', 'Lineare Optimierung II'], ['09:45', '10:55', 'EN', '3.02', 'Reading and Use of English'], ['11:00', '12:00', 'DE', '3.01', 'Erörterung: Aufbau'], ['13:00', '13:50', 'EN', '3.03', 'Writing Part 2: Article'], ['14:00', '15:30', 'WR', '3.01', 'Kaufvertrag'], ['15:40', '16:25', 'FRW', '3.02', 'Abschreibungen']];
var TEACH = [[0, 'Keller', 'MA', '08:00', '09:40'], [0, 'Keller', 'MA', '14:20', '16:55'], [1, 'Moret', 'EN', '08:00', '09:40'], [1, 'Moret', 'EN', '10:50', '12:00'], [2, 'Mäder', 'DE', '08:00', '10:40'], [2, 'Brunner', 'WR', '13:00', '14:10'], [3, 'Dupont', 'FR', '09:55', '11:35'], [3, 'Brunner', 'FRW', '14:20', '16:55']];
var PF = [
  { d: 'Freitag, 16. Oktober', ci: 'Deutsch 3.01 am Morgen, danach Mathe 3.01 und am Nachmittag Englisch Listening. Handy bleibt im Schliessfach.', co: 'Mathe und Englisch fertig, Deutsch nur halb. Am Nachmittag war ich weniger konzentriert. Nächstes Mal die schweren Fächer am Morgen.' },
  { d: 'Freitag, 18. September', ci: 'WR 2.01 und 2.02, dazu FRW Übungen. Nach jedem Auftrag kurz Pause.', co: 'WR erledigt, FRW angefangen. Kurze Pausen helfen, ein Platzwechsel am Nachmittag auch.' }
];
var NEWS = [
  { id: 'pp', t: 'Prüfungsplan 1. Semester ist online', p: 'Alle Prüfungstermine bis Ende Januar. Bitte kontrolliere deine Klasse und melde Überschneidungen bis 6. November.', d: '20.10.2026', who: 'Schulleitung', pin: true, unread: true },
  { id: 'ia', t: 'Informationsabend BM 2 am 5. November', p: 'Für alle, die nach der Lehre die BM 2 machen möchten. 18:30 in der Aula, Anmeldung nicht nötig.', d: '19.10.2026', who: 'BM-Abteilung', unread: true },
  { id: 'me', t: 'Mensa: neue Öffnungszeiten ab November', p: 'Die Mensa öffnet neu um 07:15 und ist am Mittwochnachmittag geschlossen.', d: '16.10.2026', who: 'Hausdienst' },
  { id: 'sp', t: 'Herbstsporttag: Anmeldung bis 30. Oktober', p: 'Wähle dein Angebot im Formular. Ohne Anmeldung wirst du einer Gruppe zugeteilt.', d: '14.10.2026', who: 'Fachschaft Sport' }
];
var NOTES = [
  { day: 'Heute', items: [['swap', 'warn', 'Raumänderung', 'Wirtschaft und Recht, 4. und 5. Lektion in B 015 statt A 207', '09:45', true], ['cancel', 'warn', 'Lektion entfällt', 'Deutsch heute 13:15 bei C. Mäder', '07:20', true]] },
  { day: 'Gestern', items: [['chart', 'ok', 'Neue Note in Englisch', 'Unit 4 Test: 5.5', '18:02', true]] },
  { day: 'Diese Woche', items: [['clock', 'warn', 'Absenz entschuldigen', 'Do 22.10., 2 Lektionen, bis 5.11.', 'Fr 23.10.', false], ['megaphone', 'info', 'Neue Mitteilung', 'Prüfungsplan 1. Semester ist online', 'Di 20.10.', false]] }
];
var NAV = [
  { g: 'Schule', items: [['home', 'Übersicht', 'home'], ['timetable', 'Stundenplan', 'cal'], ['grades', 'Noten', 'chart'], ['sol', 'SOL', 'book'], ['absences', 'Absenzen', 'clock']] },
  { g: 'Infos', items: [['news', 'Mitteilungen', 'megaphone'], ['documents', 'Dokumente', 'folder'], ['links', 'Links', 'grid4'], ['notifications', 'Benachrichtigungen', 'bell']] }
];
var TITLES = { home: 'Übersicht', timetable: 'Stundenplan', grades: 'Noten', subject: 'Mathematik', absences: 'Absenzen', sol: 'SOL', documents: 'Dokumente', links: 'Links', news: 'Mitteilungen', article: 'Mitteilung', notifications: 'Benachrichtigungen', profile: 'Profil', more: 'Mehr', login: '', nf: '' };
function fmt(g) { return g.toFixed(1); }
class Component extends DCLogic {
  st() {
    var P = this.props || {};
    var init = Object.assign({ page: 'home', theme: 'light', w: 1440, h: 900, tt: 'week', dlg: false, solTab: 'tasks', solToday: false, solF: 'all', psheet: false, pfSheet: false, planned: false, pfSaved: false, pfEdit: false, day: 0, wk: 0, sem: 1, docF: 'all', q: '', read: false, toast: '', sw: [1, 1, 1, 1, 0], lang: 'DE', dm: 'System', les: [1, 1, 0, 0, 0, 0, 0], why: 'Krankheit', load: false, err: false, loginErr: false, sent: false }, INIT);
    init.theme = P.theme || INIT.theme || 'light';
    var key = JSON.stringify(init), s = this.state || {};
    if (s.key === key) return s;
    return Object.assign({ key: key }, init);
  }
  set(p) { this.setState(Object.assign({}, this.st(), p)); }
  renderVals() {
    var self = this, s = this.st(), pg = s.page, app = s.w < 600;
    var set = function (p) { self.set(p); };
    var stop = function (e) { if (e && e.preventDefault) e.preventDefault(); };
    var go = function (p, extra) { return function (e) { stop(e); set(Object.assign({ page: p, dlg: false, toast: '' }, extra || {})); }; };
    var nav = NAV.map(function (g) { return { g: g.g, items: g.items.map(function (n) {
      var on = pg === n[0] || (pg === 'subject' && n[0] === 'grades') || (pg === 'article' && n[0] === 'news') ;
      return { id: n[0], label: n[1], ic: n[2], on: on ? 'on' : '', cur: on ? 'page' : false, go: go(n[0]), hasN: n[0] === 'notifications' || n[0] === 'absences', n: n[0] === 'notifications' ? '3' : '2' }; }) }; });
    var tabsDef = [['home', 'Übersicht', 'home'], ['timetable', 'Stundenplan', 'cal'], ['grades', 'Noten', 'chart'], ['more', 'Mehr', 'grid4']];
    var inMore = ['sol', 'absences', 'documents', 'links', 'news', 'article', 'notifications', 'profile', 'more'];
    var tabs = tabsDef.map(function (t) { var on = pg === t[0] || (t[0] === 'grades' && pg === 'subject') || (t[0] === 'more' && inMore.indexOf(pg) >= 0); return { label: t[1], ic: t[2], on: on ? 'on' : '', cur: on ? 'page' : false, go: go(t[0]), bdg: t[0] === 'more' }; });
    var dayOf = function (di) { return WEEK[di].s.map(function (x, i) {
      if (!x) return null;
      var st = x[3] || '';
      return { n: T[i][0], from: T[i][1], to: T[i][2], subj: S[x[0]], room: x[1], tch: x[2], cls: st, isOff: st === 'off', isChg: st === 'chg', note: x[4] || '', isNow: st === 'now' };
    }).filter(Boolean); };
    var today = dayOf(0), dayList = dayOf(s.day);
    /* time grid: one scale everywhere (1.1 px per minute from 08:00), now line on today */
    var tmin = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
    var ty = function (t) { return Math.round((tmin(t) - 480) * 1.1); };
    var NOW = '10:20';
    var hrs = function (to) { var out = []; for (var h = 8; h <= to; h++) { var t = (h < 10 ? '0' : '') + h + ':00'; out.push({ h: t, top: ty(t) + 'px' }); } return out; };
    var blocksOf = function (di, short) { var d = WEEK[di];
      if (d.sol) return [['08:00', '12:00'], ['13:00', '16:00']].map(function (r) { return { subj: 'SOL-Tag', sub: 'Lernzone', tm: r[0] + ' bis ' + r[1], cls: 'sol', st: 'top: ' + ty(r[0]) + 'px; height: ' + (ty(r[1]) - ty(r[0]) - 2) + 'px' }; });
      return d.s.map(function (x, i) { if (!x) return null; var st = x[3] || ''; var past = di === 0 && s.wk === 0 && tmin(T[i][2]) <= tmin(NOW);
        var cls = (st === 'past' ? '' : st) + (past ? ' past' : '');
        var sub = st === 'off' ? 'Entfällt' : st === 'chg' ? x[1] + ' statt ' + x[4].replace('statt ', '') : (short ? x[1] : x[1] + ' · ' + x[2]);
        return { subj: short ? SH[x[0]] : S[x[0]], sub: sub, tm: T[i][1] + ' bis ' + T[i][2], cls: cls, st: 'top: ' + ty(T[i][1]) + 'px; height: ' + (ty(T[i][2]) - ty(T[i][1]) - 2) + 'px' }; }).filter(Boolean); };
    var tgOf = function (dis, short, to, mode) { var hasNow = s.wk === 0 && dis.indexOf(0) >= 0; var col = dis.indexOf(0);
      return { cls: mode, n: String(dis.length), one: dis.length === 1, many: dis.length > 1, h: (ty(to) + 4) + 'px', hours: hrs(+to.slice(0, 2)),
        days: dis.map(function (di) { var d = WEEK[di]; return { d: d.d, n: d.n, cls: di === 0 && s.wk === 0 ? 'today' : '', al: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][di], blocks: blocksOf(di, short) }; }),
        hasNow: hasNow, now: NOW, nowTop: ty(NOW) + 'px', dotL: 'calc(' + col + ' * 100% / ' + dis.length + ')', lunch: 'top: ' + ty('12:20') + 'px; height: ' + (ty('13:15') - ty('12:20')) + 'px' }; };
    var week = { days: WEEK.map(function (d) { return { d: d.d, n: d.n, cls: d.today ? 'today' : '' }; }), rows: T.map(function (t, i) {
      return { n: t[0], from: t[1], to: t[2], cells: WEEK.map(function (d) { var x = d.s[i]; if (!x) return { empty: true, full: false, cls: 'empty' };
        var st = x[3] === 'past' ? '' : (x[3] || ''); return { empty: false, full: true, cls: st, subj: SH[x[0]], sub: x[0] === 'SOL' ? 'Lernzone' : st === 'off' ? 'Entfällt' : st === 'chg' ? x[1] + ' ' + x[4] : x[1] + ' · ' + x[2] }; }) }; }), brk: true };
    var subj = SUBJ.map(function (x) { var low = x.avg < 4; return { k: x.k, n: S[x.k], short: x.k, avg: fmt(x.avg), w: Math.round((x.avg - 1) / 5 * 100) + '%', cls: low ? 'low' : '', flag: low ? 'flag' : '', s: x.n + ' Prüfungen · ' + x.t, go: go('subject') }; });
    var recent = RECENT.map(function (r) { return { n: S[r[0]], t: r[1], d: r[2], g: fmt(r[3]), cls: r[3] < 4 ? 'low' : '' }; });
    var exams = EXAMS.map(function (e) { return { t: e[0], d: e[1], g: fmt(e[2]), w: e[3] === 1 ? 'Gewicht 1' : 'Gewicht ½', cls: e[2] < 4 ? 'low' : '', cl: 'Klasse ' + fmt(e[4]) }; });
    var abs = ABS.map(function (a, i) { var st = a.st === 'open' && s.sent && i === 0 ? 'sent' : a.st; var m = AST[st]; return Object.assign({}, a, { chip: m[0], stl: m[1], isOpen: st === 'open', go: function () { set({ dlg: true }); } }); });
    var slug = function (t) { return t.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    var q = (s.q || '').toLowerCase();
    var docChips = [{ id: 'all', g: 'Alle', c: '10' }].concat(DOCS.map(function (g) { return { id: g.g, g: g.g, c: String(g.items.length) }; })).map(function (c) { return Object.assign(c, { cls: s.docF === c.id ? 'on' : '', pr: s.docF === c.id ? 'true' : 'false', go: function () { set({ docF: c.id }); } }); });
    var docs = DOCS.filter(function (g) { return s.docF === 'all' || s.docF === g.g; }).map(function (g) { return { g: g.g, c: String(g.items.length), items: g.items.filter(function (d) { return !q || d[0].toLowerCase().indexOf(q) >= 0; }).map(function (d) { var u = '/dokumente/' + slug(d[0]) + '.pdf'; return { t: d[0], type: d[1], size: d[2], s: d[3], hasS: !!d[3], isNew: !!d[4], href: u, dl: 'Herunterladen: ' + d[0] }; }) }; }).filter(function (g) { return g.items.length; });
    var links = LINKS.map(function (g) { return { g: g.g, items: g.items.map(function (l) { return { ini: l[0], t: l[1], s: l[2], cls: l[3], href: l[4], al: l[1] + ' öffnen (neuer Tab)' }; }) }; });
    var news = NEWS.map(function (n) { return Object.assign({}, n, { cls: (n.pin ? 'pin ' : '') + (n.unread ? 'unread' : ''), go: go('article'), isPin: !!n.pin }); });
    var tgt = { swap: 'timetable', cancel: 'timetable', chart: 'subject', clock: 'absences', megaphone: 'article' };
    var notes = NOTES.map(function (g) { return { day: g.day, items: g.items.map(function (n) { return { ic: n[0], cls: n[1], t: n[2], p: n[3], time: n[4], un: n[5] && !s.read ? 'unread' : '', go: go(tgt[n[0]], n[0] === 'cancel' || n[0] === 'swap' ? { tt: 'day', day: 0 } : {}) }; }) }; });
    var more = [['sol', 'SOL', 'SOL-Tag am Freitag', 'book', ''], ['absences', 'Absenzen', s.sent ? '1 offen' : '2 offen', 'clock', 'warn'], ['news', 'Mitteilungen', '2 neu', 'megaphone', ''], ['documents', 'Dokumente', '', 'folder', ''], ['links', 'Links', '', 'grid4', ''], ['notifications', 'Benachrichtigungen', '3 neu', 'bell', ''], ['profile', 'Profil und Einstellungen', '', 'user', '']]
      .map(function (m) { return { t: m[1], s: m[2], hasS: !!m[2], ic: m[3], tag: m[4], hasTag: m[4] === 'warn', noTag: m[4] !== 'warn', go: go(m[0]) }; });
    var back = { sol: ['more', 'Mehr'], nf: ['home', 'Übersicht'], subject: ['grades', 'Noten'], article: ['news', 'Mitteilungen'], absences: ['more', 'Mehr'], documents: ['more', 'Mehr'], links: ['more', 'Mehr'], news: ['more', 'Mehr'], notifications: ['more', 'Mehr'], profile: ['more', 'Mehr'] }[pg];
    var dayPick = WEEK.map(function (d, i) { return { d: d.d, n: d.n, cls: i === s.day ? 'on' : '', cur: i === s.day ? 'true' : 'false', go: function (e) { stop(e); set({ day: i }); } }; });
    var isLogin = pg === 'login';
    var mins = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
    var Y = function (t) { return Math.round((mins(t) - 480) * 1.1); };
    var SNOW = '10:20';
    var solTabs = [['tasks', 'Aufträge'], ['cal', 'Kalender'], ['pf', 'Portfolio']].map(function (t) { return { t: t[1], cls: s.solTab === t[0] ? 'on' : '', cur: s.solTab === t[0] ? 'true' : 'false', go: function () { set({ solTab: t[0] }); } }; });
    var solFilt = ['all'].concat(Object.keys(SOLT)).map(function (k) { return { t: k === 'all' ? 'Alle' : SH[k], cls: s.solF === k ? 'on' : '', pr: s.solF === k ? 'true' : 'false', go: function () { set({ solF: k }); } }; });
    var sgroups = Object.keys(SOLT).filter(function (k) { return s.solF === 'all' || s.solF === k; }).map(function (k) { var by = SOLT[k][0]; return { k: k, n: S[k], c: String(SOLT[k][1].length), by: by, items: SOLT[k][1].map(function (x) { var slug = (k + '-sol-' + x[0]).toLowerCase().replace('.', '-'); return { code: x[0], t: x[1], min: x[2] + ' Min.', p: x[3] + ' %', pw: x[3] + '%', done: x[3] === 100, cls: x[3] === 100 ? 'done' : '', sp: URL.sharepoint + slug, dl: '/sol/auftraege/' + slug + '.pdf', spl: x[1] + ' in SharePoint öffnen', dll: x[1] + ' herunterladen' }; }) }; });
    var hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(function (h) { return { h: h, top: Y(h) + 'px' }; });
    var plan = (s.planned ? PLAN.concat([['16:30', '17:00', 'FR', '3.01', 'Compréhension orale']]) : PLAN).map(function (p) { return { from: p[0], to: p[1], k: p[2], code: p[3], t: p[4], short: SH[p[2]] + ' ' + p[3], past: s.solToday && mins(p[1]) <= mins(SNOW) ? 'past' : '', st: 'top: ' + Y(p[0]) + 'px; height: ' + (Y(p[1]) - Y(p[0]) - 3) + 'px', sm: mins(p[1]) - mins(p[0]) < 50 ? 'sm' : mins(p[1]) - mins(p[0]) < 70 ? 'md' : '' }; });
    var teach = TEACH.map(function (x) { return { n: x[1], cd: { Keller: 'KEL', Moret: 'MOR', 'Mäder': 'MAE', Dupont: 'DUP', Brunner: 'BRU' }[x[1]], kk: x[2], k: SH[x[2]], from: x[3], to: x[4], st: 'left: calc(' + x[0] + ' * 25%); top: ' + Y(x[3]) + 'px; height: ' + (Y(x[4]) - Y(x[3]) - 3) + 'px', al: x[1] + ', ' + S[x[2]] + ', ' + x[3] + ' bis ' + x[4] }; });
    var pf = PF.slice();
    if (s.pfSaved) pf = [{ d: 'Freitag, 30. Oktober', ci: 'Mathe 3.02 und 3.03 am Morgen, danach Englisch Reading.', co: '' }].concat(pf);
    pf = pf.map(function (x) { return Object.assign({}, x, { hasCo: !!x.co, noCo: !x.co, edit: function () { set({ pfEdit: true, pfSheet: true }); }, el: 'Eintrag vom ' + x.d + ' bearbeiten' }); });
    var wkDates = [['26. bis 30. Oktober', 'Woche 44'], ['2. bis 6. November', 'Woche 45']][s.wk] || ['19. bis 23. Oktober', 'Woche 43'];
    var LES = [['1', 'Französisch'], ['2', 'Mathematik'], ['3', 'Mathematik'], ['4', 'W&R'], ['5', 'G&P'], ['6', 'Informatik'], ['7', 'Informatik']];
    var nSel = s.les.filter(Boolean).length;
    var swDef = [['Stundenplanänderungen', 'Ausfälle und Raumänderungen'], ['Neue Noten', ''], ['Mitteilungen', ''], ['Absenzen', 'Erinnerung vor Ablauf der Frist'], ['Zusätzlich per E-Mail', '']];
    var opts = function (list, key) { return list.map(function (o) { return { t: o, cls: s[key] === o ? 'on' : '', pr: s[key] === o ? 'true' : 'false', go: function () { var p = {}; p[key] = o; set(p); } }; }); };
    return {
      themeCls: (s.theme === 'dark' ? 'dark' : '') + (app ? ' app' : ''), vh: s.h + 'px', setRoot: function (el) { self.rootEl = el; },
      isApp: app, isWeb: !app, isLogin: isLogin, inApp: !isLogin, webShell: !app && !isLogin, appShell: app && !isLogin,
      shellCls: app ? 'ashell' : 'shell', mainCls: app ? 'ascroll' : 'pg', noBack: !(app && !!back), newsTop: news.slice(0, 2),
      me: ME, nav: nav, tabs: tabs, title: TITLES[pg], showTitle: app && pg !== 'home' && pg !== 'subject' && pg !== 'article' && pg !== 'nf' && !isLogin,
      hasBack: app && !!back, backLabel: back ? back[1] : '', goBack: back ? go(back[0]) : null,
      pHome: pg === 'home' && !s.load, homeLoad: pg === 'home' && !!s.load, ttErr: pg === 'timetable' && !!s.err, pTimetable: pg === 'timetable', pGrades: pg === 'grades', pSubject: pg === 'subject', pAbsences: pg === 'absences', pDocuments: pg === 'documents',
      pLinks: pg === 'links', pNews: pg === 'news', pArticle: pg === 'article', pNotifications: pg === 'notifications', pProfile: pg === 'profile', pMore: pg === 'more' && !s.load, pSol: pg === 'sol',
      ttCls: 'tt-' + s.tt, ttWeek: s.tt === 'week', ttDay: s.tt === 'day', segWeek: s.tt === 'week' ? 'on' : '', segDay: s.tt === 'day' ? 'on' : '', goWeek: function (e) { if (e && e.preventDefault) e.preventDefault(); set({ tt: 'week' }); }, goDay: function (e) { if (e && e.preventDefault) e.preventDefault(); set({ tt: 'day' }); },
      ttTitle: s.tt === 'week' ? wkDates[0] : (s.day === 0 && s.wk === 0 ? 'Heute' : ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][s.day]),
      ttSub: s.tt === 'week' ? wkDates[1] + ' · ' + ME.cls : (s.day === 0 && s.wk === 0 ? 'Montag, ' : '') + ['26', '27', '28', '29', '30'][s.day] + '. Oktober' + (s.day === 4 ? ' · SOL-Tag' : ''),
      ttPrev: function () { if (s.tt === 'week') set({ wk: s.wk - 1 }); else set({ day: Math.max(0, s.day - 1) }); },
      ttNext: function () { if (s.tt === 'week') set({ wk: s.wk + 1 }); else set({ day: Math.min(4, s.day + 1) }); },
      ttPrevL: s.tt === 'week' ? 'Vorherige Woche' : 'Vorheriger Tag', ttNextL: s.tt === 'week' ? 'Nächste Woche' : 'Nächster Tag',
      ttOff: s.tt === 'week' ? s.wk !== 0 : s.day !== 0, ttHome: function () { set({ wk: 0, day: 0 }); },
      ttTg: s.tt === 'week' ? tgOf([0, 1, 2, 3, 4], true, '17:00', 'tg-week') : tgOf([s.day], false, '17:00', 'tg-day'), homeTg: tgOf([0], false, '15:00', 'tg-day tg-home'),
      today: today, week: week, dayPick: dayPick, subj: subj, recent: recent, exams: exams, abs: abs, docs: docs, links: links, news: news, notes: notes, more: more,
      openAbs: abs.filter(function (a) { return a.isOpen; }), nOpen: String(abs.filter(function (a) { return a.isOpen; }).length), hasOpen: abs.some(function (a) { return a.isOpen; }), noOpen: !abs.some(function (a) { return a.isOpen; }),
      dlg: !!s.dlg, openDlg: function (e) { stop(e); set({ dlg: true }); }, closeDlg: function () { set({ dlg: false }); },
      lessons: LES.map(function (l, i) { return { n: l[0] + '. Lektion', s: l[1], cls: s.les[i] ? 'on' : '', on: !!s.les[i], go: function (e) { stop(e); var a = s.les.slice(); a[i] = a[i] ? 0 : 1; set({ les: a }); } }; }),
      reasons: opts(['Krankheit', 'Arzt', 'Termin', 'Anderes'], 'why'), canSend: nSel > 0, cantSend: nSel === 0, sendLabel: nSel === 1 ? '1 Lektion entschuldigen' : nSel + ' Lektionen entschuldigen',
      send: function () { if (!nSel) return; set({ dlg: false, sent: true, toast: 'Absenz gesendet. Deine Klassenlehrperson prüft sie.' }); },
      toast: s.toast, hasToast: !!s.toast, closeToast: function () { set({ toast: '' }); },
      dayList: dayList, dayLabel: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][s.day], wkLabel: wkDates[0], wkNo: wkDates[1], isThisWk: s.wk === 0, notThisWk: s.wk !== 0,
      prevWk: function () { set({ wk: s.wk - 1 }); }, nextWk: function () { set({ wk: s.wk + 1 }); }, thisWk: function () { set({ wk: 0 }); },
      sem1: s.sem === 1 ? 'on' : '', sem2: s.sem === 2 ? 'on' : '', sem1p: s.sem === 1 ? 'true' : 'false', sem2p: s.sem === 2 ? 'true' : 'false', goSem1: function () { set({ sem: 1 }); }, goSem2: function () { set({ sem: 2 }); }, hasGrades: s.sem === 1, noGrades: s.sem === 2,
      docChips: docChips, q: s.q, onQ: function (e) { set({ q: e && e.target ? e.target.value : '' }); }, clearQ: function () { set({ q: '', docF: 'all' }); }, noDocs: docs.length === 0, hasDocs: docs.length > 0,
      markRead: function () { set({ read: true }); }, unreadN: s.read ? '0' : '3', hasUnread: !s.read, bellLabel: s.read ? 'Benachrichtigungen' : 'Benachrichtigungen, 3 neu',
      sws: swDef.map(function (w, i) { return { t: w[0], s: w[1], hasS: !!w[1], cls: s.sw[i] ? 'on' : '', pr: s.sw[i] ? 'true' : 'false', go: function () { var a = s.sw.slice(); a[i] = a[i] ? 0 : 1; set({ sw: a }); } }; }),
      langs: opts(['DE', 'FR', 'EN'], 'lang'), dms: opts(['System', 'Hell', 'Dunkel'], 'dm'),
      login: function () { set({ page: 'home', loginErr: false }); }, logout: go('login'), retry: function () { set({ err: false, load: false }); },
      isLoad: !!s.load, isErr: !!s.err, isOk: !s.load && !s.err, loginErr: !!s.loginErr, p404: pg === 'nf', notNf: pg !== 'nf',
      solTabs: solTabs, stTasks: s.solTab === 'tasks', stCal: s.solTab === 'cal', stPf: s.solTab === 'pf', solFilt: solFilt, sgroups: sgroups,
      hours: hours, plan: plan, teach: teach, lunch: 'top: ' + Y('12:00') + 'px; height: ' + (Y('13:00') - Y('12:00')) + 'px', solToday: !!s.solToday, solNowTop: Y(SNOW) + 'px', solNow: SNOW, calTitle: s.solToday ? 'Heute' : 'Freitag, 30. Oktober', calSub: s.solToday ? 'Freitag, 30. Oktober · Block 3' : 'Block 3', tlH: 'height: ' + (Y('17:00') + 2) + 'px',
      pf: pf, pfTitle: s.pfEdit ? 'Freitag, 16. Oktober' : 'Freitag, 30. Oktober', pfCi: s.pfEdit ? PF[0].ci : '', pfCo: s.pfEdit ? PF[0].co : '',
      goSol: go('sol', { solTab: 'tasks' }), goSolCal: go('sol', { solTab: 'cal' }),
      psheet: !!s.psheet, openPlan: function (e) { stop(e); set({ psheet: true }); }, closePlan: function () { set({ psheet: false }); },
      doPlan: function () { set({ psheet: false, planned: true, toast: 'Französisch 3.01 eingeplant, Freitag 16:30.' }); },
      pfSheet: !!s.pfSheet, openPf: function (e) { stop(e); set({ pfSheet: true, pfEdit: false }); }, closePf: function () { set({ pfSheet: false, pfEdit: false }); },
      savePf: function () { set({ pfSheet: false, pfEdit: false, pfSaved: !s.pfEdit || s.pfSaved, toast: 'Portfolio gespeichert.' }); },
      sk: [1, 2, 3, 4, 5], u: { moodle: URL.moodle, untis: URL.untis, teams: 'https://teams.microsoft.com/', outlook: 'https://outlook.office.com/mail/', pdf: '/dokumente/pruefungsplan-1-semester-2026-27.pdf' },
      goHome: go('home'), goTimetable: go('timetable'), goGrades: go('grades'), goAbsences: go('absences'), goNews: go('news'), goDocuments: go('documents'), goLinks: go('links'), goNotifications: go('notifications'), goProfile: go('profile'), goArticle: go('article'),
      themeLabel: s.theme === 'dark' ? 'Helles Design' : 'Dunkles Design', isLight: s.theme !== 'dark', isDark: s.theme === 'dark', toggleTheme: function () { set({ theme: s.theme === 'dark' ? 'light' : 'dark' }); }
    };
  }
}
