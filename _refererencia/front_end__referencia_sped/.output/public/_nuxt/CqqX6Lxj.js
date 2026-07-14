import{e as z,O as S,C as B,r as M,s as A,o as b,M as L,b as N,w as O,c as w,x as E,a as t,z as a,p as s,d as V,t as F,l as P,T as U}from"./DTLy1l_x.js";const _={class:"bg-[#16161E] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl"},D={class:"flex items-center justify-between px-5 py-4 border-b border-white/10"},I={class:"px-5 py-4 space-y-3"},R={class:"flex items-center justify-between cursor-pointer bg-white/5 px-3 py-2.5 rounded-lg border border-white/10"},q={class:"flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"},G={class:"flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"},W={class:"flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"},Q={class:"flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"},Y={class:"flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"},J={class:"px-5 pb-5 flex gap-3"},K=["disabled"],X={key:0,class:"animate-spin h-3.5 w-3.5 border-t-2 border-white rounded-full"},Z={key:1,class:"w-3.5 h-3.5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},H=z({__name:"ModalListaAlunos",props:{isOpen:{type:Boolean},anoSemestre:{},hashBase:{},filters:{}},emits:["close"],setup(y,{emit:$}){const i=y,h=$,o=S({nomeSocial:!0,cursoTurno:!0,email:!0,ra:!0,foto:!0}),p=B({get:()=>Object.values(o).every(Boolean),set:n=>{Object.keys(o).forEach(e=>{o[e]=n})}}),u=M(!1),j=(n,e)=>{const l=String(e||"").replace(/^secretaria\//,"").replace(/^\//,"");if(!n||!l)return null;if(n.includes("?")){const c=n.indexOf("?"),r=c>=0?n.slice(0,c):n,f=c>=0?n.slice(c+1):"",m=r.endsWith("/")?"":"/";return`${r}${m}${l}?${f}`}const d=n.endsWith("/")?"":"/";return`${n}${d}${l}`},C=async()=>{u.value=!0;try{const e=(await $fetch("/api/matriculas/alunos",{params:{ano_semestre:i.anoSemestre,id_turma:i.filters.curso||null,area:i.filters.curso?null:i.filters.area||null,turno:i.filters.curso?null:i.filters.turno||null,busca:i.filters.busca||null,status:i.filters.status||"Ativa",page:1,limit:9999}})).alunos||[],l=T(e),d=window.open("","_blank");d&&(d.document.write(l),d.document.close(),setTimeout(()=>d.print(),800))}catch(n){console.error("Erro ao gerar lista:",n)}finally{u.value=!1}},T=n=>{const e=`Lista de Alunos Matriculados — ${i.anoSemestre}`,l=i.filters.curso?"Turma específica":i.filters.area?i.filters.area:"Todas as turmas",d=i.filters.turno?` • ${i.filters.turno}`:"",c=n.map(r=>{const f=r.nome_aluno||[r.nome,r.sobrenome].filter(Boolean).join(" ")||"Aluno",m=typeof r.nome_social=="string"&&r.nome_social.trim()?r.nome_social.trim():null,g=o.foto&&r.foto_resposta&&i.hashBase?j(i.hashBase,r.foto_resposta):null,v=[r.nome_curso,r.turno].filter(Boolean).join(" — "),k=r.ra||r.ra_legado||null,x=[];return o.email&&r.email&&x.push(r.email),o.ra&&k&&x.push(`RA: ${k}`),`
<div class="row">
        <div class="foto ${g?"":"foto-placeholder"}">
            ${g?`<img src="${g}" alt="${f}" loading="eager" />`:'<span class="placeholder-icon">IMG</span><span class="placeholder-text">Sem foto</span>'}
        </div>
  <div class="info">
    <p class="nome">${f}</p>
    ${o.nomeSocial&&m?`<p class="social">Nome Social: ${m}</p>`:""}
    ${o.cursoTurno&&v?`<p class="curso">${v}</p>`:""}
    ${x.length?`<p class="details">${x.join(" &nbsp;·&nbsp; ")}</p>`:""}
  </div>
</div>`}).join(`
`);return`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${e}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 28px 32px; }
    h1 { font-size: 15px; font-weight: 700; letter-spacing: 0.01em; margin-bottom: 2px; }
    .sub { font-size: 11px; color: #777; margin-bottom: 18px; border-bottom: 2px solid #111; padding-bottom: 10px; }
    .row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 9px 0;
      border-bottom: 1px solid #e5e7eb;
      page-break-inside: avoid;
    }
    .row:last-child { border-bottom: none; }
    .info { flex: 1; }
    .nome { font-size: 13px; font-weight: 700; color: #111; line-height: 1.3; }
    .social { font-size: 11px; color: #555; margin-top: 2px; }
    .curso { font-size: 11px; color: #333; margin-top: 3px; }
    .details { font-size: 10px; color: #666; margin-top: 3px; }
        .foto {
            flex-shrink: 0;
            width: 52px;
            height: 52px;
            border-radius: 4px;
            border: 1px solid #ddd;
            overflow: hidden;
            background: #f3f4f6;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
        }
    .foto img { width: 52px; height: 52px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; display: block; }
        .foto-placeholder { color: #6b7280; }
        .placeholder-icon {
            width: 24px;
            height: 18px;
            border: 1px solid #9ca3af;
            border-radius: 3px;
            font-size: 8px;
            line-height: 16px;
            text-align: center;
            font-weight: 700;
            background: #ffffff;
        }
        .placeholder-text {
            font-size: 8px;
            line-height: 1;
            font-weight: 600;
            text-transform: uppercase;
        }
    @media print {
            body { padding: 0; }
            @page { size: A4; margin: 18mm 14mm 12mm 14mm; }
    }
  </style>
</head>
<body>
  <h1>${e}</h1>
  <p class="sub">${l}${d} &nbsp;·&nbsp; ${n.length} aluno${n.length!==1?"s":""}</p>
  ${c}
</body>
</html>`};return(n,e)=>(b(),A(L,{to:"body"},[N(U,{"enter-active-class":"transition ease-out duration-200","enter-from-class":"opacity-0","enter-to-class":"opacity-100","leave-active-class":"transition ease-in duration-150","leave-from-class":"opacity-100","leave-to-class":"opacity-0"},{default:O(()=>[y.isOpen?(b(),w("div",{key:0,class:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",onClick:e[8]||(e[8]=P(l=>h("close"),["self"]))},[t("div",_,[t("div",D,[e[10]||(e[10]=t("div",null,[t("h2",{class:"text-sm font-bold text-white"},"Lista de Alunos"),t("p",{class:"text-[10px] text-secondary mt-0.5"},"Escolha os campos a exibir na lista impressa")],-1)),t("button",{onClick:e[0]||(e[0]=l=>h("close")),class:"text-secondary hover:text-white transition-colors p-1 rounded"},[...e[9]||(e[9]=[t("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])]),t("div",I,[t("label",R,[e[11]||(e[11]=t("span",{class:"text-xs font-semibold text-white"},"Selecionar todos",-1)),t("button",{type:"button",onClick:e[1]||(e[1]=l=>p.value=!s(p)),class:a(["relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",s(p)?"bg-primary":"bg-white/20"])},[t("span",{class:a(["inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform",s(p)?"translate-x-4":"translate-x-1"])},null,2)],2)]),e[17]||(e[17]=t("div",{class:"h-px bg-white/5"},null,-1)),e[18]||(e[18]=t("div",{class:"flex items-center justify-between px-3 py-2 rounded-lg opacity-60"},[t("div",null,[t("p",{class:"text-xs font-medium text-white"},"Nome"),t("p",{class:"text-[10px] text-secondary"},"Obrigatório")]),t("span",{class:"text-[10px] text-secondary border border-white/10 rounded px-2 py-0.5"},"Sempre")],-1)),t("label",q,[e[12]||(e[12]=t("p",{class:"text-xs font-medium text-white"},"Nome Social",-1)),t("button",{type:"button",onClick:e[2]||(e[2]=l=>s(o).nomeSocial=!s(o).nomeSocial),class:a(["relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",s(o).nomeSocial?"bg-primary":"bg-white/20"])},[t("span",{class:a(["inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform",s(o).nomeSocial?"translate-x-4":"translate-x-1"])},null,2)],2)]),t("label",G,[e[13]||(e[13]=t("p",{class:"text-xs font-medium text-white"},"Curso e Turno",-1)),t("button",{type:"button",onClick:e[3]||(e[3]=l=>s(o).cursoTurno=!s(o).cursoTurno),class:a(["relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",s(o).cursoTurno?"bg-primary":"bg-white/20"])},[t("span",{class:a(["inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform",s(o).cursoTurno?"translate-x-4":"translate-x-1"])},null,2)],2)]),t("label",W,[e[14]||(e[14]=t("p",{class:"text-xs font-medium text-white"},"Email",-1)),t("button",{type:"button",onClick:e[4]||(e[4]=l=>s(o).email=!s(o).email),class:a(["relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",s(o).email?"bg-primary":"bg-white/20"])},[t("span",{class:a(["inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform",s(o).email?"translate-x-4":"translate-x-1"])},null,2)],2)]),t("label",Q,[e[15]||(e[15]=t("p",{class:"text-xs font-medium text-white"},"RA",-1)),t("button",{type:"button",onClick:e[5]||(e[5]=l=>s(o).ra=!s(o).ra),class:a(["relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",s(o).ra?"bg-primary":"bg-white/20"])},[t("span",{class:a(["inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform",s(o).ra?"translate-x-4":"translate-x-1"])},null,2)],2)]),t("label",Y,[e[16]||(e[16]=t("div",null,[t("p",{class:"text-xs font-medium text-white"},"Foto"),t("p",{class:"text-[10px] text-secondary"},"Quando disponível")],-1)),t("button",{type:"button",onClick:e[6]||(e[6]=l=>s(o).foto=!s(o).foto),class:a(["relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",s(o).foto?"bg-primary":"bg-white/20"])},[t("span",{class:a(["inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform",s(o).foto?"translate-x-4":"translate-x-1"])},null,2)],2)])]),t("div",J,[t("button",{onClick:e[7]||(e[7]=l=>h("close")),class:"flex-1 py-2.5 text-xs font-semibold text-secondary border border-white/10 rounded-lg hover:bg-white/5 hover:text-white transition-colors"}," Cancelar "),t("button",{onClick:C,disabled:s(u),class:"flex-1 py-2.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"},[s(u)?(b(),w("div",X)):(b(),w("svg",Z,[...e[19]||(e[19]=[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"},null,-1)])])),V(" "+F(s(u)?"Gerando...":"Imprimir Lista"),1)],8,K)])])])):E("",!0)]),_:1})]))}}),oe=Object.assign(H,{__name:"MatriculasModalListaAlunos"});export{oe as M};
