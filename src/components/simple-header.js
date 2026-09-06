function simpleHead(title='',options={}){
  const sortAction=options.sortAction||'';
  const sortLabel=options.sortLabel||'الترتيب حسب';
  const titleAction=options.titleAction||'';
  const titleActionLabel=options.titleActionLabel||'';
  return `<div class="simple-head">${status()}<div class="simple-row"><button class="back-btn header-back-btn icon-button" data-action="back" aria-label="رجوع">${icon('arrow-right',23)}</button><button class="notify icon-button" data-nav="notifications" aria-label="الإشعارات">${icon('bell',22)}${state.notifications?.filter(n=>!n.read).length?`<b class="navbadge notification-badge">${state.notifications.filter(n=>!n.read).length}</b>`:''}</button></div><div class="backline title-only"><h1 class="page-title">${title}</h1>${titleAction?`<button class="title-side-action" data-action="${titleAction}">${titleActionLabel}</button>`:''}${sortAction?`<button class="page-sort-btn icon-button" data-action="${sortAction}" aria-label="${sortLabel}" title="${sortLabel}">${icon('arrow-up-down',21)}</button>`:''}</div></div>`
}