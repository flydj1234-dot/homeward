(function(root){
const MMSI=440022000;
function normalize(feature){
 const p=feature?.properties,c=feature?.geometry?.coordinates;
 if(!p||Number(p.mmsi)!==MMSI||(p.imo&&Number(p.imo)!==9395939)||feature.geometry?.type!=='Point'||!Array.isArray(c))return null;
 const [lon,lat]=c,time=Date.parse(p.seen);
 if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!Number.isFinite(time)||time>Date.now()+60000)return null;
 // Static messages can carry a cached coordinate with a newer message time.
 if(!['PositionReport','StandardClassBPositionReport','ExtendedClassBPositionReport'].includes(p.msg_type))return null;
 return {lat,lon,time:new Date(time).toISOString(),source:'Open Waters AIS / '+String(p.source||'unknown'),auto:true,speed:Number.isFinite(p.sog)&&p.sog>=0&&p.sog<102.3?p.sog:null,destination:typeof p.destination==='string'?p.destination:null};
}
root.HomewardAIS={normalize,start(onPosition,onStatus){
 let stream,timer,closed=false,last=0,retry=3000,busy=false;
 function accept(p){if(p&&Date.parse(p.time)>=last){last=Date.parse(p.time);onPosition(p)}}
 async function refresh(){if(busy||closed)return;busy=true;onStatus('조회 중');try{const r=await fetch('https://ais.openwaters.io/v1/vessels?mmsi='+MMSI,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data.features))throw Error('Invalid response');const p=data.features.map(normalize).filter(Boolean).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time))[0];accept(p);onStatus(p?'무료 AIS 조회 완료':'선박 수신 기록 없음');}catch{onStatus('조회 실패 · 마지막 수신 기록 유지')}finally{busy=false}}
 function connect(){if(closed||document.hidden)return;stream=new EventSource('https://ais.openwaters.io/v1/stream?mmsi='+MMSI+'&snapshot=1');stream.onmessage=e=>{try{const d=JSON.parse(e.data);if(d.type==='welcome'){retry=3000;onStatus('무료 AIS 연결됨 · 새 신호 대기')}else if(d.type==='event'&&Number(d.mmsi)===MMSI){const m=d.message||{};accept(normalize({geometry:{type:'Point',coordinates:[d.lon,d.lat]},properties:{mmsi:d.mmsi,seen:d.time,msg_type:d.msg_type,source:d.source,sog:m.Sog}}))}else if(d.type==='error')stream.onerror();}catch{}};stream.onerror=()=>{stream.close();onStatus('연결 끊김 · 자동 재연결 대기');clearTimeout(timer);timer=setTimeout(connect,retry);retry=Math.min(retry*2,60000)}}
 function visibility(){clearTimeout(timer);stream?.close();if(!document.hidden){refresh();connect()}else onStatus('백그라운드 · 연결 일시 정지')}
 document.addEventListener('visibilitychange',visibility);refresh();connect();
 return {refresh,stop(){closed=true;clearTimeout(timer);stream?.close();document.removeEventListener('visibilitychange',visibility)}};
}};
})(typeof window==='undefined'?globalThis:window);
