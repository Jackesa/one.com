require('dotenv').config();
const debug = require('debug')('one.com');
const superagent = require('superagent');
const publicIp = require('public-ip');

const agent = superagent.agent();
let csrfToken;

const getCookies = async () => agent
  .get('https://www.one.com/en/')
  .then(res => res.headers['set-cookie']);

const login = async (mail, pwd) => agent
  .post('https://www.one.com/admin/login.do')
  .send('loginDomain=true')
  .send(`displayUsername=${encodeURIComponent(mail)}`)
  .send(`username=${encodeURIComponent(mail)}`)
  .send('targetDomain=')
  .send(`password1=${pwd}`)
  .send('loginTarget=')
  .set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8');

const getDns = async dns => agent
  .post('https://www.one.com/admin/ajax-dns-entries.do')
  .send(`csrft=${csrfToken}`)
  .set('accept', 'application/json')
  .then(res => res.body.response.webView.customSettings.find(o => o.subDomain === dns));

const createDns = async (dns, ip, oldDns) => {
  let newAgent = agent
    .post('https://www.one.com/admin/dns-web-handler.do')
    .send(`cmd=${oldDns ? 'update' : 'create'}`);

  if (oldDns) {
    newAgent = newAgent
      .send(`oldSubDomain=${dns}`)
      .send('oldType=A')
      .send(`oldValue=${oldDns.value}`)
      .send(`id=${oldDns.id}`)
      .send('oldTtl:')
      .send('oldPriority:');
  }

  return newAgent
    .send(`subDomain=${dns}`)
    .send(`value=${ip}`)
    .send(`csrft=${csrfToken}`)
    .send('type=A')
    .send('priority=')
    .send('ttl=')
    .send('typeLanguageToken=undefined')
    .send('showTtl=false')
    .send('showPriority=false')
    .send('isLoading=true')
    .send('isComplete=false')
    .send('hasChanged=false')
    .send('showSpfWarning=false')
    .send('spfWarningSubscription=null')
    .set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8');
};

const setCsrfToken = (cookies) => {
  debug('Got cookies: %s', cookies);
  csrfToken = cookies // eslint-disable-line prefer-destructuring
    .find(c => c.includes('CSRF_G_TOKEN'))
    .split('; ')
    .find(c => c.startsWith('CSRF_G_TOKEN='))
    .split('=')[1];
};

const run = async (usr, pwd, dns) => {
  setCsrfToken(await getCookies());
  await login(usr, pwd);

  const externalIp = await publicIp.v4();
  const oldDns = await getDns(dns);
  if (oldDns && oldDns.value === externalIp) {
    debug('IP hasn\'t changed. Still %s', externalIp);
    return;
  }

  await createDns(dns, externalIp, oldDns);
  debug('Successfully updated dns "%s" to ip %s', dns, externalIp);
};

const usr = process.env.ONE_DOT_COM_USR;
const pwd = process.env.ONE_DOT_COM_PWD;
const dns = process.argv[2];
run(usr, pwd, dns);
