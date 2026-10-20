import { referralConfig, periodBounds, previousMonth } from './referral-config.mjs';
export async function stripeRead(env, path, params = {}) {
 const secret = String(env.STRIPE_SECRET_KEY || '').trim();
 if (!secret) throw new Error('stripe_not_configured');
 const response = await fetch('https://api.stripe.com/v1/' + path + '?' + new URLSearchParams(params), {
  headers: { authorization: `Bearer ${secret}`, 'Stripe-Version': '2025-06-30.basil' }
 });
 if (!response.ok) throw new Error('stripe_read_failed');
 return response.json();
}
async function listAll(env, path, params) {
 const rows = []; let cursor = '';
 for (let page = 0; page < 100; page++) {
  const result = await stripeRead(env,path,{...params,limit:'100',...(cursor ? {starting_after:cursor} : {})});
  if (!Array.isArray(result.data)) throw new Error('stripe_incomplete');
  rows.push(...result.data);
  if (result.has_more === false) return rows;
  const next = result.data.at(-1)?.id;
  if (!next || next === cursor) throw new Error('stripe_incomplete');
  cursor = next;
 }
 throw new Error('stripe_pagination_limit');
}
const idOf = v => typeof v === 'string' ? v : v?.id;
// Fail closed when payment evidence cannot be fully read. Never treat amount_paid alone as cash.
export async function paymentEvidence(env, invoice) {
 const payments = await listAll(env,'invoice_payments',{invoice:invoice.id,status:'paid'});
 let paid = 0; const charges = [];
 for (const p of payments) {
  if (p.status !== 'paid' || p.currency !== invoice.currency || idOf(p.invoice) !== invoice.id || !Number.isSafeInteger(p.amount_paid) || p.amount_paid <= 0) throw new Error('payment_evidence_incomplete');
  let charge;
  if (p.payment?.type === 'payment_intent') {
   const pi = await stripeRead(env,'payment_intents/' + encodeURIComponent(idOf(p.payment.payment_intent)));
   if (pi.status !== 'succeeded' || !pi.latest_charge) throw new Error('payment_evidence_incomplete');
   charge = await stripeRead(env,'charges/' + encodeURIComponent(idOf(pi.latest_charge)));
  } else if (p.payment?.type === 'charge') {
   charge = await stripeRead(env,'charges/' + encodeURIComponent(idOf(p.payment.charge)));
  } else throw new Error('unsupported_invoice_payment');
  if (!Number.isSafeInteger(charge.amount_refunded) || charge.amount_refunded < 0 || typeof charge.disputed !== 'boolean') throw new Error('refund_evidence_incomplete');
  if (charge.refunded || charge.amount_refunded > 0 || charge.disputed) return { excluded: 'refund_or_dispute', charges: [] };
  if (charge.paid !== true || charge.status !== 'succeeded' || charge.currency !== invoice.currency || idOf(charge.customer) !== idOf(invoice.customer) || !Number.isSafeInteger(charge.amount) || charge.amount < p.amount_paid) throw new Error('payment_evidence_incomplete');
  paid += p.amount_paid; charges.push({id:charge.id,amount_refunded:charge.amount_refunded,invoice_payment:p.id});
 }
 if (!payments.length || paid !== invoice.amount_paid) throw new Error('payment_evidence_incomplete');
 return { charges };
}
export function commissionLine(invoice, account, subscription, config, bounds, evidence) {
 const paidAt = invoice.status_transitions?.paid_at;
 if (invoice.status !== 'paid' || !Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid <= 0 || invoice.paid_out_of_band || evidence.excluded) return null;
 if (!Number.isInteger(paidAt)) throw new Error('invoice_paid_at_missing');
 if (paidAt < bounds.start || paidAt >= bounds.end || paidAt * 1000 < account.created_at) return null;
 if (config.durationMonths !== null) {
  const until = new Date(account.created_at); until.setUTCMonth(until.getUTCMonth() + config.durationMonths);
  if (paidAt * 1000 >= until.getTime()) return null;
 }
 if (Number(invoice.pre_payment_credit_notes_amount || 0) || Number(invoice.post_payment_credit_notes_amount || 0)) return null;
 return { invoice_id:invoice.id,partner_id:account.referred_by_account_id,customer_account_id:account.id,
  subscription_id:subscription,currency:invoice.currency,paid_at:paidAt,amount_paid:invoice.amount_paid,
  rate_bp:config.rateBp,commission_minor:Number(BigInt(invoice.amount_paid) * BigInt(config.rateBp) / 10000n),
  evidence_json:JSON.stringify({invoice:invoice.id,number:invoice.number,paid_at:paidAt,charges:evidence.charges,price_ids:invoice.lines.data.map(l=>l.price?.id || l.pricing?.price_details?.price)}) };
}
export async function runReferralLedger(env, period = previousMonth()) {
 const config = referralConfig(env), bounds = periodBounds(period);
 const proPrice = String(env.STRIPE_PRICE_ID_PRO || '');
 if (!proPrice) throw new Error('pro_price_not_configured');
 const runId = crypto.randomUUID();
 await env.DB.prepare("INSERT INTO referral_ledger_runs VALUES (?,?,?,?, 'building')").bind(runId,period,Date.now(),JSON.stringify(config)).run();
 try {
  const {results: rows} = await env.DB.prepare(`SELECT DISTINCT a.*, s.stripe_subscription_id FROM accounts a JOIN sites s ON s.owner_member_id=a.member_id WHERE a.referred_by_account_id IS NOT NULL AND s.stripe_subscription_id IS NOT NULL`).all();
  const seen = new Map();
  for (const row of rows) {
   const sub = row.stripe_subscription_id;
   if (seen.has(sub)) { if (seen.get(sub) !== row.id) throw new Error('ambiguous_subscription_owner'); continue; }
   seen.set(sub,row.id);
   const {results:owners} = await env.DB.prepare('SELECT DISTINCT owner_member_id FROM sites WHERE stripe_subscription_id=?').bind(sub).all();
   if (owners.length !== 1 || owners[0].owner_member_id !== row.member_id) throw new Error('ambiguous_subscription_owner');
   // Historical paid Pro lines qualify even if the customer has since downgraded.
   const invoices = await listAll(env,'invoices',{subscription:sub,status:'paid'});
   for (const invoice of invoices) {
    const paidAt = invoice.status_transitions?.paid_at;
    if (!Number.isInteger(paidAt)) throw new Error('invoice_paid_at_missing');
    if (paidAt < bounds.start || paidAt >= bounds.end || !invoice.amount_paid || invoice.paid_out_of_band) continue;
    const invoiceSub = idOf(invoice.subscription || invoice.parent?.subscription_details?.subscription);
    if (invoiceSub !== sub) throw new Error('invoice_subscription_mismatch');
    if (invoice.lines?.has_more) invoice.lines = {data:await listAll(env,`invoices/${encodeURIComponent(invoice.id)}/lines`,{}),has_more:false};
    if (!invoice.lines?.data?.length) throw new Error('invoice_lines_missing');
    const prices = invoice.lines.data.map(l => l.price?.id || l.pricing?.price_details?.price);
    if (!prices.includes(proPrice)) continue;
    // Mixed invoices need operator review rather than paying on non-Pro revenue.
    if (prices.some(p => p !== proPrice)) throw new Error('mixed_pro_invoice_review_required');
    if (Number(invoice.pre_payment_credit_notes_amount || 0) || Number(invoice.post_payment_credit_notes_amount || 0)) continue;
    const evidence = await paymentEvidence(env,invoice);
    const line = commissionLine(invoice,row,sub,config,bounds,evidence);
    if (!line) continue;
    await env.DB.prepare('INSERT INTO referral_ledger VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(runId,...Object.values(line)).run();
   }
  }
  await env.DB.prepare("UPDATE referral_ledger_runs SET status='ready' WHERE id=?").bind(runId).run();
  return {run_id:runId,period,status:'ready'};
 } catch (error) {
  await env.DB.prepare("UPDATE referral_ledger_runs SET status='failed' WHERE id=?").bind(runId).run();
  throw error;
 }
}
export async function ledgerExport(env, period, partnerId = null) {
 periodBounds(period);
 const run = await env.DB.prepare("SELECT * FROM referral_ledger_runs WHERE period=? ORDER BY created_at DESC,rowid DESC LIMIT 1").bind(period).first();
 if (!run || run.status !== 'ready') return null;
 const {results: lines} = await env.DB.prepare(`SELECT l.*,p.email AS partner_email,c.email AS customer_email FROM referral_ledger l JOIN accounts p ON p.id=l.partner_id JOIN accounts c ON c.id=l.customer_account_id WHERE l.run_id=?${partnerId === null ? '' : ' AND l.partner_id=?'} ORDER BY l.partner_id,l.currency,l.invoice_id`).bind(run.id,...(partnerId === null ? [] : [partnerId])).all();
 const groups = new Map();
 for (const line of lines) {
  const key = line.partner_id + ':' + line.currency;
  if (!groups.has(key)) groups.set(key,{partner_id:line.partner_id,partner:line.partner_email,currency:line.currency,period,amount_minor:0,customers:[],invoices:[]});
  const g = groups.get(key); g.amount_minor += line.commission_minor; g.customers.push(line.customer_email); g.invoices.push(line.invoice_id);
 }
 return {run,lines,summary:[...groups.values()].map(g=>({...g,customers:[...new Set(g.customers)]}))};
}
export function ledgerCsv(report) {
 const cell = v => '"' + String(v ?? '').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""') + '"';
 const header = ['run_id','partner_id','partner','currency','period','customer','invoice','subscription','paid_at','actual_paid_minor','rate_bp','payout_minor','evidence'];
 return '\uFEFF' + [header,...report.lines.map(l=>[l.run_id,l.partner_id,l.partner_email,l.currency,report.run.period,l.customer_email,l.invoice_id,l.subscription_id,l.paid_at,l.amount_paid,l.rate_bp,l.commission_minor,l.evidence_json])].map(r=>r.map(cell).join(',')).join('\r\n');
}
// Stripe charge minor units, including its backwards-compatible ISK/UGX representation.
export function decimalAmount(minor,currency) {
 if (!Number.isSafeInteger(minor) || minor < 0 || !/^[a-z]{3}$/.test(currency)) throw new Error('invalid_money');
 const zero = new Set(['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','vnd','vuv','xaf','xof','xpf']);
 const places = zero.has(currency) ? 0 : ['bhd','jod','kwd','omr','tnd'].includes(currency) ? 3 : 2;
 const value=String(minor).padStart(places+1,'0');
 return places ? value.slice(0,-places)+'.'+value.slice(-places) : value;
}
export function wiseSummaryCsv(report) {
 const cell = v => '"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
 return '\uFEFF'+[['run_id','partner_id','partner','currency','period','customers','invoice_evidence','amount','amount_minor'],...report.summary.map(g=>[report.run.id,g.partner_id,g.partner,g.currency.toUpperCase(),g.period,g.customers.join(';'),g.invoices.join(';'),decimalAmount(g.amount_minor,g.currency),g.amount_minor])].map(row=>row.map(cell).join(',')).join('\r\n');
}
