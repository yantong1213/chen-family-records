/* 陳家紀錄：分類相簿 + 燈箱（第 N / M 張）
 * 網址 #g-<stageId>-<n> 代表打開某個分類；#middle 等階段 id 會回到分類選單。 */
(function(){
  var D=window.SITE_DATA;
  var album=document.getElementById('album');
  if(!D||!album)return;
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  // ---- flatten categories ----
  var cats=[],byKey={},stageIds={};
  D.stages.forEach(function(st){
    stageIds[st.id]=st;
    st.groups.forEach(function(g,i){
      var allVideo=g.items.every(function(it){return it.type==='video'});
      var c={key:'g-'+st.id+'-'+(i+1),stage:st,group:g,title:g.title||st.title,
        tag:g.title?st.title+'・'+g.title:st.title,unit:allVideo?'部':'張',
        noun:allVideo?'部影片':'張照片',featured:g.title==='珍藏影片',idx:cats.length};
      var first=g.items[0]||{};c.cover=first.type==='video'?first.poster:first.thumb;
      cats.push(c);byKey[c.key]=c;
    });
  });

  // ---- skeleton ----
  album.innerHTML=
    '<div class="album-picker" id="album-picker">'+
      '<div class="album-intro"><h2 class="section-title">相簿</h2><p>照片依時期與主題分類，點一個分類就只看那一組；看完可以直接切換到下一個分類。</p></div>'+
      '<nav class="stage-tabs" aria-label="時期">'+D.stages.map(function(st){return '<a href="#'+esc(st.id)+'">'+esc(st.title)+'</a>'}).join('')+'</nav>'+
      '<div class="picker-stages"></div>'+
    '</div>'+
    '<div class="album-view" id="album-view" hidden>'+
      '<div class="album-bar">'+
        '<button type="button" class="album-back" aria-label="回到分類選單"><span aria-hidden="true">‹</span> 分類</button>'+
        '<label class="album-select-wrap"><span class="sr-only">切換分類</span><select class="album-select"></select></label>'+
      '</div>'+
      '<header class="album-head"><p class="album-stage"></p><h2 class="album-title"></h2><p class="album-meta"></p></header>'+
      '<div class="album-content"></div>'+
      '<div class="album-pager"><a class="pager-prev" href="#"></a><a class="pager-next" href="#"></a></div>'+
    '</div>';

  var picker=document.getElementById('album-picker'),view=document.getElementById('album-view');
  var pickerStages=picker.querySelector('.picker-stages');
  var sel=view.querySelector('.album-select'),content=view.querySelector('.album-content');

  // picker: one block per stage, cover cards per category
  D.stages.forEach(function(st){
    var blk=document.createElement('section');blk.className='picker-stage';blk.id=st.id;
    var html='<div class="stage-head"><h2>'+esc(st.title)+'</h2><span class="era">'+esc(st.era)+'</span></div>'+
      (st.desc?'<p class="stage-desc">'+esc(st.desc)+'</p>':'')+'<div class="cat-grid">';
    cats.forEach(function(c){if(c.stage!==st)return;
      html+='<a class="cat-card'+(c.unit==='部'?' is-video':'')+'" href="#'+c.key+'">'+
        '<span class="cat-cover"><img loading="lazy" src="'+esc(c.cover)+'" alt="">'+(c.unit==='部'?'<span class="play small"></span>':'')+'</span>'+
        '<span class="cat-name">'+esc(c.title)+'</span>'+
        '<span class="cat-count">'+c.group.items.length+' '+c.noun+'</span></a>';
    });
    blk.innerHTML=html+'</div>';pickerStages.appendChild(blk);
  });

  // select: optgroups by stage
  D.stages.forEach(function(st){
    var og=document.createElement('optgroup');og.label=st.title;
    cats.forEach(function(c){if(c.stage!==st)return;var o=document.createElement('option');o.value=c.key;o.textContent=c.title+'（'+c.group.items.length+'）';og.appendChild(o)});
    sel.appendChild(og);
  });
  sel.addEventListener('change',function(){location.hash='#'+sel.value});
  view.querySelector('.album-back').addEventListener('click',function(){location.hash='#'+(current?current.stage.id:'album')});

  // ---- render one category ----
  var current=null,items=[];
  function renderCat(c){
    current=c;items=c.group.items;sel.value=c.key;
    view.querySelector('.album-stage').innerHTML=esc(c.stage.title)+' <span class="era">'+esc(c.stage.era)+'</span>';
    view.querySelector('.album-title').textContent=c.title;
    view.querySelector('.album-meta').textContent='共 '+items.length+' '+c.noun+(c.featured?'':'・點任一'+c.unit+'放大，左右滑動切換');
    content.innerHTML='';
    if(c.featured){
      var fl=document.createElement('div');fl.className='feature-list';
      items.forEach(function(it){var r=document.createElement('div');r.className='frow';
        r.innerHTML='<div class="fmedia"><video controls preload="none" playsinline poster="'+esc(it.poster)+'" src="'+esc(it.src)+'"></video></div><div class="ftext">'+esc(it.caption)+'<small>影片長度 '+esc(it.dur)+'</small></div>';
        fl.appendChild(r)});
      content.appendChild(fl);
    }else{
      var gal=document.createElement('div');gal.className='gallery';
      items.forEach(function(it,i){
        var f=document.createElement('figure');f.className='card'+(it.type==='video'?' video':'');
        var th=it.type==='video'?it.poster:it.thumb;
        f.innerHTML='<div class="media"><img loading="lazy" src="'+esc(th)+'" alt="'+esc(it.caption)+'"><span class="num">'+(i+1)+'</span>'+(it.type==='video'?'<span class="play"></span><span class="dur">'+esc(it.dur)+'</span>':'')+'</div><figcaption>'+esc(it.caption)+'</figcaption>';
        f.tabIndex=0;f.setAttribute('role','button');
        f.addEventListener('click',function(){open(i)});
        f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}});
        gal.appendChild(f)});
      content.appendChild(gal);
    }
    var prev=cats[c.idx-1],next=cats[c.idx+1];
    var pp=view.querySelector('.pager-prev'),pn=view.querySelector('.pager-next');
    pp.hidden=!prev;pn.hidden=!next;
    if(prev){pp.href='#'+prev.key;pp.innerHTML='<small>‹ 上一個分類</small>'+esc(prev.title)}
    if(next){pn.href='#'+next.key;pn.innerHTML='<small>下一個分類 ›</small>'+esc(next.title)}
  }

  function show(which){picker.hidden=which!=='picker';view.hidden=which!=='view'}
  function route(initial){
    var h=decodeURIComponent((location.hash||'').slice(1));
    if(byKey[h]){
      if(lb.classList.contains('open'))close();
      renderCat(byKey[h]);show('view');
      album.scrollIntoView({behavior:initial?'auto':'smooth',block:'start'});
      return;
    }
    if(stageIds[h]||h==='album'){
      var wasView=!view.hidden;show('picker');
      if(wasView||initial){var el=document.getElementById(h);if(el)el.scrollIntoView({behavior:initial?'auto':'smooth',block:'start'})}
    }
  }

  // pause other inline videos when one plays
  document.addEventListener('play',function(e){document.querySelectorAll('video').forEach(function(v){if(v!==e.target)v.pause()})},true);

  // ---- lightbox (scoped to current category) ----
  var lb=document.getElementById('lb'),stage=lb.querySelector('.lb-stage'),tg=lb.querySelector('.lb-tag'),cap=lb.querySelector('.lb-cap'),
      cnt=lb.querySelector('.lb-count'),bar=lb.querySelector('.lb-bar i'),bPrev=lb.querySelector('.lb-prev'),bNext=lb.querySelector('.lb-next'),cur=0;
  function render(){var it=items[cur];stage.innerHTML='';
    if(it.type==='video'){var v=document.createElement('video');v.src=it.src;v.poster=it.poster;v.controls=true;v.autoplay=true;v.playsInline=true;stage.appendChild(v);}
    else{var im=document.createElement('img');im.src=it.src;im.alt=it.caption;stage.appendChild(im);}
    tg.textContent=current.tag;cap.textContent=it.caption;
    cnt.textContent='第 '+(cur+1)+' / '+items.length+' '+current.unit;
    bar.style.width=((cur+1)/items.length*100)+'%';
    bPrev.disabled=cur===0;bNext.disabled=cur===items.length-1;
    [cur+1,cur-1].forEach(function(j){var n=items[j];if(n&&n.type!=='video'){var p=new Image();p.src=n.src}});
  }
  function open(i){cur=i;render();lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');stage.innerHTML='';document.body.style.overflow='';
    var cards=content.querySelectorAll('.card');if(cards[cur])cards[cur].scrollIntoView({block:'nearest'})}
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
  show('picker');route(true);
})();
