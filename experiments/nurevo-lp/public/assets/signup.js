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
  const locale = requested === 'tw' ? 'zh-tw' : (copy[requested] ? requested : 'en');
  const c = copy[locale];
  document.documentElement.lang = locale;
  document.title = `Nurevo — ${c[0]}`;
  ['heading','email-label','referral-label','submit'].forEach((id,i) => document.getElementById(id).textContent = c[i]);
  document.getElementById('note').textContent = c[5];
  document.getElementById('login').textContent = c[6];
  const form = document.getElementById('signup'), button = document.getElementById('submit'), message = document.getElementById('message');
  form.elements.referral_code.value = params.get('referral_code') || '';
  form.addEventListener('submit', async event => {
    event.preventDefault(); button.disabled = true; message.textContent = '';
    try {
      const response = await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.elements.email.value, referral_code: form.elements.referral_code.value, locale }) });
      if (!response.ok) throw new Error('send_failed');
      message.textContent = c[4]; form.hidden = true;
    } catch { message.textContent = c[7]; button.disabled = false; }
  });
})();
