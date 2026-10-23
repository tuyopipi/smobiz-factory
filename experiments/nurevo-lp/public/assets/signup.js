(() => {
  const copy = {
    ja: ['新規登録','メールアドレス','紹介コード（任意）','確認メールを送信','確認メールを送りました。メールをご確認ください。','メールのリンクからログインできます。リンクは15分間有効です。','ログイン','送信できませんでした。時間をおいて再度お試しください。'],
    en: ['Sign up','Email address','Referral code (optional)','Send confirmation email','Confirmation email sent. Please check your inbox.','Sign in with the email link. It expires in 15 minutes.','Sign in','Unable to send. Please try again later.'],
    zh: ['注册','邮箱地址','推荐码（可选）','发送确认邮件','确认邮件已发送，请查收。','通过邮件链接登录。链接在15分钟内有效。','登录','发送失败，请稍后重试。'],
    'zh-tw': ['註冊','電子郵件地址','推薦碼（選填）','寄送確認郵件','確認郵件已寄出，請查收。','透過郵件連結登入。連結在15分鐘內有效。','登入','寄送失敗，請稍後再試。'],
    ko: ['가입','이메일 주소','추천 코드 (선택)','확인 이메일 보내기','확인 이메일을 보냈습니다. 메일을 확인해 주세요.','이메일 링크로 로그인하세요. 링크는 15분 동안 유효합니다.','로그인','전송하지 못했습니다. 나중에 다시 시도해 주세요.'],
    es: ['Registrarse','Correo electrónico','Código de referido (opcional)','Enviar confirmación','Correo enviado. Revisa tu correo.','Inicia sesión con el enlace. Caduca en 15 minutos.','Iniciar sesión','No se pudo enviar. Inténtalo más tarde.'],
    fr: ['S’inscrire','Adresse e-mail','Code de parrainage (facultatif)','Envoyer la confirmation','E-mail envoyé. Consultez votre boîte de réception.','Connectez-vous avec le lien. Il expire dans 15 minutes.','Se connecter','Envoi impossible. Réessayez plus tard.'],
    de: ['Registrieren','E-Mail-Adresse','Empfehlungscode (optional)','Bestätigung senden','E-Mail gesendet. Bitte prüfen Sie Ihren Posteingang.','Melden Sie sich über den Link an. Er läuft nach 15 Minuten ab.','Anmelden','Senden fehlgeschlagen. Versuchen Sie es später erneut.']
  };
  const params = new URLSearchParams(location.search);
  const requested = (params.get('lang') || 'ja').toLowerCase();
  const locale = requested === 'tw' || /^zh-(tw|hk|hant)/.test(requested) ? 'zh-tw' : (copy[requested] ? requested : 'en');
  const c = copy[locale];
  // What went wrong, in words. The page used to say "Unable to send" for
  // everything, including an address typed wrong or a wait-and-retry limit.
  const errors = {
    ja: { rate_limited: '短時間に送信が続いたため、一時的に受け付けを止めています。数分おいてから再度お試しください。', invalid_email: 'メールアドレスの形式が正しくありません。', already_registered: 'このメールアドレスはすでに登録されています。ログインしてください。', pending_approval: '登録は承認待ちです。承認されるとメールでお知らせします。', network: '通信できませんでした。インターネット接続を確認して、もう一度お試しください。', server: 'サーバーで問題が発生しました。しばらくしてから再度お試しください。' },
    en: { rate_limited: 'Too many attempts in a short time. Please wait a few minutes and try again.', invalid_email: 'That email address does not look right.', already_registered: 'This email address is already registered. Please sign in.', pending_approval: 'Your registration is waiting for approval. We will email you when it is approved.', network: 'Could not connect. Check your internet connection and try again.', server: 'Something went wrong on our side. Please try again shortly.' },
    zh: { rate_limited: '短时间内尝试次数过多，请几分钟后再试。', invalid_email: '电子邮件地址格式不正确。', already_registered: '此电子邮件已注册，请直接登录。', pending_approval: '注册正在等待审核，通过后会邮件通知您。', network: '无法连接，请检查网络后重试。', server: '服务器出现问题，请稍后再试。' },
    'zh-tw': { rate_limited: '短時間內嘗試次數過多，請幾分鐘後再試。', invalid_email: '電子郵件地址格式不正確。', already_registered: '此電子郵件已註冊，請直接登入。', pending_approval: '註冊正在等待審核，通過後會以郵件通知您。', network: '無法連線，請檢查網路後再試。', server: '伺服器發生問題，請稍後再試。' },
    ko: { rate_limited: '짧은 시간에 시도가 너무 많습니다. 몇 분 후 다시 시도해 주세요.', invalid_email: '이메일 주소 형식이 올바르지 않습니다.', already_registered: '이미 등록된 이메일입니다. 로그인해 주세요.', pending_approval: '등록 승인을 기다리고 있습니다. 승인되면 메일로 알려 드립니다.', network: '연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.', server: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
    es: { rate_limited: 'Demasiados intentos en poco tiempo. Espera unos minutos y vuelve a intentarlo.', invalid_email: 'La dirección de correo no parece válida.', already_registered: 'Este correo ya está registrado. Inicia sesión.', pending_approval: 'Tu registro está pendiente de aprobación. Te avisaremos por correo cuando se apruebe.', network: 'No se pudo conectar. Comprueba tu conexión a internet y vuelve a intentarlo.', server: 'Algo ha fallado en nuestro lado. Inténtalo de nuevo en breve.' },
    fr: { rate_limited: 'Trop de tentatives en peu de temps. Patientez quelques minutes puis réessayez.', invalid_email: 'Cette adresse e-mail ne semble pas valide.', already_registered: 'Cette adresse e-mail est déjà inscrite. Connectez-vous.', pending_approval: 'Votre inscription est en attente de validation. Nous vous préviendrons par e-mail.', network: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.', server: 'Un problème est survenu de notre côté. Réessayez dans un instant.' },
    de: { rate_limited: 'Zu viele Versuche in kurzer Zeit. Bitte warten Sie einige Minuten und versuchen Sie es erneut.', invalid_email: 'Diese E-Mail-Adresse scheint ungültig zu sein.', already_registered: 'Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.', pending_approval: 'Ihre Registrierung wartet auf Freigabe. Wir benachrichtigen Sie per E-Mail.', network: 'Keine Verbindung. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.', server: 'Bei uns ist ein Fehler aufgetreten. Bitte versuchen Sie es gleich noch einmal.' }
  };
  const ALIAS = { rate_limit_unavailable: 'rate_limited', member_exists: 'already_registered', invalid_json: 'invalid_email', mail_send_failed: 'server' };
  function errorText(code, status) {
    const table = errors[locale] || errors.en;
    const key = ALIAS[code] || code;
    if (table[key]) return table[key];
    if (status === 429) return table.rate_limited;
    if (status >= 500 || !status) return status ? table.server : c[7];
    return c[7];
  }
  document.documentElement.lang = locale;
  document.title = `Nurevo — ${c[0]}`;
  ['heading','email-label','referral-label','submit'].forEach((id,i) => document.getElementById(id).textContent = c[i]);
  document.getElementById('note').textContent = c[5];
  document.getElementById('login').textContent = c[6];
  document.getElementById('login').href = '/dashboard?lang=' + encodeURIComponent(locale);
  const form = document.getElementById('signup'), button = document.getElementById('submit'), message = document.getElementById('message');
  form.elements.referral_code.value = params.get('referral_code') || '';
  form.addEventListener('submit', async event => {
    event.preventDefault(); button.disabled = true; message.textContent = '';
    let response;
    try {
      response = await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.elements.email.value, referral_code: form.elements.referral_code.value, locale }) });
    } catch { message.textContent = errorText('network', 0); button.disabled = false; return; }
    if (response.ok) { message.textContent = c[4]; form.hidden = true; return; }
    const body = await response.json().catch(() => ({}));
    message.textContent = errorText(body.code || body.error, response.status);
    button.disabled = false;
  });
})();
