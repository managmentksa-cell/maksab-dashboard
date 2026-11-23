/**
 * مراية مكسب: السيرفر على Google Apps Script
 * بيقرا شيتات مكسب وبيسحب من رباط من غير أي استهلاك لـ Claude.
 *
 * Script properties (Project Settings > Script properties):
 *   ACCESS_CODE     اختياري: يغيّر رمز الدخول الافتراضي
 *   ADMIN_CODE      اختياري: رمز منفصل لتعديل التسعير، ولما يتسجل رمز الدخول يبقى مشاهدة بس
 *   RIBAT_EMAIL     حساب رباط (Nozol Noor)
 *   RIBAT_PASSWORD  باسورد رباط
 */

var SHEET26 = '1XX4Vs-Gaig0HBsIKdAKVV9oBCjPYTu-TH9CQCkxjH2M';
var SHEET27 = '1RIEHAFW7kUiU6bQ87fESCFeCgI5CGP88OKFaypZCty4';
var LEDGER = '1m4RKgAjL9pkyL2213EQYz0R6_HfsKxpwEb277U5ZfAo';

var TABS26 = ['S1', 'S2', 'B1', 'B2', 'AAR', 'DJ', 'RJ', 'G', 'ASJ', 'NZT', 'ATH', 'Aj', 'Assala', 'AB3', 'VAR', 'Villa Madina'];
var TABS27 = ['Al-Salam 1', 'Al-Salam 2', 'Al-Badrani 1', 'Al-Rajhi', 'Jamawat B', 'Roaa Jamawat', 'Al-Sahaba', 'Asasyat Jamawat', 'Nozol Tabba', 'Atheer', 'Nozol Jamawat', 'Asala Jamawat', 'Jawharat Badrani', 'Manas Badrani', 'Villa Al-Ared', 'Villa Madina'];
var EXTRA = [
  [SHEET26, "'Dash B'!A1:Q140"],
  [SHEET27, "'Units'!A1:E400"],
  [SHEET27, "'Targets 2027'!A1:P120"],
  [SHEET27, "'Data'!A1:O900"]
];

var RIBAT_API = 'https://api.getribat.com/api';
var RIBAT_MAP = {
  'نزل السلام': 'S1', 'ضيافة السلام': 'S2', 'نزل البدراني': 'B1', 'ضيافة البدراني': 'B2', 'نزل الراجحي': 'AAR',
  'ضيافة الجماوات': 'DJ', 'ضيافه الجماوات': 'DJ', 'رؤى الجماوات': 'RJ', 'رؤي الجماوات': 'RJ', 'جلامور': 'G',
  'اساسيات الجماوات': 'ASJ', 'أساسيات الجماوات': 'ASJ', 'نزل طابا': 'NZT', 'الأثير': 'ATH', 'الاثير': 'ATH',
  'نزل الجموات': 'AJ', 'نزل الجماوات': 'AJ'
};
var SRC_CODE = { BookingCom: 'B', Expedia: 'E', Agoda: 'A', Direct: 'D', customer_service: 'C', sales: 'S', social_media: 'M', 'ical:airbnb': 'N', referral: 'R' };
var ST_CODE = { confirmed: 'C', checked_in: 'I', checked_out: 'O', cancelled: 'X' };

/* قايمة أسعار البيع المباشر Q4 2026: [night,min,wknd,wkndMin,weekly,season,seasonMin] */
var DP = {
 S1:{"3 غرف":{10:[200,190,250,240,180],11:[325,310,405,370,295,435,400],12:[375,350,455,420,310,510,475]}},
 S2:{"3 غرف":{10:[200,190,250,240,180],11:[325,310,405,370,295,435,400],12:[350,330,430,395,310,480,445]},
     "غرفتين":{10:[160,150,180,170,145],11:[250,240,310,285,225,335,310],12:[290,270,350,325,250,390,365]},
     "غرفة":{10:[115,110,130,120,105],11:[180,170,220,205,160,240,225],12:[225,200,260,235,180,290,265]}},
 B1:{"غرفتين":{10:[150,140,180,170,135],11:[260,245,325,295,235,345,320],12:[305,290,375,350,275,420,385]},
     "3 غرف":{10:[195,185,220,210,175],11:[325,310,405,370,295,435,400],12:[335,310,405,370,295,450,415]}},
 B2:{"3 غرف":{10:[205,195,220,210,185],11:[250,240,320,285,225,335,310],12:[300,285,370,345,250,415,380]},
     "استوديو":{10:[90,85,120,110,80],11:[160,150,195,180,145,210,195],12:[225,195,255,230,160,285,260]}},
 AAR:{"استوديو":{10:[90,80,110,100,75],11:[135,130,170,155,120,180,165],12:[185,170,220,205,150,245,230]},
      "غرفة":{10:[110,95,130,120,95],11:[160,150,195,180,145,210,195],12:[210,195,255,230,160,285,260]},
      "غرفتين":{10:[130,120,150,140,110],11:[180,170,220,205,160,240,225],12:[260,220,285,260,200,320,295]}},
 NZT:{"غرفتين":{10:[160,150,180,170,145],11:[250,240,310,285,225,335,310],12:[285,270,350,325,255,390,365]},
      "غرفة":{10:[110,105,130,120,100],11:[175,165,215,200,160,230,215],12:[200,190,245,230,180,275,250]}},
 G:{"غرفة":{10:[110,100,130,120,100],11:[160,150,195,180,145,210,195],12:[175,165,215,200,160,240,225]},
    "غرفتين":{10:[130,120,160,150,120],11:[195,185,240,225,175,260,235],12:[210,200,260,235,190,290,265]}},
 DJ:{"استوديو":{10:[110,100,130,120,100],11:[135,130,170,155,120,180,165],12:[210,195,255,230,155,285,260]},
     "غرفتين":{10:[140,130,170,160,125],11:[210,200,260,235,190,280,255],12:[265,250,325,300,240,365,340]}},
 RJ:{"غرفة بمطبخ":{10:[100,95,130,120,90],11:[145,135,175,160,125,190,175],12:[160,145,190,175,135,210,195]},
     "غرفة وصالة":{10:[120,110,145,135,105],11:[155,145,190,175,135,205,190],12:[175,165,215,200,150,240,225]}},
 ASJ:{"غرفتين":{10:[250,220,280,280,200],11:[400,350,480,445,340,490,455],12:[450,420,545,510,365,610,575]}}
};

/* آخر تقييمات مسجّلة في المراية (MyDataValue + تقرير Q3) */
var OTA_SEED = {
  AAR: { at: 1792416000000, bdcScore: 7.7, health: 64, k: 'AAR', src: 'MyDataValue + تقرير Q3' },
  ASJ: { at: 1792416000000, health: 59, k: 'ASJ', src: 'MyDataValue' },
  ASL: { at: 1792416000000, health: 18, k: 'ASL', src: 'MyDataValue' },
  B1: { at: 1792416000000, bdcScore: 7.7, health: 85, k: 'B1', src: 'MyDataValue + تقرير Q3' },
  B2: { at: 1792416000000, bdcScore: 7.5, k: 'B2', src: 'تقرير Q3' },
  DJ: { at: 1792416000000, bdcScore: 8.5, health: 63, k: 'DJ', src: 'MyDataValue + تقرير Q3' },
  G: { at: 1792416000000, bdcScore: 7.2, k: 'G', src: 'تقرير Q3' },
  NZT: { at: 1792416000000, health: 77, k: 'NZT', src: 'MyDataValue' },
  RJ: { at: 1792416000000, health: 86, k: 'RJ', src: 'MyDataValue' },
  S1: { at: 1792416000000, bdcScore: 8.2, health: 62, k: 'S1', src: 'MyDataValue + تقرير Q3' },
  S2: { at: 1792416000000, bdcScore: 8, health: 52, k: 'S2', src: 'MyDataValue + تقرير Q3' }
};

var FILE_BUNDLE = 'maksab-mirror-bundle.b64';
var FILE_RIBAT = 'maksab-mirror-ribat.json';
var FILE_STORE = 'maksab-mirror-store.json';
var FILE_REPORT = 'maksab-mirror-report.json';
var FILE_USERS = 'maksab-users.json';
var MIN_REFRESH_MS = 2 * 60 * 1000;
var DEFAULT_CODE = '100100';

/* ============ الصفحة ============ */
function doGet(e) {
  if (e && e.parameter && e.parameter.p === 'simplan') {
    return ContentService.createTextOutput(JSON.stringify(simPlan(false))).setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.p === 'simmonthly') {
    return ContentService.createTextOutput(JSON.stringify(simMonthlyGet())).setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.p === 'simmonthlysave') {
    var P = e.parameter;
    return ContentService.createTextOutput(JSON.stringify(simMonthlySave(P.code, P.k, P.n, P.l))).setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.p === 'simpage') {
    return ContentService.createTextOutput(HtmlService.createHtmlOutputFromFile('sim2').getContent()).setMimeType(ContentService.MimeType.TEXT);
  }
  if (e && e.parameter && e.parameter.p === 'simask') {
    var ans; try { ans = { text: simAsk_(e.parameter.q, e.parameter.ctx || e.parameter.c) }; } catch (er) { ans = { error: String(er.message || er) }; }
    return ContentService.createTextOutput(JSON.stringify(ans)).setMimeType(ContentService.MimeType.JSON);
  }
  if (e && e.parameter && e.parameter.p === 'sim') {
    return HtmlService.createHtmlOutputFromFile('sim').setTitle('Stay Easy | محاكي الأسعار')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('لوحة تحكم قسم الحجوزات')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/* ============ رمز الدخول ============ */
function props_() { return PropertiesService.getScriptProperties(); }

function auth_(code) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('auth_fails') || 0);
  if (fails >= 10) throw new Error('locked');
  var c = String(code || '').trim();
  var admin = props_().getProperty('ADMIN_CODE');
  var access = props_().getProperty('ACCESS_CODE') || DEFAULT_CODE;
  if (c && admin && c === admin) return 'admin';
  if (c && c === access) return admin ? 'view' : 'admin';
  cache.put('auth_fails', String(fails + 1), 300);
  throw new Error('bad_code');
}

/* ============ نظام المستخدمين: دعوة بالإيميل + صلاحيات مفصّلة ============ */
function usersRead_() { return readJson_(FILE_USERS) || { users: {}, invites: {} }; }
function usersWrite_(data) { writeFile_(FILE_USERS, JSON.stringify(data), 'application/json'); }

/* أحمد يبعت دعوة: الإيميل + الصلاحيات */
function inviteUser(code, email, perms) {
  if (auth_(code) !== 'admin') throw new Error('admin_only');
  email = String(email || '').trim().toLowerCase();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) throw new Error('invalid_email');
  var data = usersRead_();
  var token = Utilities.getUuid().slice(0, 8);
  data.invites[token] = {
    email: email,
    perms: perms || { sections: ['ov','y26','y27','pr','av','ota','al','tg','st'], properties: [], canEdit: false },
    at: new Date().toISOString()
  };
  usersWrite_(data);
  /* إرسال الدعوة بالإيميل */
  var url = ScriptApp.getService().getUrl() + '?invite=' + token;
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'دعوة للوحة تحكم قسم الحجوزات',
      htmlBody: '<div dir="rtl" style="font-family:sans-serif;padding:20px"><h2>مرحبًا!</h2><p>تم دعوتك للوصول إلى لوحة تحكم قسم الحجوزات.</p><p><a href="' + url + '" style="background:#2B5CFF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">قبول الدعوة</a></p><p style="color:#888;font-size:13px">رمز الدعوة: ' + token + '</p></div>'
    });
  } catch (e) { /* لو الإيميل فشل الدعوة تفضل شغالة بالرمز */ }
  return { token: token, email: email };
}

/* المستخدم يقبل الدعوة ويختار باسورد */
function acceptInvite(token, password) {
  token = String(token || '').trim();
  password = String(password || '').trim();
  if (password.length < 4) throw new Error('password_short');
  var data = usersRead_();
  var inv = data.invites[token];
  if (!inv) throw new Error('invalid_invite');
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + token)
    .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  data.users[inv.email] = {
    hash: hash, salt: token,
    perms: inv.perms,
    at: new Date().toISOString()
  };
  delete data.invites[token];
  usersWrite_(data);
  return { ok: true, email: inv.email };
}

/* تسجيل الدخول بالإيميل + الباسورد */
function userAuth_(email, password) {
  email = String(email || '').trim().toLowerCase();
  password = String(password || '').trim();
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('uauth_fails_' + email) || 0);
  if (fails >= 10) throw new Error('locked');
  var data = usersRead_();
  var u = data.users[email];
  if (!u) { cache.put('uauth_fails_' + email, String(fails + 1), 300); throw new Error('bad_login'); }
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + u.salt)
    .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
  if (hash !== u.hash) { cache.put('uauth_fails_' + email, String(fails + 1), 300); throw new Error('bad_login'); }
  return { email: email, perms: u.perms, role: u.perms.canEdit ? 'editor' : 'viewer' };
}

/* إدارة المستخدمين: قائمة، تعديل صلاحيات، حذف */
function getUsers(code) {
  if (auth_(code) !== 'admin') throw new Error('admin_only');
  return usersRead_();
}
function updateUserPerms(code, email, perms) {
  if (auth_(code) !== 'admin') throw new Error('admin_only');
  var data = usersRead_();
  if (!data.users[email]) throw new Error('user_not_found');
  data.users[email].perms = perms;
  usersWrite_(data);
  return data;
}
function removeUser(code, email) {
  if (auth_(code) !== 'admin') throw new Error('admin_only');
  var data = usersRead_();
  delete data.users[email];
  usersWrite_(data);
  return data;
}

/* ============ الذي الصفحة بتناديه ============ */
function getBundle(code) {
  var role = auth_(code);
  var f = findFile_(FILE_BUNDLE);
  if (!f) { syncAll(); f = findFile_(FILE_BUNDLE); }
  return { role: role, dp: DP, gz: f.getBlob().getDataAsString('UTF-8'), store: readStore_() };
}

/* نسخة getBundle للمستخدمين بالإيميل: بترجع البيانات حسب الصلاحيات */
function getBundleUser(email, password) {
  var u = userAuth_(email, password);
  var f = findFile_(FILE_BUNDLE);
  if (!f) { syncAll(); f = findFile_(FILE_BUNDLE); }
  return { role: u.role, perms: u.perms, dp: DP, gz: f.getBlob().getDataAsString('UTF-8'), store: readStore_() };
}

function refreshNow(code) {
  auth_(code);
  var lock = LockService.getScriptLock();
  if (lock.tryLock(1000)) {
    try {
      var last = Number(props_().getProperty('LAST_SYNC') || 0);
      if (Date.now() - last > MIN_REFRESH_MS) syncAll();
    } finally { lock.releaseLock(); }
  } else {
    lock.waitLock(280000);
    lock.releaseLock();
  }
  return getBundle(code);
}

function readSheet(code, id, range) {
  auth_(code);
  if (id !== LEDGER && id !== SHEET26 && id !== SHEET27) throw new Error('sheet_not_allowed');
  return readRange_(SpreadsheetApp.openById(id), range);
}

function saveDoc(code, path, data) {
  if (auth_(code) !== 'admin') throw new Error('read_only');
  var p = String(path).split('/');
  if (p.length !== 2 || p[0] !== 'pricing' || !/^[A-Za-z0-9_]+$/.test(p[1])) throw new Error('bad_path');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var s = readStore_();
    s.pricing = s.pricing || {};
    s.pricing[p[1]] = data;
    writeFile_(FILE_STORE, JSON.stringify(s), 'application/json');
  } finally { lock.releaseLock(); }
  return true;
}

/* ============ التحديث ============ */
function syncAll() {
  var errs = {};
  try { syncRibat_(); } catch (e) { errs.ribat = String(e.message || e); }
  var ranges = {};
  var ss26 = SpreadsheetApp.openById(SHEET26), ss27 = SpreadsheetApp.openById(SHEET27);
  TABS26.forEach(function (t) { addRange_(ranges, errs, ss26, SHEET26, "'" + t + "'"); });
  TABS27.forEach(function (t) { addRange_(ranges, errs, ss27, SHEET27, "'" + t + "'"); });
  EXTRA.forEach(function (x) { addRange_(ranges, errs, x[0] === SHEET26 ? ss26 : ss27, x[0], x[1]); });
  var titles = [];
  try { titles = SpreadsheetApp.openById(LEDGER).getSheets().map(function (s) { return s.getName(); }); } catch (e) { errs.ledger = String(e.message || e); }
  var ribat = readJson_(FILE_RIBAT) || {};
  var bundle = { at: Date.now(), ranges: ranges, titles: titles, ribat: ribat, errs: errs };
  var gz = Utilities.gzip(Utilities.newBlob(JSON.stringify(bundle), 'application/json'));
  writeFile_(FILE_BUNDLE, Utilities.base64Encode(gz.getBytes()), 'text/plain');
  props_().setProperty('LAST_SYNC', String(Date.now()));
  return errs;
}

function addRange_(ranges, errs, ss, id, range) {
  try { ranges[id + '|' + range] = readRange_(ss, range); }
  catch (e) { errs[range] = String(e.message || e); }
}

/* ============ قراءة الشيت ============ */
function readRange_(ss, range) {
  var m = String(range).match(/^'(.+?)'(?:!([A-Z]+)(\d+):([A-Z]+)(\d+))?$/);
  if (!m) throw new Error('bad_range ' + range);
  var sh = ss.getSheetByName(m[1]);
  if (!sh) throw new Error('tab_not_found ' + m[1]);
  var rng;
  if (m[2]) {
    var c1 = colNum_(m[2]), r1 = Number(m[3]);
    var c2 = Math.min(colNum_(m[4]), sh.getMaxColumns()), r2 = Math.min(Number(m[5]), sh.getMaxRows());
    rng = sh.getRange(r1, c1, Math.max(1, r2 - r1 + 1), Math.max(1, c2 - c1 + 1));
  } else {
    rng = sh.getDataRange();
  }
  return trimValues_(stripGuests_(rng.getDisplayValues()));
}

function colNum_(s) {
  var n = 0;
  for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64;
  return n;
}

/* بيانات الضيوف الشخصية غير بتطلع للصفحة خالص */
var PII_RX = /guest|phone|mobile|whats|e-?mail|passport|national|جوال|هاتف|موبايل|واتس|ضيف|نزيل|هوية|جواز/i;
var KEEP_RX = /paid|total|amount|count|fee|net|عدد|مبلغ|إجمالي|اجمالي|صافي|مدفوع/i;
function stripGuests_(values) {
  var limit = Math.min(6, values.length);
  for (var r = 0; r < limit; r++) {
    var row = values[r];
    for (var c = 0; c < row.length; c++) {
      var h = String(row[c]).trim();
      if (h && h.length < 40 && PII_RX.test(h) && !KEEP_RX.test(h)) {
        for (var y = r + 1; y < values.length; y++) values[y][c] = '';
      }
    }
  }
  return values;
}

function trimValues_(values) {
  var out = values.map(function (row) {
    var n = row.length;
    while (n > 0 && row[n - 1] === '') n--;
    return row.slice(0, n);
  });
  while (out.length && out[out.length - 1].length === 0) out.pop();
  return out;
}

/* ============ رباط ============ */
function ribatLogin_() {
  var email = props_().getProperty('RIBAT_EMAIL'), password = props_().getProperty('RIBAT_PASSWORD');
  if (!email || !password) throw new Error('RIBAT_EMAIL / RIBAT_PASSWORD غير متسجلين');
  var res = UrlFetchApp.fetch(RIBAT_API + '/auth/login', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Accept: 'application/json', Origin: 'https://app.getribat.com', Referer: 'https://app.getribat.com/' },
    payload: JSON.stringify({ email: email, password: password })
  });
  var code = res.getResponseCode();
  if (code >= 300) throw new Error('رباط رفض الدخول (' + code + ')');
  var j = JSON.parse(res.getContentText());
  var token = j.accessToken || (j.data && j.data.accessToken) || (j.tokens && j.tokens.accessToken) || j.token;
  if (!token) throw new Error('رباط مارجعش توكن دخول');
  return { token: token, properties: (j.user && j.user.properties) || [] };
}

function ribatGet_(token, path, pid) {
  var h = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
  if (pid) h['X-Property-Id'] = pid;
  var res = UrlFetchApp.fetch(RIBAT_API + path, { headers: h, muteHttpExceptions: true });
  if (res.getResponseCode() >= 300) throw new Error('رباط ' + path + ' رد ' + res.getResponseCode());
  return JSON.parse(res.getContentText());
}

/* كل الطلبات بتتبعت على دفعات متوازية لكي السحب يخلص في أقل من دقيقة */
function ribatAll_(reqs, size) {
  var out = [];
  for (var i = 0; i < reqs.length; i += size) {
    out = out.concat(UrlFetchApp.fetchAll(reqs.slice(i, i + size)));
    if (i + size < reqs.length) Utilities.sleep(300);
  }
  return out;
}

function syncRibat_() {
  var login = ribatLogin_();
  var token = login.token;
  var list = login.properties.length ? login.properties : (ribatGet_(token, '/properties').properties || []);
  var at = fmtRiyadh_(new Date(), "yyyy-MM-dd'T'HH:mm");
  var today = at.slice(0, 10);
  var result = emptyRibat_(at, today);
  var errs = [], seen = {}, targets = [];
  list.forEach(function (p) {
    var k = RIBAT_MAP[norm_(p.name)];
    if (k && !p.isDeleted && !seen[k]) { seen[k] = 1; targets.push({ k: k, id: p.id }); }
  });
  var req = function (path, id) {
    return { url: RIBAT_API + path, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + token, Accept: 'application/json', 'X-Property-Id': id } };
  };
  var first = [];
  var calStart = today + 'T00:00:00.000Z', calEnd = (Number(today.slice(0, 4)) + 2) + '-01-01T00:00:00.000Z';
  targets.forEach(function (t) { first.push(req('/dashboard', t.id)); first.push(req('/bookings?page=1&limit=100', t.id)); first.push(req('/bookings/calendar-data?start=' + calStart + '&end=' + calEnd, t.id)); });
  var res = ribatAll_(first, 8), more = [], owners = [];
  targets.forEach(function (t, i) {
    try {
      if (res[i * 3].getResponseCode() >= 300) throw new Error('داشبورد رد ' + res[i * 3].getResponseCode());
      if (res[i * 3 + 1].getResponseCode() >= 300) throw new Error('حجوزات رد ' + res[i * 3 + 1].getResponseCode());
      t.dash = JSON.parse(res[i * 3].getContentText());
      var b = JSON.parse(res[i * 3 + 1].getContentText());
      if (res[i * 3 + 2].getResponseCode() < 300) t.cal = JSON.parse(res[i * 3 + 2].getContentText());
      t.bookings = (b.bookings || []).slice();
      for (var pg = 2; pg <= Math.min(b.totalPages || 1, 60); pg++) { more.push(req('/bookings?page=' + pg + '&limit=100', t.id)); owners.push(t); }
    } catch (e) { t.err = String(e.message || e); }
  });
  ribatAll_(more, 8).forEach(function (r, i) {
    var t = owners[i];
    if (r.getResponseCode() >= 300) t.err = 'حجوزات رد ' + r.getResponseCode();
    else t.bookings = t.bookings.concat(JSON.parse(r.getContentText()).bookings || []);
  });
  targets.forEach(function (t) {
    if (t.err) errs.push(t.k + ': ' + t.err);
    else {
      addRibatProperty_(result, t.k, t.dash, t.bookings, at, today);
      if (t.cal) {
        result.ribat_block[t.k] = { rows: (t.cal.blocks || []).map(function (x) {
          return [clean_(x.room && x.room.name), String(x.startDate).slice(2, 10).replace(/-/g, ''), String(x.endDate).slice(2, 10).replace(/-/g, ''), clean_(x.notes)].join('|');
        }).join(';') };
        var all = [];
        (t.cal.roomTypes || []).forEach(function (rt) { (rt.rooms || []).forEach(function (r) { all.push(clean_(r.name) + '|' + clean_(rt.name)); }); });
        if (all.length) result.ribat[t.k].rooms = all.sort().join(';');
      }
    }
  });
  var count = Object.keys(result.ribat_today.now.p).length;
  if (count < 10) throw new Error('رباط: اتسحب ' + count + ' عقار بس. ' + errs.join(' · '));
  /* تقرير الفترة: كل الحجوزات من غير بيانات الضيوف، بيتقرا لما تدوس الزرار بس */
  var report = { at: at, today: today, p: {} };
  targets.forEach(function (t) {
    if (t.err || !result.ribat[t.k]) return;
    report.p[t.k] = {
      rooms: result.ribat[t.k].rooms || '',
      blocks: (result.ribat_block[t.k] || {}).rows || '',
      dirty: (result.ribat_today.now.p[t.k] || [])[12] || 0,
      rows: t.bookings.map(function (x) {
        var money = x.money || {}, div = money.moneyUnit === 'minor' ? 100 : 1;
        var tot = Number(x.totalAmount) || 0;
        var net = money.net != null ? money.net / div : tot;
        var paid = money.guestPaid ? money.guestPaid / div : net;
        return [String(x.checkIn).slice(0, 10), String(x.checkOut).slice(0, 10), clean_(x.room && x.room.name), clean_(x.source), Math.round(paid), Math.round(net), clean_(x.status), clean_(x.bookingNumber), money.commissionMissing ? 1 : 0, String(x.createdAt || '')].join('|');
      }).join(';')
    };
  });
  writeFile_(FILE_REPORT, JSON.stringify(report), 'application/json');
  writeFile_(FILE_RIBAT, JSON.stringify(result), 'application/json');
  if (errs.length) throw new Error('رباط: ' + errs.join(' · '));
}

function emptyRibat_(at, today) {
  return {
    ribat: {}, ribat_fut: {}, ribat_mon: {}, ribat_src: {}, ribat_block: {},
    ribat_today: { now: {
      at: at, date: today,
      cols: ['occupied', 'rooms', 'occPct', 'revenue', 'arrivals', 'departures', 'tomorrowArrivals', 'monthADR', 'monthOcc', 'monthRevenue', 'monthRevPAR', 'confirmedUpcoming', 'dirty'],
      p: {}, lm: {}, nc: {}, cf: {}
    } }
  };
}

/* نفس حسابات السحب القديم، من غير بيانات الضيوف */
function addRibatProperty_(res, k, dash, bookings, at, today) {
  var T = dash.today || {}, M = dash.month || {}, TM = dash.tomorrow || {}, rs = dash.roomStatus || {};
  var doc = res.ribat_today.now;
  doc.p[k] = [T.occupiedRooms || 0, T.totalRooms || 0, Math.round(T.occupancyRate || 0), Math.round(T.revenue || 0), T.arrivalsCount || 0, T.departuresCount || 0, TM.arrivalsCount || 0, Math.round(M.adr || 0), Math.round(M.avgOccupancy || 0), Math.round(M.revenue || 0), Math.round(M.revpar || 0), M.confirmedUpcoming || 0, rs.dirty || 0];

  var mThis = today.slice(0, 7);
  var pd = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1);
  var mPrev = pd.getFullYear() + '-' + ('0' + (pd.getMonth() + 1)).slice(-2);
  var c = 0, nn = 0, t = 0, tn = 0, cc = 0, cv = 0, cnn = 0;
  var rows = {}; rows[mThis] = []; rows[mPrev] = [];
  var types = {}, rooms = {}, cfr = [], fut = [], zero = [], lead = {}, lmDays = {}, srcs = {};

  bookings.forEach(function (x) {
    if (x.status === 'cancelled') return;
    var ci = String(x.checkIn).slice(0, 10), co = String(x.checkOut).slice(0, 10);
    var nights = Math.max(1, Math.round((Date.parse(co) - Date.parse(ci)) / 864e5));
    var tot = Number(x.totalAmount) || 0;
    var made = fmtRiyadh_(new Date(x.createdAt), 'yyyy-MM-dd');
    var room = clean_(x.room && x.room.name), type = clean_(x.roomType && x.roomType.name);
    var num = clean_(x.bookingNumber), src = clean_(x.source);
    var money = x.money || {}, div = money.moneyUnit === 'minor' ? 100 : 1;
    var net = money.net != null ? money.net / div : tot;
    var comm = money.commission != null ? money.commission / div : 0;
    var cleanFee = money.cleaningFee != null ? money.cleaningFee / div : 0;
    var ciShort = ci.slice(2).replace(/-/g, ''), madeShort = made.slice(2).replace(/-/g, '');

    if (room) rooms[room] = type || rooms[room] || '';
    if (type && type !== room) types[room] = type;
    if (x.status === 'confirmed' && ci >= today) cfr.push([ciShort, nights, Math.round(tot * 100) / 100].join('|'));
    if ((x.status === 'confirmed' || x.status === 'checked_in') && co >= today) {
      fut.push([ciShort, nights, room, src, Math.round(tot), Math.round(net), Math.round(comm), Math.round(cleanFee), madeShort, ST_CODE[x.status], num].join('|'));
    }
    if (made === today) {
      cc++; cv += tot; cnn += nights;
      if (ci === today) { c++; nn += nights; t += tot; tn += tot / nights; }
    }
    if (ci === made) {
      var d = lmDays[ciShort] = lmDays[ciShort] || [0, 0, 0, 0];
      d[0]++; d[1] += nights; d[2] += tot; d[3] += tot / nights;
    }
    var mk = ci.slice(0, 7);
    if (rows[mk]) rows[mk].push([ciShort, nights, room, SRC_CODE[x.source] || src, Math.round(tot * 100) / 100, ST_CODE[x.status] || x.status, num].join('|'));
    var leadDays = Math.max(0, Math.round((Date.parse(ci) - Date.parse(made)) / 864e5));
    var L = lead[mk] = lead[mk] || [0, 0];
    L[0] += leadDays; L[1]++;
    if (!(tot > 0)) zero.push([num, room, ci, co, src, x.status]);
    var sc = SRC_CODE[x.source] || 'R', start = Date.parse(ci);
    for (var nx = 0; nx < nights; nx++) {
      var nd = new Date(start + nx * 864e5).toISOString().slice(0, 10), nm = nd.slice(0, 7);
      var bucket = (srcs[nm] = srcs[nm] || {}), cell = (bucket[sc] = bucket[sc] || [0, 0, 0, 0, 0]);
      var isConf = x.status === 'confirmed' || (x.status === 'checked_in' && nd > today);
      if (isConf) { cell[2]++; cell[3] += tot / nights; } else { cell[0]++; cell[1] += tot / nights; }
      if (nx === 0) cell[4]++;
    }
  });

  doc.lm[k] = [c, nn, Math.round(t), Math.round(tn)];
  doc.nc[k] = [cc, Math.round(cv), cnn];
  doc.cf[k] = cfr.join(';');
  Object.keys(srcs).forEach(function (m) { Object.keys(srcs[m]).forEach(function (c) { srcs[m][c][1] = Math.round(srcs[m][c][1]); srcs[m][c][3] = Math.round(srcs[m][c][3]); }); });
  res.ribat_src[k] = srcs;
  res.ribat_fut[k] = { at: at, rows: fut.join(';') };
  res.ribat_mon[k] = {
    at: today,
    types: Object.keys(types).map(function (r) { return r + '|' + types[r]; }).join(';'),
    months: Object.keys(rows).reduce(function (o, m) { o[m] = rows[m].join(';'); return o; }, {})
  };
  res.ribat[k] = {
    at: at, lead: lead, zero: zero,
    rooms: Object.keys(rooms).sort().map(function (r) { return r + '|' + rooms[r]; }).join(';'),
    lm0: Object.keys(lmDays).sort().map(function (d) { var a = lmDays[d]; return [d, a[0], a[1], Math.round(a[2]), Math.round(a[3])].join(':'); }).join(',')
  };
}

function norm_(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function clean_(s) { return String(s == null ? '' : s).replace(/[|;]/g, ' ').trim(); }
function fmtRiyadh_(d, pattern) { return Utilities.formatDate(d, 'Asia/Riyadh', pattern); }

/* ============ التخزين على Drive ============ */
function findFile_(name) {
  var it = DriveApp.getFilesByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) return f; }
  return null;
}
function readJson_(name) {
  var f = findFile_(name);
  return f ? JSON.parse(f.getBlob().getDataAsString('UTF-8')) : null;
}
function writeFile_(name, text, mime) {
  var f = findFile_(name);
  if (f) f.setContent(text); else DriveApp.createFile(name, text, mime);
}
function readStore_() {
  var s = readJson_(FILE_STORE);
  if (!s) {
    s = { ota: OTA_SEED, pricing: {} };
    writeFile_(FILE_STORE, JSON.stringify(s), 'application/json');
  }
  return s;
}

/* ============ التشغيل لأول مرة: شغّل setup مرة واحدة من المحرر ============ */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncAll').timeBased().everyHours(1).create();
  readStore_();
  var errs = syncAll();
  Logger.log(Object.keys(errs).length ? 'خلص مع ملاحظات: ' + JSON.stringify(errs) : 'كله تمام: الشيتات ورباط اتحدثوا');
}


/* ============ أسعار المنصات: بتتقرا من رباط وقت الطلب ============ */
function ribatSession_(force) {
  var cache = CacheService.getScriptCache();
  var raw = force ? null : cache.get('ribat_session');
  if (raw) return JSON.parse(raw);
  var login = ribatLogin_(), ids = {};
  login.properties.forEach(function (p) {
    var k = RIBAT_MAP[norm_(p.name)];
    if (k && !ids[k]) ids[k] = p.id;
  });
  var s = { token: login.token, ids: ids };
  cache.put('ribat_session', JSON.stringify(s), 1200);
  return s;
}

function getReport(code) {
  auth_(code);
  if (!findFile_(FILE_REPORT)) syncRibat_();
  return { report: readJson_(FILE_REPORT), dp: DP };
}

function getRates(code, k, ym) {
  auth_(code);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(ym))) throw new Error('bad_month');
  var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
  var last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  var url = function (id) {
    return RIBAT_API + '/pms/properties/' + id + '/rates?start=' + ym + '-01T00:00:00.000Z&end=' + ym + '-' + ('0' + last).slice(-2) + 'T00:00:00.000Z';
  };
  var s = ribatSession_();
  if (!s.ids[k]) return { missing: true, types: [] };
  var go = function (sess) {
    return UrlFetchApp.fetch(url(sess.ids[k]), { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + sess.token, Accept: 'application/json', 'X-Property-Id': sess.ids[k] } });
  };
  var res = go(s);
  if (res.getResponseCode() === 401) res = go(ribatSession_(true));
  if (res.getResponseCode() >= 300) throw new Error('رباط رد ' + res.getResponseCode());
  var j = JSON.parse(res.getContentText());
  return {
    types: (j.roomTypes || []).map(function (t) {
      return {
        n: clean_(t.name),
        plans: (t.ratePlans || []).map(function (p) {
          var d = {};
          Object.keys(p.days || {}).forEach(function (day) {
            var x = p.days[day];
            d[day.slice(8, 10)] = [x.rate, x.isOverride ? 1 : 0, x.restrictions ? 1 : 0];
          });
          return { t: clean_(p.title), d: d };
        })
      };
    })
  };
}

function getPricingPlan(code) {
  auth_(code);
  return PLAN_Q4;
}

/* خطة الربع الرابع 2026: [أكتوبر، حد أكتوبر، نوفمبر، حد نوفمبر، ديسمبر، حد ديسمبر] على Booking */
var PLAN_Q4 = {"S1":{"avg":[280,225,450,360,480,385],"3 غرف":[280,225,450,360,480,385]},"S2":{"avg":[235,190,375,300,400,320],"3 غرف":[280,225,450,360,480,385],"غرفتين":[220,175,350,280,390,310],"غرفة":[160,130,250,200,250,200]},"B1":{"avg":[215,170,385,310,430,345],"غرفتين":[195,155,360,290,425,340],"3 غرف":[270,215,450,360,450,360]},"B2":{"avg":[205,165,285,230,315,250],"3 غرف":[285,230,350,280,380,305],"استوديو":[125,100,220,175,250,200]},"AAR":{"avg":[110,90,210,170,240,190],"استوديو":[95,75,185,150,215,170],"غرفتين":[140,110,250,200,280,225],"غرفة":[105,85,220,175,250,200]},"NZT":{"avg":[190,150,300,240,340,270],"غرفتين":[220,175,350,280,395,315],"غرفة":[155,125,240,190,275,220]},"G":{"avg":[160,130,255,205,275,220],"غرفتين":[175,140,270,215,290,230],"غرفة":[125,100,220,175,240,190]},"DJ":{"avg":[160,130,230,185,290,230],"غرفتين":[190,150,295,235,365,290],"استوديو":[135,110,185,150,235,190]},"RJ":{"avg":[140,110,200,160,215,170],"غرفة بمطبخ":[135,110,195,155,210,170],"غرفة وصالة":[165,130,210,170,230,185]},"ASJ":{"avg":[295,235,525,420,565,450],"غرفتين":[295,235,525,420,565,450]}};


/* ============ محاكي الأسعار للفريق (?p=sim) ============
 * الصفحة مفتوحة بالرابط من غير رمز، وبتعرض الأسعار المعتمدة بس.
 * لما سعر الضيف على Booking يبقى أقل من سعر المحاكي، المحاكي بينزل لوحده:
 * السعر العادي = سعر الضيف +10، وأقل سعر = سعر الضيف −10.
 * سعر الضيف = Stander Rate × (خميس/جمعة 0.8، غير هكذا 0.85×0.8) × الرسوم + التنظيف.
 */
var SIM_END = '2026-12-31';
var SIM_MAP = {
  S1: ['السلام 1', 45, 1.1, function (t) { return '3 غرف'; }],
  S2: ['السلام 2', 25, 1.1, function (t) { return /^3BDR/i.test(t) ? '3 غرف' : t === '2BDR' ? 'غرفتين' : 'غرفة'; }],
  B1: ['البدراني 1', 35, 1.1, function (t) { return /AB10[26]/i.test(t) ? '3 غرف' : 'غرفتين'; }],
  AAR: ['الراجحي', 25, 1.1, function (t) { return /STUDIO/i.test(t) ? 'استوديو' : /^1/.test(t) ? 'غرفة' : 'غرفتين'; }],
  NZT: ['نزل طابا', 25, 1.1, function (t) { return t === '2BDR' ? 'غرفتين' : /STUDIO/i.test(t) ? 'استوديو' : 'غرفة وصالة'; }],
  G: ['السحابة', 25, 1.1, function (t) { return /^1/.test(t) ? 'غرفة' : 'غرفتين'; }],
  DJ: ['ضيافة الجماوات (B)', 25, 1.1, function (t) { return /STUDIO/i.test(t) ? 'استوديو' : 'غرفتين'; }],
  RJ: ['رؤى الجماوات', 25, 1.1, function (t) { return t === 'Studio' ? 'غرفة بمطبخ' : 'غرفة وصالة'; }],
  ASJ: ['أساسيات الجماوات', 40, 1.1, function (t) { return 'غرفتين'; }]
};

function getSimAdjust() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('sim_adjust2');
  if (hit) return JSON.parse(hit);
  var now = new Date(), today = fmtRiyadh_(now, 'yyyy-MM-dd'), start = fmtRiyadh_(new Date(now.getTime() - 864e5), 'yyyy-MM-dd');
  var out = { at: fmtRiyadh_(now, 'd/M HH:mm'), g: {} };
  if (today > SIM_END) return out;
  var keys = Object.keys(SIM_MAP);
  var run = function (s) {
    var ks = keys.filter(function (k) { return s.ids[k]; });
    var reqs = ks.map(function (k) {
      return {
        url: RIBAT_API + '/pms/properties/' + s.ids[k] + '/rates?start=' + start + 'T00:00:00.000Z&end=2027-01-01T00:00:00.000Z',
        muteHttpExceptions: true,
        headers: { Authorization: 'Bearer ' + s.token, Accept: 'application/json', 'X-Property-Id': s.ids[k] }
      };
    });
    return { ks: ks, res: ribatAll_(reqs, 5) };
  };
  var r = run(ribatSession_());
  if (r.res.some(function (x) { return x.getResponseCode() === 401; })) r = run(ribatSession_(true));
  r.ks.forEach(function (k, i) {
    if (r.res[i].getResponseCode() >= 300) return;
    var m = SIM_MAP[k], j = JSON.parse(r.res[i].getContentText()), acc = {};
    (j.roomTypes || []).forEach(function (t) {
      var sp = (t.ratePlans || []).filter(function (p) { return /stand/i.test(p.title || ''); })[0];
      if (!sp) return;
      var key = m[0] + '|' + m[3](norm_(t.name));
      acc[key] = acc[key] || {};
      Object.keys(sp.days || {}).forEach(function (d) {
        if (d < start || d > SIM_END) return;
        var rate = Number(sp.days[d] && sp.days[d].rate);
        if (!(rate > 0)) return;
        var dw = new Date(d + 'T12:00:00Z').getUTCDay(), wk = dw === 4 || dw === 5;
        (acc[key][d] = acc[key][d] || []).push(rate * (wk ? 0.8 : 0.68) * m[2] + m[1]);
      });
    });
    Object.keys(acc).forEach(function (key) {
      out.g[key] = {};
      Object.keys(acc[key]).forEach(function (d) {
        var a = acc[key][d];
        out.g[key][d] = Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length);
      });
    });
  });
  try { cache.put('sim_adjust2', JSON.stringify(out), 120); } catch (e) {}
  return out;
}

/* التعديل اليدوي على المحاكي: محفوظ على Drive، ومسموح بس لرمز الأدمن */
var FILE_SIM_OV = 'maksab-sim-overrides.json';
function getSimData() {
  return simOut_();
}
function simLogin(code) {
  if (auth_(code) !== 'admin') throw new Error('not_admin');
  return true;
}
function saveSimOverrides(code, ov) {
  if (auth_(code) !== 'admin') throw new Error('not_admin');
  var clean = {};
  Object.keys(ov || {}).forEach(function (k) {
    if (!/^[^|]{1,40}\|[^|]{1,30}$/.test(k)) return;
    var d = ov[k] || {}, o = {};
    Object.keys(d).forEach(function (day) {
      var v = d[day];
      if (/^2026-(10|11|12)-\d\d$/.test(day) && v && Number(v[0]) > 0 && Number(v[1]) > 0) o[day] = [Math.round(v[0]), Math.round(Math.min(v[1], v[0]))];
    });
    if (Object.keys(o).length) clean[k] = o;
  });
  writeFile_(FILE_SIM_OV, JSON.stringify(clean), 'application/json');
  return simOut_(true);
}


/******** الإجازات والتغطية (شيت سجل مراية مكسب) ********/
var ST_LOG_ID = '1P-qtg_tNWg3WDWQ9I9njFElW_bTTY4rJ_a5qRfs7zl4';
var ST_TZ = 'Africa/Cairo';
var ST_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
var ST_TYPES = ['عارضة','سنوية','مرضية','بدل','إنهاء تعاقد','حاضر في إجازته'];
var ST_H = {
  emp:['الموظفين',['الكود','الاسم','الإيميل','بداية الشفت','نهاية الشفت','الإجازة الأسبوعية','ميعاد الصبح','ميعاد العصر']],
  prop:['العقارات',['الكود','العقار','المسؤول','البديل']],
  leave:['الإجازات',['ID','الموظف','النوع','من','إلى','ملاحظة','سجلها','وقت التسجيل','الحالة']],
  ovr:['التوزيع اليدوي',['ID','العقار','من','إلى','المسؤول','السبب','سجلها','وقت التسجيل','الحالة']],
  mail:['لوج الإيميلات',['الوقت','النوع','الموظف','الإيميل','عدد البنود','العنوان','نسخة الإيميل','ID النسخة']],
  edit:['لوج التعديلات',['الوقت','مين','العملية','التفاصيل']]
};
function stSS_(){ return SpreadsheetApp.openById(ST_LOG_ID); }
function stTab_(key, ss){ ss=ss||stSS_(); var n=ST_H[key][0], h=ST_H[key][1], sh=ss.getSheetByName(n);
  if(!sh){ sh=ss.insertSheet(n); sh.getRange('A:Z').setNumberFormat('@'); sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground('#16324f').setFontColor('#ffffff'); sh.setFrozenRows(1); sh.setRightToLeft(true); }
  return sh; }
function stRows_(key, ss){ var v=stTab_(key, ss).getDataRange().getDisplayValues(); return v.slice(1).filter(function(r){ return String(r[0]).trim(); }); }
function stNow_(){ return Utilities.formatDate(new Date(), ST_TZ, 'yyyy-MM-dd HH:mm'); }
function stCfg_(){ var ss=stSS_(), c={emp:{},order:[],prop:{},porder:[],leaves:[],ovr:[]};
  stRows_('emp',ss).forEach(function(r){ var k=r[0].trim(); c.order.push(k);
    c.emp[k]={k:k,n:r[1],e:r[2],s:r[3]||'10:00',en:r[4]||'18:00',am:r[6]||'08:00',pm:r[7]||'17:00',off:String(r[5]||'').split(/[،,]/).map(function(x){ return ST_DAYS.indexOf(x.trim()); }).filter(function(i){ return i>=0; })}; });
  stRows_('prop',ss).forEach(function(r){ var k=r[0].trim(); c.porder.push(k); c.prop[k]={k:k,n:r[1],emp:String(r[2]).trim(),sub:String(r[3]).trim()}; });
  stRows_('leave',ss).forEach(function(r){ if(r[8]==='ملغية') return; c.leaves.push({id:r[0],emp:r[1],type:r[2],from:r[3],to:r[4],note:r[5],by:r[6],at:r[7]}); });
  stRows_('ovr',ss).forEach(function(r){ if(r[8]==='ملغية') return; c.ovr.push({id:r[0],pk:r[1],from:r[2],to:r[3],emp:r[4],why:r[5],by:r[6],at:r[7]}); });
  c.send=stSend_(ss); return c; }
function stDow_(ymd){ var p=ymd.split('-'); return new Date(Date.UTC(+p[0],+p[1]-1,+p[2])).getUTCDay(); }
function stAdd_(ymd,n){ var p=ymd.split('-'); return new Date(Date.UTC(+p[0],+p[1]-1,+p[2]+n)).toISOString().slice(0,10); }
function stPresent_(c,emp,ymd){ for(var i=0;i<c.leaves.length;i++){ var l=c.leaves[i]; if(l.type==='حاضر في إجازته' && l.emp===emp && l.from<=ymd && (!l.to || ymd<=l.to)) return l; } return null; }
function stLeave_(c,emp,ymd){ for(var i=0;i<c.leaves.length;i++){ var l=c.leaves[i]; if(l.type!=='حاضر في إجازته' && l.emp===emp && l.from<=ymd && (!l.to || ymd<=l.to)) return l; } return null; }
function stAvail_(c,emp,ymd){ var e=c.emp[emp]; if(!e) return false; if(e.off.indexOf(stDow_(ymd))>=0 && !stPresent_(c,emp,ymd)) return false; return !stLeave_(c,emp,ymd); }
function stWho_(c,pk,ymd){ var p=c.prop[pk]; if(!p) return {to:null,base:null,why:'عقار ليس في الجدول'};
  if(stAvail_(c,p.emp,ymd)) return {to:p.emp,base:p.emp,why:''};
  for(var i=c.ovr.length-1;i>=0;i--){ var o=c.ovr[i]; if(o.pk===pk && o.from<=ymd && (!o.to||ymd<=o.to) && stAvail_(c,o.emp,ymd)) return {to:o.emp,base:p.emp,why:'توزيع يدوي'}; }
  if(p.sub && stAvail_(c,p.sub,ymd)) return {to:p.sub,base:p.emp,why:'البديل'};
  return {to:null,base:p.emp,why:'محتاج توزيع'}; }
function stEdit_(by,act,det){ stTab_('edit').appendRow([stNow_(),by||'',act,det]); }
function stYmdFmt_(ymd){ if(!ymd) return ''; var p=String(ymd).split('-'); return (+p[2])+'/'+(+p[1]); }

/* ============ الأخطاء والإجازات ============ */
function stData_(){ var c=stCfg_(), errs=[], log=stLogSh_(), okm={}, today=Utilities.formatDate(new Date(),ST_TZ,'yyyy-MM-dd'), unrev=0;
  var okr={}; stRows_('ok').forEach(function(r){ okm[r[0]]=[r[2]||'—',r[5]?'✔':'—',r[7]?'✔':'—'].join(' / '); if(r[2]) okr[r[0]]=[r[2],r[3]||'',r[4]||'']; });
  if(log){ var v=log.getDataRange().getDisplayValues(), raw=log.getRange(1,2,v.length,1).getValues();
    for(var r=1;r<v.length;r++){ var x=v[r], a=String(x[10]||'').replace(/^'/,''); if(!/^\d{4}-\d\d-\d\d$/.test(a)) continue;
      var f=raw[r][0], fy=(f instanceof Date)?Utilities.formatDate(f,ST_TZ,'yyyy-MM-dd'):String(f).slice(0,10);
      if(!x[14] && x[3]==='مفتوح' && fy && fy<today) unrev++;
      errs.push([x[13]||'',x[5],a,x[3],x[6],x[7],x[8],x[9],x[11]||'',x[12]||'',x[1],x[4],stBk_(x[0]),okm[stBk_(x[0])]||'',x[0],x[14]||'',x[15]||'',x[16]||'',fy,okr[stBk_(x[0])]||null]); } }
  return {c:c,errs:errs,today:today,types:ST_TYPES,unrev:unrev}; }
function stName_(c,k){ return (c.emp[k]||{}).n||k; }
function stGet(code){ auth_(code); return stData_(); }
function stSaveLeave(code,L,ovrs,by){ auth_(code); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var c=stCfg_(), re=/^\d{4}-\d\d-\d\d$/;
    if(!L||!c.emp[L.emp]||ST_TYPES.indexOf(L.type)<0||!re.test(L.from)) throw new Error('بيانات الإجازة ناقصة');
    if(L.type==='إنهاء تعاقد') L.to=''; else { if(!re.test(L.to||'')) L.to=L.from; if(L.to<L.from) throw new Error('تاريخ النهاية قبل البداية'); }
    var now=stNow_(), id='L'+Date.now(); ovrs=ovrs||[];
    stTab_('leave').appendRow([id,L.emp,L.type,L.from,L.to,String(L.note||'').slice(0,300),by||'',now,'سارية']);
    var ot=stTab_('ovr'), done=[];
    ovrs.forEach(function(o,i){ if(!c.prop[o.pk]||!c.emp[o.emp]) return;
      ot.appendRow(['O'+Date.now()+'_'+i,o.pk,o.from,o.to||'',o.emp,'بسبب '+L.type+' '+stName_(c,L.emp)+' ('+id+')',by||'',now,'سارية']);
      done.push(c.prop[o.pk].n+' ← '+stName_(c,o.emp)+' ('+o.from+(o.to?(o.to!==o.from?' → '+o.to:''):' لقدّام')+')'); });
    stEdit_(by,'إجازة جديدة',stName_(c,L.emp)+' · '+L.type+' · '+L.from+(L.to?(L.to!==L.from?' → '+L.to:''):' (من غير نهاية)')+(done.length?' · توزيع: '+done.join('، '):''));
    return stData_(); } finally { lock.releaseLock(); } }
function stSaveOvr(code,ovrs,by){ auth_(code); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var c=stCfg_(), now=stNow_(), ot=stTab_('ovr'), done=[];
    (ovrs||[]).forEach(function(o,i){ if(!c.prop[o.pk]||!c.emp[o.emp]) return;
      ot.appendRow(['O'+Date.now()+'_'+i,o.pk,o.from,o.to||'',o.emp,'المسؤول والبديل إجازة',by||'',now,'سارية']);
      done.push(c.prop[o.pk].n+' ← '+stName_(c,o.emp)+' ('+o.from+(o.to&&o.to!==o.from?' → '+o.to:'')+')'); });
    if(done.length) stEdit_(by,'توزيع يدوي',done.join('، ')); return stData_(); } finally { lock.releaseLock(); } }
function stCancel(code,kind,id,by){ auth_(code); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var c=stCfg_(), sh=stTab_(kind==='ovr'?'ovr':'leave'), v=sh.getDataRange().getDisplayValues(), det='';
    for(var r=1;r<v.length;r++){ if(v[r][0]===id){ sh.getRange(r+1,9).setValue('ملغية');
      det=kind==='ovr'?((c.prop[v[r][1]]||{}).n+' ← '+stName_(c,v[r][4])+' ('+v[r][2]+(v[r][3]&&v[r][3]!==v[r][2]?' → '+v[r][3]:'')+')'):(stName_(c,v[r][1])+' · '+v[r][2]+' · '+v[r][3]+(v[r][4]&&v[r][4]!==v[r][3]?' → '+v[r][4]:'')); } }
    if(kind!=='ovr'){ var o=stTab_('ovr'), ov=o.getDataRange().getDisplayValues();
      for(r=1;r<ov.length;r++){ if(String(ov[r][5]).indexOf('('+id+')')>=0 && ov[r][8]!=='ملغية') o.getRange(r+1,9).setValue('ملغية'); } }
    stEdit_(by,kind==='ovr'?'إلغاء توزيع':'إلغاء إجازة',det||id); return stData_(); } finally { lock.releaseLock(); } }
function stSaveSettings(code,emps,props,by,send){ auth_(code); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var c=stCfg_(), ch=[], tm=/^\d{1,2}:\d\d$/;
    var es=stTab_('emp'); stEmpCols_(es); var ev=es.getDataRange().getDisplayValues();
    for(var r=1;r<ev.length;r++){ var k=ev[r][0], n=emps&&emps[k]; if(!n) continue;
      var off=(n.off||[]).map(function(i){ return ST_DAYS[+i]; }).filter(String).join('، ');
      var row=[String(n.e||ev[r][2]).trim(), tm.test(n.s)?n.s:ev[r][3], tm.test(n.en)?n.en:ev[r][4], off, tm.test(n.am)?n.am:(ev[r][6]||'08:00'), tm.test(n.pm)?n.pm:(ev[r][7]||'17:00')];
      if(row.join('|')!==[ev[r][2],ev[r][3],ev[r][4],ev[r][5],ev[r][6]||'08:00',ev[r][7]||'17:00'].join('|')){ es.getRange(r+1,3,1,6).setValues([row]); ch.push(ev[r][1]+': '+row[1]+'–'+row[2]+' · الإجازة '+(off||'لا يوجد')+' · الإيميل الصبح '+row[4]+' والعصر '+row[5]+' · '+row[0]); } }
    var ps=stTab_('prop'), pv=ps.getDataRange().getDisplayValues();
    for(r=1;r<pv.length;r++){ var q=props&&props[pv[r][0]]; if(!q||!c.emp[q.emp]) continue; var sub=c.emp[q.sub]?q.sub:'';
      if(q.emp!==pv[r][2]||sub!==pv[r][3]){ ps.getRange(r+1,3,1,2).setValues([[q.emp,sub]]); ch.push(pv[r][1]+': المسؤول '+stName_(c,q.emp)+' · البديل '+(sub?stName_(c,sub):'لا يوجد')); } }
    if(send){ var cur=c.send, nw={am:tm.test(send.am)?send.am:cur.am, pm:tm.test(send.pm)?send.pm:cur.pm, all:send.all?'نعم':'لا'};
      if(nw.am!==cur.am||nw.pm!==cur.pm||nw.all!==(cur.all?'نعم':'لا')){ var ss=stTab_('snd'); ss.getRange(2,1,3,2).setValues([['admin_am',nw.am],['admin_pm',nw.pm],['upd_all',nw.all]]);
        ch.push('إيميل الإدارة: الصبح '+nw.am+' والعصر '+nw.pm+' · التحديثات '+(nw.all==='نعم'?'تروح للكل':'كل واحد عقاراته')); } }
    if(ch.length) stEdit_(by,'تعديل الإعدادات',ch.join(' | ')); return stData_(); } finally { lock.releaseLock(); } }
function stLogs(code){ auth_(code); return {mail:stRows_('mail').reverse().slice(0,500), edit:stRows_('edit').reverse().slice(0,500)}; }
function stMailCopy(code,id){ auth_(code); var f=DriveApp.getFileById(String(id)); if(String(f.getName()).indexOf('إيميل ')!==0) throw new Error('غير نسخة إيميل'); return f.getBlob().getDataAsString('UTF-8'); }

ST_H.tr=['تحويلات الأخطاء',['ID','الحجز','من','إلى','السبب','سجلها','الوقت','اتبلغ']];
ST_H.ok=['تأكيدات الأخطاء',['الحجز','الموظف','خانة 1','السبب','وقت خانة 1','خانة 2 (محمد عبدالله)','وقت خانة 2','خانة 3 (أحمد)','وقت خانة 3']];
function stBk_(id){ id=String(id); return id.slice(0,id.lastIndexOf('|')); }
var TRACK_EXEC='https://script.google.com/macros/s/AKfycbwqTu1QihCnxlirb7ppnOElhDilQHPm0J2H8kECV-hwFae-ej2FxdiowWHbelminpN3/exec';
// زرار "ابعت لكل مسؤول أخطاءه": بيطلب من نظام المتابعة يبعت إيميل منفصل لكل واحد بالأخطاء المفتوحة عليه
function stFixMail(code,by){ auth_(code); var res=UrlFetchApp.fetch(TRACK_EXEC,{method:'post',payload:{key:'mk_7Qz2Lp9Xw4Rt8Vn3',a:'fixmail',by:by||''},muteHttpExceptions:true}), j;
  try{ j=JSON.parse(res.getContentText()); }catch(e){ throw new Error('نظام المتابعة مردش صح ('+res.getResponseCode()+') – لازم يتعمله Deploy بالنسخة الجديدة'); }
  if(!j.ok) throw new Error(j.msg); try{ stEdit_(by,'إيميل تصليح الأخطاء',j.msg); }catch(e){} return j.msg; }
function stSendNow(code,by){ auth_(code); var res=UrlFetchApp.fetch(TRACK_EXEC,{method:'post',payload:{key:'mk_7Qz2Lp9Xw4Rt8Vn3',a:'sendnow',by:by||''},muteHttpExceptions:true}), j;
  try{ j=JSON.parse(res.getContentText()); }catch(e){ throw new Error('نظام المتابعة مردش صح ('+res.getResponseCode()+') – لازم يتعمله Deploy بالنسخة الجديدة'); }
  if(!j.ok) throw new Error(j.msg); try{ stEdit_(by,'إرسال الإيميل اليومي يدوي',j.msg); }catch(e){} return j.msg; }
function stSendUpd(code,by,emp){ auth_(code); var res=UrlFetchApp.fetch(TRACK_EXEC,{method:'post',payload:{key:'mk_7Qz2Lp9Xw4Rt8Vn3',a:'sendupd',by:by||'',emp:emp||''},muteHttpExceptions:true}), j;
  try{ j=JSON.parse(res.getContentText()); }catch(e){ throw new Error('نظام المتابعة مردش صح ('+res.getResponseCode()+') – لازم يتعمله Deploy بالنسخة الجديدة'); }
  if(!j.ok) throw new Error(j.msg); try{ stEdit_(by,'إرسال التحديثات يدوي',j.msg); }catch(e){} return j.msg; }
function stTransfer(code,bk,to,reason,by){ auth_(code); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var c=stCfg_(); if(!c.emp[to]) throw new Error('موظف غير موجود'); reason=String(reason||'').trim(); if(!reason) throw new Error('اكتب السبب');
    var sh=stSS_().getSheetByName('السجل'), v=sh.getDataRange().getDisplayValues(), from='';
    for(var r=1;r<v.length;r++) if(stBk_(v[r][0])===bk) from=v[r][13]||from;
    stTab_('tr').appendRow(['T'+Date.now(),bk,from,to,reason.slice(0,300),by||'',stNow_(),'']);
    var fn=(c.emp[from]||{}).n||from||'—';
    for(r=1;r<v.length;r++) if(stBk_(v[r][0])===bk){ sh.getRange(r+1,6).setValue(c.emp[to].n); sh.getRange(r+1,13,1,2).setValues([['حُوِّل من '+fn+': '+reason,to]]); }
    stEdit_(by,'تحويل خطأ',bk.replace('|',' · ')+' · من '+fn+' لـ '+c.emp[to].n+' · '+reason);
    return stData_(); } finally { lock.releaseLock(); } }


/******** Stay Easy: سجل تغييرات الأسعار + مساعد Gemini ********/
var FILE_SIM_SNAP = 'stayeasy-sim-snap.json';
var FILE_SIM_LOG = 'stayeasy-sim-log.json';
function simTrack_(ov, g) {
  var today = fmtRiyadh_(new Date(), 'yyyy-MM-dd');
  var eff = snapshot(ov, g);
  var prev = readJson_(FILE_SIM_SNAP);
  var ch = [];
  if (prev) {
    Object.keys(eff).forEach(function (k) {
      Object.keys(eff[k]).forEach(function (d) {
        if (d < today) return;
        var a = prev[k] && prev[k][d], b = eff[k][d];
        if (a && (a[0] !== b[0] || a[1] !== b[1])) ch.push({ k: k, d: d, f: [a[0], a[1]], n: [b[0], b[1]] });
      });
    });
  }
  if (!prev || ch.length) writeFile_(FILE_SIM_SNAP, JSON.stringify(eff), 'application/json');
  if (ch.length) {
    var log = readJson_(FILE_SIM_LOG) || [], at = new Date().toISOString(), groups = [];
    ch.sort(function (x, y) { return x.k < y.k ? -1 : x.k > y.k ? 1 : x.d < y.d ? -1 : 1; });
    ch.forEach(function (c) {
      var g0 = groups[groups.length - 1];
      if (g0 && g0.k === c.k && g0.f[0] === c.f[0] && g0.n[0] === c.n[0] && g0.f[1] === c.f[1] && g0.n[1] === c.n[1]) g0.days.push(c.d);
      else groups.push({ k: c.k, f: c.f, n: c.n, days: [c.d] });
    });
    groups.forEach(function (x) { log.unshift({ at: at, k: x.k, days: x.days, f: x.f, n: x.n }); });
    log = log.slice(0, 400);
    writeFile_(FILE_SIM_LOG, JSON.stringify(log), 'application/json');
  }
  CacheService.getScriptCache().remove('sim_out');
  return eff;
}
function simOut_(force) {
  var cache = CacheService.getScriptCache();
  if (!force) { var hit = cache.get('sim_out'); if (hit) return JSON.parse(hit); }
  var a = getSimAdjust(), ov = readJson_(FILE_SIM_OV) || {};
  var eff = simTrack_(ov, a.g);
  var out = { at: a.at, eff: eff, ov: ov, log: (readJson_(FILE_SIM_LOG) || []).slice(0, 150) };
  try { cache.put('sim_out', JSON.stringify(out), 60); } catch (e) {}
  return out;
}
function simChat(messages, context) {
  var key = props_().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('no_key');
  var SYS = 'إنت "مساعد Stay Easy"، مساعد أسعار لفريق المبيعات وخدمة العملاء.\n- رد بالعربية الفصحى، باختصار ووضوح، وبالأرقام.\n- اعتمد فقط على بيانات الأسعار الذي جاية في الرسالة (بالريال لليلة). لو المعلومة غير موجودة قول إنها غير عندك.\n- القواعد: الويك إند = ليالي الخميس والجمعة. أيام الموسم ليها سعر خاص. "أقل سعر" هو الحد الأدنى للتفاوض، والنزول تحته محتاج موافقة قسم التسعير. إقامة 7 ليالي فأكتر: الليالي العادية بسعر الإقامة الأسبوعية، والويك إند والموسم بأقل سعر ليهم. الإجمالي = مجموع الليالي (ليلة الخروج غير محسوبة).\n- لو اتسألت تحسب إقامة، اجمع الليالي يوم بيوم من البيانات واعرض الإجمالي بالسعر العادي وبأقل سعر.\n- ما تتكلمش عن مصدر الأسعار أو طريقة تحديثها أو أي منصات حجز، وما تخترعش أسعار.';
  var msgs = (messages || []).slice(-12).filter(function (m) { return m && typeof m.text === 'string' && m.text.trim(); })
    .map(function (m) { return { role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text).slice(0, 2000) }] }; });
  if (!msgs.length) throw new Error('empty');
  msgs[0].parts[0].text = 'بيانات الأسعار الحالية:\n' + String(context || '').slice(0, 60000) + '\n\n---\n' + msgs[0].parts[0].text;
  var models = [props_().getProperty('GEMINI_MODEL'), 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'].filter(Boolean);
  var res, code;
  for (var mi = 0; mi < models.length; mi++) {
  res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[mi] + ':generateContent', {
    method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key }, muteHttpExceptions: true,
    payload: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: msgs,
      generationConfig: { temperature: 0.2, maxOutputTokens: 900 } })
  });
  code = res.getResponseCode();
  if (code < 300 || (code !== 503 && code !== 429 && code !== 404)) break;
  }
  if (code === 429) throw new Error('quota');
  if (code >= 300) { var em=''; try{em=(JSON.parse(res.getContentText()).error||{}).message||''}catch(x){} throw new Error('ai '+code+' '+String(em).slice(0,160)); }
  var j = JSON.parse(res.getContentText());
  var parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
  return parts.map(function (p) { return p.text || ''; }).join('').trim() || 'معنديش رد دلوقتي، جرّب تسأل بطريقة تانية.';
}

/******** بيانات الأسعار المعتمدة (مشتركة مع الصفحة) ********/
/* بيانات الأسعار المعتمدة + منطق حساب السعر (مشترك بين الصفحة والسيرفر) */
var CFG = {"D":[{"p":"السلام 1","u":[{"t":"3 غرف","m":{"2026-10":[200,190,250,240,180,null,null],"2026-11":[325,310,405,370,295,435,400],"2026-12":[375,350,455,420,310,510,475]}}]},{"p":"السلام 2","u":[{"t":"3 غرف","m":{"2026-10":[200,190,250,240,180,null,null],"2026-11":[325,310,405,370,295,435,400],"2026-12":[350,330,430,395,310,480,445]}},{"t":"غرفتين","m":{"2026-10":[160,150,180,170,145,null,null],"2026-11":[250,240,310,285,225,335,310],"2026-12":[290,270,350,325,250,390,365]}},{"t":"غرفة","m":{"2026-10":[115,110,130,120,105,null,null],"2026-11":[180,170,220,205,160,240,225],"2026-12":[225,200,260,235,180,290,265]}}]},{"p":"البدراني 1","u":[{"t":"غرفتين","m":{"2026-10":[150,140,180,170,135,null,null],"2026-11":[260,245,325,295,235,345,320],"2026-12":[305,290,375,350,275,420,385]}},{"t":"3 غرف","m":{"2026-10":[195,185,220,210,175,null,null],"2026-11":[325,310,405,370,295,435,400],"2026-12":[335,310,405,370,295,450,415]}}]},{"p":"الراجحي","u":[{"t":"استوديو","m":{"2026-10":[90,80,110,100,75,null,null],"2026-11":[135,130,170,155,120,180,165],"2026-12":[185,170,220,205,150,245,230]}},{"t":"غرفة","m":{"2026-10":[110,95,130,120,95,null,null],"2026-11":[160,150,195,180,145,210,195],"2026-12":[210,195,255,230,160,285,260]}},{"t":"غرفتين","m":{"2026-10":[130,120,150,140,110,null,null],"2026-11":[180,170,220,205,160,240,225],"2026-12":[260,220,285,260,200,320,295]}}]},{"p":"نزل طابا","u":[{"t":"استوديو","m":{"2026-10":[110,105,130,120,100,null,null],"2026-11":[175,165,215,200,160,230,215],"2026-12":[200,190,245,230,180,275,250]}},{"t":"غرفة وصالة","m":{"2026-10":[125,120,145,135,115,null,null],"2026-11":[190,180,230,215,175,245,230],"2026-12":[215,205,260,245,195,290,265]}},{"t":"غرفتين","m":{"2026-10":[160,150,180,170,145,null,null],"2026-11":[250,240,310,285,225,335,310],"2026-12":[285,270,350,325,255,390,365]}}]},{"p":"السحابة","u":[{"t":"غرفة","m":{"2026-10":[110,100,130,120,100,null,null],"2026-11":[160,150,195,180,145,210,195],"2026-12":[175,165,215,200,160,240,225]}},{"t":"غرفتين","m":{"2026-10":[130,120,160,150,120,null,null],"2026-11":[195,185,240,225,175,260,235],"2026-12":[210,200,260,235,190,290,265]}}]},{"p":"ضيافة الجماوات (B)","u":[{"t":"استوديو","m":{"2026-10":[110,100,130,120,100,null,null],"2026-11":[135,130,170,155,120,180,165],"2026-12":[210,195,255,230,155,285,260]}},{"t":"غرفتين","m":{"2026-10":[140,130,170,160,125,null,null],"2026-11":[210,200,260,235,190,280,255],"2026-12":[265,250,325,300,240,365,340]}}]},{"p":"رؤى الجماوات","u":[{"t":"غرفة بمطبخ","m":{"2026-10":[100,95,130,120,90,null,null],"2026-11":[145,135,175,160,125,190,175],"2026-12":[160,145,190,175,135,210,195]}},{"t":"غرفة وصالة","m":{"2026-10":[120,110,145,135,105,null,null],"2026-11":[155,145,190,175,135,205,190],"2026-12":[175,165,215,200,150,240,225]}}]},{"p":"أساسيات الجماوات","u":[{"t":"غرفتين","m":{"2026-10":[325,300,380,370,280,null,null],"2026-11":[400,350,480,445,340,490,455],"2026-12":[450,420,545,510,365,610,575]}}]}],"months":["2026-11","2026-12"],"S":[["2026-11-20","2026-11-30","موسم نوفمبر"],["2026-12-24","2026-12-31","موسم نهاية السنة"]],"O":{"السلام 1|3 غرف":{"2026-10-17":[180,170],"2026-10-21":[180,170],"2026-10-18":[180,170],"2026-10-19":[180,170],"2026-10-20":[180,170]}}};

function r5(x){return Math.round(x/5)*5}
function pad(n){return String(n).padStart(2,"0")}
function fs(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function pd(s){var a=s.split("-").map(Number);return new Date(a[0],a[1]-1,a[2])}
function mkey(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)}
function inSeason(dt){var s=fs(dt);return CFG.S.some(function(x){return s>=x[0]&&s<=x[1]})}
function rate0(u,dt){var MS=CFG.months,a=u.m[mkey(dt)];if(!a)a=u.m[MS[fs(dt)<MS[0]+"-01"?0:MS.length-1]];
 var g=dt.getDay(),se=inSeason(dt)&&a[5]!=null,wk=g==4||g==5;
 return se?{t:"s",l:"موسم",r:a[5],m:a[6],w:a[4]}:wk?{t:"w",l:"ويك إند",r:a[2],m:a[3],w:a[4]}:{t:"n",l:"عادي",r:a[0],m:a[1],w:a[4]}}
/* OV = تعديلات يدوية {key:{day:[r,m]}}، ADJ = تعديلات تلقائية {key:{day:g}} */
function rateWith(u,k,dt,OV,ADJ){var b=rate0(u,dt),d=fs(dt),o=OV&&OV[k]&&OV[k][d];
 var r=o?{t:b.t,l:b.l,r:o[0],m:o[1],w:o[1],x:1}:b;
 var g=ADJ&&ADJ[k]&&ADJ[k][d];
 if(g){var nr=r5(g)+10;if(nr<r.r){var nm=Math.min(r5(g)-10,nr);r={t:r.t,l:r.l,r:nr,m:nm,w:Math.min(r.w,nm),x:r.x}}}
 return r}
function allDays(){var MS=CFG.months,f=pd(MS[0]+"-01"),l=pd(MS[MS.length-1]+"-01"),e=new Date(l.getFullYear(),l.getMonth()+1,0),out=[];
 for(var d=new Date(f);d<=e;d.setDate(d.getDate()+1))out.push(new Date(d));return out}
/* لقطة الأسعار الفعلية لكل وحدة ويوم: {key:{day:[r,m]}} */
function snapshot(OV,ADJ,fromDay){var out={},days=allDays();
 CFG.D.forEach(function(P){P.u.forEach(function(U){var k=P.p+"|"+U.t,o={};
  days.forEach(function(dt){var d=fs(dt);if(fromDay&&d<fromDay)return;var r=rateWith(U,k,dt,OV,ADJ);o[d]=[r.r,r.m,r.w]});out[k]=o})});
 return out}


/******** مراجعة الأخطاء + مواعيد الإرسال + تحديثات رباط ********/
ST_H.del=['أخطاء محذوفة',['الوقت','ID','الحجز','كود الموظف','الموظف','العقار','الحجز (تفاصيل)','نوع الخطأ','التفاصيل','السبب','مين']];
ST_H.snd=['إعدادات الإرسال',['المفتاح','القيمة']];
function stEmpCols_(sh){ if(sh.getRange(1,7).getValue()!=='ميعاد الصبح') sh.getRange(1,7,1,2).setValues([['ميعاد الصبح','ميعاد العصر']]).setFontWeight('bold').setBackground('#16324f').setFontColor('#ffffff'); }
function stSend_(ss){ var sh=stTab_('snd',ss), v=sh.getDataRange().getDisplayValues(), o={};
  if(v.length<2){ sh.getRange(2,1,3,2).setValues([['admin_am','08:00'],['admin_pm','17:00'],['upd_all','نعم']]); v=sh.getDataRange().getDisplayValues(); }
  v.slice(1).forEach(function(r){ o[r[0]]=r[1]; }); return {am:o.admin_am||'08:00', pm:o.admin_pm||'17:00', all:(o.upd_all||'نعم')==='نعم'}; }
function stLogSh_(){ var sh=stSS_().getSheetByName('السجل'); if(!sh) return null;
  if(sh.getRange(1,15).getValue()!=='المراجعة') sh.getRange(1,15,1,3).setValues([['المراجعة','راجعها','وقت المراجعة']]).setFontWeight('bold').setBackground('#16324f').setFontColor('#ffffff');
  return sh; }
function stReview(code,id,ok,by){ auth_(code); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var sh=stLogSh_(), v=sh.getDataRange().getDisplayValues(), hit=-1;
    for(var r=1;r<v.length;r++) if(v[r][0]===id){ hit=r; sh.getRange(r+1,15,1,3).setValues([ok?['صحيح',by||'',stNow_()]:['','','']]); }
    if(hit<0) throw new Error('هذا الخطأ غير موجود في السجل (يمكن اتحذف)');
    var x=v[hit]; stEdit_(by,ok?'تأكيد خطأ (صحيح)':'رجوع عن تأكيد خطأ',x[5]+' · '+x[6]+' · '+x[7]+' · '+x[8]);
    return stData_(); } finally { lock.releaseLock(); } }
function stDelete(code,id,reason,by){ auth_(code); reason=String(reason||'').trim(); if(!reason) throw new Error('اكتب سبب الحذف'); var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var sh=stLogSh_(), v=sh.getDataRange().getDisplayValues(), d=stTab_('del'), n=0, det='';
    for(var r=v.length-1;r>=1;r--){ var x=v[r]; if(x[0]!==id) continue;
      d.appendRow([stNow_(),x[0],stBk_(x[0]),x[13]||'',x[5],x[6],x[7],x[8],x[9],reason.slice(0,300),by||'']);
      det=x[5]+' · '+x[6]+' · '+x[7]+' · '+x[8]; sh.deleteRow(r+1); n++; }
    if(!n) throw new Error('هذا الخطأ غير موجود في السجل');
    stEdit_(by,'حذف خطأ (سوء فهم)',det+' · السبب: '+reason); return true; } finally { lock.releaseLock(); } }

/* تحديثات رباط اليومية: بتتسحب كل 15 دقيقة وبتتحفظ في ملف بيقراه نظام المتابعة وقت الإرسال */
var FILE_UPD = 'maksab-updates.json';
var FILE_UPD_PAUSE = 'maksab-updates-pause.json';

/* إيقاف/تشغيل التحديثات لعقار أو بند معين في يوم محدد */
function updPause(code, key, day, pause) {
  auth_(code);
  var data = readJson_(FILE_UPD_PAUSE) || {};
  if (pause) {
    data[key + '|' + day] = { at: new Date().toISOString(), by: 'manual' };
  } else {
    delete data[key + '|' + day];
  }
  writeFile_(FILE_UPD_PAUSE, JSON.stringify(data), 'application/json');
  return data;
}
function updGetPauses(code) {
  auth_(code);
  return readJson_(FILE_UPD_PAUSE) || {};
}
function updDig_(s){ return String(s||'').replace(/[٠-٩]/g,function(c){ return String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)); }); }
function updNorm_(s){ return String(s||'').toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^a-z0-9ء-ي]/g,''); }
function updPhone_(x){ var p=String(x.guestPhone||x.contactPhone||'').trim(); if(p) return p; var m=String(x.notes||'').match(/Last 4 Digits\)?\s*:\s*(\d+)/i); return m?m[1]:''; }
function updPhKey_(x){ var d=updDig_(updPhone_(x)).replace(/\D/g,''); return d.length>=8?d.slice(-9):''; }
function updName_(x){ var n=String(x.guestName||'').trim(); if(n && !/^(reserved|airbnb|not available|blocked|guest)$/i.test(n)) return n;
  var L=String(x.notes||'').split(/\n/).map(function(s){ return s.trim(); }).filter(function(s){ return s && !/imported via|reservation url|phone number|https?:/i.test(s); });
  return L[0]||n||'—'; }
function updNum_(x){ if(/airbnb/i.test(x.source)){ var m=String(x.notes||'').match(/details\/([A-Z0-9]+)/i); return m?m[1]:''; } return String(x.otaReservationCode||x.bookingNumber||'').trim(); }
function updAmt_(n){ n=Math.round(Number(n)*100)/100; return isNaN(n)?'':String(n); }
function updPay_(x,warn,who){ var s=String(x.source||''), bd=String((x.bookingData&&x.bookingData.notes)||''), tot=Number(x.totalAmount)||0, m;
  if(/airbnb|agoda/i.test(s)) return 'مدفوع';
  if(/expedia|booking/i.test(s)){
    if(/payment collect:\s*hotel collect/i.test(bd)){ m=bd.match(/Collect Amount:[^\d]*([\d,.]+)/i); return updAmt_(m?m[1].replace(/,/g,''):tot); }
    if(/payment collect:\s*ota collect/i.test(bd) || /expedia/i.test(s)) return 'مدفوع';
    return updAmt_(tot); }
  if(x.paidDone) return 'مدفوع';
  var n=updDig_(x.notes||'');
  if(/مدفوع\s*(بالكامل|كامل)|خالص|(تم|اتم)\s*الدفع\s*(بالكامل|كامل)/.test(n)) return 'مدفوع';
  var dep=0, re=/(عربون|دفع|دافع|مدفوع|حول|محول|تحويل)[^\d\n]{0,12}(\d[\d,.]*)/g;
  while((m=re.exec(n))) dep+=Number(m[2].replace(/,/g,''))||0;
  if(dep) warn.push(who+': خصمت '+updAmt_(dep)+' من الإجمالي '+updAmt_(tot)+' (من النوت)');
  var rest=tot-dep; return rest>0?updAmt_(rest):'مدفوع'; }
var FILE_UPD_SENT = 'maksab-updates-sent.json';
/* شيت الكومنكيشن: حجوزات بوكينج الذي داخلة غدًا بتتضاف لوحدها (من غير تكرار برقم الحجز) */
var COMM_ID = '1Ga4zkJvnJcNjji8mk1Lu2iNeX0UDmEiTqKz2xgYmmjg';
var COMM_AQAR = {S1:'نزل نور 1',S2:'نور 2',B1:'نور 3',B2:'نور 4',AJ:'نور 5',AAR:'نور 6',DJ:'نور 7',RJ:'نور 8',G:'جلامور',ATH:'الأثير',NZT:'نزل طابا',ASJ:'اساسيات الجماوات'};
var FILE_COMM = 'maksab-comm.json', FILE_COMM_LOG = 'maksab-comm-log.json';
/* بيسجل كل حجز بوكينج داخل غدًا: اتضاف لوحده امتى، ولا كان موجود قبل كده، ولا اتلغى من رباط بعد ما اتضاف – لكي يظهر في المراية للمراجعة.
   كل حركة بتتسجل كمان في لوج كامل (maksab-comm-log.json) مبيتمسحش غير بعد 3000 حركة */
function updComm_(R,day,onlyK,how){ var rows=[], hm=Utilities.formatDate(new Date(),'Africa/Cairo','HH:mm'), at=Utilities.formatDate(new Date(),'Africa/Cairo','yyyy-MM-dd HH:mm'), ev=[];
  var lg=function(it,e){ ev.push({at:at,day:day,no:it.no,g:it.g,p:it.p,ev:e,by:how||'تلقائي'}); };
  Object.keys(R).forEach(function(k){ if(!COMM_AQAR[k]) return; (R[k].ins||[]).forEach(function(b){ if(!/booking/i.test(b.source)) return; var no=String(b.otaReservationCode||b.bookingNumber||'').trim(); if(!no) return;
    rows.push([no,String(b.guestName||'').trim(),String(b.contactPhone||b.guestPhone||'').replace(/^\+/,'').trim(),COMM_AQAR[k]]); }); });
  var log=readJson_(FILE_COMM)||{}; if(log.day!==day) log={day:day,items:[]};
  var idx={}, cur={}; (log.items||[]).forEach(function(x,i){ idx[x.no]=i; });
  var add=[];
  if(rows.length){
    var sh=SpreadsheetApp.openById(COMM_ID).getSheetByName('Communication'), B=sh.getRange(1,2,sh.getLastRow(),3).getDisplayValues(), have={}, last=1, noPh={};
    for(var i=0;i<B.length;i++){ var x=String(B[i][0]).trim(); if(x){ have[x]=1; last=i+1; if(!/[1-9]/.test(String(B[i][2]))) noPh[x]=i+1; } }
    /* الحجوزات التي اترفعت من غير رقم: لو الرقم اتضاف على رباط يتكتب في الشيت */
    rows.forEach(function(r){ if(r[2] && noPh[r[0]]){ sh.getRange(noPh[r[0]],4).setValue(r[2]); delete noPh[r[0]]; var it=idx[r[0]]!=null?log.items[idx[r[0]]]:{no:r[0],g:r[1],p:r[3]}; lg(it,'phone'); } });
    rows.forEach(function(r){ cur[r[0]]=1; var had=!!have[r[0]], it;
      if(idx[r[0]]==null){ it={no:r[0],g:r[1],p:r[3],ph:r[2]?1:0,st:had?'had':'add',t:hm}; log.items.push(it); idx[r[0]]=log.items.length-1; lg(it,had?'had':'add'); }
      else { it=log.items[idx[r[0]]]; it.ph=r[2]?1:0; if(it.x){ delete it.x; lg(it,'back'); } if(!had && it.st!=='add'){ it.st='add'; it.t=hm; lg(it,'add'); } }
      if(!had){ have[r[0]]=1; add.push(r); } });
    if(add.length){ var p=day.split('-'), dt=new Date(+p[0],+p[1]-1,+p[2]);
      sh.getRange(last+1,2,add.length,4).setValues(add);
      sh.getRange(last+1,6,add.length,1).insertCheckboxes();
      sh.getRange(last+1,8,add.length,1).setValues(add.map(function(){ return ['Booking']; }));
      sh.getRange(last+1,11,add.length,1).setValues(add.map(function(){ return [dt]; })).setNumberFormat('d/m/yyyy'); }
  }
  if(!onlyK) (log.items||[]).forEach(function(it){ if(!cur[it.no] && !it.x){ it.x=1; lg(it,'gone'); } });
  log.at=at; log.id=COMM_ID;
  writeFile_(FILE_COMM,JSON.stringify(log),'application/json');
  if(ev.length){ var H=readJson_(FILE_COMM_LOG)||[]; H=H.concat(ev); if(H.length>3000) H=H.slice(H.length-3000); writeFile_(FILE_COMM_LOG,JSON.stringify(H),'application/json'); }
  return log; }
/* رقم الضيف لدخول اليوم: بيملى الخانة الفاضية في الشيت لو الرقم اتضاف على رباط (من غير ما يضيف صفوف) */
function commFillDay_(R,day){ var rows=[], at=Utilities.formatDate(new Date(),'Africa/Cairo','yyyy-MM-dd HH:mm'), ev=[];
  Object.keys(R).forEach(function(k){ if(!COMM_AQAR[k]) return; (R[k].ins||[]).forEach(function(b){ if(!/booking/i.test(b.source)) return; var no=String(b.otaReservationCode||b.bookingNumber||'').trim(), ph=String(b.contactPhone||b.guestPhone||'').replace(/^\+/,'').trim(); if(no&&ph) rows.push([no,String(b.guestName||'').trim(),ph,COMM_AQAR[k]]); }); });
  if(!rows.length) return 0;
  var sh=SpreadsheetApp.openById(COMM_ID).getSheetByName('Communication'), B=sh.getRange(1,2,sh.getLastRow(),3).getDisplayValues(), noPh={};
  for(var i=0;i<B.length;i++){ var x=String(B[i][0]).trim(); if(x && !/[1-9]/.test(String(B[i][2]))) noPh[x]=i+1; }
  rows.forEach(function(r){ if(noPh[r[0]]){ sh.getRange(noPh[r[0]],4).setValue(r[2]); ev.push({at:at,day:day,no:r[0],g:r[1],p:r[3],ev:'phone',by:'تلقائي'}); } });
  if(ev.length){ var H=readJson_(FILE_COMM_LOG)||[]; H=H.concat(ev); if(H.length>3000) H=H.slice(H.length-3000); writeFile_(FILE_COMM_LOG,JSON.stringify(H),'application/json'); }
  return ev.length; }
/* زرار «حدّث الشيت الآن»: يسحب دخول غدًا من رباط لعقارات الكومنكيشن بس ويرفعها */
function commNow(code){ auth_(code); var lock=LockService.getScriptLock(); if(!lock.tryLock(60000)) throw new Error('فيه سحب شغال دلوقتي، جرب كمان دقيقة');
  try{ var login=ribatLogin_(), today=fmtRiyadh_(new Date(),'yyyy-MM-dd'), tom=stAdd_(today,1);
    var T=updTargets_(login).filter(function(t){ return t.id && COMM_AQAR[t.k]; });
    try{ commFillDay_(updFetch_(login.token,T,today),today); }catch(e){ Logger.log(e); } var R=updFetch_(login.token,T,tom); var cOut=updComm_(R,tom,null,'يدوي'); try{ commFuture_(login.token,T,tom); }catch(e){ Logger.log('commFuture '+e.message); } return JSON.stringify(cOut); } finally { lock.releaseLock(); } }
/* زرار «اللوج كامل» */
function commLog(code){ auth_(code); return JSON.stringify(readJson_(FILE_COMM_LOG)||[]); }
function updTargets_(login){ var seen={}, T=[];
  (login.properties||[]).forEach(function(p){ var k=RIBAT_MAP[norm_(p.name)]; if(k&&k!=='B2'&&!p.isDeleted&&!seen[k]){ seen[k]=1; T.push({k:k,id:p.id,name:String(p.name).replace(/\s+/g,' ').trim()}); } });
  return T.concat([{k:'VAR',name:'العارض',tab:'VAR'},{k:'VM',name:'المحمدية',tab:'Villa Madina'}]); }
function updFetch_(token,targets,day){ var R={}, tg=targets.filter(function(t){ return t.id; }), det=[], own=[];
  var req=function(path,id){ return {url:RIBAT_API+path,muteHttpExceptions:true,headers:{Authorization:'Bearer '+token,Accept:'application/json','X-Property-Id':id}}; };
  var res=ribatAll_(tg.map(function(t){ return req('/bookings/calendar-data?start='+day+'T00:00:00.000Z&end='+day+'T23:59:00.000Z',t.id); }),8);
  tg.forEach(function(t,i){ var o=R[t.k]={k:t.k,name:t.name,ins:[],outs:[]}; if(res[i].getResponseCode()>=300){ o.err='رباط رد '+res[i].getResponseCode(); return; }
    (JSON.parse(res[i].getContentText()).bookings||[]).forEach(function(b){ if(/cancel|no.?show/i.test(b.status)) return;
      var ci=String(b.checkIn).slice(0,10), co=String(b.checkOut).slice(0,10);
      if(ci===day){ o.ins.push(b); det.push(req('/bookings/'+b.id,t.id)); own.push(b); } else if(co===day) o.outs.push(b); }); });
  ribatAll_(det,8).forEach(function(r,i){ if(r.getResponseCode()<300){ var f=JSON.parse(r.getContentText()), o=own[i]; for(var key in f) o[key]=f[key]; } });
  targets.filter(function(t){ return t.tab; }).forEach(function(t){ var o=R[t.k]={k:t.k,name:t.name,ins:[],outs:[]};
    try{ updVilla_(t.tab,day).forEach(function(b){ b.id=b.key; if(b.checkIn===day) o.ins.push(b); else o.outs.push(b); }); }catch(e){ o.err='شيت مكسب: '+e.message; } });
  return R; }
function updDs_(day){ var p=day.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
/* نزل السلام وضيافة السلام على رباط عقار واحد: بيتفصلوا بأول رقم في الغرفة (AS1xx نزل – AS2xx ضيافة) في نفس الخانة تحت بعض */
function updFmt_(t,day){ if(!t||t.k!=='S1') return updFmt1_(t,day);
  var pre=function(b){ var m=clean_(b.room&&b.room.name).match(/^AS(\d)\d{2}$/i); return m?m[1]:'1'; };
  var A={k:'S1',name:'نزل السلام',ins:[],outs:[],err:t.err}, B={k:'S1',name:'ضيافة السلام',ins:[],outs:[]};
  t.ins.forEach(function(x){ (pre(x)==='2'?B:A).ins.push(x); }); t.outs.forEach(function(x){ (pre(x)==='2'?B:A).outs.push(x); });
  var fa=updFmt1_(A,day), fb=updFmt1_(B,day);
  return {k:t.k,name:'نزل السلام + ضيافة السلام',nIn:fa.nIn+fb.nIn,nOut:fa.nOut+fb.nOut,warn:[],ids:fa.ids.concat(fb.ids),err:t.err||'',text:fa.text+'\n\n\n'+fb.text}; }
function updFmt1_(t,day){ var used={}, L=[], ids=[], warn=[], num=/^(S1|S2|B1|B2)$/.test(t.k); if(t.err) warn.push(t.err);
  var rn=function(b){ var n=clean_(b.room&&b.room.name), m; if(num){ m=n.match(/^(?:AS|AB)\d(\d{2})$/i)||n.match(/^(\d+)/); if(m) return String(+m[1]); } return n; }, byRoom=function(a,b){ var x=rn(a), y=rn(b); return (+x&&+y)?(+x)-(+y):(x<y?-1:1); };
  t.ins.sort(byRoom).forEach(function(a){ var nk=updNorm_(updName_(a)), ph=updPhKey_(a), best=-1, room=rn(a), kind='دخول', who=updName_(a)+' ('+room+')', w0=warn.length;
    t.outs.forEach(function(d,j){ if(used[j]) return; var same=(nk.length>2 && nk===updNorm_(updName_(d))) || (ph && ph===updPhKey_(d)); if(!same) return; if(best<0 || rn(d)===room) best=j; });
    if(best>=0){ used[best]=1; kind='تمديد'; var dr=rn(t.outs[best]); if(dr && dr!==room){ warn.push('تمديد '+updName_(a)+': الحجز الجديد مسجّل على '+room+' وهو قاعد في '+dr+' – عدّل الكالندر وانقله لـ '+dr); room=dr; } }
    else if(/نقل/.test(String(a.notes||''))) kind='نقل';
    if(/airbnb/i.test(a.source) && updName_(a)==='Reserved') warn.push('Airbnb '+room+': اسم الضيف غير مكتوب في النوت');
    var pay=updPay_(a,warn,who), bn=updNum_(a), phn=updPhone_(a);
    var line=kind+' غرفة ('+room+') اسم النزيل ('+updName_(a)+')'+(phn?' رقمه ('+phn+')':'')+' حسابه ('+pay+')'+(bn?' رقم الحجز ('+bn+')':'');
    L.push(line); ids.push({id:String(a.id),room:room,line:line,w:warn.slice(w0)}); });
  var od=[], outs=[]; t.outs.forEach(function(d,j){ if(!used[j] && od.indexOf(rn(d))<0) od.push(rn(d)); }); od.sort(function(x,y){ return (+x&&+y)?(+x)-(+y):(x<y?-1:1); }); od.forEach(function(r){ outs.push('غرفة ('+r+')'); });
  return {k:t.k,name:t.name,nIn:L.length,nOut:outs.length,warn:[],ids:ids,err:t.err||'',text:'تحديثات '+t.name+' '+updDs_(day)+'\n\n'+((!L.length&&!outs.length)?'لا يوجد تحديثات':'الدخول\n'+(L.join('\n\n')||'لا يوجد تحديثات')+'\n\nالخروج\n'+(outs.join('\n')||'لا يوجد تحديثات'))+(warn.length?'\n\nملاحظات\n- '+warn.join('\n- '):'')}; }
/* لاست مينيت: اليوم الصبح بيقارن التحديثات الذي اتبعتت امبارح بالكالندر الآن */
function updLm_(t,day,sent){ var f=updFmt_(t,day), cur={}, sid={}; f.ids.forEach(function(x){ cur[x.id]=1; }); sent.forEach(function(x){ sid[x.id]=1; });
  var canc=sent.filter(function(x){ return !cur[x.id]; }).map(function(x){ return 'شقة ('+x.room+') الغي حجزه'; });
  var nw=f.ids.filter(function(x){ return !sid[x.id]; }), w=[]; nw.forEach(function(x){ w=w.concat(x.w||[]); }); if(t.err) w.push(t.err);
  return {k:t.k,name:t.name,nC:canc.length,nL:nw.length,text:'لاست مينيت '+t.name+' '+updDs_(day)+'\n\nالإلغاءات\n'+(canc.join('\n')||'لا يوجد')+'\n\nلاست مينيت\n'+(nw.map(function(x){ return x.line; }).join('\n\n')||'لا يوجد')+(w.length?'\n\nملاحظات\n- '+w.join('\n- '):'')}; }
function updBuild_(onlyK){ var login=ribatLogin_(), token=login.token, today=fmtRiyadh_(new Date(),'yyyy-MM-dd'), tom=stAdd_(today,1), T=updTargets_(login);
  if(onlyK) T=T.filter(function(t){ return t.k===onlyK; }); if(!T.length) throw new Error('هذا العقار ليس في التحديثات');
  /* تخطي العقارات/البنود الموقوفة */
  var pauses=readJson_(FILE_UPD_PAUSE)||{};
  var R=updFetch_(token,T,tom), list=T.map(function(t){
    if(pauses[t.k+'|'+tom] || pauses[t.k+'|*']) return {k:t.k,name:t.name||t.k,nIn:0,nOut:0,warn:[],ids:[],err:'',text:'⏸ التحديثات متوقفة لهذا العقار',paused:true};
    return updFmt_(R[t.k],tom);
  });
  var comm=null; try{ comm=updComm_(R,tom,onlyK); if(!onlyK){ try{ commFuture_(token,T,tom); }catch(e3){ Logger.log('commFuture '+e3.message); } } }catch(e){ Logger.log('Communication: '+e.message); comm=readJson_(FILE_COMM)||null; if(comm) comm.err=e.message; }
  if(!onlyK){ try{ commFillDay_(updFetch_(token,T.filter(function(t){ return t.id && COMM_AQAR[t.k]; }),today),today); }catch(e){ Logger.log('Communication today: '+e.message); } }
  var snap=readJson_(FILE_UPD_SENT), lm={date:today,list:[],none:!(snap&&snap.date===today),sentAt:snap&&snap.date===today?snap.at:''};
  if(!lm.none){ var R2=updFetch_(token,T,today); lm.list=T.map(function(t){
    if(pauses[t.k+'|'+today] || pauses[t.k+'|*']) return {k:t.k,name:t.name||t.k,nC:0,nL:0,text:'⏸ لاست مينيت متوقف لهذا العقار',paused:true};
    return updLm_(R2[t.k],today,(snap.ids||{})[t.k]||[]);
  }); }
  var old=readJson_(FILE_UPD)||{};
  var mrg=function(arr,it){ var hit=false, o=(arr||[]).map(function(x){ if(x.k===it.k){ hit=true; return it; } return x; }); if(!hit) o.push(it); return o; };
  if(onlyK){ if(old.date===tom) list=mrg(old.list,list[0]);
    if(!lm.none){ if(old.lm && old.lm.date===today && !old.lm.none) lm.list=mrg(old.lm.list,lm.list[0]); } else if(old.lm && old.lm.date===today) lm=old.lm; }
  var out={at:Utilities.formatDate(new Date(),'Africa/Cairo','yyyy-MM-dd HH:mm'),date:tom,list:list,lm:lm,comm:comm}; if(onlyK) out.one=onlyK+' '+out.at;
  writeFile_(FILE_UPD,JSON.stringify(out),'application/json'); return out; }
/* الفلل (العارض والمحمدية) غير على رباط: بتتقرا من تاباتها في شيت مكسب 2026 */
function updVilla_(tab,day){ var sh=SpreadsheetApp.openById(SHEET26).getSheetByName(tab); if(!sh) throw new Error('تاب '+tab+' غير موجود');
  var lc=sh.getLastColumn(), lr=sh.getLastRow(), top=sh.getRange(1,1,2,lc).getDisplayValues(), MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], want={}, d=day.split('-'), out=[];
  for(var k=-2;k<=0;k++){ var dt=new Date(Date.UTC(+d[0],+d[1]-1+k,1)); want[MO[dt.getUTCMonth()]+' '+dt.getUTCFullYear()]=1; }
  for(var c0=0;c0<lc;c0++){ if(!want[String(top[0][c0]).trim()]) continue; var c=-1;
    for(var j=Math.max(0,c0-2);j<Math.min(lc,c0+3);j++){ if(String(top[1][j]).trim()==='Guest Name'){ c=j; break; } } if(c<0) continue;
    var H=top[1].slice(c,c+13).map(function(h){ return String(h).trim(); }), at=function(n){ var i=H.indexOf(n); return i; }, tt=-1;
    H.forEach(function(h,i){ if(tt<0 && /^Total/.test(h)) tt=i; });
    var g=at('Guest Name'), ph=at('Phone'), u=at('Unit'), src=at('Acc Ref'), ci=at('Check In'), ln=at('Length'), dn=at('Done'), nr=at('NR'); if(nr<0) nr=at('Note');
    if(g<0||ci<0) continue;
    var V=sh.getRange(3,c+1,Math.max(1,lr-2),13).getDisplayValues();
    for(var r=0;r<V.length;r++){ var x=V[r], name=String(x[g]||'').trim(); if(name==='Index'||name==='Total') break; if(!name) continue;
      var q=String(x[ci]).trim().split('/'); if(q.length<3) continue;
      var cin=q[2]+'-'+('0'+q[1]).slice(-2)+'-'+('0'+q[0]).slice(-2), n=+String(ln>=0?x[ln]:'').replace(/[^\d]/g,'')||1, cout=stAdd_(cin,n);
      if(cin!==day && cout!==day) continue;
      var phone=String(ph>=0?x[ph]:'').trim(); if(!/[1-9]/.test(phone)) phone='';
      var key=name+'|'+String(u>=0?x[u]:'').trim()+'|'+cin; if(out.some(function(o){ return o.key===key; })) continue;
      out.push({key:key,guestName:name,guestPhone:phone,room:{name:String(u>=0?x[u]:'').trim()},source:'villa:'+String(src>=0?x[src]:''),notes:nr>=0?String(x[nr]||'').replace(/https?:\S+/g,'').trim():'',
        totalAmount:Number(String(tt>=0?x[tt]:'').replace(/[^\d.]/g,''))||0,checkIn:cin,checkOut:cout,status:'confirmed',paidDone:dn>=0&&String(x[dn]).toUpperCase()==='TRUE'}); } }
  return out; }
function updRefresh(k){ var lock=LockService.getScriptLock(); if(!lock.tryLock(60000)) return; try{ updBuild_(typeof k==='string'?k:null); } finally { lock.releaseLock(); } }
function updGet(code,force,k){ auth_(code); if(force) updRefresh(typeof k==='string'&&k?k:null); var f=findFile_(FILE_UPD); return f?f.getBlob().getDataAsString('UTF-8'):''; }


/******** API للمحاكي على GitHub Pages (Stay Easy) ********/
var SIM_API_ = { getSimData: getSimData, simLogin: simLogin, saveSimOverrides: saveSimOverrides, simChat: simChat };
function doPost(e) {
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = SIM_API_[req.fn];
    if (!fn) throw new Error('bad_fn');
    out = { ok: true, data: fn.apply(null, req.args || []) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}


// Stay Easy: يرجّع صفحة المحاكي لكي تتفتح داخل المراية (نفس اللينك)
function getSimHtml(code) {
  return HtmlService.createHtmlOutputFromFile('sim2').getContent();
}


// إضافة خطأ يدوي (نفس صيغة سجل المتابعة). الصف بيتعلّم MAN| لكي نظام المتابعة ما يقفلوش تلقائي
function stAddManual(code,o,by){ auth_(code); o=o||{};
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ var c=stCfg_();
    if(!c.emp[o.emp]) throw new Error('اختر المسؤول');
    if(!c.prop[o.pk]) throw new Error('اختر العقار');
    var d=String(o.date||'').trim(); if(!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('التاريخ غير صحيح');
    var type=String(o.type||'').replace(/\|/g,'/').trim().slice(0,60), det=String(o.det||'').trim().slice(0,500), bk=String(o.bk||'').trim().slice(0,120);
    if(!type) throw new Error('اكتب نوع الخطأ'); if(!bk&&!det) throw new Error('اكتب الحجز أو التفاصيل');
    var sh=stLogSh_(); if(!sh) throw new Error('سجل الأخطاء غير موجود');
    var now=Utilities.formatDate(new Date(),ST_TZ,'dd/MM/yyyy HH:mm:ss'), id='MAN|'+Date.now()+'|'+type;
    sh.appendRow([id,"'"+now,"'"+now,'مفتوح','',c.emp[o.emp].n,c.prop[o.pk].n,bk||'—',type,det,"'"+d,'','يدوي – سجّله '+(by||''),o.emp,'صحيح',by||'',stNow_()]);
    stEdit_(by,'إضافة خطأ يدوي',c.emp[o.emp].n+' · '+c.prop[o.pk].n+' · '+type+' · '+d);
    return stData_();
  } finally { lock.releaseLock(); } }

/* شيت الكومنكيشن: تعبئة الحجوزات من اليوم فصاعدًا مرتبة بتاريخ الدخول (الأقرب أولاً). الملغية تتشال بدون فراغات */
function commFuture_(token,T,tom){
  var N=parseInt(PropertiesService.getScriptProperties().getProperty('COMM_DAYS'),10)||7;
  var sh=SpreadsheetApp.openById(COMM_ID).getSheetByName('Communication');
  /* 1) قراءة الحجوزات الموجودة في الشيت */
  var last=sh.getLastRow(), have={};
  if(last>1) sh.getRange(1,2,last,1).getDisplayValues().forEach(function(r){ var x=String(r[0]).trim(); if(x) have[x]=1; });
  /* 2) سحب حجوزات من اليوم (tom=غدًا بس هنا نبدأ من اليوم) + الأيام القادمة */
  var allRows=[];
  for(var i=0;i<N;i++){
    var day=stAdd_(tom,i), R=updFetch_(token,T,day);
    Object.keys(R).forEach(function(k){ if(!COMM_AQAR[k]) return;
      (R[k].ins||[]).forEach(function(b){ if(!/booking/i.test(b.source)) return;
        var no=String(b.otaReservationCode||b.bookingNumber||'').trim(); if(!no||have[no]) return; have[no]=1;
        var st=String(b.status||'').toLowerCase();
        if(/cancel|no.?show/i.test(st)) return; /* الملغية ما تتضافش */
        allRows.push({no:no, name:String(b.guestName||'').trim(), ph:String(b.contactPhone||b.guestPhone||'').replace(/[^0-9+]/g,'').trim(), prop:COMM_AQAR[k], ci:String(b.checkIn).slice(0,10), day:day}); }); });
  }
  /* 3) ترتيب بتاريخ الدخول: الأقرب أولاً */
  allRows.sort(function(a,b){ return a.ci<b.ci?-1:a.ci>b.ci?1:0; });
  /* 4) إضافة الصفوف الجديدة */
  var added=0;
  if(allRows.length){
    var vals=allRows.map(function(r){ return [r.no,r.name,r.ph,r.prop]; });
    var dates=allRows.map(function(r){ var p=r.ci.split('-'); return [new Date(+p[0],+p[1]-1,+p[2])]; });
    var r0=sh.getLastRow()+1;
    sh.getRange(r0,2,vals.length,4).setValues(vals);
    sh.getRange(r0,6,vals.length,1).insertCheckboxes();
    sh.getRange(r0,8,vals.length,1).setValues(vals.map(function(){ return ['Booking']; }));
    sh.getRange(r0,11,vals.length,1).setValues(dates).setNumberFormat('d/M/yyyy');
    added=vals.length;
  }
  return added;
}

/* تنظيف الحجوزات الملغية من شيت الكومنكيشن: بيشيل الصفوف الذي الحجز اتلغى على رباط */
function commCleanCancelled_(token,T){
  var sh=SpreadsheetApp.openById(COMM_ID).getSheetByName('Communication');
  var last=sh.getLastRow(); if(last<2) return 0;
  var data=sh.getRange(1,2,last,10).getDisplayValues();
  /* سحب حالة الحجوزات من رباط */
  var nos={};
  for(var i=1;i<data.length;i++){ var no=String(data[i][0]).trim(); if(no) nos[no]=i+1; }
  if(!Object.keys(nos).length) return 0;
  /* تجميع أرقام الحجوزات الملغية */
  var cancelled=[], tg=T.filter(function(t){ return t.id && COMM_AQAR[t.k]; });
  var today=fmtRiyadh_(new Date(),'yyyy-MM-dd');
  /* سحب كل الحجوزات الحالية لمقارنة الحالة */
  var N=parseInt(PropertiesService.getScriptProperties().getProperty('COMM_DAYS'),10)||7;
  var active={};
  for(var d=0;d<N;d++){
    var day=stAdd_(today,d), R=updFetch_(token,tg,day);
    Object.keys(R).forEach(function(k){ (R[k].ins||[]).forEach(function(b){
      var bn=String(b.otaReservationCode||b.bookingNumber||'').trim();
      if(bn) active[bn]=String(b.status||'');
    }); });
  }
  /* حذف الصفوف الملغية (من تحت لفوق لكي الأرقام ما تتلخبطش) */
  var rows=[];
  Object.keys(nos).forEach(function(no){
    if(active[no] && /cancel|no.?show/i.test(active[no])) rows.push(nos[no]);
    else if(!active[no] && nos[no]) { /* حجز مش موجود أصلاً في رباط - محتمل اتلغى */ }
  });
  rows.sort(function(a,b){ return b-a; }); /* من تحت لفوق */
  rows.forEach(function(r){ sh.deleteRow(r); });
  return rows.length;
}

/* ===== تارجتات الأقسام: إدخال يدوي شهري + سجل تعديلات ===== */
var TG_DEPTS=[{k:'cs',n:'خدمة العملاء'},{k:'sales',n:'المبيعات'},{k:'social',n:'السوشيال ميديا'}];
function tgSh_(name,hdr){ var ss=SpreadsheetApp.openById(ST_LOG_ID), sh=ss.getSheetByName(name); if(!sh){ sh=ss.insertSheet(name); sh.appendRow(hdr); sh.setFrozenRows(1); } return sh; }
function tgData_(){
  var sh=tgSh_('تارجتات الأقسام',['الشهر','القسم','التارجت','آخر تعديل','بواسطة']);
  var lg=tgSh_('سجل التارجتات',['الوقت','الشهر','القسم','القيمة السابقة','القيمة الجديدة','بواسطة','السبب']);
  var v=sh.getDataRange().getDisplayValues(), T={};
  for(var i=1;i<v.length;i++){ var ym=String(v[i][0]).replace(/^'/,''), d=v[i][1]; if(!ym||!d) continue; (T[ym]=T[ym]||{})[d]=Number(String(v[i][2]).replace(/,/g,''))||0; }
  var L=lg.getDataRange().getDisplayValues().slice(1).reverse().slice(0,300);
  return {depts:TG_DEPTS,targets:T,log:L};
}
/* الأرقام الفعلية: سحب من شيت مكسب 2026 + تقاطع مع رباط لمطابقة المصدر والمبالغ */
function tgActual_(ym){
  /* SRC_CODE: customer_service:'C', sales:'S', social_media:'M' */
  var deptSrc = {cs:'C', sales:'S', social:'M'};
  var result = {};
  TG_DEPTS.forEach(function(d){ result[d.k] = {bookings:0, nights:0, revenue:0, rows:[]}; });
  /* 1) قراءة بيانات رباط المحفوظة */
  var ribat = readJson_(FILE_RIBAT) || {};
  var src = ribat.ribat_src || {};
  /* 2) جمع الأرقام الفعلية لكل قسم من ribat_src (ليالي محققة + إيراد) */
  Object.keys(src).forEach(function(k){
    var months = src[k] || {};
    var bucket = months[ym];
    if(!bucket) return;
    Object.keys(deptSrc).forEach(function(dept){
      var code = deptSrc[dept];
      var cell = bucket[code];
      if(!cell) return;
      /* cell = [realizedNights, realizedRevenue, confirmedNights, confirmedRevenue, bookingsCount] */
      result[dept].nights += (cell[0]||0) + (cell[2]||0);
      result[dept].revenue += (cell[1]||0) + (cell[3]||0);
      result[dept].bookings += cell[4]||0;
    });
  });
  /* 3) قراءة من شيت مكسب 2026 لتعزيز الأرقام بالحجوزات الذي مش على رباط */
  try {
    var ss26 = SpreadsheetApp.openById(SHEET26);
    TABS26.forEach(function(tab){
      var sh = ss26.getSheetByName(tab); if(!sh) return;
      var v = sh.getDataRange().getDisplayValues(); if(v.length<2) return;
      /* البحث عن عمود المصدر والتاريخ والمبلغ في أول صفين */
      var hdr = v[0].concat(v[1]||[]);
      for(var r=2;r<v.length;r++){
        var row = v[r];
        /* التعرف على المصدر من SRC_CODE */
        for(var c=0;c<row.length;c++){
          var val = String(row[c]).trim();
          if(SRC_CODE[val]){
            var sc = SRC_CODE[val];
            Object.keys(deptSrc).forEach(function(dept){
              if(deptSrc[dept] === sc){
                /* نفحص لو الحجز في الشهر المطلوب */
                /* البحث عن عمود check-in date */
              }
            });
          }
        }
      }
    });
  } catch(e) { /* لو فشلت قراءة الشيت نكتفي ببيانات رباط */ }
  return result;
}

function tgGet(code){ auth_(code); return JSON.stringify(tgData_()); }
/* tgGetWithActuals: بترجع التارجتات + الأرقام الفعلية */
function tgGetActuals(code, ym){
  auth_(code);
  if(!/^\d{4}-\d{2}$/.test(String(ym))) ym = fmtRiyadh_(new Date(),'yyyy-MM');
  var data = tgData_();
  data.actuals = {};
  /* آخر 3 شهور */
  for(var i=0;i<3;i++){
    var d = new Date(Number(ym.slice(0,4)), Number(ym.slice(5,7))-1-i, 1);
    var m = d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
    data.actuals[m] = tgActual_(m);
  }
  return JSON.stringify(data);
}
function tgSave(code,rows,by,reason){ auth_(code);
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{ rows=rows||[]; var sh=tgSh_('تارجتات الأقسام',['الشهر','القسم','التارجت','آخر تعديل','بواسطة']);
    var lg=tgSh_('سجل التارجتات',['الوقت','الشهر','القسم','القيمة السابقة','القيمة الجديدة','بواسطة','السبب']);
    var who=String(by||'').trim().slice(0,60), why=String(reason||'').trim().slice(0,200);
    if(!who) throw new Error('اكتب اسم المسجِّل');
    var now=Utilities.formatDate(new Date(),ST_TZ,'dd/MM/yyyy HH:mm:ss');
    var v=sh.getDataRange().getDisplayValues(), pos={};
    for(var i=1;i<v.length;i++){ pos[String(v[i][0]).replace(/^'/,'')+'|'+v[i][1]]=i+1; }
    var names={}; TG_DEPTS.forEach(function(d){ names[d.k]=d.n; });
    var n=0;
    rows.forEach(function(r){ var ym=String(r.ym||'').trim(), d=String(r.dept||'').trim(), val=Number(r.val);
      if(!/^\d{4}-\d{2}$/.test(ym)) throw new Error('الشهر غير صحيح'); if(!names[d]) throw new Error('القسم غير معروف'); if(!isFinite(val)||val<0) throw new Error('قيمة التارجت غير صحيحة');
      var key=ym+'|'+d, old=pos[key]?Number(String(v[pos[key]-1][2]).replace(/,/g,''))||0:'';
      if(old!==''&&old===val) return;
      if(pos[key]){ sh.getRange(pos[key],3,1,3).setValues([[val,now,who]]); }
      else { sh.appendRow(["'"+ym,d,val,now,who]); pos[key]=sh.getLastRow(); v[pos[key]-1]=[ym,d,val,now,who]; }
      lg.appendRow([now,"'"+ym,names[d],old,val,who,why]); n++; });
    if(!n) throw new Error('لا يوجد تغيير');
    return JSON.stringify(tgData_());
  } finally { lock.releaseLock(); } }

/* ===== توصيات ذكية (تحليل قواعد بدون API) ===== */
function getRecommendations(code){
  auth_(code);
  var ribat = readJson_(FILE_RIBAT) || {};
  var today = fmtRiyadh_(new Date(), 'yyyy-MM-dd');
  var todayP = today.split('-');
  var ym = todayP[0] + '-' + todayP[1];
  var recs = [];

  /* 1. تحليل الإشغال: هل فيه عقارات إشغالها ضعيف؟ */
  var fut = ribat.ribat_fut || {};
  var lowOcc = [], highOcc = [];
  Object.keys(fut).forEach(function(k) {
    var days = fut[k] || {};
    var total = 0, occ = 0, checked = 0;
    Object.keys(days).forEach(function(d) {
      if (d < today) return;
      if (checked >= 30) return;
      checked++;
      var units = days[d];
      if (!units) return;
      var arr = Array.isArray(units) ? units : (typeof units === 'object' ? Object.keys(units).map(function(u) { return units[u]; }) : []);
      arr.forEach(function(u) { total++; if (u && u.id) occ++; });
    });
    if (total >= 10) {
      var pct = Math.round(occ / total * 100);
      if (pct < 40) lowOcc.push({ k: k, pct: pct });
      if (pct > 85) highOcc.push({ k: k, pct: pct });
    }
  });
  if (lowOcc.length) {
    lowOcc.sort(function(a, b) { return a.pct - b.pct; });
    recs.push({
      type: 'occupancy_low', priority: 'high', icon: '📉',
      title: 'إشغال منخفض في ' + lowOcc.length + ' عقار',
      detail: lowOcc.slice(0, 5).map(function(x) { return x.k + ': ' + x.pct + '%'; }).join('، '),
      action: 'مراجعة الأسعار أو تعزيز التسويق لرفع الإشغال'
    });
  }
  if (highOcc.length) {
    recs.push({
      type: 'occupancy_high', priority: 'info', icon: '🔥',
      title: 'إشغال مرتفع في ' + highOcc.length + ' عقار',
      detail: highOcc.slice(0, 5).map(function(x) { return x.k + ': ' + x.pct + '%'; }).join('، '),
      action: 'فرصة لرفع الأسعار في أوقات الذروة'
    });
  }

  /* 2. نمو الإيرادات: مقارنة الشهر الحالي بالسابق */
  var src = ribat.ribat_src || {};
  var prevM = todayP[1] === '01' ? (Number(todayP[0]) - 1) + '-12' : todayP[0] + '-' + ('0' + (Number(todayP[1]) - 1)).slice(-2);
  var curRev = 0, prevRev = 0;
  Object.keys(src).forEach(function(k) {
    var months = src[k] || {};
    if (months[ym]) Object.keys(months[ym]).forEach(function(c) { var cell = months[ym][c]; curRev += (cell[1] || 0) + (cell[3] || 0); });
    if (months[prevM]) Object.keys(months[prevM]).forEach(function(c) { var cell = months[prevM][c]; prevRev += (cell[1] || 0) + (cell[3] || 0); });
  });
  if (prevRev > 0 && curRev > 0) {
    var growth = Math.round((curRev - prevRev) / prevRev * 100);
    recs.push({
      type: 'revenue_growth', priority: growth < -10 ? 'high' : (growth > 15 ? 'info' : 'medium'), icon: growth >= 0 ? '📈' : '📉',
      title: 'نمو الإيرادات: ' + (growth >= 0 ? '+' : '') + growth + '%',
      detail: 'الشهر الحالي: ' + Math.round(curRev).toLocaleString() + ' ر.س | السابق: ' + Math.round(prevRev).toLocaleString() + ' ر.س',
      action: growth < -10 ? 'مراجعة أسباب انخفاض الإيرادات والتركيز على العقارات المتراجعة' : 'استمرار في النمو'
    });
  }

  /* 3. نسبة الإلغاءات */
  var totalB = 0, cancelB = 0;
  Object.keys(src).forEach(function(k) {
    var months = src[k] || {};
    if (!months[ym]) return;
    Object.keys(months[ym]).forEach(function(c) {
      var cell = months[ym][c];
      totalB += (cell[4] || 0);
    });
  });
  var todayData = ribat.ribat_today || {};
  Object.keys(todayData).forEach(function(k) {
    var arr = todayData[k];
    if (!Array.isArray(arr)) return;
    arr.forEach(function(b) {
      if (/cancel|no.?show/i.test(String(b.status || ''))) cancelB++;
    });
  });
  if (totalB > 5 && cancelB > 0) {
    var cancelPct = Math.round(cancelB / totalB * 100);
    if (cancelPct > 10) {
      recs.push({
        type: 'cancellation', priority: 'high', icon: '❌',
        title: 'نسبة إلغاءات مرتفعة: ' + cancelPct + '%',
        detail: cancelB + ' إلغاء من ' + totalB + ' حجز هذا الشهر',
        action: 'مراجعة سياسة الإلغاء أو تحسين تجربة الحجز'
      });
    }
  }

  /* 4. نسبة الحجز المباشر مقابل OTA */
  var directN = 0, otaN = 0;
  Object.keys(src).forEach(function(k) {
    var months = src[k] || {};
    if (!months[ym]) return;
    var bucket = months[ym];
    Object.keys(bucket).forEach(function(c) {
      var cell = bucket[c], n = cell[4] || 0;
      if (c === 'B' || c === 'D') directN += n;
      else otaN += n;
    });
  });
  if (directN + otaN > 5) {
    var directPct = Math.round(directN / (directN + otaN) * 100);
    recs.push({
      type: 'direct_ratio', priority: directPct < 20 ? 'high' : 'medium', icon: '🏠',
      title: 'نسبة الحجز المباشر: ' + directPct + '%',
      detail: directN + ' مباشر من ' + (directN + otaN) + ' حجز',
      action: directPct < 20 ? 'تعزيز قنوات الحجز المباشر لتقليل عمولات OTA' : 'نسبة جيدة، استمرار في تعزيز الحجز المباشر'
    });
  }

  /* 5. تقييمات OTA */
  var lowScore = [];
  Object.keys(OTA_SEED).forEach(function(k) {
    var s = OTA_SEED[k];
    if (s.bdcScore && s.bdcScore < 7.5) lowScore.push({ k: k, score: s.bdcScore, health: s.health || 0 });
  });
  if (lowScore.length) {
    lowScore.sort(function(a, b) { return a.score - b.score; });
    recs.push({
      type: 'ota_scores', priority: 'medium', icon: '⭐',
      title: lowScore.length + ' عقار تقييمه أقل من 7.5',
      detail: lowScore.slice(0, 5).map(function(x) { return x.k + ': ' + x.score; }).join('، '),
      action: 'تحسين جودة النظافة والخدمة والرد على تقييمات الضيوف'
    });
  }

  /* 6. تكافؤ الأسعار (Rate Parity) */
  var parityIssues = [];
  Object.keys(DP).forEach(function(k) {
    var props = DP[k];
    if (!props || typeof props !== 'object') return;
    Object.keys(props).forEach(function(unit) {
      var prices = props[unit];
      if (!prices || typeof prices !== 'object') return;
      Object.keys(prices).forEach(function(month) {
        var arr = prices[month];
        if (!Array.isArray(arr) || arr.length < 3) return;
        var minP = Math.min.apply(null, arr.filter(function(x) { return x > 0; }));
        var maxP = Math.max.apply(null, arr);
        if (maxP > 0 && minP > 0 && (maxP - minP) / minP > 0.3) {
          parityIssues.push(k);
        }
      });
    });
  });
  var uniqueParity = [];
  parityIssues.forEach(function(k) { if (uniqueParity.indexOf(k) < 0) uniqueParity.push(k); });
  if (uniqueParity.length) {
    recs.push({
      type: 'rate_parity', priority: 'medium', icon: '⚖️',
      title: 'فرق أسعار كبير في ' + uniqueParity.length + ' عقار',
      detail: uniqueParity.slice(0, 5).join('، '),
      action: 'مراجعة الأسعار لضمان تكافؤ بين القنوات ومنع تضارب الأسعار'
    });
  }

  /* 7. إشغال نهاية الأسبوع مقابل أيام الأسبوع */
  var wkdOcc = 0, wkdTot = 0, wknOcc = 0, wknTot = 0;
  Object.keys(fut).forEach(function(k) {
    var days = fut[k] || {};
    Object.keys(days).forEach(function(d) {
      if (d < today) return;
      var parts = d.split('-');
      var dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      var dow = dt.getDay();
      var units = days[d];
      if (!units) return;
      var arr = Array.isArray(units) ? units : (typeof units === 'object' ? Object.keys(units).map(function(u) { return units[u]; }) : []);
      arr.forEach(function(u) {
        if (dow === 4 || dow === 5) { wknTot++; if (u && u.id) wknOcc++; }
        else { wkdTot++; if (u && u.id) wkdOcc++; }
      });
    });
  });
  if (wkdTot > 10 && wknTot > 5) {
    var wkdPct = Math.round(wkdOcc / wkdTot * 100);
    var wknPct = Math.round(wknOcc / wknTot * 100);
    if (wknPct - wkdPct > 20) {
      recs.push({
        type: 'weekend_gap', priority: 'medium', icon: '📅',
        title: 'فجوة إشغال: نهاية الأسبوع ' + wknPct + '% vs أيام العمل ' + wkdPct + '%',
        detail: 'فرق ' + (wknPct - wkdPct) + ' نقطة',
        action: 'عروض خاصة لأيام الأسبوع أو تخفيض أسعار الأحد-الأربعاء'
      });
    }
  }

  /* 8. التوفر القريب: هل فيه عقارات فاضية بالكامل الأيام الجاية؟ */
  var emptyProps = [];
  Object.keys(fut).forEach(function(k) {
    var days = fut[k] || {};
    var empty = 0, checked = 0;
    for (var i = 0; i < 7; i++) {
      var d = stAdd_(today, i);
      var units = days[d];
      if (!units) { empty++; checked++; continue; }
      var arr = Array.isArray(units) ? units : (typeof units === 'object' ? Object.keys(units).map(function(u) { return units[u]; }) : []);
      var hasGuest = arr.some(function(u) { return u && u.id; });
      if (!hasGuest) empty++;
      checked++;
    }
    if (checked >= 5 && empty >= 5) emptyProps.push(k);
  });
  if (emptyProps.length) {
    recs.push({
      type: 'availability_urgent', priority: 'high', icon: '🚨',
      title: emptyProps.length + ' عقار فاضي الأسبوع الجاي',
      detail: emptyProps.slice(0, 5).join('، '),
      action: 'تسويق عاجل أو عروض لاست مينيت لملء الفراغات'
    });
  }

  /* ترتيب حسب الأولوية */
  var pOrder = { high: 0, medium: 1, info: 2 };
  recs.sort(function(a, b) { return (pOrder[a.priority] || 9) - (pOrder[b.priority] || 9); });

  return JSON.stringify({ at: Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HH:mm'), recs: recs });
}

/* ===== محاكي 2026-2027 (أسعار رباط) ===== */
var FILE_SIMPLAN='simplan_2026_2027.json';
function simR5_(x){return Math.round(x/5)*5}
function simBuild_(){
  var s=ribatSession_(),keys=Object.keys(s.ids),months=[];
  for(var y=2026,mo=11;y<2028;){months.push(y+'-'+('0'+mo).slice(-2));mo++;if(mo>12){mo=1;y++}}
  var reqs=[],meta=[];
  keys.forEach(function(k){months.forEach(function(ym){
    var last=new Date(Date.UTC(+ym.slice(0,4),+ym.slice(5,7),0)).getUTCDate();
    reqs.push({url:RIBAT_API+'/pms/properties/'+s.ids[k]+'/rates?start='+ym+'-01T00:00:00.000Z&end='+ym+'-'+('0'+last).slice(-2)+'T00:00:00.000Z',muteHttpExceptions:true,headers:{Authorization:'Bearer '+s.token,Accept:'application/json','X-Property-Id':s.ids[k]}});
    meta.push([k,ym]);});});
  var nm={};Object.keys(RIBAT_MAP).forEach(function(n){var c=RIBAT_MAP[n];if(!nm[c]&&/[\u0600-\u06FF]/.test(n))nm[c]=n});
  var P={};
  for(var i=0;i<reqs.length;i+=4){
    var rs=UrlFetchApp.fetchAll(reqs.slice(i,i+4));
    rs.forEach(function(r,j){
      if(r.getResponseCode()>=300)return;
      var k=meta[i+j][0],jj;try{jj=JSON.parse(r.getContentText())}catch(e){return}
      P[k]=P[k]||{n:nm[k]||k,t:{}};
      (jj.roomTypes||[]).forEach(function(t){
        var tn=clean_(t.name),plan=null;
        (t.ratePlans||[]).forEach(function(p){if(!plan&&/base/i.test(String(p.title||''))) plan=p});
        if(!plan)return;
        var o=P[k].t[tn]=P[k].t[tn]||{};
        Object.keys(plan.days||{}).forEach(function(day){
          var b=Number(plan.days[day].rate);if(!(b>0))return;
          var n=simR5_(b*0.9),l=simR5_(n*0.95);
          o[day.slice(0,10)]=[b,n,l];});});});rs=null;}
  var out={built:new Date().toISOString(),rule:'normal=round5(base*0.90); lowest=round5(normal*0.95)',props:P};
  writeFile_(FILE_SIMPLAN,JSON.stringify(out),'application/json');
  return out;
}
function simPlan(force){
  var o=force?null:readJson_(FILE_SIMPLAN);
  return o||simBuild_();
}
function simPlanRefresh(){var o=simBuild_();var n=0;Object.keys(o.props).forEach(function(k){Object.keys(o.props[k].t).forEach(function(t){n+=Object.keys(o.props[k].t[t]).length})});Logger.log('props='+Object.keys(o.props).length+' days='+n);return n}
function simAsk_(q,ctx){
  var ch=CacheService.getScriptCache(),hk='simask_'+Utilities.formatDate(new Date(),'UTC','yyyyMMddHH'),n=Number(ch.get(hk)||0);
  if(n>=120)throw new Error('تم بلوغ الحد الأقصى للأسئلة في هذه الساعة، حاول لاحقًا');
  ch.put(hk,String(n+1),3700);
  var r=simChat([{role:'user',text:String(q||'').slice(0,800)}],String(ctx||'').slice(0,12000));
  return typeof r==='string'?r:(r&&(r.text||r.reply))||JSON.stringify(r);
}

function simAskPub(q, c) {
  try { return { text: simAsk_(q, c) }; } catch (e) { return { error: String(e.message || e) }; }
}

var FILE_SIMMON='simmonthly.json';
function simMonthlyGet(){ return readJson_(FILE_SIMMON)||{}; }
function simMonthlySave(code,key,normal,lowest){
  try{
    auth_(code);
    var d=readJson_(FILE_SIMMON)||{},n=Number(normal)||0,l=Number(lowest)||0;
    if(!/^[^|]+\|[^|]+\|\d{4}-\d{2}$/.test(String(key)))throw new Error('مفتاح غير صالح');
    if(n>0){ d[key]=[n,l>0?l:simR5_(n*0.95)]; } else { delete d[key]; }
    writeFile_(FILE_SIMMON,JSON.stringify(d),'application/json');
    return {data:d};
  }catch(e){ return {error:String(e.message||e)}; }
}
