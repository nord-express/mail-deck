// One-time codes: a sign-in or verification code in a mail, which the panel shows on its line
// and a notification in its title, a click from the clipboard.
// This file is loaded by the background (importScripts) and by the panel (script tag), so it
// must not rely on anything else; only codeOf is seen outside it.
const codeOf = (() => {
  // a word that names a code, in the languages the panel speaks and a few more
  const CODE_WORDS = /code|passcode|\bpin\b|\botp\b|2fa|verif|one[- ]time|код|пароль|подтвержд|kod|código|codice|kód|κωδικ|קוד|رمز|验证码|驗證碼|認証|確認コード|인증/giu;
  // what makes a code no sign-in code when it stands before the word: a tax code, a postal code, a promo code
  const NOT_SIGN_IN = /(tax|vat|zip|postal|post|area|country|product|item|tariff|hs|sort|swift|bank|branch|promo|promotional|coupon|discount|gift|referral|invite|invitation|error|status|reason|qr|bar|source|dress|conduct|style|colou?r|booking|reservation|flight|voucher|почтовый|промо)\s*-?$/iu;
  // what names the number itself as something else: Invoice ID: 0801, Order #1234, заказ № 5512
  const LABEL = /(invoice|order|ticket|booking|reservation|reference|ref|tracking|receipt|transaction|case|claim|policy|customer|member|flight|room|account\s*(?:number|no|id)|ending\s*(?:in|with)|счёт|счет|заказ|номер|квитанц|договор|билет|рейс|бронь|комнат|rechnung|bestellung|factura|pedido|commande|fattura|ordine)\.?\s*(?:number|no\.?|id|#|№|nr\.?)?\s*[:#№-]?\s*$/iu;
  // 4-8 digits, or 3+3 split by a dash or a space, maybe after a prefix like G-; never part of a longer
  // number, an amount, a date, a time, an address, a word or a phone number. A full stop after it is fine.
  const CODE_NUMBER = /(?<![\p{L}\p{N}#№$€£¥₽/+@_-]|\p{N}[ .,:-])(?:\p{Lu}{1,3}-)?(\d{3}[- ]\d{3}|\d{4,8})(?![\p{L}\p{N}%@_/$€£¥₽]|[- .,:]\p{N})/gu;
  // how far a code may stand from the word that names it: before it ("code: 123456"), after it
  // ("123456 is your code")
  const CODE_BEFORE = 60;
  const CODE_AFTER = 40;
  // The one-time code a text names: {shown, copy}, shown as the mail writes it (G-482913, 123-456)
  // and copy its digits alone, or null. A year is no code, nor a number a label names as something
  // else; of several, six digits win, then the one nearest its word.
  return text => {
    text = String(text || '');
    // each word that names a code, and whether it names a sign-in code
    const words = [...text.matchAll(CODE_WORDS)]
      .map(w => [w.index, w.index + w[0].length, !NOT_SIGN_IN.test(text.slice(Math.max(0, w.index - 24), w.index))]);
    if (!words.some(w => w[2])) {
      return null;
    }
    let best = null;
    for (const m of text.matchAll(CODE_NUMBER)) {
      const start = m.index;
      const end = start + m[0].length;
      if (/^(19|20)\d\d$/.test(m[0]) || LABEL.test(text.slice(Math.max(0, start - 28), start))) {
        continue;
      }
      // the word nearest the number on each side names it: "tax code 0801" is no code, even
      // after a "verification code" a sentence before
      const before = words.filter(([, b]) => b <= start).at(-1);
      const after = words.find(([a]) => a >= end);
      const gap = Math.min(before?.[2] && start - before[1] <= CODE_BEFORE ? start - before[1] : Infinity,
        after?.[2] && after[0] - end <= CODE_AFTER ? after[0] - end : Infinity);
      const six = m[0].replace(/\D/g, '').length === 6;
      if (gap < Infinity && (!best || (six && !best.six) || (six === best.six && gap < best.gap))) {
        best = {shown: m[0], copy: m[0].replace(/\D/g, ''), gap, six};
      }
    }
    return best && {shown: best.shown, copy: best.copy};
  };
})();
