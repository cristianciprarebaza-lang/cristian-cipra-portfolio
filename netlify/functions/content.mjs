import { getStore } from "@netlify/blobs";
const STORE="cristian-portfolio";
const KEY="content";
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});}
function authorized(req){const secret=process.env.ADMIN_PASSWORD;if(!secret)return false;return req.headers.get("authorization")==="Bearer "+secret;}
const defaults={
 profile:{name:"Cristian Cipra",role:"Diseño gráfico · Marketing · Audiovisual · Motion Graphics",headline:"Ideas que conectan.<br><em>Diseño que comunica.</em>",intro:"Creo piezas visuales y contenido que ayudan a las marcas a comunicar mejor, conectar con las personas y verse profesionales.",about:"Soy diseñador gráfico con formación en Cibertec y experiencia práctica creando piezas publicitarias, contenido para redes y recursos audiovisuales. Me interesa unir diseño, estrategia y narrativa para convertir ideas en comunicación clara y atractiva.",email:"",phone:"",location:"Perú",portrait:"",cv:"",instagram:"",linkedin:"",behance:""},
 services:[{title:"Diseño gráfico",description:"Piezas visuales claras, atractivas y coherentes con la identidad de cada marca."},{title:"Marketing y contenido",description:"Contenido para redes sociales pensado para comunicar, conectar y generar interés."},{title:"Audiovisual",description:"Edición de video, piezas promocionales y contenido en formatos digitales."},{title:"Motion graphics",description:"Animación gráfica para dar ritmo, intención y vida a las ideas."}],
 projects:[{id:"proyecto-01",title:"Identidad visual",category:"Branding",year:"2026",description:"Sistema visual y aplicaciones gráficas para construir una presencia de marca coherente.",image:"",url:"",featured:true},{id:"proyecto-02",title:"Contenido para redes",category:"Marketing",year:"2026",description:"Diseño de publicaciones y piezas de comunicación para plataformas digitales.",image:"",url:"",featured:true},{id:"proyecto-03",title:"Pieza audiovisual",category:"Audiovisual",year:"2026",description:"Edición y tratamiento visual de contenido audiovisual para comunicación digital.",image:"",url:"",featured:true}],
 tools:["Adobe Photoshop","Adobe Illustrator","Affinity","Premiere Pro","After Effects","CapCut"],
 contactText:"¿Tienes un proyecto en mente o buscas a alguien que aporte ideas y criterio visual? Hablemos."
};
export default async (req)=>{
 const store=getStore(STORE);
 if(req.method==="GET"){const saved=await store.get(KEY,{type:"json"});return json(saved||defaults);}
 if(req.method==="POST"){if(!authorized(req))return json({error:"No autorizado"},401);try{const body=await req.json();await store.setJSON(KEY,body);return json({ok:true});}catch{return json({error:"Contenido inválido"},400);}}
 return json({error:"Método no permitido"},405);
};