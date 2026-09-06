/* Password reset UI backed by Spike OTP endpoints. */
(function(){
  let step='email',email='',debug='';
  function close(){document.querySelector('.spike-reset-root')?.remove()}
  function draw(){
    close();
    const root=document.createElement('div');root.className='spike-reset-root';
    root.innerHTML=`<div class="shade show" data-reset="close"></div><div class="phone-edit-sheet show"><button class="close-personal-edit icon-button" data-reset="close">${icon('x',20)}</button>${step==='email'?`<div class="phone-sheet-icon">${icon('key-round',24)}</div><h3>استعادة كلمة المرور</h3><p>أدخل البريد الإلكتروني المرتبط بحسابك.</p><label class="profile-edit-field"><span>البريد الإلكتروني</span><input id="reset-email" type="email" value="${esc(document.getElementById('auth-email')?.value||email)}"></label><button class="red-action full app-primary-btn" data-reset="request">إرسال رمز الاستعادة</button>`:`<div class="phone-sheet-icon">${icon('shield-check',24)}</div><h3>رمز الاستعادة</h3><p>أدخل الرمز المكوّن من 6 أرقام ثم اختر كلمة مرور جديدة.${debug?`<br><small>رمز التطوير: ${esc(debug)}</small>`:''}</p><label class="profile-edit-field"><span>رمز التحقق</span><input id="reset-code" inputmode="numeric" maxlength="6"></label><label class="profile-edit-field"><span>كلمة المرور الجديدة</span><input id="reset-password" type="password"></label><button class="red-action full app-primary-btn" data-reset="confirm">تغيير كلمة المرور</button><button class="phone-change-number app-text-btn" data-reset="back">تغيير البريد الإلكتروني</button>`}</div>`;
    document.body.appendChild(root);
  }
  async function request(){
    email=(document.getElementById('reset-email')?.value||'').trim();if(!email){showToast('أدخل البريد الإلكتروني');return}
    try{const d=await SpikeCommerce.req('/auth/password-reset/request',{method:'POST',body:{email}});debug=d.debug_code||'';step='code';draw();showToast('تم إرسال رمز الاستعادة')}catch(err){showToast(err.message||'تعذر إرسال رمز الاستعادة')}
  }
  async function confirm(){
    const code=(document.getElementById('reset-code')?.value||'').replace(/\D/g,''),password=document.getElementById('reset-password')?.value||'';
    if(code.length!==6){showToast('أدخل رمزًا من 6 أرقام');return}if(password.length<8){showToast('كلمة المرور يجب أن تكون 8 أحرف على الأقل');return}
    try{await SpikeCommerce.req('/auth/password-reset/confirm',{method:'POST',body:{email,code,password}});close();step='email';debug='';showToast('تم تغيير كلمة المرور، يمكنك تسجيل الدخول الآن')}catch(err){showToast(err.message||'تعذر تغيير كلمة المرور')}
  }
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-action="password-reset-open"]');if(open){draw();return}
    const a=e.target.closest('[data-reset]')?.dataset.reset;if(!a)return;
    if(a==='close')close();else if(a==='request')request();else if(a==='confirm')confirm();else if(a==='back'){step='email';debug='';draw()}
  });
})();
