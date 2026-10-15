const $=id=>document.getElementById(id);
const ship=`<svg class="ship" viewBox="0 0 150 64" aria-hidden="true"><path d="M15 40h124l-18 18H36z" fill="#244b53"/><path d="M18 40h120l-5 5H24z" fill="#f6f1db"/><rect x="30" y="24" width="24" height="16" rx="1" fill="#bf7356"/><rect x="55" y="24" width="24" height="16" rx="1" fill="#c8a86f"/><rect x="80" y="24" width="24" height="16" rx="1" fill="#739a8c"/><path d="M34 25v14m6-14v14m7-14v14m13-14v14m7-14v14m6-14v14m13-14v14m6-14v14m6-14v14" stroke="#ffffff35"/><path d="M108 40V15h19v25" fill="#f8f6e7"/><path d="M112 20h4v5h-4zm7 0h4v5h-4z" fill="#47727a"/><path d="M119 15V5" stroke="#244b53" stroke-width="2"/><path d="M10 62q12-6 24 0t24 0t24 0t24 0t24 0" fill="none" stroke="#7ba99f" stroke-width="2"/></svg>`;
const boat=()=>`<img class="face" src="body.png" alt="손을 모은 동생 상반신">${ship}`;
['cardBoat','previewBoat'].forEach(id=>$(id).innerHTML=boat());
$('date').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());
let map,marker,demo=false,position=null;
try{const p=JSON.parse(localStorage.getItem('homeward-position'));if(p&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180&&Number.isFinite(Date.parse(p.time))&&Date.parse(p.time)<=Date.now()&&typeof p.source==='string')position=p;}catch{}
if(window.L){map=L.map('map',{zoomControl:false,minZoom:2,maxZoom:16}).setView([28,132],4);L.control.zoom({position:'topright'}).addTo(map);const tiles=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles © <a href="https://www.esri.com/">Esri</a>, Garmin, GEBCO, NOAA NGDC and contributors',maxZoom:16}).addTo(map);const labels=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}',{attribution:'Labels: Esri, National Geographic, HERE, Geonames.org',maxZoom:16}).addTo(map);labels.on('tileerror',()=>{$('mapError').textContent='영문 지명을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해 주세요.';$('mapError').hidden=false});let failed=0;tiles.on('tileerror',()=>{if(++failed>=4)$('mapError').hidden=false});tiles.on('tileload',()=>{$('mapError').hidden=true;failed=0});}else $('mapError').hidden=false;
function drawMarker(lat,lon,label){if(!map)return;if(marker)marker.remove();marker=L.marker([lat,lon],{icon:L.divIcon({className:'map-boat',html:boat()+`<span class="marker-label">${label}</span>`,iconSize:[142,180],iconAnchor:[71,168]}),title:label}).addTo(map);map.setView([lat,lon],6);}
function render(){
 if(marker){marker.remove();marker=null}
 const stale=position&&Date.now()-Date.parse(position.time)>1800000;
 $('emptyState').hidden=!!position||demo;$('demoLabel').hidden=!demo;
 $('demoButton').textContent=demo?'미리보기 종료':'움직임 미리보기';
 if(demo)drawMarker(32,132,'애니메이션 예시');
 else if(position)drawMarker(position.lat,position.lon,position.auto?(stale?'오래된 AIS 위치 · 현재 위치 아님':'SM QINGDAO · AIS 수신 위치'):'SM QINGDAO · 직접 입력');
 $('statusBadge').textContent=position?(position.auto?(stale?'오래된 AIS 기록':'최근 AIS 수신'):'직접 입력'):'수신 대기';
 $('statusText').textContent=position?(position.auto?(stale?'표시된 곳은 과거 수신 위치입니다. 현재 위치가 아닙니다. 새 신호가 들어오면 자동 갱신됩니다.':'무료 AIS에서 받은 위치입니다. 실제 수신 시각을 확인해 주세요.'):'직접 입력한 기록입니다. 새 AIS 수신 시 자동 위치로 바뀝니다.'):'무료 AIS에 연결하여 선박의 마지막 수신 위치를 조회합니다.';
 $('received').textContent=position?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(position.time))+' KST':'—';
 $('coordinates').textContent=position?position.lat.toFixed(5)+' / '+position.lon.toFixed(5):'—';
 $('speed').textContent=position?.auto&&Number.isFinite(position.speed)?position.speed+' kn (수신 당시)':'—';
 $('destination').textContent=position?.destination==='CAVAN'?'Vancouver':position?.destination||'—';
 $('legendText').textContent=demo?'미리보기 · 실제 선박 위치 아님':position?(position.auto?(stale?'과거 수신 위치 · 현재 위치 아님':'AIS 수신 위치'):'직접 입력 기록'):'AIS 위치 수신 대기';
 $('dataSource').textContent=position?.source||'Open Waters AIS';
}

render();
$('demoButton').onclick=()=>{demo=!demo;render()};
$('locate').onclick=()=>{if(position){demo=false;render()}else $('info').showModal()};
$('resetMap').onclick=()=>map?.setView([28,132],4);
['infoButton','openInfo'].forEach(id=>$(id).onclick=()=>$('info').showModal());
$('settingsButton').onclick=()=>$('settings').showModal();$('manualButton').onclick=()=>$('manual').showModal();$('closeManual').onclick=()=>$('manual').close();
$('angle').oninput=()=>{const a=$('angle').value;document.documentElement.style.setProperty('--tilt',a+'deg');document.documentElement.style.setProperty('--minus-tilt',-a+'deg');$('angleValue').textContent=a+'°'};
$('tempo').onchange=()=>document.documentElement.style.setProperty('--duration',$('tempo').value+'s');$('animate').onchange=()=>document.body.classList.toggle('paused',!$('animate').checked);
$('positionForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),lat=Number(fd.get('lat')),lon=Number(fd.get('lon')),time=new Date(fd.get('time')+':00+09:00');if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!Number.isFinite(time.getTime())||time.getTime()>Date.now()){$('formError').textContent='좌표 범위와 수신 시각을 확인해 주세요. 미래 시각은 입력할 수 없습니다.';return}position={lat,lon,time:time.toISOString(),source:fd.get('source')};try{localStorage.setItem('homeward-position',JSON.stringify(position))}catch{$('formError').textContent='브라우저 저장 공간을 사용할 수 없습니다. 위치는 이번 방문에만 표시됩니다.';demo=false;render();return}demo=false;render();$('manual').close();$('formError').textContent=''};
$('clearPosition').onclick=()=>{position=null;try{localStorage.removeItem('homeward-position')}catch{}demo=false;render();$('manual').close()};
$('exportSheet').onclick=async()=>{try{const face=new Image();face.src='body.png';await face.decode();const c=document.createElement('canvas');c.width=2048;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#00ff00';ctx.fillRect(0,0,c.width,c.height);const angle=Number($('angle').value);for(let n=0;n<8;n++){ctx.save();ctx.translate(n*256+128,213);ctx.rotate(Math.cos(n/8*Math.PI*2)*angle*Math.PI/180);const h=200,w=h*face.naturalWidth/face.naturalHeight;ctx.drawImage(face,-w/2,-190,w,h);ctx.restore()}const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)throw Error();const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='동생-상반신-크로마키-8프레임.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('exportStatus').textContent='시트를 저장했습니다. 8칸을 왼쪽부터 순서대로 재생하세요.'}catch{$('exportStatus').textContent='시트를 저장하지 못했습니다. 새로고침 후 다시 시도해 주세요.'}};

const aisClient=HomewardAIS.start(p=>{if(position?.auto&&Date.parse(p.time)<Date.parse(position.time))return;position={...p,destination:p.destination||position?.destination};try{localStorage.setItem('homeward-position',JSON.stringify(position))}catch{}if(!demo)render();},status=>{$('connectionStatus').textContent=status});
$('refreshAIS').onclick=()=>aisClient.refresh();
setInterval(()=>{if(position?.auto&&!demo){const old=Date.now()-Date.parse(position.time)>1800000;$('statusBadge').textContent=old?'오래된 AIS 기록':'최근 AIS 수신';if(old){$('statusText').textContent='표시된 곳은 과거 수신 위치입니다. 현재 위치가 아닙니다. 새 신호를 기다리고 있습니다.';$('legendText').textContent='과거 수신 위치 · 현재 위치 아님';}}},60000);
