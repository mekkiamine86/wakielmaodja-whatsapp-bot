/**
 * ============================================================
 * KIMLAND DZ — WhatsApp Business AI Bot v2.0
 * Langue principale : Darija (عربية جزائرية) + Français
 * IA : Claude claude-opus-4-6 — Expert Closing COD Algérie
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
`🌟 أهلاً وسهلاً ${name ? `*${name}*` : ''} في *KIMLAND DZ* !

واش تحب تعمل اليوم؟

1️⃣ 🛍️ شوف المنتجات
2️⃣ 🛒 أطلب منتج
3️⃣ 📦 تتبع طلبيتي
4️⃣ 👤 تكلم مع مستشار
5️⃣ ❓ عندي سؤال

📝 إكتب رقم خيارك 👇`,

  catalog: () =>
`🛍️ *منتجاتنا الحصرية — أفضل الأسعار* 🔥

1️⃣ 🖊️ *قلم سحري عائم* — *2.990 DA*
2️⃣ 🪮 *مشط كهربائي ضد القمل* — *4.990 DA*
3️⃣ 👶 *طبعة قدم المولود* — *3.500 DA*
4️⃣ 🕶️ *نظارات UV400 رجالي* — *3.990 DA*
5️⃣ 🍳 *قلاية هوائية إنزو 4.5L* — *19.000 DA*
6️⃣ ⌚ *ساعة تومي هيلفيغر* — *26.000 DA*
7️⃣ 👞 *حذاء أندريه رجالي* — *13.000 DA*
8️⃣ 👟 *حذاء شيكو أطفال* — *6.500 DA*

━━━━━━━━━━━━━━━
🚚 توصيل لكل ولايات الجزائر
💳 الدفع عند الاستلام (COD)
✅ منتجات أصلية 100%

إكتب رقم المنتج اللي يعجبك 👇
إكتب *0* للرجوع`,

  productDetail: (p) =>
`${p.emoji} *${p.nameAr}*
━━━━━━━━━━━━━━━
📝 ${p.desc}

💰 السعر : *${p.price.toLocaleString('fr-DZ')} DA*
🚚 التوصيل : كل ولايات الجزائر 48-72 ساعة
💳 الدفع : عند الاستلام فقط
✅ المخزون : متوفر الآن

${getUrgencyLine()}

━━━━━━━━━━━━━━━
واش تبي تعمل؟

1️⃣ ✅ *طلب الآن*
2️⃣ ❓ *عندي سؤال على هذا المنتج*
0️⃣ 🔙 *ارجع للقائمة*`,

  askName: () =>
`📝 *ابدأ طلبيتك الآن* 🎉

اكتبلي *اسمك الكامل* باش نوصلك المنتج

_(مثال: محمد بن علي)_`,

  askWilaya: (name) =>
`شكراً *${name}* 😊

📍 في أنهي *ولاية* تبغي نوصلك؟

_(مثال: Alger، Oran، Constantine، Sétif...)_

💡 كل ولاية عندها سعر توصيل مختلف، سنحسبه لك تلقائياً ✅`,

  askAddress: (wilaya) =>
`ممتاز! ✅ *${wilaya}*

🏠 اكتبلي *عنوانك التفصيلي* باش يوصلك الليفريور مباشرة

_(مثال: حي السلام، شارع الشهداء، رقم 12)_`,

  askQty: (nameAr, price, tarif) =>
`📦 *كم حبة تبغي من ${nameAr}؟*

💡 *عروض خاصة للكميات:*
━━━━━━━━━━━━━━━
1️⃣ حبة واحدة → ${price.toLocaleString('fr-DZ')} DA
2️⃣ حبتين → ${Math.round(price*2*0.95).toLocaleString('fr-DZ')} DA *(وفر 5%)* 🎁
3️⃣ 3 حبات → ${Math.round(price*3*0.90).toLocaleString('fr-DZ')} DA *(وفر 10%)* 🎁🎁

🚚 *تكاليف التوصيل إلى ${tarif ? tarif.wilaya : 'ولايتك'}:*
🏠 عند الباب : *${tarif ? tarif.domicile.toLocaleString('fr-DZ') : '—'} DA*
📦 Stop Desk : *${tarif ? tarif.stopDesk.toLocaleString('fr-DZ') : '—'} DA*
⏱️ المدة     : *${tarif ? tarif.delai : '—'}*

${getUrgencyLine()}

إكتب الكمية بالأرقام (1, 2, 3...)`,

  confirmOrder: (data) => {
    const p        = PRODUCTS[data.productNum];
    const discount = data.qty >= 3 ? 0.10 : data.qty >= 2 ? 0.05 : 0;
    const subTotal = Math.round(p.price * data.qty * (1 - discount));
    const saved    = (p.price * data.qty) - subTotal;
    const tarif    = getTarif(data.wilaya);
    const livraison = tarif ? tarif.domicile : 0;
    const total    = subTotal + livraison;
    // Sauvegarder dans data pour la commande finale
    data._subTotal  = subTotal;
    data._livraison = livraison;
    data._total     = total;
    data._delai     = tarif ? tarif.delai : '48H';
    return (
`✅ *تأكيد الطلبية*
━━━━━━━━━━━━━━━
${p.emoji} *${p.nameAr}*
👤 الاسم    : ${data.name}
📍 الولاية  : ${data.wilaya}
🏠 العنوان  : ${data.address}
📦 الكمية   : ${data.qty} حبة
━━━━━━━━━━━━━━━
🛒 سعر المنتج : ${subTotal.toLocaleString('fr-DZ')} DA${discount > 0 ? ` *(خصم ${Math.round(discount*100)}% — وفرت ${saved.toLocaleString('fr-DZ')} DA)*` : ''}
🚚 التوصيل    : ${livraison > 0 ? livraison.toLocaleString('fr-DZ') + ' DA' : 'مجاني 🎁'}
⏱️ المدة      : ${data._delai}
━━━━━━━━━━━━━━━
💰 *المبلغ الإجمالي : ${total.toLocaleString('fr-DZ')} DA*
💳 *الدفع عند الاستلام فقط*
━━━━━━━━━━━━━━━
${getUrgencyLine()}
هل تأكد طلبيتك؟

✅ إكتب *نعم* أو *OUI* للتأكيد
❌ إكتب *لا* أو *NON* للإلغاء`
    );
  },

  orderConfirmed: (orderId, name) =>
`🎉 *تم تسجيل طلبيتك بنجاح!*

━━━━━━━━━━━━━━━
📋 رقم طلبيتك : *${orderId}*
━━━━━━━━━━━━━━━

*${name}*، فريقنا رح يتصل بيك خلال *30 دقيقة* لتأكيد الطلب 📞

🚚 التوصيل في *48 إلى 72 ساعة*
💳 الدفع عند الاستلام — ما تدفع قبل ما تشوف!

لتتبع طلبيتك إكتب:
📦 *تتبع ${orderId}*

شكراً على ثقتك في KIMLAND DZ ❤️
نراك قريباً! 🙏`,

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
`📦 *تتبع الطلبية #${order.id}*
━━━━━━━━━━━━━━━
${p?.emoji || '📦'} ${p?.nameAr || 'منتج'}
👤 ${order.name}
📍 ${order.wilaya}
📅 ${new Date(order.createdAt).toLocaleDateString('ar-DZ')}
💰 ${order.total?.toLocaleString('fr-DZ')} DA

${s.e} *الحالة : ${s.ar}*
${order.trackingCode ? `\n🔢 كود التتبع Yalidine : *${order.trackingCode}*\n` : ''}━━━━━━━━━━━━━━━
إكتب *4* للتحدث مع مستشار
إكتب *0* للقائمة الرئيسية`
    );
  },

  humanNeeded: () =>
`👤 *رح نوصلك بمستشارنا...*

سيتصل بك فريقنا في أقرب وقت ممكن.

⏰ أوقات العمل : *8 صباحاً – 10 مساءً* كل يوم

في انتظار الرد، اكتب سؤالك هنا وسيتم تحويله للفريق.

إكتب *0* للرجوع للقائمة 🔙`,

  outOfHours: () =>
`🌙 *مساء النور!*

فريقنا الآن خارج أوقات الدوام *(10م – 8ص)*

لكن لا تقلق! رسالتك وصلت وسنرد عليك من الساعة *8 صباحاً* إن شاء الله.

في الانتظار يمكنك:
🛍️ إكتب *1* لشوف المنتجات
🛒 إكتب *2* لتسجيل طلبية

تصبح على خير! 🌟`,

  nonTextMsg: () =>
`📝 نعتذر، ما نقدرش نفهم هذا النوع من الرسائل حالياً.

إكتبلي رسالة نصية وسأكون سعيداً بمساعدتك 😊

إكتب *0* للقائمة الرئيسية`,

  error: () =>
`❓ ماعرفتش قصدك...

إكتب *0* للرجوع للقائمة الرئيسية
إكتب *4* للتحدث مع مستشار 😊`
};

// ─── SYSTÈME PROMPT IA DARIJA — EXPERT CLOSING ───────────────
function buildSystemPrompt(productContext) {
  return `أنت مساعد مبيعات ذكي لمتجر KIMLAND DZ الجزائري. اسمك "كيم".

🎯 مهمتك الأولى: إقناع العميل بالشراء واتمام الطلبية.

📋 قواعد أساسية:
- تتكلم بالدارجة الجزائرية بطريقة ودية وطبيعية
- ردودك قصيرة (2-4 جمل فقط)
- تستعمل الإيموجي باعتدال
- إذا تكلم الفرنسية رد بالفرنسية
- دائماً تنهي بدعوة للطلب أو سؤال تفاعلي

🛒 المنتجات المتوفرة:
${Object.entries(PRODUCTS).map(([k,v])=>`${k}. ${v.nameAr} (${v.name}) — ${v.price.toLocaleString('fr-DZ')} DA`).join('\n')}

${productContext ? `🎯 المنتج الحالي: ${productContext.nameAr} بـ ${productContext.price.toLocaleString('fr-DZ')} DA\n${productContext.desc}` : ''}

🔑 تقنيات الإقناع اللي تستعملها:
1. FOMO (خوف من الفوات): "هذا المنتج يطلع كثير، المخزون محدود!"
2. Social Proof: "مئات الزبائن من [ولايتهم] طلبوا وراضيين!"
3. Risk Reversal: "الدفع عند الاستلام، ما تخسر حتى شيء!"
4. Urgency: استعمل دائماً getUrgencyLine() — مثال: "العرض سينتهي خلال 2 ساعة و15 دقيقة!"
5. Value stacking: "تحصل على X + توصيل مجاني + ضمان جودة"

🚫 لا تعطي أسعار غلط
🚫 لا تتكلم على منافسين
✅ دائماً ابقى إيجابي وودي

إذا العميل متردد قله: "جرب وإذا ما عجبكش ما تدفعش، الدفع عند الاستلام!"
إذا سأل على الجودة: "منتجات أصلية 100%، عندنا ضمان رضا تام!"
إذا قال غالي: "هذا استثمار مش مصروف، وتقدر تطلب وتدفع عند الاستلام!"`;
}

// ─── URGENCY LINE ─────────────────────────────────────────────
function getUrgencyLine() {
  return `⏳ *العرض على وشك الانتهاء — الآن أو لا!* 🚨`;
}

// ─── UTILS ────────────────────────────────────────────────────
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
  // Heure Algérie (UTC+1)
  const now = new Date();
  const algeriaHour = (now.getUTCHours() + 1) % 24;
  return algeriaHour >= 8 && algeriaHour < 22;
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
    model     : 'claude-opus-4-6',
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
      // Premier contact hors horaires
      if (session.stage === STAGES.NEW && !isBusinessHours()) {
        session.stage = STAGES.MENU;
        return sendMessage(phone, MSGS.outOfHours());
      }
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
    delivered: `🎉 *تم التسليم بنجاح!*\nشكراً على ثقتك في KIMLAND DZ ❤️\nشاركنا رأيك بكتابة *تقييم* 🌟`,
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
app.listen(CONFIG.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🤖 KIMLAND DZ WhatsApp Bot v2.0 — ACTIF   ║
╠══════════════════════════════════════════════╣
║  Port      : ${CONFIG.PORT}                            ║
║  Langue    : Darija (عربية جزائرية) + FR    ║
║  IA        : Claude claude-opus-4-6                  ║
║  Webhook   : GET/POST /webhook               ║
║  Admin     : GET /admin/orders               ║
║  Health    : GET /health                     ║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
