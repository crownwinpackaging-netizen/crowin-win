const toggle=document.querySelector('.nav-toggle'), links=document.querySelector('#navLinks');
const dropdowns=[...document.querySelectorAll('.dropdown-toggle')];
function closeDropdowns(except){dropdowns.forEach(b=>{if(b!==except){b.setAttribute('aria-expanded','false');document.getElementById(b.getAttribute('aria-controls')).hidden=true}})}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));links.classList.toggle('open',open);if(!open)closeDropdowns()});
dropdowns.forEach(b=>b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';closeDropdowns(b);b.setAttribute('aria-expanded',String(open));document.getElementById(b.getAttribute('aria-controls')).hidden=!open}));
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))closeDropdowns()});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=dropdowns.find(b=>b.getAttribute('aria-expanded')==='true');if(open){closeDropdowns();open.focus()}else if(toggle.getAttribute('aria-expanded')==='true'){toggle.setAttribute('aria-expanded','false');links.classList.remove('open');toggle.focus()}});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{let count=0;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});document.querySelectorAll('[data-category]').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++});document.querySelector('#filter-count').textContent=`${count} packaging example${count===1?'':'s'}`}));
const back=document.querySelector('.back-top');window.addEventListener('scroll',()=>{back.hidden=window.scrollY<600},{passive:true});back.addEventListener('click',()=>{window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.querySelector('.logo').focus()});
document.querySelectorAll('.zoom-image').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const modal=document.createElement('dialog');modal.className='lightbox';const image=document.createElement('img');image.src=link.href;image.alt=link.querySelector('img').alt;const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close image');modal.append(image,close);document.body.append(modal);modal.showModal();close.focus();const dismiss=()=>{modal.close();modal.remove();link.focus()};close.addEventListener('click',dismiss);modal.addEventListener('click',e=>{if(e.target===modal)dismiss()});modal.addEventListener('cancel',e=>{e.preventDefault();dismiss()})}));
const form=document.querySelector('#rfq');
if(form){
 const p=new URLSearchParams(location.search).get('product');if(p)form.elements.namedItem('product').value=p.slice(0,300);
 function prepare(){if(!form.reportValidity())return null;const d=new FormData(form);const brief=`Hello Crown Win,\n\nI would like to discuss custom packaging.\n\nName: ${d.get('name')}\nWork email: ${d.get('email')}\nCompany: ${d.get('company')}\nDelivery country: ${d.get('country')}\nPackaging: ${d.get('product')}\nQuantity: ${d.get('quantity')}\nProduct dimensions: ${d.get('dimensions')}\nMatching paper bags: ${d.has('bags')?'Yes':'Not requested'}\nAssess foldable structure: ${d.has('foldable')?'Yes':'Not requested'}\n\nProject details:\n${d.get('details')}\n\nPlease advise suitable options and the next steps.`;document.querySelector('#draft').hidden=false;document.querySelector('#draft-text').value=brief;document.querySelector('#email-draft').href='mailto:kevinlu@box-label.com?subject='+encodeURIComponent('Packaging enquiry: '+d.get('product'))+'&body='+encodeURIComponent(brief);document.querySelector('#form-status').textContent='Draft prepared. Nothing has been sent.';return brief}
 form.addEventListener('submit',e=>{e.preventDefault();prepare()});
 document.querySelector('#copy-brief').addEventListener('click',async()=>{const brief=prepare();if(!brief)return;try{await navigator.clipboard.writeText(brief);document.querySelector('#form-status').textContent='Brief copied. Paste it into an email to kevinlu@box-label.com.'}catch{const text=document.querySelector('#draft-text');text.focus();text.select();document.querySelector('#form-status').textContent='Your brief is selected below. Copy it into your email.'}});
}
/* ===== 首页报价表单 #quoteForm（2026-09-20，照 xinhua site.js）===== */
;(function(){
 var TAG='[crownwin quote-form v1]';
 try{
  var form=document.querySelector('#quoteForm.quote-form');
  if(!form)return;
  var wa=form.getAttribute('data-wa')||'';
  var status=form.querySelector('.form-status');
  function fieldError(f,show){var g=f.closest('.form-group');if(g)g.classList.toggle('invalid',show);f.setAttribute('aria-invalid',show?'true':'false');var err=g&&g.querySelector('.field-error');if(err)err.hidden=!show}
  function validate(f){if(!f.required)return true;var v=(f.value||'').trim();var ok=v.length>0;if(ok&&f.type==='email')ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);fieldError(f,!ok);return ok}
  form.querySelectorAll('[required]').forEach(function(f){
   f.addEventListener('blur',function(){if(f.value)validate(f)});
   f.addEventListener('input',function(){var g=f.closest('.form-group');if(g&&g.classList.contains('invalid'))validate(f)});
   f.addEventListener('change',function(){validate(f)});
  });
  var fileInput=form.querySelector('#fileInput'),fileLabel=form.querySelector('#fileLabel'),drop=form.querySelector('#fileDropZone');
  if(fileInput){fileInput.addEventListener('change',function(){
   var file=fileInput.files&&fileInput.files[0];
   if(file&&file.size>10*1024*1024){fileInput.value='';fileLabel.textContent='File is larger than 10MB - please choose a smaller file';drop.classList.remove('has-file');return}
   fileLabel.textContent=file?file.name:'No file selected';drop.classList.toggle('has-file',!!file);
  })}
  function showStatus(text,waHref,linkText){
   if(!status)return;status.hidden=false;status.textContent=text+' ';
   if(waHref){var a=document.createElement('a');a.href=waHref;a.target='_blank';a.rel='noopener';a.textContent=linkText;status.appendChild(a)}
  }
  form.addEventListener('submit',function(ev){
   ev.preventDefault();
   try{
    var honey=form.querySelector('input[name="_honey"]');if(honey&&honey.value)return;
    var firstBad=null;
    form.querySelectorAll('[required]').forEach(function(f){if(!validate(f)&&!firstBad)firstBad=f});
    if(firstBad){firstBad.focus();return}
    var data=new FormData(form);
    var endpoint=form.getAttribute('data-endpoint') || 'https://formspree.io/f/xbglybqq';
    var lines=['Hi Crown Win, quote request from your website.'];
    [['name','name'],['company','company'],['email','email'],['phone','phone'],['product_type','product type'],['quantity','quantity'],['message','message']].forEach(function(p){
     var v=data.get(p[0]);if(v&&typeof v==='string')lines.push(p[1]+': '+v);
    });
    var hasFile=fileInput&&fileInput.files&&fileInput.files.length>0;
    var waHref='https://wa.me/'+wa+'?text='+encodeURIComponent(lines.join('\n'));
    if(!endpoint){
     console.info(TAG,'no endpoint yet - WhatsApp fallback');
     showStatus('Our online form is being connected. Your details are ready to send on WhatsApp.'+(hasFile?' Please attach your logo file in the chat.':''),waHref,'Send it on WhatsApp instead');
     return;
    }
    var btn=form.querySelector('button[type="submit"]');var btnText=btn?btn.textContent:'';
    if(btn){btn.disabled=true;btn.textContent='Sending...'}
    fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'}})
     .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r})
     .then(function(){
      var thanks=form.getAttribute('data-thanks');
      if(thanks){location.href=thanks;return}
      showStatus('Thank you, we received your details.');form.reset();
      if(fileLabel)fileLabel.textContent='No file selected';if(drop)drop.classList.remove('has-file');
     })
     .catch(function(e){console.error(TAG,e);showStatus('Sorry, the form did not go through. Please try again, or',waHref,'send it on WhatsApp')})
     .then(function(){if(btn){btn.disabled=false;btn.textContent=btnText}});
   }catch(e){console.error(TAG,'submit failed',e)}
  });
  console.info(TAG,'ready');
 }catch(e){console.error(TAG,'init failed',e)}
})();
/* ===== /首页报价表单 ===== */
/* ===== 客户评价卡 Watch 跳转（2026-09-20）===== */
;(function(){
 var TAG='[crownwin feedback-watch v1]';
 try{
  var v=document.querySelector('.cw-video');
  if(!v)return;
  document.querySelectorAll('.cw-fb-play').forEach(function(btn){
   btn.addEventListener('click',function(){
    try{
     var t=Number(btn.getAttribute('data-seek'))||0;
     var go=function(){v.currentTime=t;v.scrollIntoView({behavior:'smooth',block:'center'});var p=v.play();if(p&&p.catch)p.catch(function(e){console.error(TAG,'play blocked',e)})};
     if(v.readyState>=1){go()}else{v.addEventListener('loadedmetadata',go,{once:true});v.load()}
    }catch(e){console.error(TAG,'click failed',e)}
   });
  });
  console.info(TAG,'ready');
 }catch(e){console.error(TAG,'init failed',e)}
})();
/* ===== /客户评价卡 Watch 跳转 ===== */
