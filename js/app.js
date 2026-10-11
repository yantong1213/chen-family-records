/* 陳家紀錄：相簿（每個分類一條可左右滑動的照片列）+ 燈箱（第 N / M 張）
 * 每個分類直接在相簿頁左右滑動瀏覽，上方顯示「第 N / M 張」；點照片可全螢幕放大。
 * 網址 #g-<stageId>-<n> 會捲到該分類；#middle 等時期 id 為一般錨點。 */
(function(){
  var D=window.SITE_DATA;
  var album=document.getElementById('album');
  if(!D||!album)return;
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  // ---- flatten categories ----
  var cats=[],byKey={};
  D.stages.forEach(function(st){
    st.groups.forEach(function(g,i){
      var allVideo=g.items.every(function(it){return it.type==='video'});
      var c={key:'g-'+st.id+'-'+(i+1),stage:st,group:g,items:g.items,title:g.title||st.title,
        tag:g.title?st.title+'・'+g.title:st.title,unit:allVideo?'部':'張',
        noun:allVideo?'部影片':'張照片',idx:cats.length,cur:0};
      cats.push(c);byKey[c.key]=c;
    });
  });

  // ---- skeleton ----
  var html='<div class="album-intro"><h2 class="section-title">相簿</h2><p>照片依時期與主題分類。每個分類直接<strong>左右滑動</strong>就能一張一張看，上方會顯示「第幾張／共幾張」；點照片可以全螢幕放大。</p></div>'+
    '<nav class="stage-tabs" aria-label="時期">'+D.stages.map(function(st){return '<a href="#'+esc(st.id)+'">'+esc(st.title)+'</a>'}).join('')+'</nav>';
  D.stages.forEach(function(st){
    html+='<section class="picker-stage" id="'+esc(st.id)+'"><div class="stage-head"><h2>'+esc(st.title)+'</h2><span class="era">'+esc(st.era)+'</span></div>'+
      (st.desc?'<p class="stage-desc">'+esc(st.desc)+'</p>':'');
    cats.forEach(function(c){if(c.stage!==st)return;
      html+='<section class="cat-row" id="'+c.key+'" data-key="'+c.key+'" aria-label="'+esc(c.title)+'">'+
        '<div class="cat-row-head">'+
          '<h3 class="cat-row-title">'+esc(c.title)+'<small>'+c.items.length+' '+c.noun+'</small></h3>'+
          '<div class="cat-row-ctrl">'+
            '<button type="button" class="strip-btn strip-prev" aria-label="上一'+c.unit+'">‹</button>'+
            '<span class="strip-count" aria-live="polite">第 1 / '+c.items.length+' '+c.unit+'</span>'+
            '<button type="button" class="strip-btn strip-next" aria-label="下一'+c.unit+'">›</button>'+
          '</div>'+
        '</div>'+
        '<div class="strip-bar"><i style="width:'+(100/c.items.length)+'%"></i></div>'+
        '<div class="strip" tabindex="0" role="region" aria-roledescription="輪播" aria-label="'+esc(c.title)+'，左右滑動瀏覽">'+
        c.items.map(function(it,i){
          var th=it.type==='video'?it.poster:it.thumb,v=it.type==='video';
          return '<figure class="slide'+(v?' video':'')+'" data-i="'+i+'">'+
            '<button type="button" class="slide-media" aria-label="放大第 '+(i+1)+' '+c.unit+'">'+
              '<img '+(i<2?'':'loading="lazy" ')+'src="'+esc(th)+'" alt="'+esc(it.caption)+'" draggable="false">'+
              (v?'<span class="play"></span><span class="dur">'+esc(it.dur)+'</span>':'')+
            '</button>'+
            '<figcaption>'+esc(it.caption)+'</figcaption></figure>';
        }).join('')+
        '</div></section>';
    });
    html+='</section>';
  });
  album.innerHTML=html;

  // ---- per-category strip behaviour ----
  var rows={};
  album.querySelectorAll('.cat-row').forEach(function(row){
    var c=byKey[row.dataset.key],strip=row.querySelector('.strip'),slides=strip.querySelectorAll('.slide'),
        cnt=row.querySelector('.strip-count'),bar=row.querySelector('.strip-bar i'),
        bp=row.querySelector('.strip-prev'),bn=row.querySelector('.strip-next');
    var r={c:c,strip:strip,slides:slides};rows[c.key]=r;
    function update(i){c.cur=i;cnt.textContent='第 '+(i+1)+' / '+slides.length+' '+c.unit;
      bar.style.width=((i+1)/slides.length*100)+'%';bp.disabled=i===0;bn.disabled=i===slides.length-1}
    function nearest(){var mid=strip.scrollLeft+strip.clientWidth/2,best=0,bd=1e9;
      for(var k=0;k<slides.length;k++){var s=slides[k],d=Math.abs(s.offsetLeft+s.offsetWidth/2-mid);if(d<bd){bd=d;best=k}}return best}
    r.go=function(i,smooth){i=Math.max(0,Math.min(slides.length-1,i));var s=slides[i];
      strip.scrollTo({left:s.offsetLeft+s.offsetWidth/2-strip.clientWidth/2,behavior:smooth===false?'auto':'smooth'});update(i)};
    var ticking=false;
    strip.addEventListener('scroll',function(){if(ticking)return;ticking=true;
      requestAnimationFrame(function(){ticking=false;var i=nearest();if(i!==c.cur)update(i)})},{passive:true});
    bp.addEventListener('click',function(){r.go(c.cur-1)});
    bn.addEventListener('click',function(){r.go(c.cur+1)});
    strip.addEventListener('keydown',function(e){
      if(e.target!==strip)return;
      if(e.key==='ArrowLeft'){e.preventDefault();r.go(c.cur-1)}
      else if(e.key==='ArrowRight'){e.preventDefault();r.go(c.cur+1)}
      else if(e.key==='Enter'){e.preventDefault();open(c,c.cur)}});
    slides.forEach(function(s,i){s.querySelector('.slide-media').addEventListener('click',function(){
      if(i!==c.cur){r.go(i);return}
      open(c,i)})});
    update(0);
  });

  // ---- deep links ----
  function route(initial){
    var h=decodeURIComponent((location.hash||'').slice(1));
    if(byKey[h]){if(lb.classList.contains('open'))close();
      var el=document.getElementById(h);if(el)el.scrollIntoView({behavior:initial?'auto':'smooth',block:'start'})}
  }

  // pause other videos when one plays
  document.addEventListener('play',function(e){document.querySelectorAll('video').forEach(function(v){if(v!==e.target)v.pause()})},true);

  // ---- lightbox (scoped to one category) ----
  var lb=document.getElementById('lb'),stage=lb.querySelector('.lb-stage'),tg=lb.querySelector('.lb-tag'),cap=lb.querySelector('.lb-cap'),
      cnt=lb.querySelector('.lb-count'),bar=lb.querySelector('.lb-bar i'),bPrev=lb.querySelector('.lb-prev'),bNext=lb.querySelector('.lb-next'),
      current=null,items=[],cur=0;
  function render(){var it=items[cur];stage.innerHTML='';
    if(it.type==='video'){var v=document.createElement('video');v.src=it.src;v.poster=it.poster;v.controls=true;v.autoplay=true;v.playsInline=true;stage.appendChild(v);}
    else{var im=document.createElement('img');im.src=it.src;im.alt=it.caption;stage.appendChild(im);}
    tg.textContent=current.tag;cap.textContent=it.caption;
    cnt.textContent='第 '+(cur+1)+' / '+items.length+' '+current.unit;
    bar.style.width=((cur+1)/items.length*100)+'%';
    bPrev.disabled=cur===0;bNext.disabled=cur===items.length-1;
    [cur+1,cur-1].forEach(function(j){var n=items[j];if(n&&n.type!=='video'){var p=new Image();p.src=n.src}});
  }
  function open(c,i){current=c;items=c.items;cur=i;render();lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');stage.innerHTML='';document.body.style.overflow='';
    if(current&&rows[current.key])rows[current.key].go(cur,false)}
  function step(d){var n=cur+d;if(n<0||n>=items.length)return;cur=n;render()}
  lb.querySelector('.lb-close').onclick=close;
  bPrev.onclick=function(e){e.stopPropagation();step(-1)};
  bNext.onclick=function(e){e.stopPropagation();step(1)};
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-body'))close()});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)});
  var sx=null,sy=null;
  lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  lb.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1);
    else if(dy>90&&Math.abs(dy)>Math.abs(dx)*1.5&&e.target.tagName!=='VIDEO')close();
    sx=sy=null});

  window.addEventListener('hashchange',function(){route(false)});
  route(true);
})();
