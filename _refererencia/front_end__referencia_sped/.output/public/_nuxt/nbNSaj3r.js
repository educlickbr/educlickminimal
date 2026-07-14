import{e as me,r as c,C as ue,E as $,h as he,c as l,x as S,o as d,a as t,t as r,m as L,P as W,F as B,G as F,v as pe,z as Q,d as xe,_ as fe}from"./DTLy1l_x.js";const ge={key:0,class:"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"},ve={class:"bg-[#16161E] rounded-lg w-full h-5/6 max-w-6xl flex flex-col overflow-hidden border border-white/10"},_e={class:"border-b border-white/10 p-6 flex-shrink-0"},we={class:"flex items-center justify-between mb-6"},ye={class:"text-secondary-400 text-sm mt-1"},ke={class:"flex items-center gap-2"},$e=["disabled"],Ce={key:0,class:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},Ee={key:1,class:"inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"},Se={class:"grid grid-cols-1 md:grid-cols-4 gap-4"},Me=["disabled"],Ne=["value"],Ae=["disabled"],Te=["value"],Re={class:"flex items-center gap-2"},De={class:"flex-1 text-center px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white"},Pe={class:"flex-1 overflow-auto"},Le={key:0,class:"flex items-center justify-center h-full"},Be={key:1,class:"flex items-center justify-center h-full"},Fe={class:"text-secondary-400 text-center"},je={key:2,class:"w-full text-sm border-collapse"},ze={class:"divide-y divide-white/5"},Oe={class:"px-4 py-3 border-r border-white/5"},Ve={class:"font-semibold text-white flex items-center gap-2"},He={key:0,class:"inline-block px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] uppercase tracking-wider"},Ie={key:0,class:"text-xs text-secondary-500 mt-0.5"},Je={key:1,class:"text-xs text-secondary-500 mt-0.5"},Ge={class:"text-xs text-secondary-400 mt-0.5"},Ue={class:"text-xs text-secondary-500"},qe={class:"text-xs text-secondary-500"},We={class:"px-4 py-3 text-center border-r border-white/5"},Qe={class:"inline-block px-2 py-1 bg-yellow-400/20 text-yellow-300 rounded text-xs font-semibold"},Ye={class:"px-4 py-3 text-center border-r border-white/5"},Ke={class:"inline-block px-2 py-1 bg-red-400/20 text-red-300 rounded text-xs font-semibold"},Xe={class:"px-4 py-3 text-center border-r border-white/5"},Ze={class:"inline-block px-2 py-1 bg-red-400/20 text-red-300 rounded text-xs font-semibold"},et={class:"px-4 py-3 text-center border-r border-white/5"},tt={class:"inline-block px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold"},ot={class:"px-4 py-3 text-center border-r border-white/5"},st={class:"inline-block px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold"},rt={class:"px-4 py-3 text-center border-r border-white/5"},at={class:"inline-block px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded text-xs font-semibold"},nt={class:"px-4 py-3 text-center border-r border-white/5"},it={class:"inline-block px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded text-xs font-semibold"},lt={class:"px-4 py-3 text-center border-r border-white/5"},dt={class:"px-4 py-3 text-center"},ct={class:"inline-block px-2 py-1 bg-red-400/20 text-red-200 rounded text-xs font-semibold"},bt={class:"border-t border-white/10 px-6 py-4 bg-white/5 flex-shrink-0 flex items-center justify-between"},mt={class:"text-sm text-secondary-400"},ut={class:"font-semibold text-white"},ht=me({__name:"ModalRelatorioAtribuicoes",props:{isOpen:{type:Boolean},anoSemestre:{}},emits:["close"],setup(j,{emit:Y}){const b=j,K=Y,M=c(!1),N=c(!1),A=c(!1),C=c(!1),T=c([]),v=c([]),f=c(""),p=c(""),_=c(""),R=c([]),D=c([]),h=c(new Date().getMonth()+1),X=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],z=ue(()=>X[h.value-1]||"Inválido"),w=o=>typeof o?.encerrado=="boolean"?o.encerrado:o?.vigencia_fim?new Date(o.vigencia_fim).getTime()<=Date.now():!1,P=o=>Number(o?.reunioes_mes_faltas||0),O=o=>{const e=o?.faltas_total_geral_com_reunioes;if(e!=null)return Number(e);const s=Number(o?.faltas_geral||0),a=Number(o?.reunioes_faltas_geral??o?.reunioes_mes_faltas??0);return s+(a>0?a:0)},m=o=>{const e=Number(o||0);return Number.isInteger(e)?String(e):e.toFixed(1)},V=o=>{if(!o)return"--";const e=new Date(o);return Number.isNaN(e.getTime())?"--":e.toLocaleDateString("pt-BR")},Z=o=>{const e=V(o?.vigencia_inicio),s=o?.vigencia_fim?V(o.vigencia_fim):"Ativa";return`${e} - ${s}`},H=o=>{const e=String(o?.nome_social||"").trim();if(e)return e;const s=String(o?.nome||"").trim(),a=String(o?.sobrenome||"").trim();return`${s} ${a}`.trim()},ee=o=>String(o?.nome_social||"").trim()||"--",te=o=>String(o?.nome_social||"").trim().length>0,I=o=>{const e=String(o?.nome_social||"").trim(),s=String(o?.nome||"").trim(),a=String(o?.sobrenome||"").trim(),n=`${s} ${a}`.trim();return e&&n&&e.toLowerCase()!==n.toLowerCase()?n:""},J=async()=>{N.value=!0;try{const o=await $fetch("/api/bolsas/editais"),e=o.data||o||[];R.value=(Array.isArray(e)?e:[]).sort((s,a)=>{const n=new Date(a.criado_em||0).getTime(),u=new Date(s.criado_em||0).getTime();return n-u}),p.value||(p.value="")}catch(o){console.error("[editais fetch]",o)}finally{N.value=!1,b.isOpen&&y()}},y=async()=>{if(b.isOpen){M.value=!0;try{const o=await $fetch("/api/bolsas/relatorio/atribuicoes",{query:{ano_semestre:b.anoSemestre,mes:h.value,id_edital:p.value||void 0,id_turma:_.value||void 0}});T.value=o?.data||[],U()}catch(o){console.error("[relatorio fetch]",o)}finally{M.value=!1}}},G=async()=>{A.value=!0;try{const o=await $fetch("/api/matriculas/turmas",{params:{ano_semestre:b.anoSemestre,area:"Regulares"}});D.value=o?.turmas||[]}catch(o){console.error("[turmas fetch]",o)}finally{A.value=!1}},oe=o=>o?.nome_curso_turno||o?.nome_curso||o?.nome_turma||o?.id,se=o=>o?.titulo||o?.nome||o?.id,U=()=>{const o=f.value.toLowerCase(),e=a=>[...a].sort((n,u)=>{const g=w(n),x=w(u);if(g!==x)return g?1:-1;const k=`${n?.nome||""} ${n?.sobrenome||""}`.trim(),i=`${u?.nome||""} ${u?.sobrenome||""}`.trim();return k.localeCompare(i)});if(!o){v.value=e(T.value);return}const s=T.value.filter(a=>{const n=(a.nome||"").toLowerCase(),u=(a.sobrenome||"").toLowerCase(),g=`${n} ${u}`.trim(),x=(a.email||"").toLowerCase(),k=(a.curso||"").toLowerCase();return n.includes(o)||u.includes(o)||g.includes(o)||x.includes(o)||k.includes(o)});v.value=e(s)},re=()=>{h.value=h.value===1?12:h.value-1},ae=()=>{h.value=h.value===12?1:h.value+1},E=o=>o?String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):"",ne=async()=>{const o={};for(let e=1;e<=12;e++)try{const s=await $fetch("/api/bolsas/relatorio/atribuicoes",{query:{ano_semestre:b.anoSemestre,mes:e,id_edital:p.value||void 0,id_turma:_.value||void 0}});o[e]=s?.data||[]}catch(s){console.error(`Erro ao buscar mês ${e}:`,s),o[e]=[]}return o},ie=o=>{const e=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],s=`
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                background: #fff;
                color: #000;
            }
            
            .page {
                page-break-after: always;
                padding: 40px;
                min-height: 100vh;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            .header {
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            
            .header h1 {
                font-size: 20px;
                margin-bottom: 5px;
            }
            
            .meta {
                font-size: 12px;
                color: #666;
                margin: 3px 0;
            }
            
            .meta.strong {
                font-weight: bold;
                color: #000;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 11px;
            }
            
            thead {
                background: #f5f5f5;
                font-weight: bold;
            }
            
            th, td {
                border: 1px solid #ddd;
                padding: 6px;
                text-align: left;
            }
            
            th {
                background: #f0f0f0;
                text-align: center;
                font-weight: bold;
            }
            
            tbody tr:nth-child(even) {
                background: #fafafa;
            }
            
            td.number {
                text-align: center;
            }
            
            .badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .badge.encerrado {
                background: #ffebee;
                color: #c62828;
            }
            
            .no-data {
                text-align: center;
                color: #999;
                padding: 20px;
                font-style: italic;
            }
        </style>
    `,a=e.map((n,u)=>{const g=u+1,x=o[g]||[];if(x.length===0)return`
                <section class="page">
                    <header class="header">
                        <h1>Relatório de Atribuições - ${n}</h1>
                        <div class="meta strong">${n} / ${b.anoSemestre}</div>
                    </header>
                    <div class="no-data">Nenhum aluno encontrado para este mês.</div>
                </section>
            `;const k=x.map(i=>{const ce=H(i),be=w(i)?'<span class="badge encerrado">Encerrado</span>':"";return`
                <tr>
                    <td>
                        <strong>${E(ce)}</strong>
                        ${be}
                        <br/><small style="color: #999;">${E(i.email||"")}</small>
                        <br/><small style="color: #999;">${E(i.curso||"")} • ${E(i.turno||"")}</small>
                    </td>
                    <td class="number">${i.abonosmes||0}</td>
                    <td class="number">${m(i.faltas_p1_mes)||0}</td>
                    <td class="number">${m(i.faltas_p2_mes)||0}</td>
                    <td class="number">${i.faltas_ambos_p1p2_mes||0}</td>
                    <td class="number">${m(i.faltas_total_mes)||0}</td>
                    <td class="number">${Number(i.presencas_total_mes||0).toFixed(1)}</td>
                    <td class="number">${m(i.presencas_geral)||0}</td>
                    <td class="number">${P(i)||0}</td>
                    <td class="number"><strong>${m(O(i))||0}</strong></td>
                </tr>
            `}).join("");return`
            <section class="page">
                <header class="header">
                    <h1>Relatório de Atribuições - ${n}</h1>
                    <div class="meta strong">${n} / ${b.anoSemestre}</div>
                    <div class="meta">${x.length} aluno(s)</div>
                </header>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Aluno</th>
                            <th>Abono</th>
                            <th>P1</th>
                            <th>P2</th>
                            <th>Fal.Int.</th>
                            <th>Fal.Mês</th>
                            <th>Pres.</th>
                            <th>Pres.Ger.</th>
                            <th>Reunião</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${k}
                    </tbody>
                </table>
            </section>
        `}).join("");return`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Atribuições</title>
            ${s}
        </head>
        <body>
            ${a}
        </body>
        </html>
    `},le=o=>{const e=document.createElement("iframe");Object.assign(e.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0"}),document.body.appendChild(e);const s=e.contentDocument||e.contentWindow?.document;if(!s)return;s.open(),s.write(o),s.close();const a=()=>{e._hasPrinted||(e._hasPrinted=!0,e.contentWindow?.focus(),e.contentWindow?.print(),setTimeout(()=>{document.body.contains(e)&&document.body.removeChild(e)},1e3))};e.onload=()=>setTimeout(a,250),setTimeout(a,750)},de=async()=>{C.value=!0;try{const o=await ne(),e=ie(o);le(e)}catch(o){console.error("Erro ao gerar relatório para impressão:",o)}finally{C.value=!1}},q=()=>{f.value="",K("close")};return $(()=>b.isOpen,o=>{o&&(R.value.length===0?J():y(),D.value.length===0&&G())}),$(h,()=>{y()}),$(p,()=>{y()}),$(_,()=>{y()}),$(f,()=>{U()}),he(()=>{b.isOpen&&(J(),G())}),(o,e)=>j.isOpen?(d(),l("div",ge,[t("div",ve,[t("div",_e,[t("div",we,[t("div",null,[e[3]||(e[3]=t("h2",{class:"text-2xl font-bold text-white"},"Relatório de Atribuições",-1)),t("p",ye,r(z.value)+" / "+r(b.anoSemestre),1)]),t("div",ke,[t("button",{onClick:de,disabled:C.value,title:"Imprimir todos os meses",class:"p-2 text-secondary-400 hover:text-white hover:bg-white/5 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"},[C.value?(d(),l("div",Ee)):(d(),l("svg",Ce,[...e[4]||(e[4]=[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"},null,-1)])]))],8,$e),t("button",{onClick:q,class:"text-secondary-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded"},[...e[5]||(e[5]=[t("svg",{class:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])])]),t("div",Se,[t("div",null,[e[7]||(e[7]=t("label",{class:"block text-sm font-semibold text-secondary-300 mb-2"},"Edital",-1)),L(t("select",{"onUpdate:modelValue":e[0]||(e[0]=s=>p.value=s),disabled:N.value,class:"w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors disabled:opacity-50"},[e[6]||(e[6]=t("option",{value:"",class:"text-black"},"Todos",-1)),(d(!0),l(B,null,F(R.value,s=>(d(),l("option",{key:s.id,value:s.id,class:"text-black"},r(se(s)),9,Ne))),128))],8,Me),[[W,p.value]])]),t("div",null,[e[9]||(e[9]=t("label",{class:"block text-sm font-semibold text-secondary-300 mb-2"},"Turma",-1)),L(t("select",{"onUpdate:modelValue":e[1]||(e[1]=s=>_.value=s),disabled:A.value,class:"w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors disabled:opacity-50"},[e[8]||(e[8]=t("option",{value:"",class:"text-black"},"Todas",-1)),(d(!0),l(B,null,F(D.value,s=>(d(),l("option",{key:s.id,value:s.id,class:"text-black"},r(oe(s)),9,Te))),128))],8,Ae),[[W,_.value]])]),t("div",null,[e[12]||(e[12]=t("label",{class:"block text-sm font-semibold text-secondary-300 mb-2"},"Mês",-1)),t("div",Re,[t("button",{onClick:re,title:"Mês anterior",class:"px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"},[...e[10]||(e[10]=[t("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M15 19l-7-7 7-7"})],-1)])]),t("div",De,r(z.value),1),t("button",{onClick:ae,title:"Próximo mês",class:"px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"},[...e[11]||(e[11]=[t("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 5l7 7-7 7"})],-1)])])])]),t("div",null,[e[13]||(e[13]=t("label",{class:"block text-sm font-semibold text-secondary-300 mb-2"},"Buscar Aluno",-1)),L(t("input",{"onUpdate:modelValue":e[2]||(e[2]=s=>f.value=s),type:"text",placeholder:"Nome, email, curso...",class:"w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-secondary-500 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors"},null,512),[[pe,f.value]])])])]),t("div",Pe,[M.value?(d(),l("div",Le,[...e[14]||(e[14]=[t("div",{class:"text-center"},[t("div",{class:"inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"}),t("p",{class:"text-secondary-400"},"Carregando dados...")],-1)])])):v.value.length===0?(d(),l("div",Be,[t("p",Fe,r(f.value?"Nenhum aluno encontrado para os critérios selecionados.":"Nenhum aluno encontrado neste edital."),1)])):(d(),l("table",je,[e[15]||(e[15]=t("thead",{class:"sticky top-0 z-20 bg-[#16161E] border-b border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"},[t("tr",null,[t("th",{class:"bg-[#16161E] px-4 py-3 text-left font-semibold text-secondary-300 border-r border-white/5"},"Aluno"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-yellow-400 border-r border-white/5 w-12"},"Abono"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-red-400 border-r border-white/5 w-12"},"P1"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-red-400 border-r border-white/5 w-12"},"P2"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-red-500 border-r border-white/5 w-16"},"Faltas Inteiras"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-red-300 border-r border-white/5 w-16"},"Faltas Mês"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-emerald-400 border-r border-white/5 w-16"},"Presença"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-emerald-400 border-r border-white/5 w-16"},"Pres.Geral"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-blue-400 border-r border-white/5 w-16"},"Reunião"),t("th",{class:"bg-[#16161E] px-4 py-3 text-center font-semibold text-red-300 w-20"},"Total Geral")])],-1)),t("tbody",ze,[(d(!0),l(B,null,F(v.value,s=>(d(),l("tr",{key:s.id_aluno,class:Q(["transition-colors",w(s)?"bg-red-950/10 hover:bg-red-950/20":"hover:bg-white/[0.03]"])},[t("td",Oe,[t("div",null,[t("div",Ve,[t("span",null,r(H(s)),1),w(s)?(d(),l("span",He," Encerrado ")):S("",!0)]),te(s)?S("",!0):(d(),l("div",Ie," Nome social: "+r(ee(s)),1)),I(s)?(d(),l("div",Je," NR: "+r(I(s)),1)):S("",!0),t("div",Ge,r(s.email),1),t("div",Ue,r(s.curso)+" • "+r(s.turno),1),t("div",qe,"Vigência: "+r(Z(s)),1)])]),t("td",We,[t("span",Qe,r(s.abonosmes),1)]),t("td",Ye,[t("span",Ke,r(m(s.faltas_p1_mes)),1)]),t("td",Xe,[t("span",Ze,r(m(s.faltas_p2_mes)),1)]),t("td",et,[t("span",tt,r(s.faltas_ambos_p1p2_mes),1)]),t("td",ot,[t("span",st,r(m(s.faltas_total_mes)),1)]),t("td",rt,[t("span",at,r(Number(s.presencas_total_mes).toFixed(1)),1)]),t("td",nt,[t("span",it,r(m(s.presencas_geral)),1)]),t("td",lt,[t("span",{class:Q(["inline-block px-2 py-1 rounded text-xs font-semibold",P(s)>0?"bg-red-500/20 text-red-300":"bg-emerald-400/20 text-emerald-300"])},r(P(s)),3)]),t("td",dt,[t("span",ct,r(m(O(s))),1)])],2))),128))])]))]),t("div",bt,[t("p",mt,[t("span",ut,r(v.value.length),1),e[16]||(e[16]=xe(" aluno(s) ",-1))]),t("button",{onClick:q,class:"px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-sm font-semibold transition-colors"}," Fechar ")])])])):S("",!0)}}),xt=Object.assign(fe(ht,[["__scopeId","data-v-555f6292"]]),{__name:"BolsasModalRelatorioAtribuicoes"});export{xt as M};
