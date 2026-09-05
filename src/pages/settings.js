function settings(){
  const draft=state.settingsDraft||{...state.settings};
  const isArabic=draft.language==='ar';
  return `
  <section class="screen settings-screen">
    ${simpleHead(isArabic?'الإعدادات المتقدمة':'Advanced settings')}
    <div class="page-wrap settings-wrap">

      <section class="settings-section">
        <div class="settings-section-head">
          <div class="settings-section-icon">◐</div>
          <div>
            <h2>${isArabic?'المظهر':'Appearance'}</h2>
            <p>${isArabic?'اختر الوضع المناسب لك':'Choose your preferred appearance'}</p>
          </div>
        </div>
        <div class="theme-options" role="radiogroup" aria-label="Theme">
          <button class="theme-option ${draft.theme==='light'?'selected':''}" data-action="settings-theme" data-value="light">
            <span class="theme-preview light-preview"><i></i><i></i><i></i></span>
            <span>${isArabic?'الوضع الفاتح':'Light mode'}</span>
            <b class="settings-radio"></b>
          </button>
          <button class="theme-option ${draft.theme==='dark'?'selected':''}" data-action="settings-theme" data-value="dark">
            <span class="theme-preview dark-preview"><i></i><i></i><i></i></span>
            <span>${isArabic?'الوضع الداكن':'Dark mode'}</span>
            <b class="settings-radio"></b>
          </button>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-head">
          <div class="settings-section-icon">文</div>
          <div>
            <h2>${isArabic?'اللغة':'Language'}</h2>
            <p>${isArabic?'لغة واجهة التطبيق':'App interface language'}</p>
          </div>
        </div>
        <div class="settings-choice-row">
          <button class="settings-choice ${draft.language==='ar'?'selected':''}" data-action="settings-language" data-value="ar">
            <span class="choice-main"><strong>العربية</strong><small>Arabic</small></span>
            <b class="settings-radio"></b>
          </button>
          <button class="settings-choice ${draft.language==='en'?'selected':''}" data-action="settings-language" data-value="en">
            <span class="choice-main"><strong>English</strong><small>الإنجليزية</small></span>
            <b class="settings-radio"></b>
          </button>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-head">
          <div class="settings-section-icon">$</div>
          <div>
            <h2>${isArabic?'العملة':'Currency'}</h2>
            <p>${isArabic?'اختر العملة التي تريد عرض الأسعار بها':'Choose the currency used to display prices'}</p>
          </div>
        </div>
        <button class="settings-select" data-action="currency-sheet">
          <span>
            <strong>${currencyLabel(draft.currency,isArabic)}</strong>
            <small>${currencyCodeLabel(draft.currency)}</small>
          </span>
          <span class="settings-chevron">⌄</span>
        </button>
        <p class="settings-note">${isArabic?'سيتم ربط أسعار الصرف من لوحة التحكم عند توصيل الواجهة بالباك إند.':'Exchange rates will be supplied by the backend when the UI is connected.'}</p>
      </section>

      <section class="settings-danger-section">
        <div>
          <h2>${isArabic?'حذف الحساب':'Delete account'}</h2>
          <p>${isArabic?'سيتم حذف الحساب والبيانات المرتبطة به نهائياً بعد التأكيد.':'Your account and associated data will be permanently deleted after confirmation.'}</p>
        </div>
        <button class="delete-account-btn" data-action="delete-account-open">${isArabic?'حذف الحساب':'Delete account'}</button>
      </section>

      <div class="settings-save-wrap">
        <button class="settings-save" data-action="save-settings">${isArabic?'حفظ التعديلات':'Save changes'}</button>
      </div>

    </div>
    ${settingsCurrencySheet(draft,isArabic)}
    ${deleteAccountModal(isArabic)}
  </section>${bottom('profile')}`;
}

function currencyLabel(code,isArabic=true){
  const labels={
    USD:isArabic?'الدولار الأمريكي':'US Dollar',
    SAR:isArabic?'الريال السعودي':'Saudi Riyal',
    YER_OLD:isArabic?'الريال اليمني القديم':'Old Yemeni Rial',
    YER_NEW:isArabic?'الريال اليمني الجديد':'New Yemeni Rial'
  };
  return labels[code]||labels.USD;
}

function currencyCodeLabel(code){
  return {USD:'USD  $',SAR:'SAR  ر.س',YER_OLD:'YER • قديم',YER_NEW:'YER • جديد'}[code]||'USD  $';
}

function settingsCurrencySheet(draft,isArabic){
  const currencies=['USD','SAR','YER_OLD','YER_NEW'];
  return `
    <div class="shade ${state.settingsCurrencySheet?'show':''}" data-action="currency-sheet-close"></div>
    <div class="settings-bottom-sheet ${state.settingsCurrencySheet?'show':''}">
      <div class="sheet-handle"></div>
      <div class="settings-sheet-head">
        <h3>${isArabic?'اختر العملة':'Choose currency'}</h3>
        <button class="sheet-close-btn icon-button" data-action="currency-sheet-close">${icon('x',20)}</button>
      </div>
      <div class="currency-list">
        ${currencies.map(code=>`<button class="currency-option ${draft.currency===code?'selected':''}" data-action="settings-currency" data-value="${code}">
          <span><strong>${currencyLabel(code,isArabic)}</strong><small>${currencyCodeLabel(code)}</small></span>
          <b class="settings-radio"></b>
        </button>`).join('')}
      </div>
    </div>`;
}

function deleteAccountModal(isArabic){
  return `
    <div class="settings-modal-shade ${state.deleteAccountModal?'show':''}" data-action="delete-account-close"></div>
    <div class="delete-account-modal ${state.deleteAccountModal?'show':''}" role="dialog" aria-modal="true">
      <div class="delete-warning-icon">!</div>
      <h3>${isArabic?'هل أنت متأكد من حذف الحساب؟':'Delete your account?'}</h3>
      <p>${isArabic?'هذا الإجراء نهائي. سيتم تسجيل خروجك وحذف بيانات الحساب عند ربط التطبيق بالباك إند.':'This action is permanent. You will be signed out and the account will be deleted when connected to the backend.'}</p>
      <div class="delete-modal-actions">
        <button class="delete-confirm" data-action="delete-account-confirm">${isArabic?'نعم، حذف الحساب':'Yes, delete account'}</button>
        <button class="delete-cancel" data-action="delete-account-close">${isArabic?'إلغاء':'Cancel'}</button>
      </div>
    </div>`;
}
