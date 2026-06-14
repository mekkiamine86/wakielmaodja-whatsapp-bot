 /**
 * ============================================================
 * واقع الموجة — WhatsApp Business AI Bot v2.0
 * Langue principale : Darija (عربية جزائرية) + Français
 * IA : Claude claude- — Expert Closing COD Algérie
 * Stack : Node.js + Express + WhatsApp Cloud API (Meta)
 * ============================================================
 */

require('dotenv').config();
const express  = require('express');
const axios    = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const { getTarif } = require('./tarifs');

const app = express();
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── CONFIG ───────────────────────────────────────────────────
const CONFIG = {
  WA_TOKEN    : process.env.WA_TOKEN,
  WA_PHONE_ID : process.env.WA_PHONE_ID,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN,
  OWNER_PHONE : process.env.OWNER_PHONE,
  PORT        : process.env.PORT || 3000
};

// ─── KIMLAND AUTO-REGISTRATION MODULE ───────────────────────
const KIMLAND = {
  base   : 'https://kimland.dz/app/client',
  user   : process.env.KIMLAND_USER || '',
  pass   : process.env.KIMLAND_PASS || '',
  cookies: '',

  WILAYAS: {
    'أدرار':1,'الشلف':2,'الأغواط':3,'أم البواقي':4,'باتنة':5,
    'بجاية':6,'بسكرة':7,'بشار':8,'البليدة':9,'البويرة':10,
    'تمنراست':11,'تبسة':12,'تلمسان':13,'تيارت':14,'تيزي وزو':15,
    'الجزائر':16,'الجلفة':17,'جيجل':18,'سطيف':19,'سعيدة':20,
    'سكيكدة':21,'سيدي بلعباس':22,'عنابة':23,'قالمة':24,
    'قسنطينة':25,'المدية':26,'مستغانم':27,'المسيلة':28,
    'معسكر':29,'ورقلة':30,'وهران':31,'البيض':32,'إليزي':33,
    'برج بوعريريج':34,'بومرداس':35,'الطارف':36,'تندوف':37,
    'تيسمسيلت':38,'الوادي':39,'خنشلة':40,'سوق أهراس':41,
    'تيبازة':42,'ميلة':43,'عين الدفلى':44,'النعامة':45,
    'عين تيموشنت':46,'غرداية':47,'غليزان':48,
    'تيميمون':49,'برج باجي مختار':50,'أولاد جلال':51,
    'بني عباس':52,'عين صالح':53,'عين قزام':54,'تقرت':55,
    'جانت':56,'المغير':57,'المنيعة':58,
    'adrar':1,'chlef':2,'laghouat':3,'oum el bouaghi':4,
    'batna':5,'bejaia':6,'bjaia':6,'biskra':7,'bechar':8,
    'blida':9,'bouira':10,'tamanrasset':11,'tebessa':12,
    'tlemcen':13,'tiaret':14,'tizi ouzou':15,'alger':16,
    'djelfa':17,'jijel':18,'setif':19,'saida':20,
    'skikda':21,'sidi bel abbes':22,'annaba':23,'guelma':24,
    'constantine':25,'medea':26,'mostaganem':27,'msila':28,
    'mascara':29,'ouargla':30,'oran':31,'el bayadh':32,
    'illizi':33,'bba':34,'boumerdes':35,'el tarf':36,
    'tindouf':37,'tissemsilt':38,'el oued':39,'khenchela':40,
    'souk ahras':41,'tipaza':42,'mila':43,'ain defla':44,
    'naama':45,'ain temouchent':46,'ghardaia':47,'relizane':48,
    'dzair':16,'dzayer':16,'wahran':31,'tizi':15,
  },

  resolveWilaya(name) {
    if (!name) return null;
    const k = name.trim().toLowerCase()
      .replace(/[أإآ]/g,'ا').replace(/[ةه]/g,'ه').replace(/ى/g,'ي')
      .replace(/\s+/g,' ');
    if (this.WILAYAS[k]) return this.WILAYAS[k];
    for (const [key, val] of Object.entries(this.WILAYAS)) {
      if (k.includes(key) || key.includes(k)) return val;
    }
    return null;
  },

  formatPhone(phone) {
    const s = String(phone || '');
    if (s.startsWith('213')) return '0' + s.slice(3);
    if (s.startsWith('+213')) return '0' + s.slice(4);
    if (s.startsWith('0')) return s;
    return '0' + s;
  },

  async req(path, opts = {}) {
    const url = this.base + path;
    const headers = {
      'User-Agent'  : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      ...(this.cookies ? { Cookie: this.cookies } : {}),
      ...(opts.headers || {})
    };
    const resp = await axios({
      url, method: opts.method || 'GET', headers,
      data: opts.data, maxRedirects: 5,
      validateStatus: s => s < 500
    });
    const sc = resp.headers['set-cookie'];
    if (sc) this.cookies = sc.map(c => c.split(';')[0]).join('; ');
    return resp;
  },

  parseToken(html) {
    const m = html.match(/name=["']token["'][^>]*value=["']([a-f0-9]{32,128})["']/i)
           || html.match(/value=["']([a-f0-9]{32,128})["'][^>]*name=["']token["']/i)
           || html.match(/"token"\s*:\s*"([a-f0-9]{32,128})"/i);
    return m ? m[1] : null;
  },

  async login() {
    if (!this.user || !this.pass) return false;
    const page = await this.req('/', { headers: { 'X-Requested-With': '' } });
    const tok = this.parseToken(page.data);
    const params = new URLSearchParams({
      user: this.user, password: this.pass,
      username: this.user, ...(tok ? { token: tok } : {})
    });
    await this.req('/login/', { method: 'POST', data: params.toString() });
    const check = await this.req('/App/Content/views/clients.php');
    const ok = check.status === 200 && check.data.length > 500;
    console.log(`[Kimland] login: ${ok ? '✅ OK' : '❌ FAILED'}`);
    return ok;
  },

  async getToken() {
    const r = await this.req('/App/Content/views/clients.php');
    return this.parseToken(r.data);
  },

  async getFirstCommune(wilayaId) {
    const p = new URLSearchParams({ wilaya: String(wilayaId) });
    const r = await this.req('/App/Control/commande/select_commune.php',
      { method: 'POST', data: p.toString() });
    const m = String(r.data).match(/value=["'](\d+)["']/);
    return m ? m[1] : '1';
  },

  async registerClient(order) {
    if (!this.user || !this.pass) {
      console.log('[Kimland] Pas de credentials. Skip.');
      return;
    }
    const wilayaId = this.resolveWilaya(order.wilaya);
    if (!wilayaId) { console.error(`[Kimland] Wilaya introuvable: "${order.wilaya}"`); return; }
    let token = await this.getToken();
    if (!token) {
      const ok = await this.login();
      if (!ok) return;
      token = await this.getToken();
    }
    if (!token) { console.error('[Kimland] Impossible d\'obtenir le token CSRF'); return; }
    const commune = await this.getFirstCommune(wilayaId);
    const phone   = this.formatPhone(order.phone);
    const parts   = (order.name || 'Client').trim().split(/\s+/);
    const nom     = parts[0];
    const prenom  = parts.slice(1).join(' ') || '.';
    const params = new URLSearchParams({
      nom, prenom, tel1: phone, tel2: '',
      adresse: order.address || '.', commune,
      frais: String(order.livraison || 0), email: '', token
    });
    const resp = await this.req('/App/Control/commande/newcommande_valid.php',
      { method: 'POST', data: params.toString() });
    console.log(`[Kimland] ✅ Client enregistré: ${nom} | wilaya=${wilayaId} | status=${resp.status}`);
  }
};

// ─── CATALOGUE ────────────────────────────────────────────────
const PRODUCTS = {
  '1': {
    name  : 'Magic Floating Pen Set Jaune',
    nameAr: 'قلم سحري عائم',
    price : 2990, achat: 700, marge: 2290,
    desc  : 'قلم يكتب في الهواء بدون ورقة، هدية رائعة للأطفال 🖊️✨',
    url   : 'https://kimland.dz/product/3459/',
    emoji : '🖊️'
  },
  '2': {
    name  : 'V-Comb Anti-Poux Électrique',
    nameAr: 'مشط كهربائي ضد القمل',
    price : 4990, achat: 2000, marge: 2990,
    desc  : 'يقضي على القمل نهائياً بدون كيماويات، آمن للأطفال والكبار 🪮',
    url   : 'https://kimland.dz/product/7260/',
    emoji : '🪮'
  },
  '3': {
    name  : 'Empreinte Nouveau-Né',
    nameAr: 'طبعة قدم المولود الجديد',
    price : 3500, achat: 980, marge: 2520,
    desc  : 'احتفظ بذكرى قدمين طفلك للأبد، هدية لا تُقدر بثمن 👶',
    url   : 'https://kimland.dz/product/3515/',
    emoji : '👶'
  },
  '4': {
    name  : 'Lunettes de Soleil Homme UV400',
    nameAr: 'نظارات شمسية رجالي UV400',
    price : 3990, achat: 1200, marge: 2790,
    desc  : 'حماية كاملة من الأشعة فوق البنفسجية، ستايل عصري 🕶️',
    url   : 'https://kimland.dz/product/3541/',
    emoji : '🕶️'
  },
  '5': {
    name  : 'Enzo Air Fryer 4.5L Professional',
    nameAr: 'قلاية هوائية إنزو 4.5 لتر',
    price : 19000, achat: 12000, marge: 7000,
    desc  : 'طبخ صحي بدون زيت، توفير 80% من الدهون، سعة 4.5L 🍳',
    url   : 'https://kimland.dz/product/9674/',
    emoji : '🍳'
  },
  '6': {
    name  : 'Montre Tommy Hilfiger Max',
    nameAr: 'ساعة تومي هيلفيغر ماكس',
    price : 26000, achat: 16500, marge: 9500,
    desc  : 'ساعة فاخرة أصلية 100%، ستايل عالمي بثمن معقول ⌚',
    url   : 'https://kimland.dz/product/9332/',
    emoji : '⌚'
  },
  '7': {
    name  : 'André Chaussure Classique Homme',
    nameAr: 'حذاء أندريه كلاسيكي رجالي',
    price : 13000, achat: 7300, marge: 5700,
    desc  : 'جلد طبيعي، راحة ممتازة، ستايل رسمي وعصري في نفس الوقت 👞',
    url   : 'https://kimland.dz/product/10318/',
    emoji : '👞'
  },
  '8': {
    name  : 'Chicco Chaussures Pour Enfant',
    nameAr: 'حذاء شيكو للأطفال',
    price : 6500, achat: 3100, marge: 3400,
    desc  : 'ماركة إيطالية أصلية، مريح ومضمون لأطفالك 👟',
    url   : 'https://kimland.dz/product/9434/',
    emoji : '👟'
  }
};

// ─── WILAYAS (للتحقق) ─────────────────────────────────────────
const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة',
  'البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل',
  'سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم',
  'المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف',
  'تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى',
  'النعامة','عين تموشنت','غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال',
  'بني عباس','إن صالح','إن قزام','تقرت','جانت','المغير','المنيعة',
  // نسخة فرنسية أيضاً
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'Sila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt',
  'El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma',
  'Aïn Témouchent','Ghardaïa','Relizane'
];

// ─── SESSION & COMMANDES ──────────────────────────────────────
const sessions = new Map();
const orders   = new Map();

const STAGES = {
  NEW: 'new', MENU: 'menu', CATALOG: 'catalog',
  PRODUCT_SELECTED: 'product_selected',
  ORDER_NAME: 'order_name', ORDER_WILAYA: 'order_wilaya',
  ORDER_ADDRESS: 'order_address', ORDER_QTY: 'order_qty',
  ORDER_CONFIRM: 'order_confirm', ORDER_DONE: 'order_done',
  TRACK_ORDER: 'track_order', AI_CHAT: 'ai_chat',
  HUMAN_NEEDED: 'human_needed', FEEDBACK: 'feedback'
};

// ─── MESSAGES EN DARIJA ───────────────────────────────────────
const MSGS = {

  welcome: (name) =>
    `مرحبا ${name ? `*${name}*` : 'صديقي'} 👋\n` +
    `*واقع الموجة* — متجر جزائري أصيل 🇩🇿\n\n` +
    `واش تحب تعمل؟\n` +
    `1️⃣ 🛍️ شوف المنتجات\n` +
    `2️⃣ 📦 تتبع طلبيتي\n` +
    `3️⃣ 👤 كلم مستشار\n` +
    `4️⃣ ❓ اسأل سؤال\n\n` +
    `✅ *الدفع عند الاستلام — تشوف المنتج قبل ما تدفع*\n\n` +
    `اكتب رقم خيارك 👇`,

  catalog: () =>
    `📦 *منتجاتنا — الدفع عند الاستلام دايما ✅*\n\n` +
    `1️⃣ 🖊️ *قلم سحري عائم* — *2.990 DA*\n` +
    `2️⃣ 🪮 *مشط كهربائي ضد القمل* — *4.990 DA*\n` +
    `3️⃣ 👶 *طبعة قدم المولود* — *3.500 DA*\n` +
    `4️⃣ 🕶️ *نظارات UV400 رجالي* — *3.990 DA*\n` +
    `5️⃣ 🍳 *قلاية هوائية إنزو 4.5L* — *19.000 DA*\n` +
    `6️⃣ ⌚ *ساعة تومي هيلفيغر* — *26.000 DA*\n` +
    `7️⃣ 👞 *حذاء أندريه رجالي* — *13.000 DA*\n` +
    `8️⃣ 👟 *حذاء شيكو أطفال* — *6.500 DA*\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🚚 توصيل لكل ولايات الجزائر\n` +
    `✅ تدفع كي يوصلك السعي على بابك\n\n` +
    `اكتب رقم المنتج 👇\n` +
    `اكتب *0* للرجوع`,

  productDetail: (p) =>
    `${p.emoji} *${p.nameAr}*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📝 ${p.desc}\n\n` +
    `💰 السعر : *${p.price.toLocaleString('fr-DZ')} DA*\n` +
    `🚚 التوصيل : لكل ولايات الجزائر\n` +
    `✅ الدفع : عند الاستلام — تشوف المنتج قبل ما تدفع\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `واش تبي تعمل؟\n` +
    `1️⃣ ✅ *اطلب دروك*\n` +
    `2️⃣ ❓ *عندي سؤال على هذا المنتج*\n` +
    `0️⃣ 🔙 *ارجع للقائمة*`,

  askName: () =>
    `📝 *ابدأ طلبيتك* 🎉\n\n` +
    `اكتبلي *اسمك الكامل* باش نوصلك المنتج\n` +
    `_(مثال: محمد بن علي)_`,

  askWilaya: (name) =>
    `شكراً *${name}* 😊\n\n` +
    `📍 في أنهي *ولاية* تبغي نوصلك؟\n` +
    `_(مثال: Alger، Oran، Constantine، Sétif...)_\n\n` +
    `💡 كل ولاية عندها سعر توصيل مختلف، نحسبه ليك تلقائياً`,

  askAddress: (wilaya) =>
    `✅ *${wilaya}*\n\n` +
    `🏠 اكتبلي *عنوانك التفصيلي* باش يوصلك الليفريور مباشرة\n` +
    `_(مثال: حي السلام، شارع الشهداء، رقم 12)_`,

  askQty: (nameAr, price, tarif) =>
    `📦 *كم حبة تبغي من ${nameAr}؟*\n\n` +
    `1️⃣ حبة واحدة → ${price.toLocaleString('fr-DZ')} DA\n` +
    `2️⃣ حبتين → ${Math.round(price*2*0.95).toLocaleString('fr-DZ')} DA *(وفر 5%)* 🎁\n` +
    `3️⃣ 3 حبات → ${Math.round(price*3*0.90).toLocaleString('fr-DZ')} DA *(وفر 10%)* 🎁🎁\n\n` +
    `🚚 *التوصيل لـ ${tarif ? tarif.wilaya : 'ولايتك'}:*\n` +
    `🏠 عند الباب  : *${tarif ? tarif.domicile.toLocaleString('fr-DZ') : '—'} DA*\n` +
    `📦 Stop Desk : *${tarif ? tarif.stopDesk.toLocaleString('fr-DZ') : '—'} DA*\n` +
    `⏱️ المدة     : *${tarif ? tarif.delai : '—'}*\n\n` +
    `اكتب الكمية (1، 2، 3...)`,

  confirmOrder: (data) => {
    const p        = PRODUCTS[data.productNum];
    const discount = data.qty >= 3 ? 0.10 : data.qty >= 2 ? 0.05 : 0;
    const subTotal = Math.round(p.price * data.qty * (1 - discount));
    const saved    = (p.price * data.qty) - subTotal;
    const tarif    = getTarif(data.wilaya);
    const livraison= tarif ? tarif.domicile : 0;
    const total    = subTotal + livraison;
    data._subTotal  = subTotal;
    data._livraison = livraison;
    data._total     = total;
    data._delai     = tarif ? tarif.delai : '48H';
    return (
      `✅ *تأكيد الطلبية*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${p.emoji} *${p.nameAr}*\n\n` +
      `👤 الاسم    : ${data.name}\n` +
      `📍 الولاية  : ${data.wilaya}\n` +
      `🏠 العنوان  : ${data.address}\n` +
      `📦 الكمية   : ${data.qty} حبة\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🛒 سعر المنتج : ${subTotal.toLocaleString('fr-DZ')} DA` +
        (discount > 0 ? ` *(خصم ${Math.round(discount*100)}% — وفرت ${saved.toLocaleString('fr-DZ')} DA)*` : '') + `\n` +
      `🚚 التوصيل    : ${livraison > 0 ? livraison.toLocaleString('fr-DZ') + ' DA' : 'مجاني 🎁'}\n` +
      `⏱️ المدة      : ${data._delai}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `💰 *المبلغ الإجمالي : ${total.toLocaleString('fr-DZ')} DA*\n\n` +
      `✅ *تدفع كي يوصلك السعي على بابك — مش قبل*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `واش تأكد طلبيتك؟\n` +
      `اكتب *نعم* أو *OUI* للتأكيد ✅\n` +
      `اكتب *لا* أو *NON* للإلغاء ❌`
    );
  },

  orderConfirmed: (orderId, name) =>
    `🎉 *الطلبية مسجلة!*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📋 رقم طلبيتك : *${orderId}*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `*${name ? name : 'صديقي'}*، فريقنا رح يتصل بيك خلال *30 دقيقة* لتأكيد 📞\n\n` +
    `🚚 التوصيل في *2-5 أيام عمل* حسب ولايتك\n` +
    `✅ تدفع كي يوصلك السعي — مش قبل\n\n` +
    `باش تتبع طلبيتك اكتب:\n` +
    `📦 *تتبع ${orderId}*\n\n` +
    `شكراً على ثقتك في واقع الموجة ❤️`,

  trackOrder: (order) => {
    const statusMap = {
      pending  : { e: '⏳', ar: 'في انتظار التأكيد' },
      confirmed: { e: '✅', ar: 'مؤكدة — قيد التحضير' },
      shipped  : { e: '🚚', ar: 'في طريقها إليك!' },
      delivered: { e: '🎉', ar: 'تم التسليم بنجاح!' },
      cancelled: { e: '❌', ar: 'ملغاة' }
    };
    const s = statusMap[order.status] || statusMap.pending;
    const p = PRODUCTS[order.productNum];
    return (
      `📦 *تتبع الطلبية #${order.id}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${p?.emoji || '📦'} ${p?.nameAr || 'منتج'}\n` +
      `👤 ${order.name}\n` +
      `📍 ${order.wilaya}\n` +
      `📅 ${new Date(order.createdAt).toLocaleDateString('ar-DZ')}\n` +
      `💰 ${order.total?.toLocaleString('fr-DZ')} DA\n` +
      `${s.e} *الحالة : ${s.ar}*\n` +
      `${order.trackingCode ? `\n🔢 كود التتبع Yalidine : *${order.trackingCode}*\n` : ''}` +
      `━━━━━━━━━━━━━━━\n` +
      `اكتب *4* للتحدث مع مستشار\n` +
      `اكتب *0* للقائمة الرئيسية`
    );
  },

  humanNeeded: () =>
    `👤 *رح نوصلك بمستشارنا*\n\n` +
    `فريقنا يرد عليك في أقرب وقت ممكن.\n` +
    `⏰ أوقات العمل : *8 صباحاً – 10 مساءً*\n\n` +
    `اكتب سؤالك هنا وسيتم تحويله للفريق.\n` +
    `اكتب *0* للرجوع للقائمة 🔙`,

  outOfHours: () =>
    `🌙 *مرحبا!*\n\n` +
    `فريقنا الآن خارج أوقات الدوام *(10م – 8ص)*\n\n` +
    `رسالتك وصلت وسنرد عليك من الساعة *8 صباحاً* إن شاء الله 🙏\n\n` +
    `في الانتظار يمكنك:\n` +
    `🛍️ اكتب *1* لشوف المنتجات\n` +
    `🛒 اكتب *2* لتسجيل طلبية\n\n` +
    `تصبح على خير! 🌟`,

  nonTextMsg: () =>
    `📝 نعتذر، ما نقدرش نفهم هذا النوع من الرسائل.\n\n` +
    `اكتبلي رسالة نصية وسأكون سعيداً بمساعدتك 😊\n` +
    `اكتب *0* للقائمة الرئيسية`,

  error: () =>
    `❓ ما فهمتكش...\n\n` +
    `اكتب *0* للقائمة الرئيسية\n` +
    `اكتب *4* للتحدث مع مستشار 😊`
};

// ─── SYSTÈME PROMPT IA DARIJA — EXPERT CLOSING ───────────────
function buildSystemPrompt(productContext) {
  const pi = productContext
    ? `\n🎯 المنتج الحالي: *${productContext.nameAr}* (${productContext.name}) — ${productContext.price.toLocaleString('fr-DZ')} DA\n📝 ${productContext.desc}`
    : '';
  return `أنت "كيم" — مساعد مبيعات واقع الموجة على واتساب.
متجر جزائري أصيل، خدمة صادقة، COD دايما. 🇩🇿

🗣️ طريقة الكلام:
- دارجة جزائرية حقيقية: واش، كيفاش، علاش، باش، راني، راه، بالزاف، دروك، قاع
- رسايل قصيرة — 2 إلى 4 سطور فقط على واتساب
- إيموجي باعتدال، ما تبالغش
- إذا كلمك بالفرنسية رد بالفرنسية بشكل طبيعي

🏆 قيم البيع الحقيقية — هذا اللي يفرقنا:
1. COD = صفر خطر — "تدفع كي تشوف المنتج في يدك، مش قبل" ✅
2. الثقة قبل البيع — جاوب بصدق حتى إذا كان الجواب "ما يناسبكش"
3. جودة حقيقية — المنتجات أصلية، ما تبالغش ولا تكذب أبدا
4. سعر واضح — ما تخبيش أي تكلفة، قل الحقيقة من البداية
5. "الزبون الراضي يجيب 3 زبائن — الزبون تعبان يحرق السمعة على 30"

🛒 المنتجات المتوفرة:
${Object.entries(PRODUCTS).map(([k,v])=>`${k}. ${v.nameAr} — ${v.price.toLocaleString('fr-DZ')} DA`).join('\n')}
${pi}

💬 ردود على الاعتراضات الشائعة:
• "غالي" → "راه الدفع عند الاستلام، تشوف المنتج قبل ما تدفع. وعندنا خصم على الكميات."
• "خايف نتغشى" → "نفهمك بالزاف! عندنا COD — متدفعش قبل ما يوصلك المنتج على بابك مباشرة."
• "واش أصلي؟" → "نعم 100%، كيفما مكتوب على الموقع kimland.dz. شوف التفاصيل هناك."
• "واش عندكم ضمان؟" → "الضمان هو COD — تشوف المنتج، تجربه، وبعدين تدفع للسعي."
• "واش عندكم زبائن راضيين؟" → "بالزاف! وكل واحد دفع بعد ما شاف المنتج في يده."

🚫 لا تستعمل ضغط وهمي: "ينتهي خلال ساعة"، "آخر قطعة" — هذا كذب وياخذ الثقة
🚫 لا تعطي معلومات غلط على المنتج أو السعر
✅ الصدق والثقة هما أقوى تقنية بيع — دايما

إذا العميل ما قرر باعد: "خذ وقتك، المنتج موجود. وإذا عندك أي سؤال أنا هنا."`;
}
function getUrgencyLine() { return ''; }
function generateOrderId() {
  return 'KL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,3).toUpperCase();
}

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, { stage: STAGES.NEW, data: {}, history: [], lastActivity: Date.now(), lang: 'ar' });
  }
  const s = sessions.get(phone);
  s.lastActivity = Date.now();
  return s;
}

function isBusinessHours() {
  // 24h/24 — 7j/7 (paramètre WhatsApp mis à jour)
  return true;
}

function detectLang(text) {
  // Détecte si le message est principalement en arabe ou français
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const totalChars  = text.replace(/\s/g,'').length;
  return arabicChars / totalChars > 0.3 ? 'ar' : 'fr';
}

function normalizeConfirm(msg) {
  const yes = ['نعم','أيوه','أيو','آيه','ايوه','yes','oui','ok','okay','نعمmmm','ايه'];
  const no  = ['لا','لأ','non','no','nope','annuler'];
  const m = msg.toLowerCase().replace(/\s/g,'');
  if (yes.some(w => m.includes(w))) return 'yes';
  if (no.some(w => m.includes(w)))  return 'no';
  return null;
}

// ─── ENVOI WA ─────────────────────────────────────────────────
async function sendMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${CONFIG.WA_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text, preview_url: false }
      },
      {
        headers: {
          Authorization: `Bearer ${CONFIG.WA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (e) {
    console.error('❌ WA send error:', e.response?.data || e.message);
  }
}

// Envoyer image produit + lien page
async function sendProductLink(to, product) {
  const msg = `🔗 شوف المنتج هنا:\n${product.url}\n\n📸 صور + فيديو + تفاصيل كاملة`;
  await sendMessage(to, msg);
}

async function notifyOwner(message) {
  if (CONFIG.OWNER_PHONE) {
    await sendMessage(CONFIG.OWNER_PHONE, `🔔 *KIMLAND BOT*\n\n${message}`);
  }
}

// ─── IA CLAUDE — RÉPONSE INTELLIGENTE ────────────────────────
async function getAIResponse(userMessage, session, productContext) {
  const systemPrompt = buildSystemPrompt(productContext);

  // Garder les 10 derniers échanges
  const history = session.history.slice(-10);

  const response = await anthropic.messages.create({
    model     : 'claude-',
    max_tokens: 350,
    system    : systemPrompt,
    messages  : [...history, { role: 'user', content: userMessage }]
  });

  const reply = response.content[0].text;

  // Mémoriser la conversation
  session.history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: reply }
  );
  if (session.history.length > 20) session.history = session.history.slice(-20);

  return reply;
}

// ─── LOGIQUE PRINCIPALE ───────────────────────────────────────
async function handleMessage(phone, text, profileName) {
  const session = getSession(phone);
  const raw = text.trim();
  const msg = raw.toLowerCase();

  // Détecter la langue
  session.lang = detectLang(raw);

  console.log(`📨 [${phone}|${session.stage}] "${raw}"`);

  // ── Commandes globales ──
  if (msg === '0' || msg === 'menu' || msg === 'قائمة' || msg === 'رجوع') {
    session.stage = STAGES.MENU;
    session.data  = {};
    return sendMessage(phone, MSGS.welcome(profileName));
  }

  // Suivi rapide : "تتبع KLXXX" ou "suivi KLXXX"
  const trackMatch = raw.match(/(?:تتبع|suivi|track)\s+([A-Z0-9]{6,})/i);
  if (trackMatch) {
    const id    = trackMatch[1].toUpperCase();
    const order = [...orders.values()].find(o => o.id === id);
    if (order) return sendMessage(phone, MSGS.trackOrder(order));
    return sendMessage(phone, `❌ رقم الطلبية *${id}* غير موجود.\n\nتأكد من الرقم أو اكتب *4* للتواصل معنا.`);
  }

  // ── FSM ──────────────────────────────────────────────────────
  switch (session.stage) {

    // ── MENU / ACCUEIL ───────────────────────────────────────
    case STAGES.NEW:
    case STAGES.MENU: {
      session.stage = STAGES.MENU;

      if (msg === '1') {
        session.stage = STAGES.CATALOG;
        return sendMessage(phone, MSGS.catalog());
      }
      if (msg === '2') {
        session.stage = STAGES.CATALOG;
        return sendMessage(phone, MSGS.catalog());
      }
      if (msg === '3') {
        session.stage = STAGES.TRACK_ORDER;
        return sendMessage(phone, '🔍 إكتب *رقم طلبيتك* (مثال: KL1A2B3C) :');
      }
      if (msg === '4') {
        session.stage = STAGES.HUMAN_NEEDED;
        await notifyOwner(`👤 العميل *${profileName || phone}* يطلب مستشار بشري.`);
        return sendMessage(phone, MSGS.humanNeeded());
      }
      if (msg === '5') {
        session.stage = STAGES.AI_CHAT;
        return sendMessage(phone, '💬 اسألني ما تشاء عن منتجاتنا، أنا هنا لمساعدتك! 😊');
      }

      // Message libre → IA تستقبل وتُقنع
      try {
        const aiReply = await getAIResponse(raw, session, null);
        return sendMessage(phone, aiReply);
      } catch {
        return sendMessage(phone, MSGS.welcome(profileName));
      }
    }

    // ── CATALOGUE ────────────────────────────────────────────
    case STAGES.CATALOG: {
      if (PRODUCTS[raw]) {
        session.data.productNum = raw;
        session.stage = STAGES.PRODUCT_SELECTED;
        await sendMessage(phone, MSGS.productDetail(PRODUCTS[raw]));
        // Envoyer aussi le lien de la landing page
        await sendProductLink(phone, PRODUCTS[raw]);
        return;
      }
      // Essai de correspondance par nom
      const found = Object.entries(PRODUCTS).find(([,p]) =>
        msg.includes(p.nameAr.substring(0,6)) || msg.includes(p.name.toLowerCase().substring(0,6))
      );
      if (found) {
        session.data.productNum = found[0];
        session.stage = STAGES.PRODUCT_SELECTED;
        await sendMessage(phone, MSGS.productDetail(found[1]));
        await sendProductLink(phone, found[1]);
        return;
      }
      return sendMessage(phone, MSGS.catalog());
    }

    // ── PRODUIT SÉLECTIONNÉ ──────────────────────────────────
    case STAGES.PRODUCT_SELECTED: {
      const p = PRODUCTS[session.data.productNum];

      if (msg === '1' || msg === 'order' || msg === 'طلب' || msg === 'اطلب') {
        session.stage = STAGES.ORDER_NAME;
        return sendMessage(phone, MSGS.askName());
      }
      if (msg === '2' || msg === 'سؤال' || msg === 'تفاصيل') {
        session.stage = STAGES.AI_CHAT;
        // IA présente le produit en détail
        try {
          const detail = await getAIResponse(
            `زبون سأل عن المنتج "${p.nameAr}"، اشرحه بالدارجة الجزائرية باختصار وحفزه على الطلب`,
            session, p
          );
          return sendMessage(phone, detail + '\n\n━━━━━━━━━━━━━━━\nإكتب *1* لتطلبه الآن أو *0* للقائمة');
        } catch {
          return sendMessage(phone, `✨ ${p.nameAr}\n\n${p.desc}\n\nالسعر: ${p.price.toLocaleString('fr-DZ')} DA\n\nإكتب *1* لتطلبه الآن.`);
        }
      }
      if (msg === '0') {
        session.stage = STAGES.CATALOG;
        return sendMessage(phone, MSGS.catalog());
      }

      // Message libre → IA répond sur le produit
      try {
        const aiReply = await getAIResponse(raw, session, p);
        // Si l'IA ferme la vente, passer à la commande
        return sendMessage(phone, aiReply + '\n\nإكتب *1* لتطلب الآن! 🛒');
      } catch {
        return sendMessage(phone, MSGS.productDetail(p));
      }
    }

    // ── COMMANDE : NOM ───────────────────────────────────────
    case STAGES.ORDER_NAME: {
      if (raw.length < 3) {
        return sendMessage(phone, '❌ إكتب اسمك الكامل من فضلك (على الأقل 3 أحرف).');
      }
      session.data.name = raw;
      session.stage = STAGES.ORDER_WILAYA;
      return sendMessage(phone, MSGS.askWilaya(raw));
    }

    // ── COMMANDE : WILAYA ────────────────────────────────────
    case STAGES.ORDER_WILAYA: {
      if (raw.length < 3) {
        return sendMessage(phone, '❌ إكتب اسم ولايتك من فضلك.');
      }
      const tarif = getTarif(raw);
      if (!tarif) {
        return sendMessage(phone,
          `❓ ما عرفتش هذه الولاية : "*${raw}*"\n\nإكتب اسم الولاية بالفرنسية\n_(مثال: Alger, Oran, Sétif, Annaba...)_`
        );
      }
      session.data.wilaya = tarif.wilaya; // nom normalisé
      session.data._tarif = tarif;
      session.stage = STAGES.ORDER_ADDRESS;
      return sendMessage(phone,
        `✅ *${tarif.wilaya}*\n🚚 توصيل : *${tarif.domicile.toLocaleString('fr-DZ')} DA* | Stop Desk : *${tarif.stopDesk.toLocaleString('fr-DZ')} DA* | ⏱️ ${tarif.delai}\n\n` +
        MSGS.askAddress(tarif.wilaya)
      );
    }

    // ── COMMANDE : ADRESSE ───────────────────────────────────
    case STAGES.ORDER_ADDRESS: {
      if (raw.length < 5) {
        return sendMessage(phone, '❌ إكتب عنوانك التفصيلي من فضلك (حي، شارع، رقم).');
      }
      session.data.address = raw;
      session.stage = STAGES.ORDER_QTY;
      const p = PRODUCTS[session.data.productNum];
      const tarif = session.data._tarif || getTarif(session.data.wilaya);
      return sendMessage(phone, MSGS.askQty(p.nameAr, p.price, tarif));
    }

    // ── COMMANDE : QUANTITÉ ──────────────────────────────────
    case STAGES.ORDER_QTY: {
      const qty = parseInt(raw);
      if (isNaN(qty) || qty < 1 || qty > 20) {
        return sendMessage(phone, '❌ إكتب كمية صحيحة (بين 1 و20).');
      }
      session.data.qty = qty;
      session.stage = STAGES.ORDER_CONFIRM;
      // Pré-calculer le tarif si pas déjà fait
      if (!session.data._tarif) {
        session.data._tarif = getTarif(session.data.wilaya);
      }
      return sendMessage(phone, MSGS.confirmOrder(session.data));
    }

    // ── COMMANDE : CONFIRMATION ──────────────────────────────
    case STAGES.ORDER_CONFIRM: {
      const answer = normalizeConfirm(raw);

      if (answer === 'yes') {
        const orderId  = generateOrderId();
        const p        = PRODUCTS[session.data.productNum];
        const discount = session.data.qty >= 3 ? 0.10 : session.data.qty >= 2 ? 0.05 : 0;
        const subTotal = Math.round(p.price * session.data.qty * (1 - discount));
        const tarif    = session.data._tarif || getTarif(session.data.wilaya);
        const livraison = tarif ? tarif.domicile : 0;
        const total    = session.data._total || (subTotal + livraison);
        const delai    = session.data._delai || (tarif ? tarif.delai : '48H');
        const clientName = session.data.name;

        const order = {
          id          : orderId,
          phone,
          productNum  : session.data.productNum,
          name        : clientName,
          wilaya      : session.data.wilaya,
          address     : session.data.address,
          qty         : session.data.qty,
          subTotal,
          livraison,
          total,
          discount,
          delai,
          status      : 'pending',
          createdAt   : Date.now(),
          trackingCode: null
        };
        orders.set(orderId, order);

        // ── Auto-enregistrement sur Kimland.dz ─────────────────
        KIMLAND.registerClient(order).catch(err =>
          console.error('[Kimland] Erreur enregistrement:', err.message)
        );

        // Alerte propriétaire avec détail livraison
        await notifyOwner(
          `🛒 *طلبية جديدة #${orderId}*\n\n` +
          `${p.emoji} المنتج  : ${p.nameAr}\n` +
          `👤 العميل  : ${clientName}\n` +
          `📞 الهاتف  : +${phone}\n` +
          `📍 الولاية : ${session.data.wilaya}\n` +
          `🏠 العنوان : ${session.data.address}\n` +
          `📦 الكمية  : ${session.data.qty}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `🛒 المنتج  : ${subTotal.toLocaleString('fr-DZ')} DA\n` +
          `🚚 التوصيل : ${livraison.toLocaleString('fr-DZ')} DA (${delai})\n` +
          `${discount > 0 ? `🎁 خصم    : ${Math.round(discount*100)}%\n` : ''}` +
          `💰 الإجمالي: *${total.toLocaleString('fr-DZ')} DA*\n` +
          `\n⚡ اتصل خلال 30 دقيقة!`
        );

        session.stage = STAGES.ORDER_DONE;
        session.data  = {};
        return sendMessage(phone, MSGS.orderConfirmed(orderId, clientName || profileName || ''));
      }

      if (answer === 'no') {
        session.stage = STAGES.MENU;
        session.data  = {};
        // IA tente un dernier closing
        try {
          const lastChance = await getAIResponse(
            'العميل ألغى الطلبية، جاول تقنعه بدعوة أخيرة قصيرة بالدارجة',
            session, null
          );
          return sendMessage(phone, lastChance + '\n\nإكتب *2* إذا غيرت رأيك 😊');
        } catch {
          return sendMessage(phone, '🙁 حسناً! لما تبغي نكون هنا.\nإكتب *0* للقائمة.');
        }
      }

      // Réponse ambiguë
      return sendMessage(phone, 'إكتب *نعم* أو *OUI* لتأكيد الطلبية\nأو *لا* أو *NON* للإلغاء.');
    }

    // ── APRÈS COMMANDE ───────────────────────────────────────
    case STAGES.ORDER_DONE: {
      session.stage = STAGES.MENU;
      return sendMessage(phone, MSGS.welcome(profileName));
    }

    // ── SUIVI ────────────────────────────────────────────────
    case STAGES.TRACK_ORDER: {
      const trackId = raw.toUpperCase();
      const found   = [...orders.values()].find(o => o.id === trackId);
      if (found) {
        session.stage = STAGES.MENU;
        return sendMessage(phone, MSGS.trackOrder(found));
      }
      return sendMessage(phone, `❌ رقم الطلبية *${trackId}* غير موجود.\n\nتأكد من الرقم أو اكتب *0* للقائمة.`);
    }

    // ── CHAT IA LIBRE ────────────────────────────────────────
    case STAGES.AI_CHAT: {
      // Détecter intention de commander
      const orderIntent = /(?:نطلب|طلب|commander|order|ajouter|أطلب|حب نطلب)/i.test(raw);
      if (orderIntent && Object.keys(session.data).includes('productNum')) {
        session.stage = STAGES.ORDER_NAME;
        return sendMessage(phone, MSGS.askName());
      }

      try {
        const currentProduct = session.data.productNum ? PRODUCTS[session.data.productNum] : null;
        const aiReply = await getAIResponse(raw, session, currentProduct);
        return sendMessage(phone, aiReply);
      } catch (e) {
        console.error('AI Error:', e.message);
        return sendMessage(phone, 'عذراً، صار مشكل تقني صغير. إكتب *4* للتحدث مع مستشار أو *0* للقائمة.');
      }
    }

    // ── AGENT HUMAIN ─────────────────────────────────────────
    case STAGES.HUMAN_NEEDED: {
      await notifyOwner(`💬 رسالة من *${profileName || phone}*:\n"${raw}"`);
      return sendMessage(phone, '✅ رسالتك وصلت لفريقنا! سيردون عليك في أقرب وقت.\n\nإكتب *0* للقائمة.');
    }

    default: {
      session.stage = STAGES.MENU;
      return sendMessage(phone, MSGS.welcome(profileName));
    }
  }
}

// ─── WEBHOOK META ─────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('✅ Webhook vérifié');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Répondre à Meta immédiatement

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value.messages) continue;

        for (const message of value.messages) {
          const phone       = message.from;
          const contact     = value.contacts?.find(c => c.wa_id === phone);
          const profileName = contact?.profile?.name || '';

          if (message.type !== 'text') {
            // Message non-texte (image, audio, sticker...)
            console.log(`📎 [${phone}] Non-text: ${message.type}`);
            await sendMessage(phone, MSGS.nonTextMsg());
            continue;
          }

          const text = message.text.body;
          console.log(`\n📱 ${profileName || phone}: "${text}"`);

          await handleMessage(phone, text, profileName);
        }
      }
    }
  } catch (e) {
    console.error('❌ Webhook error:', e.message);
  }
});

// ─── ADMIN API ────────────────────────────────────────────────

// Toutes les commandes
app.get('/admin/orders', (req, res) => {
  const list = [...orders.values()].sort((a,b) => b.createdAt - a.createdAt);
  const stats = {
    total   : list.length,
    pending : list.filter(o => o.status === 'pending').length,
    confirmed: list.filter(o => o.status === 'confirmed').length,
    shipped : list.filter(o => o.status === 'shipped').length,
    delivered: list.filter(o => o.status === 'delivered').length,
    revenue : list.filter(o => o.status === 'delivered').reduce((s,o) => s + (o.total||0), 0)
  };
  res.json({ stats, orders: list.slice(0, 100) });
});

// Mettre à jour le statut d'une commande → notifie automatiquement le client
app.post('/admin/orders/:id/status', async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  const { status, trackingCode } = req.body;
  order.status = status;
  if (trackingCode) order.trackingCode = trackingCode;

  // Envoyer notification WhatsApp au client
  const statusMessages = {
    confirmed: `✅ *طلبيتك ${order.id} تم تأكيدها!*\nسيتم تحضيرها وإرسالها في أقرب وقت 📦`,
    shipped  : `🚚 *طلبيتك ${order.id} في الطريق!*\n${trackingCode ? `كود التتبع: *${trackingCode}*\n` : ''}توقع الاستلام خلال 24-48 ساعة ⏰`,
    delivered: `🎉 *تم التسليم بنجاح!*\nشكراً على ثقتك في واقع الموجة ❤️\nشاركنا رأيك بكتابة *تقييم* 🌟`,
    cancelled: `❌ *طلبيتك ${order.id} تم إلغاؤها.*\nللاستفسار اكتب *4* للتحدث مع مستشار.`
  };

  if (statusMessages[status]) {
    await sendMessage(order.phone, statusMessages[status]);
  }

  res.json({ success: true, order });
});

// Envoyer message manuel à un client
app.post('/admin/message', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });
  await sendMessage(phone, message);
  res.json({ success: true });
});

// Sessions actives
app.get('/admin/sessions', (req, res) => {
  const list = [...sessions.entries()].map(([phone, s]) => ({
    phone, stage: s.stage, lang: s.lang,
    historyLen: s.history.length,
    lastActivity: new Date(s.lastActivity).toISOString()
  }));
  res.json({ count: list.length, sessions: list });
});

// Health
app.get('/health', (req, res) => res.json({
  status : 'ok',
  uptime : Math.round(process.uptime()),
  sessions: sessions.size,
  orders : orders.size,
  businessHours: isBusinessHours()
}));

// ─── START ────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════
// 🚀 WAKIELMAODJA — Endpoint Landing Pages CPA (iTAG)
// ════════════════════════════════════════════════════════════

// CORS pour autoriser les LPs hostées sur n'importe quel domaine
app.use((req, res, next) => {
  if (req.path.startsWith('/new-order-wakielmaodja') || req.path.startsWith('/admin')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
  }
  next();
});

// Anti-doublon: tel client → timestamp dernière commande
const wakielmaodjaAntiDup = new Map();

app.post('/new-order-wakielmaodja', async (req, res) => {
  try {
    const data = req.body || {};

    // Validation
    if (!data.nom || !data.telephone || !data.wilaya) {
      return res.status(400).json({
        success: false,
        error: 'Champs manquants: nom, telephone, wilaya'
      });
    }

    // Anti-doublon 5 min (même téléphone)
    const phoneKey = String(data.telephone).trim();
    const lastTime = wakielmaodjaAntiDup.get(phoneKey);
    if (lastTime && Date.now() - lastTime < 5 * 60 * 1000) {
      return res.json({
        success: true,
        order_id: 'DUPLICATE',
        message: 'Commande déjà reçue, on te rappelle',
        duplicate: true
      });
    }
    wakielmaodjaAntiDup.set(phoneKey, Date.now());

    // Génération Order ID Wakielmaodja
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `WM${yy}${mm}${dd}-${rnd}`;

    // Sauvegarde dans Map orders (consultable via /admin/orders)
    const order = {
      id: orderId,
      brand: 'Wakielmaodja',
      product: 'iTAG Smart Tracker',
      productNum: 'WM-ITAG',
      lpSource: data.lp_source || 'unknown',
      name: data.nom,
      phone: data.telephone,
      wilaya: data.wilaya,
      commune: data.commune || '',
      address: data.commune || '',
      qty: data.quantite || 1,
      subTotal: 2999 * (data.quantite || 1),
      livraisonType: data.livraison || 'domicile', // 'domicile' ou 'stopdesk'
      total: data.prix_total || (2999 * (data.quantite || 1)),
      delai: '24-48h',
      status: 'pending',
      createdAt: Date.now(),
      trackingCode: null,
      notes: data.notes || ''
    };
    orders.set(orderId, order);

    // 📱 NOTIFICATION WhatsApp à Amine (son natif WhatsApp sur ton tél)
    const cleanPhone = String(data.telephone).replace(/[^0-9]/g, '');
    const callableLink = cleanPhone.startsWith('213')
      ? `+${cleanPhone}`
      : `+213${cleanPhone.replace(/^0/, '')}`;

    const livraisonLabel = (data.livraison === 'stopdesk') ? '📍 Stop Desk (point relais)' : '🏠 À domicile';

    const notifMsg =
      `🆕 *طلب جديد — Wakielmaodja* 🇩🇿\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📋 Order: *${orderId}*\n` +
      `👤 ${data.nom}\n` +
      `📞 ${callableLink}\n` +
      `📍 ${data.wilaya}${data.commune ? ' — ' + data.commune : ''}\n` +
      `🚚 ${livraisonLabel}\n` +
      `📦 iTAG x${data.quantite || 1}\n` +
      `💰 *${(data.prix_total || 2999).toLocaleString('fr-DZ')} DA*\n` +
      `🎯 Source: ${data.lp_source || 'inconnu'}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📞 *Action: appeler le client*`;

    await notifyOwner(notifMsg);

    return res.json({
      success: true,
      order_id: orderId,
      message: 'سنتصل بك للتأكيد'
    });

  } catch (error) {
    console.error('❌ Wakielmaodja order error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur, réessaye ou contacte WhatsApp'
    });
  }
});

// GET pour tester que l'endpoint est live
app.get('/new-order-wakielmaodja', (req, res) => {
  res.json({
    status: 'Wakielmaodja CPA endpoint actif ✅',
    method: 'POST',
    expected_fields: ['nom', 'telephone', 'wilaya', 'commune?', 'quantite?', 'prix_total?', 'lp_source?', 'livraison?']
  });
});

// Stats Wakielmaodja seulement
app.get('/admin/wakielmaodja/orders', (req, res) => {
  const list = [...orders.values()]
    .filter(o => o.brand === 'Wakielmaodja')
    .sort((a, b) => b.createdAt - a.createdAt);

  const stats = {
    total: list.length,
    pending: list.filter(o => o.status === 'pending').length,
    confirmed: list.filter(o => o.status === 'confirmed').length,
    revenue_confirmed: list
      .filter(o => o.status === 'confirmed' || o.status === 'delivered')
      .reduce((s, o) => s + (o.total || 0), 0)
  };

  // Stats par source LP
  const bySource = {};
  list.forEach(o => {
    const src = o.lpSource || 'unknown';
    if (!bySource[src]) bySource[src] = { count: 0, revenue: 0 };
    bySource[src].count++;
    bySource[src].revenue += o.total || 0;
  });

  res.json({ stats, bySource, orders: list.slice(0, 100) });
});app.listen(CONFIG.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🤖 واقع الموجة WhatsApp Bot v2.0 — ACTIF   ║
╠══════════════════════════════════════════════╣
║  Port      : ${CONFIG.PORT}                            ║
║  Langue    : Darija (عربية جزائرية) + FR    ║
║  IA        : Claude claude-                  ║
║  Webhook   : GET/POST /webhook               ║
║  Admin     : GET /admin/orders               ║
║  Health    : GET /health                     ║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
