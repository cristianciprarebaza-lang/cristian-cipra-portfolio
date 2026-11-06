import { getStore } from "@netlify/blobs";
const STORE="cristian-portfolio-media";
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});}
function authorized(req){const secret=process.env.ADMIN_PASSWORD;return !!secret&&req.headers.get("authorization")==="Bearer "+secret;}
export default async (req)=>{
 const store=getStore(STORE);
 if(req.method==="GET"){const id=new URL(req.url).searchParams.get("id");if(!id||!/^[a-zA-Z0-9-]+$/.test(id))return new Response("Not found",{status:404});const blob=await store.get(id,{type:"blob"});if(!blob)return new Response("Not found",{status:404});return new Response(blob,{headers:{"Content-Type":blob.type||"application/octet-stream","Cache-Control":"public,max-age=31536000,immutable"}});}
 if(req.method==="POST"){if(!authorized(req))return json({error:"No autorizado"},401);const form=await req.formData();const file=form.get("file");if(!(file instanceof File))return json({error:"Falta el archivo"},400);if(!file.type.startsWith("image/"))return json({error:"Solo se permiten imágenes"},400);if(file.size>5*1024*1024)return json({error:"Máximo 5 MB por imagen"},413);const id=crypto.randomUUID();await store.set(id,file,{metadata:{type:file.type,name:file.name}});return json({ok:true,url:`/.netlify/functions/media?id=${id}`});}
 return json({error:"Método no permitido"},405);
};