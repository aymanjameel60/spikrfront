/* Real Spike customer profile bridge. Replaces legacy local-only profile/OTP handlers. */
(function(){
  const api=()=>window.SpikeCommerce;
  const abs=v=>v&&String(v).startsWith('/uploads/')?`http://localhost:9100/api/v1${v}`:v;
  async function refreshProfile(){
    if(!customerToken()||!api()?.req)return null;
    const d=await api().req('/profile',{auth:true});
    const u=d?.user;if(!u)return null;
    state.userProfile={...state.userProfile,name:u.name||'',email:u.email||'',phone:u.phone||'',avatar:abs(u.avatar_url)||state.userProfile?.avatar};
    return u;
  }
  window.refreshSpikeProfile=refreshProfile;

  document.addEventListener('change',e=>{
    if(e.target?.id==='profile-image-input')state.pendingProfileFile=e.target.files?.[0]||null;
  });

  window.savePersonalProfile=async function(){
    const name=(document.getElementById('profile-name-input')?.value||'').trim();
    if(!name){showToast('أدخل الاسم');return}
    try{
      let avatarUrl;
      if(state.pendingProfileFile){
        const fd=new FormData();fd.append('file',state.pendingProfileFile);
        const up=await api().req('/uploads/avatar',{method:'POST',body:fd,auth:true,form:true});avatarUrl=up.url;
      }
      const d=await api().req('/profile',{method:'PUT',auth:true,body:{name,...(avatarUrl?{avatar_url:avatarUrl}:{})}});
      const u=d.user;state.userProfile={...state.userProfile,name:u.name,email:u.email,phone:u.phone,avatar:abs(u.avatar_url)||state.userProfile.avatar};
      state.pendingProfileAvatar=null;state.pendingProfileFile=null;state.personalEditOpen=false;showToast('تم تحديث الملف الشخصي');render();
    }catch(err){showToast(err.message||'تعذر تحديث الملف الشخصي')}
  };

  window.sendPhoneOtp=async function(){
    const phone=(document.getElementById('new-phone-input')?.value||state.pendingPhone||'').trim();
    const digits=phone.replace(/\D/g,'');if(digits.length<8){showToast('أدخل رقم جوال صحيح');return}
    try{
      const d=await api().req('/profile/phone/request',{method:'POST',auth:true,body:{phone}});
      state.pendingPhone=phone;state.phoneOtpStep='otp';state.phoneOtpDebugCode=d.debug_code||'';
      showToast(d.debug_code?`رمز التطوير: ${d.debug_code}`:'تم إرسال رمز التحقق');render();
    }catch(err){showToast(err.message||'تعذر إرسال رمز التحقق')}
  };

  window.verifyPhoneOtp=async function(){
    const code=(document.getElementById('phone-otp-input')?.value||'').replace(/\D/g,'');if(code.length!==6){showToast('أدخل رمز التحقق المكوّن من 6 أرقام');return}
    try{
      const d=await api().req('/profile/phone/verify',{method:'POST',auth:true,body:{code}});state.userProfile.phone=d.user?.phone||state.pendingPhone;state.phoneEditOpen=false;state.phoneOtpStep='phone';state.pendingPhone='';state.phoneOtpDebugCode='';showToast('تم تأكيد رقم الجوال الجديد');render();
    }catch(err){showToast(err.message||'تعذر تأكيد الرقم')}
  };

  document.addEventListener('click',e=>{if(e.target.closest('[data-action="resend-phone-otp"]'))setTimeout(()=>window.sendPhoneOtp(),0)});
  if(customerToken())refreshProfile().then(()=>typeof render==='function'&&render()).catch(()=>{});
})();
