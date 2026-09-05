function personalDataPage(){const p=state.userProfile;return `<section class="screen personal-data-screen">${simpleHead('الملف الشخصي')}<div class="page-wrap personal-data-wrap">
  <div class="personal-hero-card">
    <div class="profile-avatar-ring"><img src="${p.avatar||A+'image 1.png'}" alt="الصورة الشخصية"></div>
    <h1>${esc(p.name)}</h1><p>${esc(p.email)}</p>
    <div class="verified-badge">${icon('badge-check',16)} تم التحقق</div>
  </div>
  <button class="edit-profile-wide app-secondary-btn" data-action="edit-personal">${icon('pencil',18)}<span>تعديل الملف الشخصي</span></button>
  <h2 class="personal-section-title">معلومات الحساب</h2>
  <div class="account-info-card">
    <div class="account-info-row"><span class="account-icon">${icon('phone',19)}</span><div><small>الجوال</small><strong dir="ltr">${esc(p.phone)}</strong></div><span class="row-verified">${icon('badge-check',16)} تم التحقق</span><button data-action="edit-phone" aria-label="تغيير رقم الجوال">${icon('pencil',17)}</button></div>
    <div class="account-info-row"><span class="account-icon">${icon('globe-2',19)}</span><div><small>البلد</small><strong>${esc(p.country)}</strong></div></div>
  </div>
</div>${personalEditSheet()}${phoneEditSheet()}</section>${bottom('profile')}`}

function personalEditSheet(){const p=state.userProfile;return `<div class="shade ${state.personalEditOpen?'show':''}" data-action="close-personal-edit"></div><div class="personal-edit-sheet ${state.personalEditOpen?'show':''}"><button class="close-personal-edit icon-button" data-action="close-personal-edit">${icon('x',20)}</button><h3>تعديل الملف الشخصي</h3><div class="edit-avatar-preview"><img id="profile-preview" src="${p.avatar||A+'image 1.png'}"><label class="change-photo-button app-secondary-btn">${icon('camera',17)}<span>تغيير الصورة</span><input id="profile-image-input" type="file" accept="image/*" hidden></label></div><label class="profile-edit-field"><span>الاسم</span><input id="profile-name-input" value="${esc(p.name)}" placeholder="الاسم الكامل"></label><label class="profile-edit-field"><span>البريد الإلكتروني</span><input value="${esc(p.email)}" disabled></label><button class="red-action full profile-save-btn app-primary-btn" data-action="save-personal-edit">${icon('check',18)}<span>حفظ التعديلات</span></button></div>`}

function phoneEditSheet(){
  const step=state.phoneOtpStep||'phone';
  return `<div class="shade ${state.phoneEditOpen?'show':''}" data-action="close-phone-edit"></div><div class="phone-edit-sheet ${state.phoneEditOpen?'show':''}"><button class="close-phone-edit icon-button" data-action="close-phone-edit">${icon('x',20)}</button>${step==='phone'?`<div class="phone-sheet-icon">${icon('phone',24)}</div><h3>تغيير رقم الجوال</h3><p>أدخل رقم الجوال الجديد وسنرسل إليه رمز تحقق OTP لتأكيد الرقم.</p><label class="profile-edit-field"><span>رقم الجوال الجديد</span><input id="new-phone-input" dir="ltr" inputmode="tel" placeholder="مثال: 967 700 000 000" value="${esc(state.pendingPhone||'')}"></label><button class="red-action full app-primary-btn" data-action="send-phone-otp">${icon('send',18)}<span>إرسال رمز التحقق</span></button>`:`<div class="phone-sheet-icon">${icon('message-square-code',24)}</div><h3>تأكيد رقم الجوال</h3><p>أرسلنا رمز تحقق إلى <strong dir="ltr">${esc(state.pendingPhone||'')}</strong>. أدخل الرمز المكوّن من 6 أرقام.</p><input id="phone-otp-input" class="otp-single-input" dir="ltr" inputmode="numeric" maxlength="6" placeholder="••••••"><button class="red-action full app-primary-btn" data-action="verify-phone-otp">${icon('badge-check',18)}<span>تأكيد الرقم</span></button><button class="phone-resend app-text-btn" data-action="resend-phone-otp">${icon('refresh-cw',16)}<span>إعادة إرسال الرمز</span></button><button class="phone-change-number app-text-btn" data-action="phone-back-to-number">${icon('pencil',16)}<span>تغيير الرقم</span></button>`}</div>`
}
