import{e as to,r as l,E as ao,h as ro,c as r,a,x as m,m as so,v as io,p as n,F as M,G as B,d as P,t as d,l as no,o as s,z as T}from"./DTLy1l_x.js";import{u as co}from"./Bp67p3lH.js";const lo={translate:"no",class:"notranslate h-full w-full flex flex-col font-sans bg-transparent"},po={class:"flex-1 overflow-y-auto space-y-4 w-full"},uo={class:"bg-transparent md:bg-div-15 rounded-none md:rounded p-0 md:p-8 flex-1 w-full space-y-4"},go={class:"grid grid-cols-1 md:grid-cols-12 gap-3"},xo={class:"md:col-span-9"},fo={key:0,class:"flex justify-center py-16"},mo={key:1,class:"rounded-xl border border-white/10 bg-[#16161E] p-6 text-center"},bo={key:2,class:"space-y-3"},ho={class:"flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"},vo={class:"space-y-1"},wo={class:"text-white font-bold text-sm md:text-base"},yo={class:"text-xs text-secondary"},_o={key:0},Co={key:1},ko={key:2},Eo={class:"text-[11px] text-secondary/80"},zo={class:"text-[11px] text-secondary/80"},Ao={key:0},So={class:"flex flex-wrap items-center gap-2"},$o={class:"mt-4 flex flex-wrap gap-2"},Ro=["onClick"],Lo=["onClick"],No={class:"flex flex-col md:flex-row items-center justify-between gap-3 pt-2"},Do={class:"text-xs text-secondary"},Po={class:"text-white"},To={class:"flex gap-2"},jo=["disabled"],Oo=["disabled"],Mo={class:"w-full max-w-xl rounded-2xl border border-white/10 bg-[#11131a] shadow-2xl overflow-hidden"},Bo={class:"p-5 space-y-3"},Uo={key:0,class:"py-10 text-center text-secondary text-sm"},qo={key:1,class:"space-y-3"},Io={class:"flex flex-col md:flex-row md:items-center md:justify-between gap-3"},Vo={class:"text-xs font-black uppercase tracking-wider text-secondary"},Fo={class:"text-white text-base mt-1 break-words"},Ho=["disabled","onClick"],Wo="Não informado",Xo=to({__name:"index",setup(Zo){co({title:"Meus Certificados | SPEDigital",htmlAttrs:{translate:"no",class:"notranslate"},bodyAttrs:{class:"notranslate"}});const b=l({busca:""}),h=l([]),A=l(!1),S=l(!1),v=l(null),w=l([]),y=l(!1),c=l({total:0,page:1,pages:1,limit:12}),_=()=>{S.value=!1,v.value=null,w.value=[],y.value=!1},U=async o=>{v.value=o,S.value=!0,y.value=!0,w.value=[];try{const e=await $fetch("/api/educacional/avaliacao/opcoes-nome-impressao");w.value=e?.opcoes||[]}catch(e){console.error(e),window.alert("Não foi possível carregar as opções de nome para impressão."),_()}finally{y.value=!1}},q=o=>{if(!o.disponivel||!o.valor||!v.value)return;const e=v.value;_(),K(e,o.valor)},$=o=>{const e=String(o||"").toLowerCase();return e==="regulares"?"Regulares":e==="extensao"||e==="extensão"?"Extensão":e==="cursos_livres"||e==="cursos livres"?"Cursos Livres":e==="especializacao"||e==="especialização"?"Especialização":o||"Curso"},I=o=>{const e=$(o);return e==="Extensão"?"bg-blue-500/10 text-blue-400 border-blue-500/20":e==="Regulares"?"bg-purple-500/10 text-purple-400 border-purple-500/20":e==="Cursos Livres"?"bg-amber-500/10 text-amber-400 border-amber-500/20":e==="Especialização"?"bg-cyan-500/10 text-cyan-400 border-cyan-500/20":"bg-white/10 text-secondary border-white/15"},R=o=>{if(!o)return"—";const e=new Date(o);return Number.isNaN(e.getTime())?"—":e.toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})},j=o=>{if(!o)return"—";const e=new Date(o);return Number.isNaN(e.getTime())?"—":e.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"})},V=(o=new Date)=>o.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}),F=o=>!o||o<=0?"—":o%60===0?`${o/60}h`:`${(o/60).toFixed(1)}h`,H=o=>o==="Regulares"?"Curso Regular de":o==="Extensão"?"Curso de Extensão Cultural":o==="Cursos Livres"?"Curso Livre de":o==="Especialização"?"Curso de Especialização":"Curso de",W=o=>o==="Regulares"?"Coordenador(a) dos Cursos Regulares":o==="Extensão"?"Coordenador(a) dos Cursos de Extensão Cultural":o==="Cursos Livres"?"Coordenador(a) dos Cursos Livres":o==="Especialização"?"Coordenador(a) dos Cursos de Especialização":"Coordenador(a) dos Cursos",Z=o=>`/api/certificado/validacao/${o}/qrcode?size=320`,G=o=>o==="Regulares"?"CURSO REGULAR":o==="Extensão"?"CURSO DE EXTENSÃO CULTURAL":o==="Cursos Livres"?"CURSOS LIVRES":o==="Especialização"?"CURSO DE ESPECIALIZAÇÃO":"CURSO",L=(o,e=Wo)=>String(o||"").trim()||e,Q=(o,e)=>{const t=[{titulo:W(o),nome:L(e.coordenador)}];return(o==="Cursos Livres"||o==="Extensão")&&t.push({titulo:"Docente",nome:L(e.docente)}),o==="Extensão"&&t.push({titulo:"Curador(a)",nome:L(e.curador)}),t},X=o=>o==="Extensão"?"coordenacao-triplo":o==="Cursos Livres"?"coordenacao-duplo":"coordenacao-padrao",J=async o=>{if(o)try{const e=await $fetch(`/api/certificado/validacao/${o}/publico`),t=e?.path||e?.url;if(!t){window.alert("Página pública ainda indisponível para este certificado.");return}window.open(t,"_blank","noopener,noreferrer")}catch(e){console.error("Erro ao abrir página pública do certificado:",e),window.alert("Não foi possível abrir a página pública deste certificado.")}},C=async()=>{A.value=!0;try{const o=await $fetch("/api/aluno/meus-certificados",{params:{busca:b.value.busca||null,page:c.value.page,limit:c.value.limit}});h.value=o?.itens||[],c.value={total:o?.total||0,page:o?.page||1,pages:o?.pages||1,limit:o?.limit||12}}catch(o){console.error("Erro ao buscar certificados do aluno:",o),h.value=[],c.value={total:0,page:1,pages:1,limit:12}}finally{A.value=!1}},Y=(o,e)=>{const t=$(o.area_curso),i=H(t),p=String(e||"").trim()||`${o.aluno_nome||""} ${o.aluno_sobrenome||""}`.trim()||"NOME DO(A) ESTUDANTE",k=o.certificado_texto_institucional||"São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas",x=o.certificado_carga_horaria_exibida||F(o.qtd_minutos_total),u=j(o.dt_ini_curso_contexto),f=j(o.dt_fim_curso_contexto),E=V(),g=X(t),z=t==="Extensão"?"pagina-2-body pagina-2-body-triplo":t==="Cursos Livres"?"pagina-2-body pagina-2-body-duplo":"pagina-2-body pagina-2-body-padrao",oo=t==="Extensão"?"rodape-p2 rodape-p2-triplo":t==="Cursos Livres"?"rodape-p2 rodape-p2-duplo":"rodape-p2 rodape-p2-padrao",eo=Q(t,{coordenador:o.certificado_nome_coordenador,docente:o.certificado_nome_docente,curador:o.certificado_nome_curador}).map(O=>`
                        <div class="coordenacao-bloco">
                            <div class="coord-titulo">${O.titulo}</div>
                            <div class="coord-nome">${O.nome}</div>
                        </div>`).join("");return`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Certificado - ${o.nome_curso}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; }
            @page { size: A4 landscape; margin: 0; }

            .pagina {
                width: 297mm;
                height: 210mm;
                background-image: url('https://spedppull.b-cdn.net/site/sped_certificado_01x.png');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                position: relative;
                page-break-after: always;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .pagina-2 {
                background-image: url('https://spedppull.b-cdn.net/site/sped_cetificado_02x.png');
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                padding-top: 64mm;
            }

            .conteudo {
                width: 85%;
                text-align: justify;
                font-size: 13px;
                line-height: 1.8;
                color: #1a1a1a;
                font-family: 'Roboto', Arial, sans-serif;
            }

            .conteudo p {
                margin-bottom: 12px;
            }

            .destaque-nome,
            .destaque-curso {
                font-weight: bold;
                text-decoration: none;
            }

            .header-2 {
                text-align: center;
                margin-bottom: 12px;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
            }

            .descricao-curso {
                margin: 4px 0 14px;
                text-align: justify;
                font-size: 14px;
                line-height: 1.75;
            }

            .info-carga {
                margin: 26px 0 0;
                font-size: 12px;
            }

            .info-carga p {
                margin: 8px 0;
            }

            .pagina-1 {
                justify-content: flex-start;
                padding-left: 92mm;
            }

            .pagina-1 .conteudo {
                width: 80%;
            }

            .data-local {
                margin-top: 40px;
                font-size: 14px;
                font-weight: normal;
                color: #1a1a1a;
                text-align: center;
            }

            .validacao-box {
                margin: 24px auto 0;
                padding: 14px;
                width: 88%;
                border: 1px solid #d4d4d8;
                background: rgba(255, 255, 255, 0.96);
                display: flex;
                align-items: center;
                gap: 14px;
            }

            .validacao-box img {
                width: 76px;
                height: 76px;
                flex: 0 0 76px;
                display: block;
            }

            .validacao-texto {
                font-size: 10px;
                line-height: 1.55;
                text-align: left;
            }

            .validacao-autoridades {
                margin-top: 6px;
                font-weight: 600;
            }

            .autoridades-box {
                margin: 34px auto 0;
                text-align: center;
            }

            .autoridade-item {
                margin: 8px 0;
                font-size: 14px;
                line-height: 1.45;
                color: #1a1a1a;
            }

            .autoridade-nome {
                font-weight: 700;
            }

            .autoridade-cargo {
                font-weight: 500;
            }

            .coordenacao {
                margin-top: 25px;
                font-size: 11px;
            }

            .coordenacao-bloco + .coordenacao-bloco {
                margin-top: 14px;
            }

            .coord-titulo {
                font-weight: 700;
                text-transform: uppercase;
                font-size: 16px;
                line-height: 1.3;
                margin-bottom: 2px;
            }

            .coord-nome {
                font-size: 13px;
                font-weight: 400;
                margin-top: 0;
            }

            .coordenacao-duplo {
                margin-top: 20px;
            }

            .coordenacao-duplo .coord-titulo {
                font-size: 15px;
                line-height: 1.22;
            }

            .coordenacao-duplo .coord-nome {
                font-size: 12px;
            }

            .coordenacao-duplo .coordenacao-bloco + .coordenacao-bloco {
                margin-top: 12px;
            }

            .coordenacao-triplo {
                margin-top: 16px;
            }

            .coordenacao-triplo .coord-titulo {
                font-size: 14px;
                line-height: 1.18;
            }

            .coordenacao-triplo .coord-nome {
                font-size: 11.5px;
            }

            .coordenacao-triplo .coordenacao-bloco + .coordenacao-bloco {
                margin-top: 10px;
            }

            .pagina-2-body {
                display: flex;
                gap: 28px;
                align-items: center;
                justify-content: space-between;
            }

            .pagina-2-esquerda {
                flex: 0 1 46%;
                max-width: 46%;
                min-width: 0;
            }

            .pagina-2-direita {
                flex: 0 0 495px;
                width: 495px;
            }

            .validacao-box-p2 {
                margin: 10px 0 0;
                width: 100%;
            }

            .validacao-box-p2 img {
                width: 72px;
                height: 72px;
                flex: 0 0 72px;
            }

            .validacao-box-p2 .validacao-texto {
                font-size: 9.5px;
                line-height: 1.45;
            }

            .pagina-2-body-duplo {
                gap: 24px;
            }

            .pagina-2-body-triplo {
                gap: 20px;
            }

            .pagina-2-body-triplo .info-carga {
                margin-top: 20px;
            }

            .pagina-2-body-triplo .validacao-box-p2 {
                margin-top: 4px;
            }

            .rodape-p2-padrao {
                margin-top: 50px;
            }

            .rodape-p2-duplo {
                margin-top: 36px;
            }

            .rodape-p2-triplo {
                margin-top: 24px;
            }

            .tipo-curso-box {
                position: absolute;
                top: 36mm;
                left: 50%;
                transform: translateX(-50%);
                width: fit-content;
                background: linear-gradient(to bottom, #009c82 0%, #008870 100%);
                padding: 18px 46px;
                text-align: center;
                z-index: 10;
                margin: 0;
                clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
            }

            .tipo-curso-texto {
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 25px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 0.8px;
                -webkit-text-stroke: 0.55px rgba(255, 255, 255, 0.45);
                text-shadow: 0.35px 0 currentColor, -0.35px 0 currentColor, 0 0.35px currentColor, 0 -0.35px currentColor, 0 2px 3px rgba(0, 0, 0, 0.18);
            }
        </style>
    </head>
    <body>
        <div class="pagina pagina-1">
            <div class="conteudo">
                <p>
                    Certificamos que <span class="destaque-nome">${p}</span> concluiu o
                    <span class="destaque-curso">${i} ${o.nome_curso}</span> na
                    <strong>${k}</strong>.
                    Duração de <strong>${x}</strong>, presencial, no período de
                    <strong>${u}</strong> a <strong>${f}</strong>.
                </p>
                <p class="data-local">São Paulo, ${E}</p>
                <div class="autoridades-box">
                    <p class="autoridade-item"><span class="autoridade-nome">Inês Bogéa</span> - <span class="autoridade-cargo">Diretora Artística e Educacional</span></p>
                    <p class="autoridade-item"><span class="autoridade-nome">José Simões</span> - <span class="autoridade-cargo">Superintendente Educacional</span></p>
                </div>
            </div>
        </div>

        <div class="pagina pagina-2">
            <div class="tipo-curso-box">
                <div class="tipo-curso-texto">${G(t)}</div>
            </div>
            <div class="conteudo">
                <div class="header-2">Descrição do Curso</div>
                <div class="descricao-curso">${o.descricao_curso||"Sem descrição cadastrada."}</div>

                <div class="${z}">
                    <div class="pagina-2-esquerda">
                        <div class="info-carga">
                            <p><strong>Carga horária:</strong> ${x}</p>
                            <p><strong>Período:</strong> ${u} a ${f}</p>
                        </div>

                        <div class="coordenacao ${g}">
${eo}
                        </div>
                    </div>
                    <div class="pagina-2-direita">
                        <div class="validacao-box validacao-box-p2">
                            <img src="${Z(o.id_certificado_emitido)}" alt="QR Code de validação do certificado" />
                            <div class="validacao-texto">
                                Documento validado digitalmente pela SP Escola de Dança. Para verificar a integridade deste certificado, aponte a câmera do seu celular para o QR Code.
                                <div class="validacao-autoridades">• Victor Santos (Secretaria Educacional)</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="${oo}" style="border-top: 1px solid #ccc; padding-top: 12px; font-size: 10px; text-align: center;">
                    <p style="margin: 4px 0;"><strong>SÃO PAULO ESCOLA DE DANÇA - CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS</strong></p>
                    <p style="margin: 4px 0;">Rua Mauá, 51 • 3º andar • Luz • São Paulo • SP • 01028-900 • Fone +55 (11) 3367-5900</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `},N=o=>{o._hasPrinted||(o._hasPrinted=!0,o.contentWindow&&setTimeout(()=>{o.contentWindow?.focus(),o.contentWindow?.print(),setTimeout(()=>{document.body.contains(o)&&document.body.removeChild(o)},1e3)},300))},K=(o,e)=>{const t=Y(o,e),i=document.createElement("iframe");Object.assign(i.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0"}),document.body.appendChild(i);const p=i.contentDocument||i.contentWindow&&i.contentWindow.document;if(!p)return;p.open(),p.write(t),p.close();const k=()=>{const x=p.getElementsByTagName("img");if(!x.length){N(i);return}const u=Array.from(x).filter(g=>!g.complete);if(!u.length){N(i);return}let f=0;const E=()=>{f++,f===u.length&&N(i)};for(let g=0;g<u.length;g++){const z=u[g];z.onload=E,z.onerror=E}};i.onload=()=>k(),setTimeout(()=>k(),500)};let D=null;return ao(()=>b.value.busca,()=>{D&&clearTimeout(D),D=setTimeout(()=>{c.value.page=1,C()},350)}),ro(()=>{C()}),(o,e)=>(s(),r("div",lo,[a("main",po,[a("section",uo,[a("div",go,[a("div",xo,[e[3]||(e[3]=a("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Buscar Certificado",-1)),so(a("input",{"onUpdate:modelValue":e[0]||(e[0]=t=>n(b).busca=t),type:"text",placeholder:"Curso, código do curso ou turma...",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"},null,512),[[io,n(b).busca]])]),e[4]||(e[4]=a("div",{class:"md:col-span-3 flex items-end"},[a("div",{class:"w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"}," Apenas certificados aprovados aparecem aqui. ")],-1))]),n(A)?(s(),r("div",fo,[...e[5]||(e[5]=[a("div",{class:"animate-spin rounded-full h-10 w-10 border-t-2 border-primary"},null,-1)])])):n(h).length===0?(s(),r("div",mo,[...e[6]||(e[6]=[a("h2",{class:"text-base font-black text-white"},"Nenhum certificado aprovado encontrado",-1),a("p",{class:"text-sm text-secondary mt-2 max-w-2xl mx-auto"}," Assim que um certificado for aprovado pela equipe acadêmica, ele ficará disponível aqui para visualização e impressão. ",-1)])])):(s(),r("div",bo,[(s(!0),r(M,null,B(n(h),t=>(s(),r("div",{key:t.id_certificado_emitido,class:"rounded-xl border border-white/10 bg-[#12121A] p-4"},[a("div",ho,[a("div",vo,[a("h3",wo,d(t.nome_curso),1),a("p",yo,[t.cod_curso?(s(),r("span",_o,d(t.cod_curso),1)):m("",!0),t.cod_turma_contexto?(s(),r("span",Co," • Turma "+d(t.cod_turma_contexto),1)):m("",!0),t.ano_semestre_contexto?(s(),r("span",ko," • "+d(t.ano_semestre_contexto),1)):m("",!0)]),a("p",Eo," Período: "+d(R(t.dt_ini_curso_contexto))+" a "+d(R(t.dt_fim_curso_contexto)),1),a("p",zo,[P(" Aprovado em: "+d(R(t.aprovado_em))+" ",1),t.aprovado_por_nome?(s(),r("span",Ao," • por "+d(t.aprovado_por_nome),1)):m("",!0)])]),a("div",So,[a("span",{class:T(["px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider",I(t.area_curso)])},d($(t.area_curso)),3),e[7]||(e[7]=a("span",{class:"px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}," Aprovado ",-1))])]),a("div",$o,[a("button",{onClick:i=>J(t.id_certificado_emitido),class:"w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors",title:"Abrir Página Pública"},[...e[8]||(e[8]=[a("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[a("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"1.8",d:"M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"})],-1)])],8,Ro),a("button",{onClick:i=>U(t),class:"px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider bg-primary hover:brightness-110 text-white transition-colors ring-2 ring-primary/40 shadow-lg shadow-primary/25"}," Visualizar / Imprimir ",8,Lo)])]))),128)),a("div",No,[a("span",Do,[e[9]||(e[9]=P("Total: ",-1)),a("strong",Po,d(n(c).total),1),e[10]||(e[10]=P(" certificados",-1))]),a("div",To,[a("button",{onClick:e[1]||(e[1]=t=>{n(c).page--,C()}),disabled:n(c).page<=1,class:"px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"}," Anterior ",8,jo),a("button",{onClick:e[2]||(e[2]=t=>{n(c).page++,C()}),disabled:n(c).page>=n(c).pages,class:"px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"}," Próxima ",8,Oo)])])]))])]),n(S)?(s(),r("div",{key:0,class:"fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4",onClick:no(_,["self"])},[a("div",Mo,[a("div",{class:"flex items-center justify-between px-5 py-4 border-b border-white/10"},[e[12]||(e[12]=a("div",null,[a("h3",{class:"text-white font-black text-lg"},"Escolha o Nome de Exibição"),a("p",{class:"text-sm text-secondary mt-1"},"Selecione como deseja que o nome apareça no certificado impresso.")],-1)),a("button",{class:"w-8 h-8 rounded-full bg-white/5 text-secondary hover:bg-white/10 hover:text-white transition-colors",onClick:_},[...e[11]||(e[11]=[a("svg",{class:"w-4 h-4 mx-auto",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[a("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])]),a("div",Bo,[n(y)?(s(),r("div",Uo,"Carregando opções de nome...")):(s(),r("div",qo,[(s(!0),r(M,null,B(n(w),t=>(s(),r("div",{key:t.tipo,class:T(["rounded-xl border p-4",t.disponivel?"border-white/10 bg-white/5":"border-white/5 bg-white/[0.03] opacity-60"])},[a("div",Io,[a("div",null,[a("p",Vo,d(t.label),1),a("p",Fo,d(t.valor||"Não informado"),1)]),a("button",{class:T(["inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors",t.disponivel?"bg-primary text-white hover:brightness-110":"bg-white/5 text-secondary cursor-not-allowed"]),disabled:!t.disponivel,onClick:i=>q(t)}," Usar "+d(t.label),11,Ho)])],2))),128))]))])])])):m("",!0)]))}});export{Xo as default};
