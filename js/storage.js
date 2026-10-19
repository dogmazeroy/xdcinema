(function(){'use strict';
const KEY='inconnu-cinema-v5', PREFERENCES='inconnu-cinema-preferences';
const defaults={films:[],records:{}};
function parse(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
let state=parse(KEY,defaults);if(!Array.isArray(state.films))state.films=[];if(!state.records||typeof state.records!=='object'||Array.isArray(state.records))state.records={};
const settings=parse(PREFERENCES,{});
const listeners=new Set();let saveTimeout;
const clone=x=>JSON.parse(JSON.stringify(x));
function notify(){listeners.forEach(fn=>fn())}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));notify();return true}catch(e){console.error(e);return false}}
function record(id){return state.records[id]||(state.records[id]={fav:false,watched:false,progress:0,duration:0,notes:'',rating:0,updatedAt:0})}
function setRecord(id,patch){state.records[id]={...record(id),...patch,updatedAt:Date.now()};save()}
function films(){return state.films}
function upsertFilm(film){const i=state.films.findIndex(f=>f.id===film.id);const copy={...film};delete copy.localURL;if(i>=0)state.films[i]={...state.films[i],...copy};else state.films.unshift({...copy,addedAt:film.addedAt||Date.now()});save()}
function removeFilm(id){state.films=state.films.filter(f=>f.id!==id);delete state.records[id];save()}
function prefs(k,v){if(arguments.length===1)return settings[k];settings[k]=v;try{localStorage.setItem(PREFERENCES,JSON.stringify(settings))}catch(e){console.warn(e)}notify();return v}
function exportData(){return JSON.stringify({format:'inconnu-cinema-v5',exportedAt:new Date().toISOString(),films:state.films,records:state.records},null,2)}
function importData(data,merge=true){if(!data||!Array.isArray(data.films)||typeof data.records!=='object'||!data.records)throw Error('Backup inválido: esperado {films, records}.');if(data.films.length>10000)throw Error('Backup muito grande.');const newFilms=data.films.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string').map(x=>({id:x.id.slice(0,150),title:x.title.slice(0,250),year:Number(x.year)||'',director:String(x.director||'').slice(0,250),genre:String(x.genre||'').slice(0,250),country:String(x.country||'').slice(0,250),description:String(x.description||'').slice(0,4000),poster:String(x.poster||'').slice(0,2000),videoUrl:String(x.videoUrl||'').slice(0,2000),externalUrl:String(x.externalUrl||'').slice(0,2000),source:String(x.source||'manual'),mimeType:String(x.mimeType||''),addedAt:Number(x.addedAt)||Date.now(),driveId:String(x.driveId||'').slice(0,180)}));const base=merge?state.films:[];state.films=Array.from(new Map([...base,...newFilms].map(x=>[x.id,x])).values());if(!merge)state.records={};for(const [id,value] of Object.entries(data.records)){if(!value||typeof value!=='object'||id.length>160)continue;state.records[id]={...(state.records[id]||{}),fav:!!value.fav,watched:!!value.watched,progress:Math.max(0,Number(value.progress)||0),duration:Math.max(0,Number(value.duration)||0),notes:String(value.notes||'').slice(0,5000),rating:Math.max(0,Math.min(5,Number(value.rating)||0)),updatedAt:Number(value.updatedAt)||0}}save();return newFilms.length}
window.IC_STORE={films,record,setRecord,upsertFilm,removeFilm,prefs,exportData,importData,clearRecords(){state.records={};save()},onChange(fn){listeners.add(fn);return()=>listeners.delete(fn)},snapshot(){return clone(state)},reload(){state=parse(KEY,defaults);notify()}};
})();
