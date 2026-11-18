// Loads a generated app in headless Chromium and reports when its first view is on screen and what that cost.
// The clock starts after the browser is up: a visitor's own browser start is not part of the first run.
// usage: node proof.mjs <playwright index.mjs, as a file URL> <url>
const
    [pwPath, url] = process.argv.slice(2),
    {chromium}    = await import(pwPath),
    browser       = await chromium.launch({channel: 'chromium', headless: true}),
    page          = await browser.newPage(),
    errors        = [],
    failed        = [],
    t0            = Date.now();

let requests = 0, cssRequests = 0, jsRequests = 0, textMs = null;

page.on('console',   m => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
page.on('response',  r => {
    const pathname = new URL(r.url()).pathname;

    requests++;
    /\.css$/.test(pathname)  && cssRequests++;
    /\.m?js$/.test(pathname) && jsRequests++;
    r.status() >= 400        && failed.push(`${r.status()} ${pathname.slice(-100)}`)
});

await page.goto(url, {waitUntil: 'commit'});

try {
    await page.getByText('Welcome to your new Neo.mjs App.').waitFor({state: 'visible', timeout: 60000});
    textMs = Date.now() - t0
} catch (e) {
    errors.push('TIMEOUT: the welcome text never became visible')
}

// the icon font and the last sheets arrive after the text: idle is the styled frame
await page.waitForLoadState('networkidle').catch(() => {});

const
    idleMs = Date.now() - t0,
    dom    = await page.evaluate(() => {
        const
            viewport = document.querySelector('.neo-viewport'),
            tab      = document.querySelector('.neo-tab-container'),
            button   = document.querySelector('.neo-tab-header-button, .neo-tab-header-toolbar .neo-button'),
            icon     = document.querySelector('.fa-home');

        return {
            viewportDisplay: viewport && getComputedStyle(viewport).display,
            tabRect        : tab && (r => `${Math.round(r.width)}x${Math.round(r.height)}`)(tab.getBoundingClientRect()),
            buttonBg       : button && getComputedStyle(button).backgroundColor,
            iconFont       : icon && getComputedStyle(icon).fontFamily.slice(0, 40),
            styleSheets    : document.styleSheets.length
        }
    });

console.log(JSON.stringify({textMs, idleMs, requests, jsRequests, cssRequests, failedCount: failed.length, failed: failed.slice(0, 10), errors: errors.slice(0, 5), ...dom}));

await browser.close();
