import puppeteer from 'puppeteer';

const BASE = 'http://localhost:5173';
const PW   = 'Test1234!';

const CLIENTS = [
  { email: 'wei.ming@stresstestpt.com',      name: 'Wei Ming'   },
  { email: 'aisha.rahman@stresstestpt.com',  name: 'Aisha Rahman' },
  { email: 'ryan.chua@stresstestpt.com',     name: 'Ryan Chua'  },
  { email: 'natasha.wong@stresstestpt.com',  name: 'Natasha Wong' },
  { email: 'darren.teo@stresstestpt.com',    name: 'Darren Teo' },
];

const TRAINERS = [
  { email: 'alex.chen.pt2@stresstestpt.com', name: 'Alex Chen'  },
  { email: 'sarah.lim.pt@stresstestpt.com',  name: 'Sarah Lim'  },
  { email: 'raj.kumar.pt@stresstestpt.com',  name: 'Raj Kumar'  },
  { email: 'jessica.tan.pt@stresstestpt.com',name: 'Jessica Tan' },
  { email: 'marcus.ho.pt@stresstestpt.com',  name: 'Marcus Ho'  },
];

const results = [];
let passed = 0, failed = 0;

const pass = (user, test) => { results.push({ s:'PASS', user, test }); passed++; console.log(`  ✓ ${test}`); };
const fail = (user, test, e) => { results.push({ s:'FAIL', user, test, err: e?.message ?? String(e) }); failed++; console.error(`  ✗ ${test}: ${e?.message ?? e}`); };

async function newPage(browser) {
  const ctx  = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.setDefaultTimeout(15000);
  return { page, ctx };
}

const wait = (page, ms) => page.evaluate(ms => new Promise(r => setTimeout(r, ms)), ms);

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 20000 });
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.click('#email');
  await page.type('#email', email, { delay: 15 });
  await page.click('#password');
  await page.type('#password', PW, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 18000 });
  await page.waitForSelector('h1', { timeout: 12000 });
  await wait(page, 800);
}

async function clickTab(page, label) {
  const keyword = label.split(' ').pop().toLowerCase();
  const tryClick = async () => page.evaluate((label) => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.replace(/\s+/g,' ').trim() === label);
    if (btn) { btn.click(); return true; }
    return false;
  }, label);

  let clicked = await tryClick();
  if (!clicked) { await wait(page, 1000); clicked = await tryClick(); }
  if (!clicked) return false;

  try {
    await page.waitForFunction(
      (kw) => {
        const h1 = document.querySelector('h1');
        return h1 && h1.textContent.trim().toLowerCase().includes(kw);
      }, { timeout: 6000 }, keyword
    );
  } catch (_) { await wait(page, 1500); }
  await wait(page, 300);
  return true;
}

const getH1   = page => page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '');
const hasText = (page, t) => page.evaluate(t => document.body.innerText.toLowerCase().includes(t.toLowerCase()), t);
const hasSel  = (page, s) => page.evaluate(s => !!document.querySelector(s), s);

// Wait for any fixed-position overlay (toast) — checks position, zIndex, and background
async function waitForToast(page, timeout = 8000) {
  try {
    await page.waitForFunction(
      () => [...document.querySelectorAll('div')].some(d =>
        d.style && d.style.position === 'fixed' &&
        (d.style.zIndex === '9999' || d.style.zIndex === 9999) &&
        d.style.background && d.style.background.includes('rgba')
      ),
      { timeout }
    );
    return true;
  } catch { return false; }
}

// Submit a React form by finding it via an input placeholder, using requestSubmit()
// which fires a native submit event that bubbles to React's #root delegation listener.
async function submitReactForm(page, inputPlaceholder) {
  return page.evaluate((ph) => {
    const form = [...document.querySelectorAll('form')].find(f =>
      f.querySelector(`input[placeholder="${ph}"]`)
    );
    if (form) { form.requestSubmit(); return true; }
    return false;
  }, inputPlaceholder);
}

// Wait for a Supabase REST API POST/PATCH response to a specific table
async function waitForSupabaseWrite(page, table, method = 'POST', timeout = 10000) {
  return page.waitForResponse(
    resp => resp.url().includes(table) && resp.request().method() === method,
    { timeout }
  ).catch(() => null);
}

// Robustly fill an input via CDP
async function fillInput(page, el, value) {
  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await el.type(String(value), { delay: 15 });
  await wait(page, 300);
}

// ── CLIENT TESTS ──────────────────────────────────────────────────────────────
async function testClient(browser, client, idx) {
  const { page, ctx } = await newPage(browser);
  const u = client.name;
  console.log(`\n── Client ${idx+1}: ${u} ──`);
  try {
    try { await login(page, client.email); pass(u, 'Login'); }
    catch(e) { fail(u, 'Login', e); await ctx.close(); return; }

    // ── MY BOOKINGS ──────────────────────────────────────────────────────────
    try {
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('BOOKING')) throw new Error(`h1="${h1}"`);
      pass(u, 'Bookings: dynamic heading "My Bookings"');
    } catch(e) { fail(u, 'Bookings: heading', e); }

    try {
      const ok = await page.evaluate(() =>
        [...document.querySelectorAll('span')].some(s => {
          const r = s.style.borderRadius;
          return r === '20px' || r === '1.25rem';
        })
      );
      if (!ok) throw new Error('No pill badge found');
      pass(u, 'Bookings: status pill badges');
    } catch(e) { fail(u, 'Bookings: pill badges', e); }

    try {
      const ok = await page.evaluate(() =>
        [...document.querySelectorAll('div')].some(d =>
          d.style.transition && d.style.transition.includes('transform'))
      );
      if (!ok) throw new Error('No hover-transition card');
      pass(u, 'Bookings: hover lift transition');
    } catch(e) { fail(u, 'Bookings: hover', e); }

    try {
      const ok = await page.evaluate(() =>
        [...document.querySelectorAll('div')].some(d => d.style.overflowX === 'auto')
      );
      if (!ok) throw new Error('No overflowX:auto tab bar wrapper');
      pass(u, 'Bookings: tab bar scrollable (mobile)');
    } catch(e) { fail(u, 'Bookings: tab scroll', e); }

    // ── MY PLAN ───────────────────────────────────────────────────────────────
    try {
      await clickTab(page, 'My Plan');
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('PLAN')) throw new Error(`h1="${h1}"`);
      pass(u, 'Plan: dynamic heading "My Plan"');
    } catch(e) { fail(u, 'Plan: heading', e); }

    try {
      await wait(page, 1000);
      const hasPlan  = await hasText(page, 'Day') || await hasText(page, 'Push') || await hasText(page, 'Pull');
      const hasEmpty = await hasSel(page, 'svg');
      if (!hasPlan && !hasEmpty) throw new Error('No plan content or empty SVG state');
      pass(u, 'Plan: content or illustrated empty state');
    } catch(e) { fail(u, 'Plan: content', e); }

    // ── MY PROGRESS ───────────────────────────────────────────────────────────
    try {
      await clickTab(page, 'My Progress');
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('PROGRESS')) throw new Error(`h1="${h1}"`);
      pass(u, 'Progress: dynamic heading "My Progress"');
    } catch(e) { fail(u, 'Progress: heading', e); }

    // Wait for data to load
    try { await page.waitForSelector('.recharts-responsive-container, form', { timeout: 8000 }); } catch(_) {}
    await wait(page, 1000);

    try {
      const ok = await hasSel(page, 'svg[width="20"]');
      if (!ok) throw new Error('No 20px SVG milestone badge');
      pass(u, 'Progress: SVG milestone badges (no emojis)');
    } catch(e) { fail(u, 'Progress: SVG badges', e); }

    try {
      const ok = await hasSel(page, '.recharts-responsive-container, .recharts-wrapper');
      if (!ok) throw new Error('No Recharts container');
      pass(u, 'Progress: body metrics chart renders');
    } catch(e) { fail(u, 'Progress: chart', e); }

    try {
      const ok = await page.evaluate(() => {
        const sel = document.querySelector('select');
        return sel && (sel.style.appearance === 'none' || sel.style.webkitAppearance === 'none' || sel.style.backgroundImage.includes('svg'));
      });
      if (!ok) throw new Error('Select missing custom chevron style');
      pass(u, 'Progress: strength select custom styled');
    } catch(e) { fail(u, 'Progress: styled select', e); }

    // Weigh-in validation: submit out-of-range weight to trigger React's inline error
    try {
      const inputs = await page.$$('input[type="number"]');
      let weightInput = null;
      for (const inp of inputs) {
        const ph = await inp.evaluate(el => el.placeholder);
        if (ph && ph.includes('75')) { weightInput = inp; break; }
      }
      if (!weightInput) throw new Error('Weight input not found');

      // Set weight to 10 (below min 20) so React's handleLog fires and shows error
      await fillInput(page, weightInput, '10');
      await submitReactForm(page, 'e.g. 75.5');
      await wait(page, 1500);

      // Check for React's validation error in the DOM
      const ok = await hasText(page, 'weight must') ||
                 await hasText(page, 'must be between') ||
                 await hasText(page, 'date is required');
      if (!ok) throw new Error('No inline validation error shown');
      pass(u, 'Progress: weigh-in inline validation');
    } catch(e) { fail(u, 'Progress: weigh-in validation', e); }

    // Weigh-in submit: fill valid weight and submit, verify via Supabase network call
    try {
      const inputs = await page.$$('input[type="number"]');
      let weightInput = null;
      for (const inp of inputs) {
        const ph = await inp.evaluate(el => el.placeholder);
        if (ph && ph.includes('75')) { weightInput = inp; break; }
      }
      if (!weightInput) throw new Error('Weight input not found');
      await fillInput(page, weightInput, '77.5');

      const [response] = await Promise.all([
        waitForSupabaseWrite(page, 'client_body_metrics', 'POST', 8000),
        submitReactForm(page, 'e.g. 75.5'),
      ]);
      if (!response) throw new Error('No Supabase body_metrics write detected');
      pass(u, 'Progress: weigh-in submit (verified via API)');
    } catch(e) { fail(u, 'Progress: weigh-in submit', e); }

    try {
      // Wait for metrics to reload after weigh-in submit (fetchMetrics re-fetches on success)
      await wait(page, 2500);
      const ok = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
          b.textContent.toLowerCase().includes('log history') ||
          b.textContent.toLowerCase().includes('recent history')
        );
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!ok) throw new Error('Log history toggle button not found');
      pass(u, 'Progress: log history toggle');
    } catch(e) { fail(u, 'Progress: history toggle', e); }

    // ── DAILY LOG ─────────────────────────────────────────────────────────────
    try {
      await clickTab(page, 'Daily Log');
      await page.waitForSelector('input[type="date"]', { timeout: 10000 });
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('DAILY') && !h1.toUpperCase().includes('LOG'))
        throw new Error(`h1="${h1}"`);
      pass(u, 'Daily Log: dynamic heading "Daily Log"');
    } catch(e) { fail(u, 'Daily Log: heading', e); }

    try {
      const ok = await hasSel(page, 'input[type="date"]');
      if (!ok) throw new Error('No date input');
      pass(u, 'Daily Log: date picker present');
    } catch(e) { fail(u, 'Daily Log: date picker', e); }

    try {
      const ok = await page.evaluate(() =>
        [...document.querySelectorAll('p')].some(p =>
          p.textContent.trim().toUpperCase() === 'EATEN'
        )
      );
      if (!ok) throw new Error('EATEN calorie card not found');
      pass(u, 'Daily Log: calorie summary cards render');
    } catch(e) { fail(u, 'Daily Log: calorie summary', e); }

    try {
      const ok = await page.evaluate(() =>
        document.body.innerText.includes('Set by trainer') ||
        document.body.innerText.includes('Personal target') ||
        document.body.innerText.includes('Set a macro target') ||
        document.body.innerText.includes('Set target') ||
        document.body.innerText.includes('Edit target')
      );
      if (!ok) throw new Error('Macro target section not found');
      pass(u, 'Daily Log: macro target section visible');
    } catch(e) { fail(u, 'Daily Log: macro target', e); }

    // Nutrition save: fill inputs via native setter (React-safe) then submit
    try {
      await wait(page, 500);
      // Verify inputs exist
      const inputsFound = await page.evaluate(() => ({
        protein: !!document.querySelector('input[placeholder="e.g. 150"]'),
        carbs: !!document.querySelector('input[placeholder="e.g. 200"]'),
        fats: !!document.querySelector('input[placeholder="e.g. 60"]'),
      }));
      if (!inputsFound.protein || !inputsFound.carbs || !inputsFound.fats)
        throw new Error(`Macro inputs not found: ${JSON.stringify(inputsFound)}`);

      // Set values using native setter so React picks up the change event
      await page.evaluate(() => {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const setVal = (sel, val) => {
          const el = document.querySelector(`input[placeholder="${sel}"]`);
          if (!el) return;
          nativeSetter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        setVal('e.g. 150', '155');
        setVal('e.g. 200', '210');
        setVal('e.g. 60',  '62');
      });
      await wait(page, 400); // let React batch state updates

      const [response] = await Promise.all([
        waitForSupabaseWrite(page, 'client_nutrition_logs', 'POST', 10000),
        submitReactForm(page, 'e.g. 150'),
      ]);
      if (!response) throw new Error('No Supabase nutrition_logs write detected');
      pass(u, 'Daily Log: nutrition save → Supabase confirmed');
    } catch(e) { fail(u, 'Daily Log: nutrition toast', e); }

    // Steps save: fill via native setter then submit
    try {
      // Wait for component to finish load() reload after successful nutrition save
      try {
        await page.waitForFunction(
          () => !!document.querySelector('input[placeholder="e.g. 8500"]'),
          { timeout: 10000 }
        );
      } catch(_) {}
      await wait(page, 300);
      const stepsFound = await page.evaluate(() => !!document.querySelector('input[placeholder="e.g. 8500"]'));
      if (!stepsFound) throw new Error('Steps input not found');

      await page.evaluate(() => {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const el = document.querySelector('input[placeholder="e.g. 8500"]');
        if (!el) return;
        nativeSetter.call(el, '9200');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await wait(page, 400); // let React batch state updates

      const [response] = await Promise.all([
        waitForSupabaseWrite(page, 'client_steps_logs', 'POST', 10000),
        submitReactForm(page, 'e.g. 8500'),
      ]);
      if (!response) throw new Error('No Supabase steps_logs write detected');
      pass(u, 'Daily Log: steps save → Supabase confirmed');
    } catch(e) { fail(u, 'Daily Log: steps toast', e); }

    // ── MY PROFILE ────────────────────────────────────────────────────────────
    try {
      await wait(page, 800);
      await clickTab(page, 'My Profile');
      await page.waitForFunction(
        () => !!document.querySelector('input[placeholder="Your full name"]'),
        { timeout: 15000 }
      );
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('PROFILE')) throw new Error(`h1="${h1}"`);
      pass(u, 'Profile: dynamic heading "My Profile"');
    } catch(e) { fail(u, 'Profile: heading', e); }

    // Profile save: fill name and verify via Supabase
    try {
      const nameInput = await page.$('input[placeholder="Your full name"]');
      if (!nameInput) throw new Error('Name input not found');
      await fillInput(page, nameInput, client.name);

      const [response] = await Promise.all([
        waitForSupabaseWrite(page, '/profiles', 'PATCH', 10000),
        submitReactForm(page, 'Your full name'),
      ]);
      if (!response) throw new Error('No Supabase profiles write detected');
      pass(u, 'Profile: save → Supabase confirmed');
    } catch(e) { fail(u, 'Profile: save toast', e); }

  } catch(err) { fail(u, 'UNHANDLED', err); }
  finally { await ctx.close(); }
}

// ── TRAINER TESTS ─────────────────────────────────────────────────────────────
async function testTrainer(browser, trainer, idx) {
  const { page, ctx } = await newPage(browser);
  const u = trainer.name;
  console.log(`\n── Trainer ${idx+1}: ${u} ──`);
  try {
    try { await login(page, trainer.email); pass(u, 'Login'); }
    catch(e) { fail(u, 'Login', e); await ctx.close(); return; }

    // APPOINTMENTS
    try {
      await clickTab(page, 'Appointments');
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('APPOINTMENT')) throw new Error(`h1="${h1}"`);
      pass(u, 'Appointments: dynamic heading');
    } catch(e) { fail(u, 'Appointments: heading', e); }

    try {
      await wait(page, 800);
      const ok = await hasText(page, 'Today') || await hasText(page, 'Next 7 Days') || await hasText(page, 'No session');
      if (!ok) throw new Error('Appointments section content not found');
      pass(u, 'Appointments: section renders');
    } catch(e) { fail(u, 'Appointments: renders', e); }

    try {
      const hasHoverCard = await page.evaluate(() =>
        [...document.querySelectorAll('div')].some(d =>
          d.style.transition && d.style.transition.includes('transform'))
      );
      const hasNoSession = await hasText(page, 'No session');
      if (!hasHoverCard && !hasNoSession) throw new Error('Neither hover card nor empty state found');
      pass(u, 'Appointments: renders correctly');
    } catch(e) { fail(u, 'Appointments: renders', e); }

    // AVAILABILITY
    try {
      await clickTab(page, 'Availability');
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('AVAILABILITY')) throw new Error(`h1="${h1}"`);
      pass(u, 'Availability: dynamic heading');
    } catch(e) { fail(u, 'Availability: heading', e); }

    try {
      await wait(page, 500);
      const ok = await hasText(page, 'Weekly Schedule');
      if (!ok) throw new Error('Weekly Schedule section missing');
      pass(u, 'Availability: weekly schedule renders');
    } catch(e) { fail(u, 'Availability: schedule', e); }

    try {
      const toggled = await page.evaluate(() => {
        const toggleBtn = [...document.querySelectorAll('button')].find(b =>
          b.style && (b.style.width === '38px' || b.style.borderRadius === '11px')
        );
        if (toggleBtn) { toggleBtn.click(); return true; }
        return false;
      });
      if (!toggled) throw new Error('Day toggle pill button not found');
      await wait(page, 500);
      pass(u, 'Availability: day toggle works');
    } catch(e) { fail(u, 'Availability: day toggle', e); }

    // MY PROFILE
    try {
      await clickTab(page, 'My Profile');
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('PROFILE')) throw new Error(`h1="${h1}"`);
      pass(u, 'Profile: dynamic heading');
    } catch(e) { fail(u, 'Profile: heading', e); }

    try {
      await wait(page, 500);
      const ok = await hasText(page, 'expertise') || await hasText(page, 'specialt') || await hasText(page, 'offering');
      if (!ok) throw new Error('Profile content missing');
      pass(u, 'Profile: expertise/specialties section renders');
    } catch(e) { fail(u, 'Profile: content', e); }

    // MY PLANS
    try {
      await clickTab(page, 'My Plans');
      const h1 = await getH1(page);
      if (!h1.toUpperCase().includes('PLAN')) throw new Error(`h1="${h1}"`);
      pass(u, 'Plans: dynamic heading');
    } catch(e) { fail(u, 'Plans: heading', e); }

    try {
      await wait(page, 800);
      const ok = await hasText(page, 'plan') || await hasText(page, 'template') || await hasText(page, 'create') || await hasSel(page, 'svg');
      if (!ok) throw new Error('Plans content missing');
      pass(u, 'Plans: content or empty state renders');
    } catch(e) { fail(u, 'Plans: content', e); }

    // TAB SCROLL
    try {
      const ok = await page.evaluate(() =>
        [...document.querySelectorAll('div')].some(d => d.style.overflowX === 'auto')
      );
      if (!ok) throw new Error('No overflowX:auto tab wrapper');
      pass(u, 'Tab bar: scrollable (mobile-safe)');
    } catch(e) { fail(u, 'Tab bar: scrollable', e); }

  } catch(err) { fail(u, 'UNHANDLED', err); }
  finally { await ctx.close(); }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     ReadyPT Rigorous Stress Test Suite          ║');
  console.log('║     5 Clients × 5 Trainers                      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let i = 0; i < CLIENTS.length;  i++) await testClient(browser,  CLIENTS[i],  i);
    for (let i = 0; i < TRAINERS.length; i++) await testTrainer(browser, TRAINERS[i], i);
  } finally {
    await browser.close();
  }

  const pct = Math.round(passed / (passed + failed) * 100);
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                   RESULTS                       ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  ✓ PASSED : ${String(passed).padEnd(4)}  (${pct}%)${' '.repeat(Math.max(0, 21 - pct.toString().length))}║`);
  console.log(`║  ✗ FAILED : ${String(failed).padEnd(35)}║`);
  console.log(`║  TOTAL    : ${String(passed + failed).padEnd(35)}║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.s === 'FAIL').forEach(r => {
      console.log(`  [${r.user}] ${r.test}`);
      if (r.err) console.log(`    → ${r.err}`);
    });
  } else {
    console.log('\n✅ All tests passed!');
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
