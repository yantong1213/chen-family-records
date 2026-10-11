(function(){
  var D=window.SITE_DATA, main=document.getElementById('stages'), all=[];
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  D.stages.forEach(function(st){
    var sec=document.createElement('section');sec.className='stage';sec.id=st.id;
    sec.innerHTML='<div class="stage-head"><h2>'+esc(st.title)+'</h2><span class="era">'+esc(st.era)+'</span></div>'+(st.desc?'<p class="stage-desc">'+esc(st.desc)+'</p>':'');
    st.groups.forEach(function(g){
      if(g.title){var h=document.createElement('h3');h.className='sub-head';h.textContent=g.title;sec.appendChild(h);}
      var tag=g.title?st.title+'・'+g.title:st.title;
      if(g.title==='珍藏影片'){
        var fl=document.createElement('div');fl.className='feature-list';
        g.items.forEach(function(it){
          var r=document.createElement('div');r.className='frow';
          r.innerHTML='<div class="fmedia"><video controls preload="none" playsinline poster="'+esc(it.poster)+'" src="'+esc(it.src)+'"></video></div><div class="ftext">'+esc(it.caption)+'<small>影片長度 '+esc(it.dur)+'</small></div>';
          fl.appendChild(r);
        });
        sec.appendChild(fl);return;
      }
      var gal=document.createElement('div');gal.className='gallery';
      g.items.forEach(function(it){
        var idx=all.length;it.tag=tag;all.push(it);
        var f=document.createElement('figure');f.className='card'+(it.type==='video'?' video':'');
        var th=it.type==='video'?it.poster:it.thumb;
        f.innerHTML='<div class="media"><img loading="lazy" src="'+esc(th)+'" alt="'+esc(it.caption)+'">'+(it.type==='video'?'<span class="play"></span><span class="dur">'+esc(it.dur)+'</span>':'')+'</div><figcaption>'+esc(it.caption)+'</figcaption>';
        f.addEventListener('click',function(){open(idx)});gal.appendChild(f);
      });
      sec.appendChild(gal);
    });
    main.appendChild(sec);
  });
  // pause other inline videos when one plays
  document.addEventListener('play',function(e){document.querySelectorAll('video').forEach(function(v){if(v!==e.target)v.pause()})},true);
  var lb=document.getElementById('lb'),stage=lb.querySelector('.lb-stage'),tg=lb.querySelector('.lb-tag'),cap=lb.querySelector('.lb-cap'),cnt=lb.querySelector('.lb-count'),cur=0;
  function render(){var it=all[cur];stage.innerHTML='';
    if(it.type==='video'){var v=document.createElement('video');v.src=it.src;v.poster=it.poster;v.controls=true;v.autoplay=true;v.playsInline=true;stage.appendChild(v);}
    else{var im=document.createElement('img');im.src=it.src;im.alt=it.caption;stage.appendChild(im);}
    tg.textContent=it.tag;cap.textContent=it.caption;cnt.textContent=(cur+1)+' / '+all.length;}
  function open(i){cur=i;render();lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');stage.innerHTML='';document.body.style.overflow=''}
  function step(d){cur=(cur+d+all.length)%all.length;render()}
  lb.querySelector('.lb-close').onclick=close;
  lb.querySelector('.lb-prev').onclick=function(e){e.stopPropagation();step(-1)};
  lb.querySelector('.lb-next').onclick=function(e){e.stopPropagation();step(1)};
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-body'))close()});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)});
  var sx=null;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)step(dx<0?1:-1);sx=null});
})();
