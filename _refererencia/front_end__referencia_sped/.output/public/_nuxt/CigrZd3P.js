const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./DhV3-_R1.js","./DsqdWQfm.js","./DXDaohro.js"])))=>i.map(i=>d[i]);
import{e as re,r as z,C as Z,E as ie,c as r,x as B,o as n,a as e,d as W,t as p,m as A,v as R,p as s,q as ce,z as F,F as D,G as H,N as J,l as ne,_ as pe,O as be,h as ge,s as we,w as ue,H as ye,b as de,P as _e,I as ae,D as me}from"./DTLy1l_x.js";import{g as te}from"./945uib3O.js";import{u as le}from"./BIEcws3b.js";const ke={key:0,class:"relative z-50"},$e={class:"fixed inset-0 z-10 overflow-y-auto"},Ce={class:"flex min-h-full items-center justify-center p-0 md:p-4 text-center"},Ee={class:"relative w-full max-w-4xl transform rounded-none md:rounded-xl bg-[#16161E] border border-white/10 text-left shadow-xl transition-all flex flex-col max-h-[90vh]"},Se={class:"flex items-center justify-between p-6 border-b border-white/10"},Pe={class:"flex flex-col gap-1"},Ae={class:"text-xl font-bold text-white"},ze={class:"block text-sm text-secondary font-normal mt-1 capitalize"},Le={class:"flex items-center gap-3"},je={class:"flex items-center gap-2 bg-[#0f0f15] border border-white/10 rounded-lg p-1.5 pl-3"},Me={class:"flex border-b border-white/10 px-6"},Be={class:"flex-1 overflow-y-auto p-6 custom-scrollbar"},Te={key:0,class:"flex justify-center py-10"},De={key:1,class:"flex flex-col items-center justify-center py-10 opacity-50"},Oe={key:2,class:"space-y-8"},Ie={class:"bg-white/5 rounded-lg p-5 border border-white/10"},Ve={class:"grid grid-cols-1 md:grid-cols-2 gap-4"},Fe={class:"md:col-span-2"},He={class:"md:col-span-2"},Ne={class:"md:col-span-2"},Re={class:"md:col-span-2"},Ue={class:"text-sm font-bold text-white mb-4 uppercase tracking-wider"},qe={class:"space-y-3"},We=["onClick"],Ge={class:"flex flex-col"},Ye={class:"font-bold text-white text-sm"},Je={class:"text-xs text-secondary mt-0.5"},Ke={key:0,class:"flex items-center gap-1 mt-1 text-xs text-yellow-500 font-bold"},Qe={class:"p-4 pt-0 border-t border-white/10 mt-2 space-y-4"},Xe={class:"grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"},Ze={class:"flex gap-2"},et=["onUpdate:modelValue","onBlur"],tt=["onClick"],ot={class:"mt-1 h-4"},st={key:0,class:"text-xs text-yellow-500 animate-pulse"},at={key:1,class:"text-xs text-green-500"},nt={class:"flex gap-2"},rt=["onUpdate:modelValue","onBlur"],it=["onClick"],lt={class:"mt-1 h-4"},dt={key:0,class:"text-xs text-yellow-500 animate-pulse"},ct={key:1,class:"text-xs text-green-500"},pt={class:"flex gap-2"},ut=["onUpdate:modelValue","onBlur"],mt=["onClick"],ht={class:"mt-1 h-4"},xt={key:0,class:"text-xs text-yellow-500 animate-pulse"},vt={key:1,class:"text-xs text-green-500"},ft={class:"md:col-span-3"},bt={class:"flex gap-2"},gt=["onUpdate:modelValue","onBlur"],wt=["onClick"],yt={class:"mt-1 h-4"},_t={key:0,class:"text-xs text-yellow-500 animate-pulse"},kt={key:1,class:"text-xs text-green-500"},$t={key:3,class:"space-y-6"},Ct={class:"w-full flex justify-between items-center p-5 hover:bg-white/5 transition-colors text-left group"},Et=["onClick"],St={class:"flex flex-col gap-1 text-left"},Pt={class:"font-bold text-white"},At={class:"text-xs text-secondary w-fit bg-white/5 px-2 py-0.5 rounded"},zt={class:"flex items-center gap-4"},Lt={class:"text-xs font-bold text-white bg-primary/20 text-primary px-2 py-1 rounded"},jt=["onClick"],Mt={class:"p-5 pt-0 border-t border-white/10"},Bt={class:"space-y-1 mt-4"},Tt={class:"w-8 text-right font-mono opacity-50"},Dt={class:"text-white"},Ot={key:0,class:"text-xs text-secondary/50 italic py-2"},It={class:"p-4 border-t border-white/10 flex justify-end gap-3 bg-[#16161E]"},Vt=re({__name:"ModalListaHomologados",props:{isOpen:{type:Boolean},area:{},anoSemestre:{}},emits:["close"],setup(M,{emit:T}){const w=M,{showToast:$}=le(),y=z(!1),C=z("config"),k=z(""),f=z({tituloCentral_1:"Processo Seletivo",tituloCentral_2:"Cursos Regulares | São Paulo Escola de Dança",tituloCentral_3:"Habilitados(as/es) para a ETAPA I e II",dataEtapas:"dia 01 a 03/12/2025",logoUrl:"https://spedppull.b-cdn.net/site/sped_logo_total%20(1).png"}),_=z([]),N=Z(()=>{if(!w.anoSemestre)return"";let m=w.anoSemestre.substring(0,2),t=w.anoSemestre.includes("IIs")?"2":"1";return`20${m}.${t}`}),U=async()=>{if(w.isOpen){y.value=!0;try{const m=await $fetch("/api/selecao/lista-homologados",{params:{area:w.area,anoSemestre:w.anoSemestre,dataInicio:k.value||void 0}});_.value=(m||[]).map(t=>({...t,custom_data_prova:t.data_prova||"",custom_hora_redacao:t.hora_redacao||"",custom_hora_pratica:t.hora_pratica||"",custom_cabecalho:t.cabecalho||"",isExpanded:!1,isPreviewExpanded:!1,isSaving:!1,lastSaved:null})).sort((t,i)=>t.nome_turma.localeCompare(i.nome_turma))}catch(m){console.error("Error fetching list:",m),$("Erro ao buscar lista de homologados.",{type:"error"})}finally{y.value=!1}}},I=async m=>{m.isSaving=!0;try{await $fetch("/api/selecao/parametros-homologacao",{method:"POST",body:{id_turma:m.id_turma,data_prova:m.custom_data_prova,hora_redacao:m.custom_hora_redacao,hora_prova_pratica:m.custom_hora_pratica,texto_cabecalho_curso:m.custom_cabecalho}}),m.lastSaved=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}catch(t){console.error("Error saving params:",t),$("Erro ao salvar configurações da turma.",{type:"error"})}finally{m.isSaving=!1}};ie(()=>w.isOpen,m=>{m&&(U(),C.value="config")});const G=(m=[])=>{const t=m.length>0?m:_.value,i=h(t),x=document.createElement("iframe");Object.assign(x.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0"}),document.body.appendChild(x);const L=x.contentDocument||x.contentWindow&&x.contentWindow.document;if(!L)return;L.open(),L.write(i),L.close();const V=()=>{const v=L.images;if(!v.length){Q(x);return}let a=0;const j=()=>{a++,a===v.length&&Q(x)};for(let l=0;l<v.length;l++){const E=v[l];E&&(E.complete?j():(E.addEventListener("load",j),E.addEventListener("error",j)))}};x.onload=()=>V(),setTimeout(()=>V(),500)},K=m=>{G([m])},Q=m=>{m._hasPrinted||(m._hasPrinted=!0,m.contentWindow&&setTimeout(()=>{m.contentWindow?.focus(),m.contentWindow?.print(),setTimeout(()=>{document.body.contains(m)&&document.body.removeChild(m)},1e3)},300))},S=()=>`
       * { box-sizing: border-box; font-family: 'Poppins', sans-serif; color: #222; font-size: 13px; }
       .pagina { padding: 10mm 10mm; width: 100%; margin: 0; }
       .pagina + .pagina { page-break-before: always; }
       .cabecalho-interno { text-align: center; margin-top: 0; margin-bottom: 22px; font-size: 13px; line-height: 1.45; }
       .logo-cabecalho { width: 120px; margin-bottom: 10px; }
       .linhas-centrais div { margin: 2px 0; font-weight: 700; }
       .texto-etapas { margin-top: 12px; white-space: normal; text-align: center; font-size: 13px; }
       .bloco-cabecalho-turma { margin-bottom: 20px; }
       .info-turma p { margin: 3px 0; font-size: 13px; }
       .titulo-turma { font-size: 15px; font-weight: 700; }
       .texto-prova { margin-top: 12px; margin-bottom: 22px; line-height: 1.5; font-size: 13px; }
       .titulo-lista { margin-top: 16px; margin-bottom: 8px; font-weight: 700; font-size: 13px; }
       .aluno-item { padding: 6px 0; border-bottom: 1px solid #eee; font-size: 13px; }
       .aluno-item:last-of-type { border-bottom: none; }
       
       /* Print Settings */
       @page { size: A4; margin: 10mm; }
       html, body { width: 210mm; min-height: 297mm; background: white; margin: 0; padding: 0; }
       img { max-width: 100%; height: auto; }
`,u=m=>{const t=m.map(l=>({...l,data_prova:l.custom_data_prova,hora_redacao:l.custom_hora_redacao,hora_pratica:l.custom_hora_pratica,cabecalho:l.custom_cabecalho})).filter(l=>(l.alunos||[]).length>0),i=`${f.value.tituloCentral_1} - ${N.value}`,x=l=>l||"",L=`
    presencialmente, no seguinte endereço: R. Mauá, 51 - 3º andar - Luz, São Paulo - SP - Complexo Júlio Prestes. 
    Atente-se para o dia e o horário da sua prova descritos abaixo. Chegue com 30 minutos de antecedência para registro de entrada na portaria. 
    Qualquer dúvida, escreva para secretaria@spescoladedanca.org.br ou pelo telefone: (11) 91593-2046.
    `,V=()=>`
        <div class="cabecalho-interno">
          <img src="${f.value.logoUrl}" class="logo-cabecalho" />
          <div class="linhas-centrais">
            <div class="linha-1"><strong>${i}</strong></div>
            <div class="linha-2"><strong>${f.value.tituloCentral_2}</strong></div>
            <div class="linha-3"><strong>${f.value.tituloCentral_3}</strong></div>
          </div>
          <div class="texto-etapas">
            As Etapas I e II acontecerão <strong>${f.value.dataEtapas}</strong> ${L}
          </div>
        </div>
    `,v=l=>`
        <div class="bloco-cabecalho-turma">
          <div class="info-turma">
            <p class="titulo-turma"><strong>${l.nome_turma}</strong></p>
            <p><strong>Turno:</strong> ${x(l.turno)}</p>
            <p><strong>Data da Prova:</strong> ${x(l.data_prova)}</p>
            <p><strong>Hora da Redação:</strong> ${x(l.hora_redacao)}</p>
            <p><strong>Hora da Prova Prática:</strong> ${x(l.hora_pratica)}</p>
          </div>
          <div class="texto-prova">
            ${(l.cabecalho||"").replace(/\n/g,"<br>")}
          </div>
        </div>
    `,a=l=>`
        <div class="titulo-lista">Lista de Alunos</div>
        ${(l.alunos||[]).map((E,X)=>`
          <div class="aluno-item">
           ${X+1} - ${E.nome}
          </div>`).join("")}
    `;let j=!0;return t.map(l=>{const E=j?V():"";return j=!1,`
            <div class="pagina">
                ${E}
                ${v(l)}
                ${a(l)}
            </div>
        `}).join("")},h=m=>`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Processo Seletivo</title>
        <style>
          ${S()}
        </style>
      </head>
      <body>
        ${u(m)}
      </body>
    </html>
    `;return(m,t)=>M.isOpen?(n(),r("div",ke,[e("div",{class:"fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity",onClick:t[0]||(t[0]=i=>m.$emit("close"))}),e("div",$e,[e("div",Ce,[e("div",Ee,[e("div",Se,[e("div",Pe,[e("h3",Ae,[t[12]||(t[12]=W(" Gerar Lista de Homologados ",-1)),e("span",ze,p(M.area)+" | "+p(M.anoSemestre),1)])]),e("div",Le,[e("div",je,[t[14]||(t[14]=e("span",{class:"text-xs font-bold text-secondary uppercase tracking-wider"},"A partir de:",-1)),A(e("input",{"onUpdate:modelValue":t[1]||(t[1]=i=>ce(k)?k.value=i:null),type:"date",class:"bg-transparent text-white text-xs font-bold outline-none border-none p-0 w-28 placeholder-secondary/50"},null,512),[[R,s(k)]]),s(k)?(n(),r("button",{key:0,onClick:t[2]||(t[2]=i=>k.value=""),class:"w-5 h-5 flex items-center justify-center text-secondary hover:text-red-400 transition-colors",title:"Limpar filtro de data"},[...t[13]||(t[13]=[e("svg",{class:"w-3 h-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])):B("",!0),e("button",{onClick:U,class:"bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded transition-colors"}," Filtrar ")]),e("button",{onClick:t[3]||(t[3]=i=>m.$emit("close")),class:"text-secondary hover:text-white transition-colors ml-4"},[...t[15]||(t[15]=[e("svg",{class:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])])]),e("div",Me,[e("button",{onClick:t[4]||(t[4]=i=>C.value="config"),class:F(["px-4 py-3 text-sm font-bold border-b-2 transition-colors",s(C)==="config"?"border-primary text-primary":"border-transparent text-secondary hover:text-white"])}," Configurar Relatório ",2),e("button",{onClick:t[5]||(t[5]=i=>C.value="preview"),class:F(["px-4 py-3 text-sm font-bold border-b-2 transition-colors",s(C)==="preview"?"border-primary text-primary":"border-transparent text-secondary hover:text-white"])}," Visualizar Lista (Preview) ",2)]),e("div",Be,[s(y)?(n(),r("div",Te,[...t[16]||(t[16]=[e("div",{class:"animate-spin rounded-full h-10 w-10 border-t-2 border-primary"},null,-1)])])):s(_).length===0?(n(),r("div",De,[...t[17]||(t[17]=[e("p",null,"Nenhuma turma encontrada.",-1)])])):s(C)==="config"?(n(),r("div",Oe,[e("div",Ie,[t[23]||(t[23]=e("h4",{class:"text-sm font-bold text-white mb-4 uppercase tracking-wider"},"Cabeçalho Geral",-1)),e("div",Ve,[e("div",Fe,[t[18]||(t[18]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Título Central 1 (Prefixo)",-1)),A(e("input",{"onUpdate:modelValue":t[6]||(t[6]=i=>s(f).tituloCentral_1=i),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"},null,512),[[R,s(f).tituloCentral_1]])]),e("div",He,[t[19]||(t[19]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Título Central 2 (Instituição)",-1)),A(e("input",{"onUpdate:modelValue":t[7]||(t[7]=i=>s(f).tituloCentral_2=i),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"},null,512),[[R,s(f).tituloCentral_2]])]),e("div",Ne,[t[20]||(t[20]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Título Central 3 (Subtítulo)",-1)),A(e("input",{"onUpdate:modelValue":t[8]||(t[8]=i=>s(f).tituloCentral_3=i),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"},null,512),[[R,s(f).tituloCentral_3]])]),e("div",Re,[t[21]||(t[21]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Texto da Data das Etapas",-1)),A(e("input",{"onUpdate:modelValue":t[9]||(t[9]=i=>s(f).dataEtapas=i),type:"text",class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"},null,512),[[R,s(f).dataEtapas]]),t[22]||(t[22]=e("p",{class:"text-[10px] text-secondary mt-1"},"Ex: dia 01 a 03/12/2025",-1))])])]),e("div",null,[e("h4",Ue,"Configuração por Turma ("+p(s(_).length)+")",1),e("div",qe,[(n(!0),r(D,null,H(s(_),i=>(n(),r("div",{key:i.id_turma,class:"bg-white/5 border border-white/10 rounded-lg overflow-hidden"},[e("button",{onClick:x=>i.isExpanded=!i.isExpanded,class:"w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"},[e("div",Ge,[e("p",Ye,p(i.nome_turma),1),e("p",Je,p(i.turno),1),(i.alunos||[]).length===0?(n(),r("div",Ke,[...t[24]||(t[24]=[e("svg",{class:"w-3 h-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"})],-1),W(" Sem alunos nesta turma ",-1)])])):B("",!0)]),(n(),r("svg",{class:F(["w-5 h-5 text-secondary transition-transform",{"rotate-180":i.isExpanded}]),fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[...t[25]||(t[25]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M19 9l-7 7-7-7"},null,-1)])],2))],8,We),A(e("div",Qe,[e("div",Xe,[e("div",null,[t[27]||(t[27]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Data da Prova",-1)),e("div",Ze,[A(e("input",{"onUpdate:modelValue":x=>i.custom_data_prova=x,onBlur:x=>I(i),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none",placeholder:"Ex: 05/12/2025"},null,40,et),[[R,i.custom_data_prova]]),e("button",{onClick:x=>I(i),class:"text-primary hover:text-primary-600 transition-colors p-1",title:"Salvar"},[...t[26]||(t[26]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"})],-1)])],8,tt)]),e("div",ot,[i.isSaving?(n(),r("span",st,"Aguarde...")):i.lastSaved?(n(),r("span",at,"Salvo às "+p(i.lastSaved),1)):B("",!0)])]),e("div",null,[t[29]||(t[29]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Hora Redação",-1)),e("div",nt,[A(e("input",{"onUpdate:modelValue":x=>i.custom_hora_redacao=x,onBlur:x=>I(i),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none",placeholder:"Ex: 09h"},null,40,rt),[[R,i.custom_hora_redacao]]),e("button",{onClick:x=>I(i),class:"text-primary hover:text-primary-600 transition-colors p-1",title:"Salvar"},[...t[28]||(t[28]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"})],-1)])],8,it)]),e("div",lt,[i.isSaving?(n(),r("span",dt,"Aguarde...")):i.lastSaved?(n(),r("span",ct,"Salvo às "+p(i.lastSaved),1)):B("",!0)])]),e("div",null,[t[31]||(t[31]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Hora Prática",-1)),e("div",pt,[A(e("input",{"onUpdate:modelValue":x=>i.custom_hora_pratica=x,onBlur:x=>I(i),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none",placeholder:"Ex: 10h30"},null,40,ut),[[R,i.custom_hora_pratica]]),e("button",{onClick:x=>I(i),class:"text-primary hover:text-primary-600 transition-colors p-1",title:"Salvar"},[...t[30]||(t[30]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"})],-1)])],8,mt)]),e("div",ht,[i.isSaving?(n(),r("span",xt,"Aguarde...")):i.lastSaved?(n(),r("span",vt,"Salvo às "+p(i.lastSaved),1)):B("",!0)])]),e("div",ft,[t[33]||(t[33]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Texto/Cabeçalho da Prova",-1)),e("div",bt,[A(e("textarea",{"onUpdate:modelValue":x=>i.custom_cabecalho=x,onBlur:x=>I(i),rows:"4",class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none",placeholder:"Instruções específicas para esta turma..."},null,40,gt),[[R,i.custom_cabecalho]]),e("button",{onClick:x=>I(i),class:"text-primary hover:text-primary-600 transition-colors p-1",title:"Salvar"},[...t[32]||(t[32]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"})],-1)])],8,wt)]),e("div",yt,[i.isSaving?(n(),r("span",_t,"Aguarde...")):i.lastSaved?(n(),r("span",kt,"Salvo às "+p(i.lastSaved),1)):B("",!0)])])])],512),[[J,i.isExpanded]])]))),128))])])])):s(C)==="preview"?(n(),r("div",$t,[(n(!0),r(D,null,H(s(_),i=>A((n(),r("div",{key:i.id_turma,class:"bg-white/5 border border-white/10 rounded-lg overflow-hidden"},[e("div",Ct,[e("button",{onClick:x=>i.isPreviewExpanded=!i.isPreviewExpanded,class:"flex-1 flex justify-between items-center pr-4"},[e("div",St,[e("h4",Pt,p(i.nome_turma),1),e("span",At,p(i.turno),1)]),e("div",zt,[e("span",Lt,p((i.alunos||[]).length)+" alunos ",1),(n(),r("svg",{class:F(["w-5 h-5 text-secondary transition-transform duration-200",{"rotate-180":i.isPreviewExpanded}]),fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[...t[34]||(t[34]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M19 9l-7 7-7-7"},null,-1)])],2))])],8,Et),e("button",{onClick:ne(x=>K(i),["stop"]),class:"p-2 text-primary hover:text-primary hover:bg-white/10 rounded-lg transition-colors ml-2 border-l border-white/10 pl-4",title:"Imprimir somente esta turma"},[...t[35]||(t[35]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})],-1)])],8,jt)]),A(e("div",Mt,[e("div",Bt,[(n(!0),r(D,null,H(i.alunos,(x,L)=>(n(),r("div",{key:L,class:"flex gap-3 text-sm text-secondary-300 py-1 border-b border-white/5 last:border-0"},[e("span",Tt,p(Number(L)+1)+".",1),e("span",Dt,p(x.nome),1)]))),128)),!i.alunos||i.alunos.length===0?(n(),r("div",Ot," Nenhum aluno nesta lista. ")):B("",!0)])],512),[[J,i.isPreviewExpanded]])])),[[J,(i.alunos||[]).length>0]])),128))])):B("",!0)]),e("div",It,[e("button",{onClick:t[10]||(t[10]=i=>m.$emit("close")),class:"px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white font-bold rounded-lg transition-colors"}," Cancelar "),s(C)==="preview"?(n(),r("button",{key:0,onClick:t[11]||(t[11]=i=>G()),class:"px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"},[...t[36]||(t[36]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})],-1),W(" Imprimir Relatório ",-1)])])):B("",!0)])])])])])):B("",!0)}}),Ft=Object.assign(pe(Vt,[["__scopeId","data-v-0d69fcfb"]]),{__name:"ModalListaHomologados"}),Ht={key:0,class:"relative z-50"},Nt={class:"fixed inset-0 z-10 overflow-y-auto"},Rt={class:"flex min-h-full items-center justify-center p-0 md:p-4 text-center"},Ut={class:"relative w-full max-w-4xl transform rounded-none md:rounded-xl bg-[#16161E] border border-white/10 text-left shadow-xl transition-all flex flex-col max-h-[90vh]"},qt={class:"flex items-center justify-between p-6 border-b border-white/10"},Wt={class:"flex flex-col gap-1"},Gt={class:"text-xl font-bold text-white"},Yt={class:"block text-sm text-secondary font-normal mt-1 capitalize"},Jt={class:"flex items-center gap-3"},Kt={class:"flex items-center gap-2 bg-[#0f0f15] border border-white/10 rounded-lg p-1.5 pl-3"},Qt={class:"flex border-b border-white/10 px-6"},Xt={class:"flex-1 overflow-y-auto p-6 custom-scrollbar"},Zt={key:0,class:"flex justify-center py-10"},eo={key:1,class:"flex flex-col items-center justify-center py-10 opacity-50"},to={key:2,class:"space-y-8"},oo={class:"text-sm font-bold text-white mb-4 uppercase tracking-wider"},so={class:"mb-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"},ao={class:"pr-4"},no={class:"text-xs text-secondary mt-0.5"},ro=["aria-checked"],io={class:"space-y-3"},lo=["onClick"],co={class:"flex flex-col"},po={class:"font-bold text-white text-sm"},uo={class:"text-xs text-secondary mt-0.5"},mo={key:0,class:"flex items-center gap-1 mt-1 text-xs text-yellow-500 font-bold"},ho={class:"p-4 pt-0 border-t border-white/10 mt-2 space-y-4"},xo={class:"space-y-4 mt-4"},vo={class:"block text-xs font-bold text-secondary mb-1"},fo={class:"flex gap-2"},bo=["onUpdate:modelValue","onBlur","placeholder"],go=["onClick"],wo={class:"mt-1 h-4"},yo={key:0,class:"text-xs text-yellow-500 animate-pulse"},_o={key:1,class:"text-xs text-green-500"},ko={class:"flex gap-2"},$o=["onUpdate:modelValue","onBlur"],Co=["onClick"],Eo={class:"mt-1 h-4"},So={key:0,class:"text-xs text-yellow-500 animate-pulse"},Po={key:1,class:"text-xs text-green-500"},Ao={key:3,class:"space-y-6"},zo={class:"w-full flex justify-between items-center p-5 hover:bg-white/5 transition-colors text-left group"},Lo=["onClick"],jo={class:"flex flex-col gap-1 text-left"},Mo={class:"font-bold text-white"},Bo={class:"text-xs text-secondary w-fit bg-white/5 px-2 py-0.5 rounded"},To={class:"flex items-center gap-4"},Do={class:"text-xs font-bold text-white bg-primary/20 text-primary px-2 py-1 rounded"},Oo={class:"ml-2 border-l border-white/10 pl-4 flex flex-col gap-2"},Io=["onClick"],Vo=["onClick","disabled"],Fo={class:"p-5 pt-0 border-t border-white/10"},Ho={class:"space-y-1 mt-4"},No={class:"w-8 text-right font-mono opacity-50"},Ro={class:"text-white"},Uo={key:0,class:"text-xs text-secondary/5 italic py-2"},qo={class:"p-4 border-t border-white/10 flex justify-end gap-3 bg-[#16161E]"},Wo=["disabled"],Go=re({__name:"ModalFichaAvaliacao",props:{isOpen:{type:Boolean},area:{},anoSemestre:{}},emits:["close"],setup(M,{emit:T}){const w=M,{showToast:$}=le(),y=z(!1),C=z(!1),k=z("config"),f=z(""),_=z(!1),N=z([]),U=z(null),I=z(""),G=Z(()=>{if(!w.anoSemestre)return"";let c=w.anoSemestre.substring(0,2),o=w.anoSemestre.includes("IIs")?"2":"1";return`20${c}.${o}`}),K=Z(()=>{const c=(w.area||"").trim().toLowerCase();return c==="regulares"?"Cursos Regulares":c==="extensao"||c==="extensão"?"Extensão":c==="cursos_livres"||c==="cursos livres"?"Cursos Livres":w.area||""}),Q=Z(()=>`Processo seletivo${_.value?" vagas complementares":""} ${w.anoSemestre||""}`.trim()),S=async()=>{if(w.isOpen){y.value=!0;try{const c=await $fetch("/api/selecao/fichas-avaliacao",{params:{area:w.area,anoSemestre:w.anoSemestre,dataInicio:f.value||void 0}});N.value=(c||[]).map(o=>({...o,custom_pergunta_1:o.pergunta_1||"",custom_pergunta_2:o.pergunta_2||"",custom_pergunta_3:o.pergunta_3||"",custom_rodape:o.rodape||"",isExpanded:!1,isPreviewExpanded:!1,isSaving:!1,lastSaved:null})).sort((o,d)=>o.nome_turma.localeCompare(d.nome_turma))}catch(c){console.error("Error fetching fichas:",c),$("Erro ao buscar fichas de avaliação.",{type:"error"})}finally{y.value=!1}}},u=async c=>{if(!c.id_curso){console.error("Missing id_curso for turma:",c);return}c.isSaving=!0;try{await $fetch("/api/selecao/ficha-avaliacao-config",{method:"POST",body:{id_curso:c.id_curso,pergunta_1:c.custom_pergunta_1,pergunta_2:c.custom_pergunta_2,pergunta_3:c.custom_pergunta_3,rodape:c.custom_rodape}}),c.lastSaved=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}catch(o){console.error("Error saving params:",o),$("Erro ao salvar configurações da ficha.",{type:"error"})}finally{c.isSaving=!1}},h=()=>JSON.stringify({area:w.area,anoSemestre:w.anoSemestre,dataInicio:f.value||null}),m=async()=>{const c=h();if(U.value&&I.value===c)return U.value;C.value=!0;try{const o=await $fetch("/api/selecao/listas-presenca",{params:{area:w.area,anoSemestre:w.anoSemestre,dataInicio:f.value||void 0}}),d=Array.isArray(o)?o:[];return U.value=d,I.value=c,d}catch(o){return console.error("Error fetching listas de presença:",o),$("Erro ao buscar listas de presença.",{type:"error"}),[]}finally{C.value=!1}};ie(()=>w.isOpen,c=>{c&&(S(),k.value="config",U.value=null,I.value="")});const t=c=>{const o=document.createElement("iframe");Object.assign(o.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0"}),document.body.appendChild(o);const d=o.contentDocument||o.contentWindow&&o.contentWindow.document;if(!d)return;d.open(),d.write(c),d.close();const P=()=>{const b=d.images;if(!b.length){v(o);return}let q=0;const g=()=>{q++,q===b.length&&v(o)};for(let O=0;O<b.length;O++){const Y=b[O];Y&&(Y.complete?g():(Y.addEventListener("load",g),Y.addEventListener("error",g)))}};o.onload=()=>P(),setTimeout(()=>P(),500)},i=(c=[])=>{const o=c.length>0?c:N.value;t(E(o))},x=async c=>{const d=await m();if(!d.length){$("Nenhuma lista de presença encontrada para impressão.",{type:"info"});return}t(X(d))},L=c=>{i([c])},V=async c=>{const d=(await m()).find(P=>P.id_turma===c.id_turma);if(!d){$("Nenhuma lista encontrada para esta turma.",{type:"info"});return}t(X([d]))},v=c=>{c._hasPrinted||(c._hasPrinted=!0,c.contentWindow&&setTimeout(()=>{c.contentWindow?.focus(),c.contentWindow?.print(),setTimeout(()=>{document.body.contains(c)&&document.body.removeChild(c)},1e3)},300))},a=()=>`
    * { box-sizing: border-box; font-family: 'Poppins', Arial, sans-serif; color: #222; font-size: 12.5px; }
    body { margin: 0; padding: 0; }
    .pagina { width: 100%; padding: 10mm 6mm 10mm 10mm; }
    .pagina + .pagina { page-break-before: always; }
    
    /* BLOCO 1: TOPO */
    .bloco-topo { margin-bottom: 6mm; }
    .linha-topo { display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: flex-start; gap: 10px; }
    .badge-area { font-size: 10px; text-transform: uppercase; font-weight: 600; border-radius: 12px; border: 1px solid #333; padding: 4px 10px; display: inline-block; white-space: nowrap; justify-self: start; }
    .topo-centro { text-align: center; font-size: 13px; justify-self: center; flex: 1; }
    .logo-area { width: 100%; max-width: 130px; height: auto; justify-self: end; overflow: visible; margin-right: -10mm; }
    .logo-area img { max-width: 100%; height: auto; display: block; transform: scale(2.4); transform-origin: top right; }
    .topo-centro .linha1 { font-weight: 500; margin-bottom: 3px; }
    .topo-centro .linha2 { font-weight: 700; font-size: 16px; margin-bottom: 3px; }
    .topo-centro .linha3 { font-weight: 600; margin-bottom: 3px; }
    .topo-centro .linha4 { font-size: 12px; font-style: italic; }

    /* BLOCO 2: DADOS CANDIDATO */
    .bloco-candidato { margin-bottom: 6mm; }
    .linha-cabecalho-ficha { display: flex; justify-content: space-between; }
    .bloco-num-classificacao { width: 32mm; height: 26mm; border: 1.5px solid #000; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 700; }
    .bloco-dados-candidato { flex: 1; margin-left: 14px; font-size: 12.5px; }
    .bloco-dados-candidato .linha { margin-bottom: 4px; }
    .bloco-dados-candidato strong { font-weight: 600; }

    /* BLOCO 3: PERGUNTAS INICIAIS */
    .bloco-perguntas-iniciais { margin-bottom: 6mm; }
    .bloco-pergunta { margin-bottom: 6mm; }
    .bloco-pergunta:last-child { margin-bottom: 0; }
    .faixa-cinza { background: #f0f0f0; border-radius: 8px; padding: 5px 10px; font-size: 12px; margin-bottom: 4px; line-height: 1.4; }
    .linha-opcoes { display: flex; gap: 20px; margin-bottom: 2px; font-size: 12px; padding-left: 10px; }
    .checkbox-falso { display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 5px; vertical-align: middle; }

    /* BLOCO 4: TABELA AVALIAÇÃO */
    .bloco-avaliacao { margin-bottom: 6mm; }
    .titulo-secao { text-align: center; font-size: 12.5px; font-weight: 600; margin-bottom: 4mm; }
    .tabela-criterios { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .tabela-criterios th, .tabela-criterios td { border: 0.6px solid #555; padding: 5px 6px; vertical-align: middle; }
    .tabela-criterios th { font-weight: 600; text-align: left; }
    .col-av { width: 28mm; text-align: center; }
    .col-med { width: 20mm; text-align: center; }

    /* BLOCO 5: NOTA FINAL + CONSIDERAÇÕES */
    .bloco-nota-consideracoes { margin-bottom: 6mm; }
    .linha-nota-consideracoes { display: flex; gap: 8mm; }
    .col-consideracoes { flex: 4; }
    .titulo-consideracoes { font-weight: 600; margin-bottom: 5px; font-size: 12.5px; }
    .linha-cons { border-top: 0.6px solid #555; height: 8mm; margin-bottom: 3mm; }
    .col-nota-final { flex: 1; }
    .titulo-nota-final { font-weight: 700; margin-bottom: 5px; font-size: 12.5px; }
    .box-nota-final { width: 24mm; height: 14mm; border: 1px solid #000; }

    /* BLOCO 6: ASSINATURAS */
    .bloco-assinaturas { margin-bottom: 10mm; }
    .assinaturas { display: flex; justify-content: center; gap: 35mm; font-size: 12px; text-align: center; }
    .assinatura-col { flex: 0 0 auto; }
    .assinatura-linha { border-top: 0.6px solid #555; width: 50mm; margin-bottom: 3px; }

    /* BLOCO 7: RODAPÉ */
    .bloco-rodape { margin-top: auto; }
    .rodape-perfil { font-size: 11px; text-align: center; line-height: 1.3; }
    .rodape-titulo { font-weight: 700; margin-bottom: 2px; }
    .rodape-texto { font-weight: 400; }

    /* LISTA DE PRESENCA */
    .lista-presenca-pagina { width: calc(100% - 6mm); margin: 0 auto; padding: 0; }
    .lista-cabecalho { text-align: center; margin-bottom: 8mm; }
    .lista-logo { margin-bottom: 5mm; }
    .lista-logo img { width: 110px; max-width: 100%; display: block; margin: 0 auto; }
    .lista-linha-processo { font-size: 15px; font-weight: 700; margin-bottom: 2mm; }
    .lista-linha-escola { font-size: 12.5px; font-weight: 500; margin-bottom: 2.5mm; }
    .lista-linha-turma { font-size: 16px; font-weight: 700; margin-bottom: 1mm; }
    .lista-linha-turno { font-size: 12.5px; font-weight: 600; margin-bottom: 3mm; }
    .lista-titulo { font-size: 18px; font-weight: 800; letter-spacing: 0.8px; margin-bottom: 0; }
    .lista-tabela { width: 98%; margin: 0 auto; border-collapse: collapse; table-layout: fixed; }
    .lista-tabela th, .lista-tabela td { border: 0.8px solid #555; padding: 7px 8px; vertical-align: middle; }
    .lista-tabela th { font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; }
    .lista-tabela td { font-size: 11.5px; height: 13mm; }
    .col-numero { width: 18mm; text-align: center; }
    .col-cpf { width: 38mm; }
    .col-assinatura { width: 50mm; }
    
    @page { size: A4; margin: 0; }
    html, body { width: 210mm; background: white; }
`,j=c=>{const o=g=>g||"",d=g=>g?String(g).toUpperCase():"",P=g=>{if(!g)return"";if(g.includes("/"))return g;if(g.includes("-")){const O=(g.split("T")[0]||"").split("-");if(O.length===3)return`${O[2]}/${O[1]}/${O[0]}`}return g},b=g=>{if(!g)return"N/A";const O=new Date,Y=new Date(g);let oe=O.getFullYear()-Y.getFullYear();const se=O.getMonth()-Y.getMonth();return(se<0||se===0&&O.getDate()<Y.getDate())&&oe--,oe};return c.map(g=>{if(!Array.isArray(g.alunos)||g.alunos.length===0)return"";const O=g.custom_pergunta_1,Y=g.custom_pergunta_2,oe=g.custom_pergunta_3,se=`Perfil do Curso de ${g.nome_turma}:
${g.custom_rodape||""}`.trim(),[he,...xe]=se.split(`
`),ve=xe.join(" ").trim();return g.alunos.map(ee=>{const fe=String(ee.classificacao||"").padStart(3,"0");return`
                <div class="pagina">
                  <!-- BLOCO 1: TOPO -->
                  <div class="bloco-topo">
                    <div class="linha-topo">
                      <div class="badge-area">${K.value}</div>
                      <div class="topo-centro">
                        <div class="linha1">${Q.value} </div>
                        <div class="linha2">Ficha de Avaliação</div>
                        <div class="linha3">${o(g.nome_turma)}</div>
                        <div class="linha4">(${o(g.turno)})</div>
                      </div>
                      <div class="logo-area">
                        <img src="https://spedppull.b-cdn.net/site/sped_logo_total%20(1).png" alt="Logo SPED">
                      </div>
                    </div>
                  </div>

                  <!-- BLOCO 2: DADOS DO CANDIDATO -->
                  <div class="bloco-candidato">
                    <div class="linha-cabecalho-ficha">
                      <div class="bloco-num-classificacao">${fe}</div>
                      <div class="bloco-dados-candidato">
                        <div class="linha"><strong>Nome completo:</strong> ${d(ee.nome)}</div>
                        <div class="linha"><strong>Data da Prova: </strong>${P(g.data_prova)}</div>
                        <div class="linha"><strong>Etnia: </strong> ${o(ee.cor_raca)}</div>
                        <div class="linha"><strong>Idade: </strong> ${b(ee.data_nascimento)} anos</div>
                        <div class="linha"><strong>Gênero: </strong> ${o(ee.identidade_genero)}</div>
                        <div class="linha"><strong>Cursar sem bolsa? </strong> ${o(ee.condicao_receber_bolsa)}</div>
                        <div class="linha"><strong>Experiência na área?: </strong> ________</div>
                        <div class="linha"><strong>Renda per capita: </strong> ${o(ee.renda_per_capita)}</div>
                      </div>
                    </div>
                  </div>

                  <!-- BLOCO 3: PERGUNTAS INICIAIS -->
                  <div class="bloco-perguntas-iniciais">
                    <div class="bloco-pergunta">
                      <div class="faixa-cinza">Tem disponibilidade para frequentar o curso conforme os horários estabelecidos?</div>
                      <div class="linha-opcoes">
                        <span><span class="checkbox-falso"></span>Sim</span>
                        <span><span class="checkbox-falso"></span>Não</span>
                      </div>
                    </div>
                    <div class="bloco-pergunta">
                      <div class="faixa-cinza">É a sua 1ª vivência com o Curso Regular?</div>
                      <div class="linha-opcoes">
                        <span><span class="checkbox-falso"></span>Sim</span>
                        <span><span class="checkbox-falso"></span>Não</span>
                      </div>
                    </div>
                    <div class="bloco-pergunta">
                      <div class="faixa-cinza">Qual a expectativa em relação ao curso?</div>
                      <div class="linha-opcoes">
                        <span><span class="checkbox-falso"></span>Complementar a formação?</span>
                        <span><span class="checkbox-falso"></span>Se preparar para o mercado de trabalho?</span>
                      </div>
                    </div>
                  </div>

                  <!-- BLOCO 4: TABELA DE AVALIAÇÃO -->
                  <div class="bloco-avaliacao">
                    <div class="titulo-secao">Vivência prática (Nota de 0 a 10)</div>
                    <table class="tabela-criterios">
                      <tr>
                        <th>Critérios de Avaliação</th>
                        <th class="col-av">Avaliador 1</th>
                        <th class="col-av">Avaliador 2</th>
                        <th class="col-med">Média</th>
                      </tr>
                      <tr>
                        <td>${o(O)}</td>
                        <td></td><td></td><td></td>
                      </tr>
                      <tr>
                        <td>${o(Y)}</td>
                        <td></td><td></td><td></td>
                      </tr>
                      <tr>
                        <td>${o(oe)}</td>
                        <td></td><td></td><td></td>
                      </tr>
                    </table>
                  </div>

                  <!-- BLOCO 5: NOTA FINAL + CONSIDERAÇÕES -->
                  <div class="bloco-nota-consideracoes">
                    <div class="linha-nota-consideracoes">
                      <div class="col-consideracoes">
                        <div class="titulo-consideracoes">Considerações:</div>
                        <div class="linha-cons"></div>
                        <div class="linha-cons"></div>
                        <div class="linha-cons"></div>
                      </div>
                      <div class="col-nota-final">
                        <div class="titulo-nota-final">Nota final</div>
                        <div class="box-nota-final"></div>
                      </div>
                    </div>
                  </div>

                  <!-- BLOCO 6: ASSINATURAS -->
                  <div class="bloco-assinaturas">
                    <div class="assinaturas">
                      <div class="assinatura-col">
                        <div class="assinatura-linha"></div>
                        Avaliador 1
                      </div>
                      <div class="assinatura-col">
                        <div class="assinatura-linha"></div>
                        Avaliador 2
                      </div>
                    </div>
                  </div>

                  <!-- BLOCO 7: RODAPÉ -->
                  <div class="bloco-rodape">
                    <div class="rodape-perfil">
                      <div class="rodape-titulo">${o(he)}</div>
                      <div class="rodape-texto">${o(ve)}</div>
                    </div>
                  </div>
                </div>
             `}).join("")}).join("")},l=c=>{const o=b=>b||"",d=b=>b?String(b).toUpperCase():"",P=`Processo Seletivo ${K.value} ${G.value}`.trim();return c.map(b=>{if(!Array.isArray(b.alunos)||b.alunos.length===0)return"";const q=b.alunos.map(g=>`
                <tr>
                    <td class="col-numero">${String(g.classificacao||"").padStart(3,"0")}</td>
                    <td>${d(g.nome)}</td>
                    <td class="col-cpf">${o(g.cpf)}</td>
                    <td class="col-assinatura"></td>
                </tr>
            `).join("");return`
            <div class="pagina lista-presenca-pagina">
                <div class="lista-cabecalho">
                    <div class="lista-logo">
                        <img src="https://spedppull.b-cdn.net/site/sped_logo_total%20(1).png" alt="Logo SPED">
                    </div>
                    <div class="lista-linha-processo">${P}</div>
                    <div class="lista-linha-escola">São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas</div>
                    <div class="lista-linha-turma">${o(b.nome_turma)}</div>
                    <div class="lista-linha-turno">${o(b.turno)}</div>
                    <div class="lista-titulo">LISTA DE PRESENÇA</div>
                </div>

                <table class="lista-tabela">
                    <thead>
                        <tr>
                            <th class="col-numero">Nº</th>
                            <th>Nome</th>
                            <th class="col-cpf">CPF</th>
                            <th class="col-assinatura">Assinatura</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${q}
                    </tbody>
                </table>
            </div>
        `}).join("")},E=c=>`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Fichas de Avaliação</title>
        <style>
          ${a()}
        </style>
      </head>
      <body>
        ${j(c)}
      </body>
    </html>
    `,X=c=>`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Listas de Presença</title>
        <style>
          ${a()}
          @page { size: A4; margin: 14mm 16mm 14mm 10mm; }
          html, body { width: auto; }
        </style>
      </head>
      <body>
        ${l(c)}
      </body>
    </html>
    `;return(c,o)=>M.isOpen?(n(),r("div",Ht,[e("div",{class:"fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity",onClick:o[0]||(o[0]=d=>c.$emit("close"))}),e("div",Nt,[e("div",Rt,[e("div",Ut,[e("div",qt,[e("div",Wt,[e("h3",Gt,[o[10]||(o[10]=W(" Gerar Fichas de Avaliação ",-1)),e("span",Yt,p(M.area)+" | "+p(M.anoSemestre),1)])]),e("div",Jt,[e("div",Kt,[o[12]||(o[12]=e("span",{class:"text-xs font-bold text-secondary uppercase tracking-wider"},"A partir de:",-1)),A(e("input",{"onUpdate:modelValue":o[1]||(o[1]=d=>ce(f)?f.value=d:null),type:"date",class:"bg-transparent text-white text-xs font-bold outline-none border-none p-0 w-28 placeholder-secondary/50"},null,512),[[R,s(f)]]),s(f)?(n(),r("button",{key:0,onClick:o[2]||(o[2]=d=>f.value=""),class:"w-5 h-5 flex items-center justify-center text-secondary hover:text-red-400 transition-colors",title:"Limpar filtro de data"},[...o[11]||(o[11]=[e("svg",{class:"w-3 h-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])):B("",!0),e("button",{onClick:S,class:"bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded transition-colors"}," Filtrar ")]),e("button",{onClick:o[3]||(o[3]=d=>c.$emit("close")),class:"text-secondary hover:text-white transition-colors ml-4"},[...o[13]||(o[13]=[e("svg",{class:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])])]),e("div",Qt,[e("button",{onClick:o[4]||(o[4]=d=>k.value="config"),class:F(["px-4 py-3 text-sm font-bold border-b-2 transition-colors",s(k)==="config"?"border-primary text-primary":"border-transparent text-secondary hover:text-white"])}," Configurar Ficha ",2),e("button",{onClick:o[5]||(o[5]=d=>k.value="preview"),class:F(["px-4 py-3 text-sm font-bold border-b-2 transition-colors",s(k)==="preview"?"border-primary text-primary":"border-transparent text-secondary hover:text-white"])}," Visualizar Lista (Preview) ",2)]),e("div",Xt,[s(y)?(n(),r("div",Zt,[...o[14]||(o[14]=[e("div",{class:"animate-spin rounded-full h-10 w-10 border-t-2 border-primary"},null,-1)])])):s(N).length===0?(n(),r("div",eo,[...o[15]||(o[15]=[e("p",null,"Nenhuma turma encontrada.",-1)])])):s(k)==="config"?(n(),r("div",to,[e("div",null,[e("h4",oo,"Configuração por Turma ("+p(s(N).length)+")",1),e("div",so,[e("div",ao,[o[16]||(o[16]=e("p",{class:"text-sm font-bold text-white"},'Incluir "vagas complementares" no título',-1)),e("p",no,"Desligado: Processo seletivo "+p(M.anoSemestre)+" | Ligado: Processo seletivo vagas complementares "+p(M.anoSemestre),1)]),e("button",{type:"button",role:"switch","aria-checked":s(_),onClick:o[6]||(o[6]=d=>_.value=!s(_)),class:F(["relative inline-flex h-7 w-12 items-center rounded-full transition-colors",s(_)?"bg-primary":"bg-white/15"])},[e("span",{class:F(["inline-block h-5 w-5 transform rounded-full bg-white transition-transform",s(_)?"translate-x-6":"translate-x-1"])},null,2)],10,ro)]),e("div",io,[(n(!0),r(D,null,H(s(N),d=>(n(),r("div",{key:d.id_turma,class:"bg-white/5 border border-white/10 rounded-lg overflow-hidden"},[e("button",{onClick:P=>d.isExpanded=!d.isExpanded,class:"w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"},[e("div",co,[e("p",po,p(d.nome_turma),1),e("p",uo,p(d.turno),1),(d.alunos||[]).length===0?(n(),r("div",mo,[...o[17]||(o[17]=[e("svg",{class:"w-3 h-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"})],-1),W(" Sem alunos nesta turma ",-1)])])):B("",!0)]),(n(),r("svg",{class:F(["w-5 h-5 text-secondary transition-transform",{"rotate-180":d.isExpanded}]),fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[...o[18]||(o[18]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M19 9l-7 7-7-7"},null,-1)])],2))],8,lo),A(e("div",ho,[e("div",xo,[(n(),r(D,null,H(3,P=>e("div",{key:P},[e("label",vo,"Pergunta "+p(P),1),e("div",fo,[A(e("input",{"onUpdate:modelValue":b=>d[`custom_pergunta_${P}`]=b,onBlur:b=>u(d),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none",placeholder:`Digite a pergunta ${P}...`},null,40,bo),[[R,d[`custom_pergunta_${P}`]]]),e("button",{onClick:b=>u(d),class:"text-primary hover:text-primary-600 transition-colors p-1",title:"Salvar"},[...o[19]||(o[19]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"})],-1)])],8,go)]),e("div",wo,[d.isSaving?(n(),r("span",yo,"Aguarde...")):d.lastSaved?(n(),r("span",_o,"Salvo às "+p(d.lastSaved),1)):B("",!0)])])),64)),e("div",null,[o[21]||(o[21]=e("label",{class:"block text-xs font-bold text-secondary mb-1"},"Rodapé",-1)),e("div",ko,[A(e("textarea",{"onUpdate:modelValue":P=>d.custom_rodape=P,onBlur:P=>u(d),class:"w-full bg-[#0f0f15] border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none min-h-[120px]",placeholder:"Texto do rodapé..."},null,40,$o),[[R,d.custom_rodape]]),e("button",{onClick:P=>u(d),class:"text-primary hover:text-primary-600 transition-colors p-1 self-start",title:"Salvar"},[...o[20]||(o[20]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a2 2 0 110-4 2 2 0 010 4zm3-10H9V5h6v4z"})],-1)])],8,Co)]),e("div",Eo,[d.isSaving?(n(),r("span",So,"Aguarde...")):d.lastSaved?(n(),r("span",Po,"Salvo às "+p(d.lastSaved),1)):B("",!0)])])])],512),[[J,d.isExpanded]])]))),128))])])])):s(k)==="preview"?(n(),r("div",Ao,[(n(!0),r(D,null,H(s(N),d=>A((n(),r("div",{key:d.id_turma,class:"bg-white/5 border border-white/10 rounded-lg overflow-hidden"},[e("div",zo,[e("button",{onClick:P=>d.isPreviewExpanded=!d.isPreviewExpanded,class:"flex-1 flex justify-between items-center pr-4"},[e("div",jo,[e("h4",Mo,p(d.nome_turma),1),e("span",Bo,p(d.turno),1)]),e("div",To,[e("span",Do,p((d.alunos||[]).length)+" alunos ",1),(n(),r("svg",{class:F(["w-5 h-5 text-secondary transition-transform duration-200",{"rotate-180":d.isPreviewExpanded}]),fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[...o[22]||(o[22]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M19 9l-7 7-7-7"},null,-1)])],2))])],8,Lo),e("div",Oo,[e("button",{onClick:ne(P=>L(d),["stop"]),class:"inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors",title:"Imprimir fichas desta turma"},[...o[23]||(o[23]=[e("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})],-1),W(" Fichas ",-1)])],8,Io),e("button",{type:"button",onClick:ne(P=>V(d),["stop"]),disabled:s(C),class:"inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-primary hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",title:"Imprimir lista desta turma"},[o[24]||(o[24]=e("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2zm8-14H8"})],-1)),W(" "+p(s(C)?"Gerando...":"Listas"),1)],8,Vo)])]),A(e("div",Fo,[e("div",Ho,[(n(!0),r(D,null,H(d.alunos,(P,b)=>(n(),r("div",{key:b,class:"flex gap-3 text-sm text-secondary-300 py-1 border-b border-white/5 last:border-0"},[e("span",No,p(Number(b)+1)+".",1),e("span",Ro,p(P.nome),1)]))),128)),!d.alunos||d.alunos.length===0?(n(),r("div",Uo," Nenhum aluno nesta lista. ")):B("",!0)])],512),[[J,d.isPreviewExpanded]])])),[[J,(d.alunos||[]).length>0]])),128))])):B("",!0)]),e("div",qo,[e("button",{onClick:o[7]||(o[7]=d=>c.$emit("close")),class:"px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white font-bold rounded-lg transition-colors"}," Cancelar "),s(k)==="preview"?(n(),r(D,{key:0},[e("button",{onClick:o[8]||(o[8]=d=>i()),class:"px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"},[...o[25]||(o[25]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})],-1),W(" Imprimir Fichas ",-1)])]),e("button",{type:"button",onClick:o[9]||(o[9]=d=>x()),disabled:s(C),class:"px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"},[o[26]||(o[26]=e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 12h6m-6 4h6m-7 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2zm8-14H8"})],-1)),W(" "+p(s(C)?"Gerando Listas...":"Imprimir Listas"),1)],8,Wo)],64)):B("",!0)])])])])])):B("",!0)}}),Yo=Object.assign(pe(Go,[["__scopeId","data-v-c5ba217f"]]),{__name:"ModalFichaAvaliacao"}),Jo={key:0,class:"relative z-50"},Ko={class:"fixed inset-0 z-10 overflow-y-auto"},Qo={class:"flex min-h-full items-center justify-center p-4 text-center"},Xo={class:"relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#1A1B26] text-left align-middle shadow-xl transition-all border border-white/10 flex flex-col max-h-[90vh]"},Zo={class:"p-6 border-b border-white/10 flex justify-between items-center bg-[#16161E]"},es={class:"text-xs text-secondary mt-1"},ts={class:"flex border-b border-white/10 bg-[#16161E]"},os={class:"p-6 bg-[#1A1B26] overflow-y-auto custom-scrollbar flex-1"},ss={key:0,class:"flex justify-center items-center py-20"},as={key:1},ns={class:"space-y-6"},rs={class:"bg-white/5 rounded-lg p-5 border border-white/5"},is={class:"bg-white/5 rounded-lg p-5 border border-white/5"},ls={class:"space-y-6"},ds={class:"w-full flex justify-between items-center p-5 hover:bg-white/5 transition-colors text-left group"},cs=["onClick"],ps={class:"flex flex-col gap-1 text-left"},us={class:"font-bold text-white"},ms={class:"text-xs text-secondary w-fit bg-white/5 px-2 py-0.5 rounded"},hs={class:"flex items-center gap-4"},xs={class:"text-xs font-bold text-white bg-primary/20 text-primary px-2 py-1 rounded"},vs=["onClick"],fs={class:"p-5 pt-0 border-t border-white/10"},bs={class:"space-y-1 mt-4"},gs={class:"w-8 text-right font-mono opacity-50"},ws={class:"text-white"},ys={key:0,class:"text-center py-10 opacity-50"},_s={class:"p-4 border-t border-white/10 flex justify-end gap-3 bg-[#16161E]"},ks=re({__name:"ModalListaSelecionados",props:{isOpen:{type:Boolean},area:{},anoSemestre:{}},emits:["close"],setup(M,{emit:T}){const w=M,{showToast:$}=le(),y=z("config"),C=z(!1),k=z([]),f=be({semestreModulo:"1º semestre de 2026, correspondentes ao Módulo Fogo",periodoMatricula:"06 a 08 de dezembro até às 12h00 (horário de Brasília).",tipoProcesso:"seletivo",tipoCandidatura:"estudante"}),_=async()=>{C.value=!0;try{const u=await $fetch("/api/selecao/lista-selecionados",{params:{area:w.area,anoSemestre:w.anoSemestre,tipoProcesso:f.tipoProcesso,tipoCandidatura:f.tipoCandidatura}})||[];u.forEach(h=>{h.alunos.sort((m,t)=>m.nome.localeCompare(t.nome)),h.isPreviewExpanded=!1}),u.sort((h,m)=>h.nome_turma.localeCompare(m.nome_turma)),k.value=u}catch(S){console.error(S),$("Erro ao carregar lista de selecionados.",{type:"error"})}finally{C.value=!1}};ie(()=>w.isOpen,S=>{S&&(y.value="config",_())});const N=S=>{const u=S||k.value,h=document.createElement("iframe");h.style.position="fixed",h.style.right="0",h.style.bottom="0",h.style.width="0",h.style.height="0",h.style.border="0",document.body.appendChild(h);const m=h.contentWindow?.document;if(!m)return;const t=Q(u);m.open(),m.write(t),m.close();const i=()=>{const x=m.images;if(!x.length){U(h);return}let L=0;const V=()=>{L++,L===x.length&&U(h)};for(let v=0;v<x.length;v++){const a=x[v];a&&(a.complete?V():(a.addEventListener("load",V),a.addEventListener("error",V)))}};h.onload=()=>i(),setTimeout(()=>i(),500)},U=S=>{S._hasPrinted||(S._hasPrinted=!0,S.contentWindow&&setTimeout(()=>{S.contentWindow?.focus(),S.contentWindow?.print(),setTimeout(()=>{document.body.contains(S)&&document.body.removeChild(S)},1e3)},300))},I=S=>{N([S])},G=()=>`
  * {
    box-sizing: border-box;
    font-family: 'Poppins', sans-serif;
    color: #222;
    font-size: 13px;
  }

 .pagina {
  padding: 3mm 10mm;
  width: 100%;
  margin: 0;
  page-break-inside: avoid !important;
}

/* Espaço ENTRE turmas */
 .pagina + .pagina {
  margin-top: 0;  /* ⬅ Mude esse número para mais ou menos espaço */
  page-break-before: avoid !important;
}


  /* CABEÇALHO FIXO */
  .cabecalho-interno {
    text-align: center;
    margin-top: 0;
    margin-bottom: 22px;
    font-size: 13px;
    line-height: 1.45;
  }

  .logo-cabecalho {
    width: 120px;
    margin-bottom: 10px;
  }

  .linhas-centrais div {
    margin: 2px 0;
    font-weight: 700;
  }

  .texto-etapas {
    margin-top: 12px;
    white-space: normal;
    text-align: left;
    font-size: 13px;
  }

  /* BLOCO DA TURMA */
  .bloco-cabecalho-turma {
    margin-bottom: 20px;
  }

  .info-turma p {
    margin: 3px 0;
    font-size: 13px;
  }

  .titulo-turma {
    font-size: 15px;
    font-weight: 700;
  }

  /* LISTA */
  .titulo-lista {
    margin-top: 6px;
    margin-bottom: 6px;
    font-weight: 700;
    font-size: 12px;
  }

  .aluno-item {
    padding: 6px 0;
    border-bottom: 1px solid #eee;
    font-size: 13px;
  }

  .aluno-item:last-of-type {
    border-bottom: none;
  }
`,K=S=>{const u="https://spedppull.b-cdn.net/site/sped_logo_total%20(1).png",m=`Processo Seletivo - ${w.anoSemestre||""}`,t="Cursos Regulares | São Paulo Escola de Dança",i="Lista de Aprovados(as)",x=f.semestreModulo||"",L=f.periodoMatricula||"",V=()=>`
        <div class="cabecalho-interno">
            <img src="${u}" class="logo-cabecalho" />

            <div class="linhas-centrais">
                <div class="linha-1"><strong>${m}</strong></div>
                <div class="linha-2"><strong>${t}</strong></div>
                <div class="linha-3"><strong>${i}</strong></div>
            </div>

            <div class="texto-etapas">
                A Associação Pró-Dança - APD, Organização Social de Cultura, inscrita no CNPJ de nº. 11.035.916/0003-65 (filial), com filial na Rua Mauá, nº. 51, 3º andar, Centro, São Paulo/SP, CEP 01028-000, gestora da São Paulo Escola de Dança – Centro de Formação em Artes Coreográficas, nos termos do Contrato de Gestão nº. 05/2021 celebrado com o Estado de São Paulo por intermédio de sua Secretaria de Cultura, Economia e Indústria Criativas, torna pública a lista de aprovados(as) no processo seletivo dos Cursos Regulares do <strong>${x}</strong> <br> <strong> O link da matrícula será enviado para o e-mail cadastrado na inscrição. Fique atento à sua caixa de SPAM. </strong> <br> Período de matrícula on-line: <strong>${L}</strong>. <br> O candidato aprovado que não efetivar a matrícula no prazo estipulado perderá automaticamente o direito à vaga. <br> Qualquer dúvida, escreva para o e-mail <strong> secretaria@spescoladedanca.org.br </strong> ou entre em contato pelo telefone <strong> (11) 3367-5900 </strong> ou WhatsApp <strong> (11) 91593-2046 </strong>.
            </div>
        </div>
    `,v=l=>`
        <div class="bloco-cabecalho-turma">
            <div class="info-turma">
                <p class="titulo-turma"><strong>${l.nome_turma}</strong></p> - <strong>${l.turno}</strong></p>
            </div>
        </div>
    `,a=l=>`
        <div class="titulo-lista">Candidatos Aprovados</div>
        ${(l.alunos||[]).map((E,X)=>`
                <div class="aluno-item">
                    ${X+1} - ${E.nome}
                </div>
            `).join("")}
    `;let j=!0;return S.map(l=>{if(!l.alunos||l.alunos.length===0)return"";const E=j?V():"";return j=!1,`
            <div class="pagina">
                ${E}
                ${v(l)}
                ${a(l)}
            </div>
        `}).join("")},Q=S=>`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista de Selecionados</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>${G()}</style>
        </head>
        <body>
          ${K(S)}
        </body>
      </html>
      `;return(S,u)=>M.isOpen?(n(),r("div",Jo,[e("div",{class:"fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity",onClick:u[0]||(u[0]=h=>S.$emit("close"))}),e("div",Ko,[e("div",Qo,[e("div",Xo,[e("div",Zo,[e("div",null,[u[8]||(u[8]=e("h3",{class:"text-lg font-bold text-white"}," Gerar Lista de Selecionados ",-1)),e("p",es,p(w.area)+" | "+p(w.anoSemestre),1)]),e("button",{onClick:u[1]||(u[1]=h=>S.$emit("close")),class:"text-secondary hover:text-white transition-colors"},[...u[9]||(u[9]=[e("svg",{class:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])]),e("div",ts,[e("button",{onClick:u[2]||(u[2]=h=>y.value="config"),class:F(["px-6 py-3 text-sm font-medium border-b-2 transition-colors",s(y)==="config"?"border-primary text-white":"border-transparent text-secondary hover:text-white"])}," Configurar Texto ",2),e("button",{onClick:u[3]||(u[3]=h=>y.value="preview"),class:F(["px-6 py-3 text-sm font-medium border-b-2 transition-colors",s(y)==="preview"?"border-primary text-white":"border-transparent text-secondary hover:text-white"])}," Visualizar e Imprimir ",2)]),e("div",os,[s(C)?(n(),r("div",ss,[...u[10]||(u[10]=[e("div",{class:"animate-spin rounded-full h-10 w-10 border-t-2 border-primary"},null,-1)])])):(n(),r("div",as,[A(e("div",ns,[e("div",rs,[u[11]||(u[11]=e("label",{class:"block text-xs font-bold text-secondary uppercase mb-2"},"Semestre e Módulo",-1)),u[12]||(u[12]=e("p",{class:"text-[10px] text-secondary/50 mb-2"},'Complementa a frase: "...dos Cursos Regulares do [TEXTO]"',-1)),A(e("input",{"onUpdate:modelValue":u[4]||(u[4]=h=>s(f).semestreModulo=h),type:"text",class:"w-full bg-[#16161E] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"},null,512),[[R,s(f).semestreModulo]])]),e("div",is,[u[13]||(u[13]=e("label",{class:"block text-xs font-bold text-secondary uppercase mb-2"},"Período de Matrícula",-1)),u[14]||(u[14]=e("p",{class:"text-[10px] text-secondary/50 mb-2"},'Complementa a frase: "Período de matrícula on-line: [TEXTO]"',-1)),A(e("input",{"onUpdate:modelValue":u[5]||(u[5]=h=>s(f).periodoMatricula=h),type:"text",class:"w-full bg-[#16161E] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"},null,512),[[R,s(f).periodoMatricula]])]),u[15]||(u[15]=e("div",{class:"flex p-4 mb-4 text-sm text-yellow-500 rounded-lg bg-yellow-500/10 border border-yellow-500/20",role:"alert"},[e("svg",{class:"flex-shrink-0 inline w-5 h-5 mr-3",fill:"currentColor",viewBox:"0 0 20 20"},[e("path",{"fill-rule":"evenodd",d:"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z","clip-rule":"evenodd"})]),e("div",null,[e("span",{class:"font-medium"},"Atenção:"),W(" Estes textos são usados apenas para a impressão e não são salvos no banco de dados. Configure antes de imprimir. ")])],-1))],512),[[J,s(y)==="config"]]),A(e("div",ls,[(n(!0),r(D,null,H(s(k),h=>A((n(),r("div",{key:h.id_turma,class:"bg-white/5 border border-white/10 rounded-lg overflow-hidden"},[e("div",ds,[e("button",{onClick:m=>h.isPreviewExpanded=!h.isPreviewExpanded,class:"flex-1 flex justify-between items-center pr-4"},[e("div",ps,[e("h4",us,p(h.nome_turma),1),e("span",ms,p(h.turno),1)]),e("div",hs,[e("span",xs,p((h.alunos||[]).length)+" selecionados ",1),(n(),r("svg",{class:F(["w-5 h-5 text-secondary transition-transform duration-200",{"rotate-180":h.isPreviewExpanded}]),fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[...u[16]||(u[16]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M19 9l-7 7-7-7"},null,-1)])],2))])],8,cs),e("button",{onClick:ne(m=>I(h),["stop"]),class:"p-2 text-primary hover:text-primary hover:bg-white/10 rounded-lg transition-colors ml-2 border-l border-white/10 pl-4",title:"Imprimir somente esta turma"},[...u[17]||(u[17]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})],-1)])],8,vs)]),A(e("div",fs,[e("div",bs,[(n(!0),r(D,null,H(h.alunos,(m,t)=>(n(),r("div",{key:t,class:"flex gap-3 text-sm text-secondary-300 py-1 border-b border-white/5 last:border-0 pl-4"},[e("span",gs,p(Number(t)+1)+".",1),e("span",ws,p(m.nome),1)]))),128))])],512),[[J,h.isPreviewExpanded]])])),[[J,(h.alunos||[]).length>0]])),128)),!s(k)||s(k).every(h=>!h.alunos||h.alunos.length===0)?(n(),r("div",ys," Nenhum candidato aprovado encontrado. ")):B("",!0)],512),[[J,s(y)==="preview"]])]))]),e("div",_s,[e("button",{onClick:u[6]||(u[6]=h=>S.$emit("close")),class:"px-6 py-2.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white font-bold rounded-lg transition-colors"}," Cancelar "),s(y)==="preview"?(n(),r("button",{key:0,onClick:u[7]||(u[7]=h=>N()),class:"px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"},[...u[18]||(u[18]=[e("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})],-1),W(" Imprimir Lista ",-1)])])):B("",!0)])])])])])):B("",!0)}}),$s=Object.assign(pe(ks,[["__scopeId","data-v-78dabf45"]]),{__name:"ModalListaSelecionados"}),Cs=M=>M&&M.find(w=>{const $=String(w.label).trim().toLowerCase();return["true","sim","s","yes","1"].includes($)})?.qtd||0,Es=M=>{if(!M||!M.length)return[];const T={"< 18":0,"18-24":0,"25-34":0,"35-44":0,"45-59":0,"60+":0},w=new Date;return M.forEach($=>{if(!$)return;let y=null;if($.includes("-")){const k=$.split("T")[0];k&&/^\d{4}-\d{2}-\d{2}$/.test(k)&&(y=new Date(k))}else if($.includes("/")){const C=$.split("/");if(C.length===3){const[k,f,_]=C;_&&f&&k&&_.length===4&&(y=new Date(`${_}-${f}-${k}`))}}if(y&&!isNaN(y.getTime())){let C=w.getFullYear()-y.getFullYear();const k=w.getMonth()-y.getMonth();(k<0||k===0&&w.getDate()<y.getDate())&&C--,C<18?T["< 18"]=(T["< 18"]||0)+1:C<=24?T["18-24"]=(T["18-24"]||0)+1:C<=34?T["25-34"]=(T["25-34"]||0)+1:C<=44?T["35-44"]=(T["35-44"]||0)+1:C<=59?T["45-59"]=(T["45-59"]||0)+1:T["60+"]=(T["60+"]||0)+1}}),Object.entries(T).map(([$,y])=>({faixa:$,qtd:y})).filter($=>$.qtd>0)},Ss={class:"bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8"},Ps={class:"flex flex-col md:flex-row items-center justify-between gap-4 mb-6"},As={class:"flex items-center gap-6 border-b border-secondary/10 w-full md:w-auto pb-1 overflow-x-auto no-scrollbar"},zs=["onClick"],Ls={key:0,class:"absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"},js={class:"relative w-full md:w-48"},Ms=["value"],Bs=["value"],Ts=["value"],Ds={key:0,class:"flex justify-center py-20"},Os={key:1,class:"space-y-8"},Is={class:"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"},Vs={class:"text-[10px] uppercase font-bold text-secondary tracking-wider"},Fs={class:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"},Hs={class:"bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col h-full"},Ns={class:"space-y-4 flex-1"},Rs={class:"flex justify-between text-xs mb-1"},Us={class:"text-secondary-300 capitalize"},qs={class:"text-white font-bold"},Ws={class:"w-full h-2 bg-white/5 rounded-full overflow-hidden"},Gs={class:"bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col h-full"},Ys={class:"space-y-4 flex-1"},Js={class:"flex justify-between text-xs mb-1"},Ks={class:"text-secondary-300 capitalize"},Qs={class:"text-white font-bold"},Xs={class:"w-full h-2 bg-white/5 rounded-full overflow-hidden"},Zs={class:"bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col h-full"},ea={class:"space-y-4 flex-1"},ta={class:"flex justify-between text-xs mb-1"},oa={class:"text-secondary-300 capitalize"},sa={class:"text-white font-bold"},aa={class:"w-full h-2 bg-white/5 rounded-full overflow-hidden"},na={class:"bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col h-full min-h-[250px] lg:col-span-2"},ra={key:0,class:"space-y-4 flex-1"},ia={class:"flex justify-between text-xs mb-1"},la={class:"text-secondary-300"},da={class:"text-white font-bold"},ca={class:"w-full h-2 bg-white/5 rounded-full overflow-hidden"},pa={key:1,class:"flex-1 flex items-center justify-center text-secondary/40 text-xs"},ua={class:"bg-[#16161E] border border-white/5 rounded-xl p-5 flex flex-col justify-center h-full min-h-[250px] relative"},ma={key:0,class:"flex flex-col items-center justify-center flex-1"},ha={class:"text-6xl font-black text-white mb-2"},xa={class:"text-xs text-secondary/50 mt-4"},va={key:1,class:"flex-1 flex items-center justify-center text-secondary/40 text-xs"},fa={key:2,class:"flex flex-col items-center justify-center py-20 opacity-50"},ba={class:"bg-div-15 rounded-xl p-5 border border-secondary/10"},ga={class:"space-y-2"},wa=["disabled"],ya={class:"flex flex-col items-start"},_a={class:"text-[10px] opacity-60 font-normal"},ka={key:0,class:"animate-spin h-4 w-4 border-t-2 border-primary rounded-full"},$a={key:1,class:"w-4 h-4 text-primary",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},Ca=["disabled"],Ea={class:"flex flex-col items-start"},Sa={class:"text-[10px] opacity-60 font-normal"},Pa={key:0,class:"animate-spin h-4 w-4 border-t-2 border-primary rounded-full"},Aa={key:1,class:"w-4 h-4 text-primary",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},za=["disabled"],La={class:"flex flex-col items-start"},ja={class:"text-[10px] opacity-60 font-normal"},Ma={key:0,class:"animate-spin h-4 w-4 border-t-2 border-primary rounded-full"},Ba={key:1,class:"w-4 h-4 text-primary",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},Ta={key:3,class:"text-xs text-secondary/30 text-center py-2 italic"},Va=re({__name:"painel",setup(M){const{showToast:T}=le(),w=z(!1),$=z(!1),y=z("Extensão"),C={Extensão:"extensao",Regulares:"regulares","Cursos Livres":"cursos_livres"},k=Z(()=>C[y.value]||"extensao"),f=z(te()),_=z(null),N=async()=>{w.value=!0;try{const v=await $fetch("/api/selecao/dashboard-demographics",{params:{ano_semestre:f.value,tipo_processo:"seletivo",tipo_candidatura:"estudante",area:k.value}});_.value=v}catch(v){console.error("Error fetching dashboard:",v)}finally{w.value=!1}};ie([y,f],()=>{N()}),ge(()=>{N()});const U=v=>({Aguardando:"text-yellow-400",Matriculado:"text-green-400",Aprovado:"text-blue-400",Recusado:"text-red-400",Suplente:"text-orange-400"})[v]||"text-white",I=v=>v||"Aguardando",G=v=>v?v.reduce((a,j)=>a+(Number(j.qtd)||0),0)||1:0,K=v=>v?v.reduce((a,j)=>a+(Number(j.qtd)||0),0):0,Q=["ate_meio","Até meio salário-mínimo","ate_um","Até 1 salário-mínimo","um_dois","De 1 a 2 salários-mínimos","dois_cinco","De 2 a 5 salários-mínimos","cinco_dez","De 5 a 10 salários-mínimos","acima_dez","Acima de 10 salários-mínimos"],S=Z(()=>_.value?.demographics?.renda?[..._.value.demographics.renda].sort((v,a)=>{const j=Q.indexOf(v.label),l=Q.indexOf(a.label);return(j===-1?999:j)-(l===-1?999:l)}):[]),u=Z(()=>{if(_.value?.demographics?.idade&&_.value.demographics.idade.length>0)return _.value.demographics.idade;const v=_.value?.demographics?.nascimentos;return Es(v)}),h=Z(()=>_.value?.demographics?.genero?[..._.value.demographics.genero].sort((v,a)=>a.qtd-v.qtd):[]),m=Z(()=>_.value?.demographics?.raca?[..._.value.demographics.raca].sort((v,a)=>a.qtd-v.qtd):[]),t=v=>v?v.replace(/_/g," ").replace(/\b\w/g,a=>a.toUpperCase()):"Não Informado",i=z(!1),x=z(!1),L=z(!1),V=async()=>{$.value=!0;try{const{default:v}=await me(async()=>{const{default:b}=await import("./DhV3-_R1.js").then(q=>q.e);return{default:b}},__vite__mapDeps([0,1]),import.meta.url),a=await $fetch("/api/selecao/exportar-excel",{params:{ano_semestre:f.value,area:k.value,tipo_candidatura:"estudante"}});if(!a||!a.data||a.data.length===0){T("Nenhum dado encontrado para exportação.",{type:"info"});return}const j=new v.Workbook,l=j.addWorksheet("Candidatos"),E=[{header:"Nome Completo",key:"nome_completo",width:30},{header:"Email",key:"email",width:30},{header:"Curso",key:"curso",width:30},{header:"Turma",key:"turma",width:30},{header:"Turno",key:"turno",width:15},{header:"Data Inscrição",key:"data_inscricao",width:20},{header:"Status",key:"status",width:15}],X=(a.dynamic_columns||[]).map(b=>({header:b.label,key:b.pergunta??b.label,width:30}));l.columns=[...E,...X];const c=a.data.map(b=>{const q={nome_completo:b["Nome Completo"],email:b.Email,curso:b.Curso,turma:b.Turma,turno:b.Turno,data_inscricao:b["Data Inscrição"],status:b.Status};return(a.dynamic_columns||[]).forEach(g=>{const O=g.pergunta??g.label;q[O]=b.respostas?.[O]??""}),q});l.addRows(c);const o=l.getRow(1);o.font={bold:!0,color:{argb:"FFFFFFFF"}},o.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFfd0054"}};const d=await j.xlsx.writeBuffer(),P=new Blob([d],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});{const b=await me(()=>import("./DXDaohro.js").then(g=>g.F),__vite__mapDeps([2,1]),import.meta.url),{saveAs:q}=b;q(P,`Candidatos_${y.value}_${f.value}.xlsx`)}T("Download do Excel iniciado!",{type:"success"})}catch(v){console.error("Erro ao exportar excel:",v),T(v.message||"Erro ao exportar dados.",{type:"error"})}finally{$.value=!1}};return(v,a)=>{const j=ye;return n(),we(j,{name:"base"},{sidebar:ue(()=>[e("div",ba,[a[26]||(a[26]=e("h3",{class:"text-sm font-bold text-white mb-4"},"Ações Rápidas",-1)),e("div",ga,[s(y)==="Regulares"?(n(),r(D,{key:0},[e("button",{onClick:a[1]||(a[1]=l=>i.value=!0),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"},[...a[18]||(a[18]=[e("span",null,"Lista Homologados",-1),e("svg",{class:"w-4 h-4 opacity-50 group-hover:opacity-100",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"})],-1)])]),e("button",{onClick:a[2]||(a[2]=l=>x.value=!0),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"},[...a[19]||(a[19]=[e("span",null,"Ficha de Avaliação",-1),e("svg",{class:"w-4 h-4 opacity-50 group-hover:opacity-100",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})],-1)])]),e("button",{onClick:a[3]||(a[3]=l=>L.value=!0),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"},[...a[20]||(a[20]=[e("span",null,"Lista Selecionados",-1),e("svg",{class:"w-4 h-4 opacity-50 group-hover:opacity-100",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"})],-1)])]),e("button",{onClick:V,disabled:s($),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"},[e("div",ya,[e("span",null,p(s($)?"Baixando...":"Baixar Excel"),1),e("span",_a,p(s(y)),1)]),s($)?(n(),r("div",ka)):(n(),r("svg",$a,[...a[21]||(a[21]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},null,-1)])]))],8,wa)],64)):s(y)==="Cursos Livres"?(n(),r(D,{key:1},[e("button",{onClick:a[4]||(a[4]=l=>L.value=!0),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"},[...a[22]||(a[22]=[e("span",null,"Lista Selecionados",-1),e("svg",{class:"w-4 h-4 opacity-50 group-hover:opacity-100",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"})],-1)])]),e("button",{onClick:V,disabled:s($),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"},[e("div",Ea,[e("span",null,p(s($)?"Baixando...":"Baixar Excel"),1),e("span",Sa,p(s(y)),1)]),s($)?(n(),r("div",Pa)):(n(),r("svg",Aa,[...a[23]||(a[23]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},null,-1)])]))],8,Ca)],64)):s(y)==="Extensão"?(n(),r(D,{key:2},[e("button",{onClick:a[5]||(a[5]=l=>L.value=!0),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group"},[...a[24]||(a[24]=[e("span",null,"Lista Selecionados",-1),e("svg",{class:"w-4 h-4 opacity-50 group-hover:opacity-100",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"})],-1)])]),e("button",{onClick:V,disabled:s($),class:"w-full bg-[#16161E] hover:bg-white/5 border border-white/5 text-secondary hover:text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"},[e("div",La,[e("span",null,p(s($)?"Baixando...":"Baixar Excel"),1),e("span",ja,p(s(y)),1)]),s($)?(n(),r("div",Ma)):(n(),r("svg",Ba,[...a[25]||(a[25]=[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},null,-1)])]))],8,za)],64)):(n(),r("div",Ta," Selecione uma área "))])])]),default:ue(()=>[e("div",Ss,[e("div",Ps,[e("div",As,[(n(),r(D,null,H(C,(l,E)=>e("button",{key:l,onClick:X=>y.value=E,class:F(["text-sm font-bold pb-2 relative transition-colors whitespace-nowrap capitalize text-secondary hover:text-primary",s(y)===E?"text-primary":"text-secondary"])},[W(p(E)+" ",1),s(y)===E?(n(),r("span",Ls)):B("",!0)],10,zs)),64))]),e("div",js,[A(e("select",{"onUpdate:modelValue":a[0]||(a[0]=l=>ce(f)?f.value=l:null),class:"w-full bg-[#16161E] border border-secondary/10 text-white text-xs rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-2.5 pr-8 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"},[e("option",{value:s(te)(void 0,-1)},p(s(te)(void 0,-1)),9,Ms),e("option",{value:s(te)()},p(s(te)())+" (Atual)",9,Bs),e("option",{value:s(te)(void 0,1)},p(s(te)(void 0,1)),9,Ts)],512),[[_e,s(f)]])])]),s(w)?(n(),r("div",Ds,[...a[9]||(a[9]=[e("div",{class:"animate-spin rounded-full h-12 w-12 border-t-2 border-primary"},null,-1)])])):s(_)?(n(),r("div",Os,[e("div",Is,[(n(!0),r(D,null,H(s(_).status_counts,(l,E)=>(n(),r("div",{key:E,class:"bg-[#16161E] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]"},[e("span",{class:F(["text-3xl font-black mb-1",U(String(E))])},p(l),3),e("span",Vs,p(I(String(E))),1)]))),128))]),e("div",null,[a[16]||(a[16]=e("h3",{class:"text-xs font-bold text-secondary uppercase tracking-wider mb-4"},"Demografia e Perfil",-1)),e("div",Fs,[e("div",Hs,[a[10]||(a[10]=e("h4",{class:"text-sm font-bold text-white mb-4"},"Identidade de Gênero",-1)),e("div",Ns,[(n(!0),r(D,null,H(s(h),(l,E)=>(n(),r("div",{key:E},[e("div",Rs,[e("span",Us,p(t(l.label)),1),e("span",qs,p(l.qtd),1)]),e("div",Ws,[e("div",{class:"h-full bg-pink-500 rounded-full",style:ae({width:`${l.qtd/G(s(_).demographics.genero)*100}%`})},null,4)])]))),128))])]),e("div",Gs,[a[11]||(a[11]=e("h4",{class:"text-sm font-bold text-white mb-4"},"Cor / Raça",-1)),e("div",Ys,[(n(!0),r(D,null,H(s(m),(l,E)=>(n(),r("div",{key:E},[e("div",Js,[e("span",Ks,p(t(l.label)),1),e("span",Qs,p(l.qtd),1)]),e("div",Xs,[e("div",{class:"h-full bg-blue-500 rounded-full",style:ae({width:`${l.qtd/G(s(_).demographics.raca)*100}%`})},null,4)])]))),128))])]),e("div",Zs,[a[12]||(a[12]=e("h4",{class:"text-sm font-bold text-white mb-4"},"Renda Familiar",-1)),e("div",ea,[(n(!0),r(D,null,H(s(S),(l,E)=>(n(),r("div",{key:E},[e("div",ta,[e("span",oa,p(t(l.label)),1),e("span",sa,p(l.qtd),1)]),e("div",aa,[e("div",{class:"h-full bg-emerald-500 rounded-full",style:ae({width:`${l.qtd/G(s(_).demographics.renda)*100}%`})},null,4)])]))),128))])]),e("div",na,[a[13]||(a[13]=e("h4",{class:"text-sm font-bold text-white mb-4"},"Faixa Etária",-1)),s(u)&&s(u).length>0?(n(),r("div",ra,[(n(!0),r(D,null,H(s(u),(l,E)=>(n(),r("div",{key:E},[e("div",ia,[e("span",la,p(l.faixa),1),e("span",da,p(l.qtd),1)]),e("div",ca,[e("div",{class:"h-full bg-purple-500 rounded-full",style:ae({width:`${l.qtd/G(s(u))*100}%`})},null,4)])]))),128))])):(n(),r("div",pa," Sem dados de idade "))]),e("div",ua,[a[15]||(a[15]=e("h4",{class:"text-sm font-bold text-white mb-4 absolute top-5 left-5"},"PCD",-1)),K(s(_).demographics.pcd)>0?(n(),r("div",ma,[e("div",ha,p(s(Cs)(s(_).demographics.pcd)),1),a[14]||(a[14]=e("p",{class:"text-sm text-secondary font-bold uppercase tracking-wider"},"PCD",-1)),e("p",xa," Total Inscritos: "+p(K(s(_).demographics.pcd)),1)])):(n(),r("div",va," Sem dados PCD "))])])])])):(n(),r("div",fa,[...a[17]||(a[17]=[e("div",{class:"text-5xl mb-4"},"∅",-1),e("p",{class:"text-white font-medium"},"Nenhum dado encontrado para este período.",-1)])]))]),de(Ft,{"is-open":s(i),area:s(k),"ano-semestre":s(f),onClose:a[6]||(a[6]=l=>i.value=!1)},null,8,["is-open","area","ano-semestre"]),de(Yo,{"is-open":s(x),area:s(k),"ano-semestre":s(f),onClose:a[7]||(a[7]=l=>x.value=!1)},null,8,["is-open","area","ano-semestre"]),de($s,{"is-open":s(L),area:s(k),"ano-semestre":s(f),onClose:a[8]||(a[8]=l=>L.value=!1)},null,8,["is-open","area","ano-semestre"])]),_:1})}}});export{Va as default};
