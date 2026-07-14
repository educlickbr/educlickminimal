import{e as ve,r as x,C as _,E as te,s as he,b as j,w as _e,T as ye,M as ke,o as c,c as u,x as v,a as e,z as I,p as r,t as n,m as W,d as m,v as Z,q as re,l as ee,F as ie,G as ue,Z as Ce,_ as $e,h as Ee}from"./DTLy1l_x.js";import{B as se}from"./BZjZ4e7r.js";import{M as Ae}from"./Cgfm3fjc.js";import{a as ze,g as Pe}from"./945uib3O.js";import{u as Se}from"./BIEcws3b.js";import{u as Te}from"./Bp67p3lH.js";import"./DxV-g2df.js";const De={class:"bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden"},Me={class:"flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0"},Re={class:"flex items-center gap-3 min-w-0"},qe={class:"min-w-0"},Le={class:"text-base font-black text-white truncate leading-tight"},Oe={class:"flex flex-1 overflow-hidden min-h-0"},Ne={class:"w-full md:w-[42%] border-r border-white/10 overflow-y-auto p-6 space-y-6 custom-scrollbar shrink-0"},Ve={class:"space-y-3"},je={class:"flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"},Ie={class:"text-sm text-white/80"},Ue={class:"bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"},Be={class:"text-sm text-white/80"},Fe={class:"grid grid-cols-2 gap-3"},He={class:"bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"},Ge={class:"text-xs font-mono text-secondary"},We={class:"bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"},Ze={class:"text-xs text-primary font-bold"},Je={class:"space-y-4"},Qe={class:"border border-white/10 rounded-lg overflow-hidden focus-within:border-amber-500/40 transition-colors"},Xe={class:"flex items-center gap-0.5 px-2 py-1.5 bg-white/3 border-b border-white/10"},Ye={class:"space-y-3"},Ke={class:"flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg px-3 py-2.5"},et={class:"text-sm text-white/80"},tt={key:0},ot={key:1},at={class:"flex-1 overflow-y-auto p-6 custom-scrollbar"},rt={class:"bg-[#111119] border border-white/8 rounded-xl p-7 space-y-7 text-[13px] leading-8"},st={class:"text-white/85"},it={class:"bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic font-semibold"},nt={class:"bg-blue-500/15 text-blue-300 rounded px-1 not-italic"},dt={class:"bg-blue-500/15 text-blue-300 rounded px-1 not-italic font-semibold"},lt={class:"bg-amber-500/15 text-amber-300 rounded px-1 not-italic"},ct={class:"bg-amber-500/15 text-amber-300 rounded px-1 not-italic"},ut={class:"bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic"},pt={class:"bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic"},mt=["innerHTML"],xt={key:0,class:"text-secondary/40 italic text-xs px-1"},bt={class:"space-y-2"},gt={class:"text-white/80"},ft={class:"bg-amber-500/15 text-amber-300 rounded px-1 not-italic"},vt={class:"text-white/80"},wt={class:"bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic"},ht={class:"space-y-3"},_t={class:"text-[13px] uppercase tracking-wider font-bold leading-snug"},yt={class:"bg-blue-500/15 text-blue-300 rounded px-1 not-italic font-bold"},kt={class:"text-sm font-normal leading-tight"},Ct={class:"bg-amber-500/15 text-amber-300 rounded px-1 not-italic font-normal"},$t={class:"flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0"},ge="José Da Silva (Inserir nome)",fe="Não informado",Et=ve({__name:"ParametrizacaoCertificadoModal",props:{show:{type:Boolean},curso:{},idCertificadoEmitido:{},previewAluno:{},previewTurma:{},readOnly:{type:Boolean}},emits:["close","salvar"],setup(A,{emit:T}){const d=A,q=T,k=x(null),h=x("São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas"),b=x(""),D=x(""),z=x(""),P=x(""),M=x(""),pe=_(()=>d.idCertificadoEmitido?`/api/certificado/validacao/${d.idCertificadoEmitido}/qrcode?size=320`:""),R=async()=>{if(d.idCertificadoEmitido)try{const s=await $fetch(`/api/certificado/validacao/${d.idCertificadoEmitido}/publico`),t=s?.path||s?.url;if(!t){window.alert("Página pública ainda indisponível para este certificado.");return}window.open(t,"_blank","noopener,noreferrer")}catch(s){console.error("Erro ao abrir página pública do certificado:",s),window.alert("Não foi possível abrir a página pública deste certificado.")}},f=s=>{if(!s)return null;const t=new Date(s);return Number.isNaN(t.getTime())?null:de(t)},L=_(()=>{const s=(d.previewAluno?.nome||"").trim(),t=(d.previewAluno?.sobrenome||"").trim();return`${s} ${t}`.trim()||"NOME DO(A) ESTUDANTE"}),O=_(()=>f(d.previewTurma?.dt_ini_curso)||"05 de fevereiro de 2025"),N=_(()=>f(d.previewTurma?.dt_fim_curso)||"30 de novembro de 2025"),U=s=>!s||s<=0?"—":s%60===0?`${s/60}h`:`${(s/60).toFixed(1)}h`,J=s=>s==="Regulares"?"Curso Regular de":s==="Extensão"?"Curso de Extensão Cultural":s==="Cursos Livres"?"Curso Livre de":s==="Especialização"?"Curso de Especialização":"Curso de",Q=s=>s==="Regulares"?"Coordenador(a) dos Cursos Regulares":s==="Extensão"?"Coordenador(a) dos Cursos de Extensão Cultural":s==="Cursos Livres"?"Coordenador(a) dos Cursos Livres":s==="Especialização"?"Coordenador(a) dos Cursos de Especialização":"Coordenador(a) dos Cursos",p=s=>s==="Regulares"?"CURSO REGULAR":s==="Extensão"?"CURSO DE EXTENSÃO CULTURAL":s==="Cursos Livres"?"CURSOS LIVRES":s==="Especialização"?"CURSO DE ESPECIALIZAÇÃO":"CURSO",S=_(()=>J(d.curso?.area??"")),B=_(()=>Q(d.curso?.area??"")),g=_(()=>d.curso?.area??""),F=_(()=>["Cursos Livres","Extensão"].includes(g.value)),X=_(()=>g.value==="Extensão"),oe=_(()=>{const s=d.curso?.area??"";return s==="Regulares"?"bg-purple-500/10 text-purple-400 border-purple-500/20":s==="Extensão"?"bg-blue-500/10 text-blue-400 border-blue-500/20":s==="Cursos Livres"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-white/10 text-secondary border-white/15"}),ae=(s,t=fe)=>String(s||"").trim()||t,ne=(s,t,l=fe)=>{const $=[{titulo:Q(s),nome:ae(t.coordenador,l)}];return(s==="Cursos Livres"||s==="Extensão")&&$.push({titulo:"Docente",nome:ae(t.docente)}),s==="Extensão"&&$.push({titulo:"Curador(a)",nome:ae(t.curador)}),$},me=s=>s==="Extensão"?"coordenacao-triplo":s==="Cursos Livres"?"coordenacao-duplo":"coordenacao-padrao",H=_(()=>ne(g.value,{coordenador:D.value,docente:z.value,curador:P.value},ge)),G=s=>{document.execCommand(s,!1),k.value&&(M.value=k.value.innerHTML)},xe=()=>{k.value&&(M.value=k.value.innerHTML)};te(()=>d.curso,s=>{s&&(h.value=s.certificado_texto_institucional||"São Paulo Escola de Dança - Centro de Formação em Artes Coreográficas",b.value=s.certificado_carga_horaria_exibida||U(s.qtd_minutos_total),D.value=s.certificado_nome_coordenador||"",z.value=s.certificado_nome_docente||"",P.value=s.certificado_nome_curador||"",M.value=s.descricao??"",Ce(()=>{k.value&&(k.value.innerHTML=s.descricao??"")}))},{immediate:!0});const de=(s=new Date)=>{const t={day:"numeric",month:"long",year:"numeric",timeZone:"America/Sao_Paulo"};return s.toLocaleDateString("pt-BR",t)},le=()=>{if(!d.curso)return"";const s=de(),t=L.value,l=O.value,$=N.value,Y=me(d.curso.area),E=d.curso.area==="Extensão"?"pagina-2-body pagina-2-body-triplo":d.curso.area==="Cursos Livres"?"pagina-2-body pagina-2-body-duplo":"pagina-2-body pagina-2-body-padrao",K=d.curso.area==="Extensão"?"rodape-p2 rodape-p2-triplo":d.curso.area==="Cursos Livres"?"rodape-p2 rodape-p2-duplo":"rodape-p2 rodape-p2-padrao",V=ne(d.curso.area,{coordenador:D.value,docente:z.value,curador:P.value},ge).map(y=>`
                        <div class="coordenacao-bloco">
                            <div class="coord-titulo">${y.titulo}</div>
                            <div class="coord-nome">${y.nome}</div>
                        </div>`).join("");return`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Certificado - ${d.curso.nome_curso}</title>
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
            
            .destaque-nome {
                font-weight: bold;
                text-decoration: none;
            }
            
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
            
            /* Página 1: desloca texto para a área livre após o grafismo da esquerda */
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
        <!-- PÁGINA 1 -->
        <div class="pagina pagina-1">
            <div class="conteudo">
                <p>
                    Certificamos que <span class="destaque-nome">${t}</span> concluiu o 
                    <span class="destaque-curso">${S.value} ${d.curso.nome_curso}</span> na 
                    <strong>${h.value}</strong>. 
                    Duração de <strong>${b.value}</strong>, presencial, no período de 
                    <strong>${l}</strong> a <strong>${$}</strong>.
                </p>
                <p class="data-local">São Paulo, ${s}</p>
                <div class="autoridades-box">
                    <p class="autoridade-item"><span class="autoridade-nome">Inês Bogéa</span> - <span class="autoridade-cargo">Diretora Artística e Educacional</span></p>
                    <p class="autoridade-item"><span class="autoridade-nome">José Simões</span> - <span class="autoridade-cargo">Superintendente Educacional</span></p>
                </div>
            </div>
        </div>

        <!-- PÁGINA 2 -->
        <div class="pagina pagina-2">
            <div class="tipo-curso-box">
                <div class="tipo-curso-texto">${p(d.curso.area)}</div>
            </div>
            <div class="conteudo">
                <div class="header-2">Descrição do Curso</div>
                <div class="descricao-curso">${M.value||d.curso.descricao||"Sem descrição cadastrada."}</div>

                <div class="${E}">
                    <div class="pagina-2-esquerda">
                        <div class="info-carga">
                            <p><strong>Carga horária:</strong> ${b.value}</p>
                            <p><strong>Período:</strong> ${l} a ${$}</p>
                        </div>
                        <div class="coordenacao ${Y}">
${V}
                        </div>
                    </div>
                    <div class="pagina-2-direita">
                        ${d.idCertificadoEmitido?`
                        <div class="validacao-box validacao-box-p2">
                            <img src="${pe.value}" alt="QR Code de validação do certificado" />
                            <div class="validacao-texto">
                                Documento validado digitalmente pela SP Escola de Dança. Para verificar a integridade deste certificado, aponte a câmera do seu celular para o QR Code.
                                <div class="validacao-autoridades">• Victor Santos (Secretaria Educacional)</div>
                            </div>
                        </div>`:""}
                    </div>
                </div>
                <div class="${K}" style="border-top: 1px solid #ccc; padding-top: 12px; font-size: 10px; text-align: center;">
                    <p style="margin: 4px 0;"><strong>SÃO PAULO ESCOLA DE DANÇA - CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS</strong></p>
                    <p style="margin: 4px 0;">Rua Mauá, 51 • 3º andar • Luz • São Paulo • SP • 01028-900 • Fone +55 (11) 3367-5900</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `},ce=()=>{if(!d.curso)return;const s=le(),t=document.createElement("iframe");Object.assign(t.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0"}),document.body.appendChild(t);const l=t.contentDocument||t.contentWindow&&t.contentWindow.document;if(!l)return;l.open(),l.write(s),l.close();const $=()=>{const Y=l.getElementsByTagName("img");if(!Y.length){C(t);return}const E=Array.from(Y).filter(y=>!y.complete);if(!E.length){C(t);return}let K=0;const V=()=>{K++,K===E.length&&C(t)};for(let y=0;y<E.length;y++){const o=E[y];o.onload=V,o.onerror=V}};t.onload=()=>$(),setTimeout(()=>$(),500)},C=s=>{s._hasPrinted||(s._hasPrinted=!0,s.contentWindow&&setTimeout(()=>{s.contentWindow?.focus(),s.contentWindow?.print(),setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s)},1e3)},300))},be=()=>{if(d.curso){if(F.value&&!z.value.trim()){window.alert(`Docente é obrigatório para ${d.curso.area}.`);return}if(X.value&&!P.value.trim()){window.alert("Curador(a) é obrigatório para Extensão.");return}q("salvar",{cursoId:d.curso.id,textoInstitucional:h.value,cargaHoraria:b.value,nomeCoordenador:D.value,nomeDocente:z.value,nomeCurador:P.value,descricaoHtml:M.value})}};return(s,t)=>(c(),he(ke,{to:"body"},[j(ye,{name:"modal-fade"},{default:_e(()=>[A.show&&A.curso?(c(),u("div",{key:0,class:"fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-5",onClick:t[12]||(t[12]=ee(l=>q("close"),["self"]))},[e("div",De,[e("div",Me,[e("div",Re,[e("span",{class:I(["text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border shrink-0",r(oe)])},n(A.curso.area),3),e("div",qe,[t[13]||(t[13]=e("p",{class:"text-[10px] text-secondary uppercase tracking-widest font-bold leading-none mb-0.5"},"Parametrizar Certificado",-1)),e("h2",Le,n(A.curso.nome_curso),1)])]),e("button",{onClick:t[0]||(t[0]=l=>q("close")),class:"ml-4 w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 transition-all shrink-0",title:"Fechar"},[...t[14]||(t[14]=[e("svg",{class:"w-5 h-5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])]),e("div",Oe,[e("div",Ne,[e("div",null,[t[20]||(t[20]=e("p",{class:"text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5"},"Identificação",-1)),e("div",Ve,[e("div",null,[t[16]||(t[16]=e("p",{class:"text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"},"Tipo de Certificado",-1)),e("div",je,[e("span",Ie,n(r(S)),1),t[15]||(t[15]=e("span",{class:"ml-auto text-[9px] text-blue-400/70 uppercase tracking-wider font-bold shrink-0"},"Automático",-1))])]),e("div",null,[t[17]||(t[17]=e("p",{class:"text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"},"Nome do Curso",-1)),e("div",Ue,[e("span",Be,n(A.curso.nome_curso),1)])]),e("div",Fe,[e("div",null,[t[18]||(t[18]=e("p",{class:"text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"},"Código",-1)),e("div",He,[e("span",Ge,n(A.curso.cod_curso||"—"),1)])]),e("div",null,[t[19]||(t[19]=e("p",{class:"text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"},"Carga Total",-1)),e("div",We,[e("span",Ze,n(U(A.curso.qtd_minutos_total)),1)])])])])]),e("div",null,[t[23]||(t[23]=e("p",{class:"text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5"},"Texto Principal",-1)),e("div",Je,[e("div",null,[t[21]||(t[21]=e("label",{class:"flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"},[m(" Instituição "),e("span",{class:"text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"},"· editável")],-1)),W(e("textarea",{"onUpdate:modelValue":t[1]||(t[1]=l=>re(h)?h.value=l:null),rows:"2",placeholder:"Nome da instituição no certificado...",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30 resize-none leading-relaxed"},null,512),[[Z,r(h)]])]),e("div",null,[t[22]||(t[22]=e("label",{class:"flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"},[m(" Carga Horária (exibida) "),e("span",{class:"text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"},"· editável")],-1)),W(e("input",{"onUpdate:modelValue":t[2]||(t[2]=l=>re(b)?b.value=l:null),type:"text",placeholder:"ex: 320h",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"},null,512),[[Z,r(b)]])])])]),e("div",null,[t[25]||(t[25]=e("p",{class:"text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5 flex items-center gap-1.5"},[m(" Descrição do Curso "),e("span",{class:"text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"},"· editável")],-1)),e("div",Qe,[e("div",Xe,[e("button",{onMousedown:t[3]||(t[3]=ee(l=>G("bold"),["prevent"])),class:"w-7 h-7 flex items-center justify-center text-xs font-black bg-transparent hover:bg-white/10 rounded text-white transition-colors",title:"Negrito"},"B",32),e("button",{onMousedown:t[4]||(t[4]=ee(l=>G("italic"),["prevent"])),class:"w-7 h-7 flex items-center justify-center text-xs italic bg-transparent hover:bg-white/10 rounded text-white transition-colors",title:"Itálico"},"I",32),e("button",{onMousedown:t[5]||(t[5]=ee(l=>G("underline"),["prevent"])),class:"w-7 h-7 flex items-center justify-center text-xs underline bg-transparent hover:bg-white/10 rounded text-white transition-colors",title:"Sublinhado"},"U",32),e("button",{onMousedown:t[6]||(t[6]=ee(l=>G("strikeThrough"),["prevent"])),class:"w-7 h-7 flex items-center justify-center text-xs line-through bg-transparent hover:bg-white/10 rounded text-secondary transition-colors",title:"Tachado"},"S",32),t[24]||(t[24]=e("div",{class:"w-px h-4 bg-white/10 mx-1"},null,-1)),e("button",{onMousedown:t[7]||(t[7]=ee(l=>G("removeFormat"),["prevent"])),class:"px-2 h-7 flex items-center justify-center text-[10px] font-bold bg-transparent hover:bg-white/10 rounded text-secondary hover:text-white transition-colors uppercase tracking-wide",title:"Remover formatação"},"Limpar",32)]),e("div",{ref_key:"editorRef",ref:k,contenteditable:"true",onInput:xe,class:"min-h-[140px] max-h-[240px] overflow-y-auto px-4 py-3 text-sm text-white/90 leading-7 bg-[#0f0f15] focus:outline-none custom-scrollbar"},null,544)]),t[26]||(t[26]=e("p",{class:"text-[10px] text-secondary/40 mt-1.5"},[m("Usa a coluna "),e("span",{class:"font-mono"},"descricao"),m(" do curso como ponto de partida.")],-1))]),e("div",null,[t[32]||(t[32]=e("p",{class:"text-[10px] font-black uppercase tracking-widest text-secondary/60 pb-2 mb-3 border-b border-white/5"},"Coordenação",-1)),e("div",Ye,[e("div",null,[t[28]||(t[28]=e("p",{class:"text-[10px] text-secondary uppercase tracking-wider mb-1 font-bold"},"Área de Coordenação",-1)),e("div",Ke,[e("span",et,n(r(B)),1),t[27]||(t[27]=e("span",{class:"ml-auto text-[9px] text-blue-400/70 uppercase tracking-wider font-bold shrink-0"},"Automático",-1))])]),e("div",null,[t[29]||(t[29]=e("label",{class:"flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"},[m(" Nome do(a) Coordenador(a) "),e("span",{class:"text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"},"· editável")],-1)),W(e("input",{"onUpdate:modelValue":t[8]||(t[8]=l=>re(D)?D.value=l:null),type:"text",placeholder:"ex: Prof.ª Ana Lima",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"},null,512),[[Z,r(D)]])]),r(F)?(c(),u("div",tt,[t[30]||(t[30]=e("label",{class:"flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"},[m(" Nome do Docente "),e("span",{class:"text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"},"· obrigatório")],-1)),W(e("input",{"onUpdate:modelValue":t[9]||(t[9]=l=>re(z)?z.value=l:null),type:"text",placeholder:"ex: Prof. João Silva",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"},null,512),[[Z,r(z)]])])):v("",!0),r(X)?(c(),u("div",ot,[t[31]||(t[31]=e("label",{class:"flex items-center gap-1.5 text-xs text-secondary font-bold uppercase tracking-wider mb-1.5"},[m(" Nome do Curador(a) "),e("span",{class:"text-amber-400/80 normal-case font-medium tracking-normal text-[10px]"},"· obrigatório")],-1)),W(e("input",{"onUpdate:modelValue":t[10]||(t[10]=l=>re(P)?P.value=l:null),type:"text",placeholder:"ex: Curadora Maria Souza",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-secondary/30"},null,512),[[Z,r(P)]])])):v("",!0)])])]),e("div",at,[t[48]||(t[48]=e("div",{class:"flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 pb-4 border-b border-white/5"},[e("p",{class:"text-[10px] font-black uppercase tracking-widest text-secondary/50 w-full"},"Legenda da prévia"),e("span",{class:"flex items-center gap-1.5 text-[10px] text-secondary font-bold"},[e("span",{class:"inline-block w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30 shrink-0"}),m(" Dado do curso ")]),e("span",{class:"flex items-center gap-1.5 text-[10px] text-secondary font-bold"},[e("span",{class:"inline-block w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30 shrink-0"}),m(" Dado do estudante / turma (exemplo) ")]),e("span",{class:"flex items-center gap-1.5 text-[10px] text-secondary font-bold"},[e("span",{class:"inline-block w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30 shrink-0"}),m(" Campo editável ")])],-1)),e("div",rt,[e("p",st,[t[33]||(t[33]=e("span",null,"Certificamos que ",-1)),e("mark",it,n(r(L)),1),t[34]||(t[34]=e("span",null," concluiu o ",-1)),e("mark",nt,n(r(S)),1),t[35]||(t[35]=e("span",null,null,-1)),e("mark",dt,n(A.curso.nome_curso),1),t[36]||(t[36]=e("span",null," na ",-1)),e("mark",lt,n(r(h)||"—"),1),t[37]||(t[37]=e("span",null,". Duração de ",-1)),e("mark",ct,n(r(b)||"—"),1),t[38]||(t[38]=e("span",null,", presencial, no período de ",-1)),e("mark",ut,n(r(O)),1),t[39]||(t[39]=e("span",null," a ",-1)),e("mark",pt,n(r(N)),1),t[40]||(t[40]=e("span",null,".",-1))]),t[44]||(t[44]=e("p",{class:"text-white/70 text-sm leading-6 mt-2"},[m(" São Paulo, "),e("mark",{class:"bg-emerald-500/15 text-emerald-300 rounded px-1 not-italic text-sm"},"15 de abril de 2026")],-1)),t[45]||(t[45]=e("hr",{class:"border-white/8"},null,-1)),e("div",null,[t[41]||(t[41]=e("p",{class:"text-[9px] uppercase tracking-widest text-secondary/40 mb-3 font-black"},"Descrição do Curso",-1)),e("div",{class:"text-white/75 leading-7 bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-3",innerHTML:r(M)},null,8,mt),r(M)?v("",!0):(c(),u("p",xt,"Sem descrição cadastrada."))]),t[46]||(t[46]=e("hr",{class:"border-white/8"},null,-1)),e("div",bt,[e("p",gt,[t[42]||(t[42]=m(" Carga horária: ",-1)),e("mark",ft,n(r(b)||"—"),1)]),e("p",vt,[t[43]||(t[43]=m(" Período: ",-1)),e("mark",wt,n(r(O))+" – "+n(r(N)),1)])]),e("div",ht,[(c(!0),u(ie,null,ue(r(H),l=>(c(),u("div",{key:l.titulo,class:"space-y-0.5"},[e("p",_t,[e("mark",yt,n(l.titulo),1)]),e("p",kt,[e("mark",Ct,n(l.nome),1)])]))),128))]),t[47]||(t[47]=e("div",{class:"border-t border-white/8 pt-4 space-y-1"},[e("p",{class:"text-[10px] font-black text-white/40 uppercase tracking-widest"}," SÃO PAULO ESCOLA DE DANÇA - CENTRO DE FORMAÇÃO EM ARTES COREOGRÁFICAS "),e("p",{class:"text-[10px] text-white/25"}," Rua Mauá, 51 • 3º andar • Luz • São Paulo • SP • 01028-900 • Fone +55 (11) 3367-5900 ")],-1))])])]),e("div",$t,[d.idCertificadoEmitido?(c(),u("button",{key:0,onClick:R,class:"px-5 py-2.5 text-sm font-bold text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2",title:"Abrir página pública do certificado"},[...t[49]||(t[49]=[e("svg",{class:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"1.8",d:"M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"})],-1),m(" Página Pública ",-1)])])):v("",!0),e("button",{onClick:ce,class:"px-5 py-2.5 text-sm font-bold text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2",title:"Visualizar prévia em PDF"},[...t[50]||(t[50]=[e("svg",{class:"w-4 h-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M15 12a3 3 0 11-6 0 3 3 0 016 0z"}),e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"})],-1),m(" Preview ",-1)])]),e("button",{onClick:t[11]||(t[11]=l=>q("close")),class:"px-5 py-2.5 text-sm font-bold text-secondary hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"},n(d.readOnly?"Fechar":"Cancelar"),1),d.readOnly?v("",!0):(c(),u("button",{key:1,onClick:be,class:"px-5 py-2.5 text-sm font-bold text-white bg-primary hover:brightness-110 rounded-lg transition-all"}," Salvar Parametrização "))])])])):v("",!0)]),_:1})]))}}),At=Object.assign($e(Et,[["__scopeId","data-v-2f6ca336"]]),{__name:"EducacionalParametrizacaoCertificadoModal"}),zt={translate:"no",class:"notranslate h-full w-full flex flex-col font-sans bg-transparent"},Pt={class:"flex-1 overflow-y-auto space-y-4 w-full"},St={class:"bg-transparent md:bg-div-15 rounded-none md:rounded p-0 md:p-8 flex-1 w-full"},Tt={class:"flex items-center gap-6 border-b border-secondary/10 w-full pb-1 overflow-x-auto no-scrollbar mb-6"},Dt={key:0,class:"absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"},Mt={key:0,class:"absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-full"},Rt={class:"space-y-4"},qt={key:0,class:"space-y-4"},Lt={class:"grid grid-cols-1 md:grid-cols-12 gap-4 mb-2"},Ot={class:"md:col-span-8"},Nt={class:"relative"},Vt={class:"md:col-span-4"},jt={key:0,class:"flex justify-center py-20"},It={key:1,class:"flex flex-col items-center justify-center py-20 opacity-50 bg-[#0f0f15] rounded-xl border border-white/5 border-dashed"},Ut={key:2,class:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"},Bt={class:"flex items-center gap-2 mb-3 flex-wrap"},Ft={class:"text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border border-primary/25 bg-primary/10 text-primary"},Ht={class:"text-lg font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors"},Gt={class:"flex items-center gap-2 text-xs text-secondary mb-4"},Wt={class:"font-mono opacity-80"},Zt={class:"text-xs text-secondary leading-relaxed min-h-[44px] line-clamp-2 mb-4"},Jt={class:"grid grid-cols-2 gap-2 text-[11px] mb-4"},Qt={class:"rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"},Xt={class:"text-white"},Yt={class:"rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"},Kt={class:"text-white"},eo={class:"rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"},to={class:"text-white"},oo={class:"rounded-md border border-white/10 bg-white/5 px-2 py-1 text-secondary"},ao={class:"text-white"},ro={class:"pt-4 border-t border-white/5 flex items-center justify-between gap-2"},so={class:"text-xs text-secondary"},io=["onClick"],no={key:3,class:"flex flex-col md:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5"},lo={class:"text-xs md:text-sm text-secondary-500 order-2 md:order-1"},co={class:"font-medium text-white"},uo={class:"font-medium text-white"},po={class:"font-medium text-white"},mo={class:"flex gap-2 order-1 md:order-2"},xo=["disabled"],bo=["disabled"],go={key:1,class:"space-y-4"},fo={class:"grid grid-cols-1 md:grid-cols-12 gap-3"},vo={class:"md:col-span-2"},wo={class:"md:col-span-2"},ho={class:"md:col-span-3"},_o={class:"md:col-span-2"},yo={class:"md:col-span-3"},ko={key:0,class:"flex justify-center py-16"},Co={key:1,class:"rounded-xl border border-white/10 bg-[#16161E] p-5 text-sm text-secondary"},$o={key:2,class:"rounded-xl border border-white/10 bg-[#16161E] p-5 text-sm text-secondary"},Eo={key:3,class:"space-y-3"},Ao={class:"flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"},zo={class:"space-y-1"},Po={class:"text-white font-bold text-sm md:text-base"},So={class:"text-xs text-secondary"},To={key:0},Do={key:1},Mo={class:"text-[11px] text-secondary/80"},Ro={class:"flex flex-wrap items-center gap-2"},qo={class:"px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider bg-white/5 text-white border-white/10"},Lo={class:"mt-4 flex flex-wrap gap-2"},Oo=["onClick"],No=["onClick"],Vo=["onClick","disabled"],jo=["onClick"],Io={key:0,class:"mt-4 rounded-lg border border-white/10 bg-black/20 p-3 space-y-2"},Uo={class:"space-y-2"},Bo={key:0},Fo={key:1},Ho={class:"mt-1 md:mt-0"},Go={key:0,class:"text-primary ml-2"},Wo={key:0,class:"text-xs text-amber-300"},Zo={class:"flex flex-col md:flex-row items-center justify-between gap-3 pt-2"},Jo={class:"text-xs text-secondary"},Qo={class:"text-white"},Xo={class:"flex gap-2"},Yo=["disabled"],Ko=["disabled"],na=ve({__name:"index",setup(A){Te({title:"Certificados | SPEDigital",htmlAttrs:{translate:"no",class:"notranslate"},bodyAttrs:{class:"notranslate"}});const T=x("modelos"),d=x(!1),q=x(!1),k=x(!1),{showToast:h}=Se(),b=x({search:"",area:null}),D=[{label:"Todas as Áreas",value:null},{label:"Extensão",value:"Extensão"},{label:"Regulares",value:"Regulares"},{label:"Cursos Livres",value:"Cursos Livres"},{label:"Especialização",value:"especializacao"}],z=[{label:"Regulares",value:"Regulares"},{label:"Extensão",value:"Extensão"},{label:"Cursos Livres",value:"Cursos Livres"},{label:"Especialização",value:"especializacao"}],P=[{label:"Todos",value:"todos"},{label:"Elegíveis",value:"elegiveis"},{label:"Não elegíveis",value:"nao_elegiveis"}],M=ze(6),pe=_(()=>M.map(o=>({id:o.id,nome:o.nome}))),R=x([]),f=x({pagina_atual:1,qtd_paginas:1,qtd_total:0}),L=x(null),O=x(!1),N=x(!1),U=x(null),J=x(null),Q=x(null),p=x({area:"Regulares",ano_semestre:Pe(),id_turma:"",elegibilidade:"todos",busca:""}),S=x([]),B=x([]),g=x({total:0,page:1,pages:1,limit:20}),F=x({}),X=x(!1),oe=x(null),ae=o=>!o||o<=0?"Carga não definida":o%60===0?`${o/60}h`:`${(o/60).toFixed(1)}h`,ne=o=>{if(!o)return"Modalidade não definida";const a=o.replace(/_/g," ");return a.charAt(0).toUpperCase()+a.slice(1)},me=o=>o==="Extensão"?"bg-blue-500/10 text-blue-400 border-blue-500/20":o==="Regulares"?"bg-purple-500/10 text-purple-400 border-purple-500/20":o==="Cursos Livres"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-white/10 text-secondary border-white/15",H=async()=>{d.value=!0;try{const o=await $fetch("/api/educacional/cursos",{params:{area:b.value.area,nome:b.value.search||null,pagina:f.value.pagina_atual,limite:12}});R.value=o?.itens||[],f.value={pagina_atual:o?.pagina_atual||1,qtd_paginas:o?.qtd_paginas||1,qtd_total:o?.qtd_total||0}}catch(o){console.error("Erro ao buscar cursos para certificados:",o),R.value=[],f.value={pagina_atual:1,qtd_paginas:1,qtd_total:0}}finally{d.value=!1}},G=o=>{N.value=!1,U.value=null,J.value=null,L.value=o,O.value=!0},xe=async o=>{try{await $fetch("/api/educacional/certificados/parametrizacao",{method:"POST",body:{id_curso:o.cursoId,texto_institucional:o.textoInstitucional,nome_coordenador:o.nomeCoordenador,nome_docente:o.nomeDocente,nome_curador:o.nomeCurador,carga_horaria_exibida:o.cargaHoraria,descricao:o.descricaoHtml}}),R.value=R.value.map(a=>a.id!==o.cursoId?a:{...a,descricao:o.descricaoHtml,certificado_texto_institucional:o.textoInstitucional,certificado_nome_coordenador:o.nomeCoordenador,certificado_nome_docente:o.nomeDocente,certificado_nome_curador:o.nomeCurador,certificado_carga_horaria_exibida:o.cargaHoraria}),h("Parametrização salva com sucesso.",{type:"success"}),le()}catch(a){h(a?.data?.statusMessage||a?.message||"Erro ao salvar parametrização.",{type:"error"})}},de=o=>{N.value=!0,Q.value=o.id_certificado_emitido,U.value={nome:o.nome,sobrenome:o.sobrenome},J.value={dt_ini_curso:o.dt_ini_curso_contexto,dt_fim_curso:o.dt_fim_curso_contexto},L.value={id:o.id_curso,nome_curso:o.nome_curso,cod_curso:o.cod_curso,area:o.area_curso==="extensao"?"Extensão":o.area_curso==="cursos_livres"?"Cursos Livres":o.area_curso==="regulares"?"Regulares":o.area_curso,area_int:o.area_curso,modalidade:o.modalidade,descricao:o.descricao_curso,certificado_texto_institucional:o.certificado_texto_institucional,certificado_nome_coordenador:o.certificado_nome_coordenador,certificado_nome_docente:o.certificado_nome_docente,certificado_nome_curador:o.certificado_nome_curador,certificado_carga_horaria_exibida:o.certificado_carga_horaria_exibida,qtd_modulos:o.qtd_modulos,qtd_aulas_modulo:o.qtd_aulas_modulo,qtd_periodos:o.qtd_periodos,qtd_minutos_periodo:o.qtd_minutos_periodo,qtd_minutos_total:o.qtd_minutos_total,status:!0},O.value=!0},le=()=>{O.value=!1,L.value=null,U.value=null,J.value=null,Q.value=null,N.value=!1},ce=async()=>{q.value=!0,S.value=[];try{const o=await $fetch("/api/educacional/turmas",{params:{area:p.value.area,ano_semestre:p.value.ano_semestre,limite:200,pagina:1}});S.value=o?.itens||[],S.value.find(a=>a.id===p.value.id_turma)||(p.value.id_turma=S.value[0]?.id||"")}catch(o){console.error("Erro ao buscar turmas de certificados:",o),S.value=[],p.value.id_turma=""}finally{q.value=!1}},C=async()=>{if(!p.value.id_turma){B.value=[],g.value={total:0,page:1,pages:1,limit:20};return}k.value=!0;try{const o=await $fetch("/api/educacional/certificados/contexto",{params:{id_turma:p.value.id_turma,area:p.value.area,ano_semestre:p.value.ano_semestre,elegibilidade:p.value.elegibilidade,busca:p.value.busca||null,page:g.value.page,limit:g.value.limit}});B.value=o?.itens||[],g.value={total:o?.total||0,page:o?.page||1,pages:o?.pages||1,limit:o?.limit||20}}catch(o){console.error("Erro ao buscar alunos para certificados:",o),B.value=[],g.value={total:0,page:1,pages:1,limit:20}}finally{k.value=!1}},be=o=>{F.value[o]=!F.value[o]},s=o=>{oe.value={id_matricula:o.id_matricula_contexto,id_aluno:o.id_aluno,id_turma:o.id_turma_contexto,nome:o.nome,sobrenome:o.sobrenome,nome_curso:o.nome_curso},X.value=!0},t=()=>{X.value=!1,oe.value=null},l=async o=>{try{await $fetch("/api/educacional/certificados/aprovacao",{method:"POST",body:{id_aluno:o.id_aluno,id_turma_contexto:o.id_turma_contexto,aprovado:!0,motivo:null,snapshot_parametrizacao:{nome_curso:o.nome_curso,descricao:o.descricao_curso,qtd_minutos_total:o.qtd_minutos_total,texto_institucional:o.certificado_texto_institucional,nome_coordenador:o.certificado_nome_coordenador,nome_docente:o.certificado_nome_docente,nome_curador:o.certificado_nome_curador,carga_horaria_exibida:o.certificado_carga_horaria_exibida}}}),h("Certificação aprovada com sucesso.",{type:"success"}),await C()}catch(a){h(a?.data?.statusMessage||a?.message||"Erro ao atualizar certificação.",{type:"error"})}},$=o=>String(o||"").toLowerCase()==="regulares",Y=()=>{h("Disponível no fim do semestre.",{type:"info"})},E=o=>{if(!o)return"—";const a=new Date(o);return Number.isNaN(a.getTime())?"—":a.toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})},K=_(()=>S.value.map(o=>({id:o.id,nome:`${o.nome_curso}${o.cod_turma?` (${o.cod_turma})`:""}`})));let V=null;te(()=>b.value.search,()=>{V&&clearTimeout(V),V=setTimeout(()=>{f.value.pagina_atual=1,H()},400)}),te(()=>b.value.area,()=>{f.value.pagina_atual=1,H()}),te(()=>[p.value.area,p.value.ano_semestre],async()=>{g.value.page=1,await ce(),await C()}),te(()=>[p.value.id_turma,p.value.elegibilidade],()=>{g.value.page=1,C()});let y=null;return te(()=>p.value.busca,()=>{y&&clearTimeout(y),y=setTimeout(()=>{g.value.page=1,C()},350)}),Ee(()=>{H(),ce().then(()=>C())}),(o,a)=>{const we=At;return c(),u(ie,null,[e("div",zt,[e("main",Pt,[e("section",St,[e("div",Tt,[e("button",{onClick:a[0]||(a[0]=i=>T.value="modelos"),class:I(["text-sm font-bold pb-2 relative transition-colors whitespace-nowrap",r(T)==="modelos"?"text-primary":"text-secondary hover:text-white"])},[a[13]||(a[13]=m(" Modelos ",-1)),r(T)==="modelos"?(c(),u("span",Dt)):v("",!0)],2),e("button",{onClick:a[1]||(a[1]=i=>T.value="certificados"),class:I(["text-sm font-bold pb-2 relative transition-colors whitespace-nowrap",r(T)==="certificados"?"text-primary":"text-secondary hover:text-white"])},[a[14]||(a[14]=m(" Certificados ",-1)),r(T)==="certificados"?(c(),u("span",Mt)):v("",!0)],2)]),e("div",Rt,[r(T)==="modelos"?(c(),u("div",qt,[e("div",Lt,[e("div",Ot,[a[16]||(a[16]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Buscar Curso",-1)),e("div",Nt,[W(e("input",{"onUpdate:modelValue":a[2]||(a[2]=i=>r(b).search=i),type:"text",placeholder:"Digite o nome do curso...",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"},null,512),[[Z,r(b).search]]),a[15]||(a[15]=e("svg",{class:"w-4 h-4 text-secondary/50 absolute left-3.5 top-3.5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"})],-1))])]),e("div",Vt,[a[17]||(a[17]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Área",-1)),j(se,{modelValue:r(b).area,"onUpdate:modelValue":a[3]||(a[3]=i=>r(b).area=i),options:D,"label-key":"label","value-key":"value",placeholder:"Todas as Áreas"},null,8,["modelValue"])])]),r(d)?(c(),u("div",jt,[...a[18]||(a[18]=[e("div",{class:"animate-spin rounded-full h-12 w-12 border-t-2 border-primary"},null,-1)])])):r(R).length===0?(c(),u("div",It,[...a[19]||(a[19]=[e("div",{class:"text-4xl mb-4"},"📜",-1),e("p",{class:"text-white font-bold"},"Nenhum curso encontrado",-1),e("p",{class:"text-sm text-secondary"},"Ajuste os filtros para visualizar os cursos.",-1)])])):(c(),u("div",Ut,[(c(!0),u(ie,null,ue(r(R),i=>(c(),u("div",{key:i.id,class:I(["bg-[#0f0f15] border rounded-xl p-5 transition-all group relative overflow-hidden",r(L)?.id===i.id?"border-primary/40 shadow-lg shadow-primary/10":"border-white/5 hover:border-primary/30"])},[e("div",Bt,[e("span",{class:I(["text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border",me(i.area)])},n(i.area),3),e("span",Ft,n(ae(i.qtd_minutos_total)),1)]),e("h3",Ht,n(i.nome_curso),1),e("div",Gt,[a[20]||(a[20]=e("svg",{class:"w-3.5 h-3.5",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},[e("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M7 20l4-16m2 16l4-16M6 9h14M4 15h14"})],-1)),e("span",Wt,n(i.cod_curso||"SEM CÓDIGO"),1)]),e("p",Zt,n(i.descricao||"Sem descrição cadastrada para o texto-base do certificado."),1),e("div",Jt,[e("span",Qt,[a[21]||(a[21]=m(" Módulos: ",-1)),e("strong",Xt,n(i.qtd_modulos??"-"),1)]),e("span",Yt,[a[22]||(a[22]=m(" Aulas/Módulo: ",-1)),e("strong",Kt,n(i.qtd_aulas_modulo??"-"),1)]),e("span",eo,[a[23]||(a[23]=m(" Períodos: ",-1)),e("strong",to,n(i.qtd_periodos??"-"),1)]),e("span",oo,[a[24]||(a[24]=m(" Hs/Encontro: ",-1)),e("strong",ao,n(i.qtd_periodos&&i.qtd_minutos_periodo?(i.qtd_periodos*i.qtd_minutos_periodo/60).toFixed(1).replace(/\.0$/,"")+"h":"-"),1)])]),e("div",ro,[e("span",so,n(ne(i.modalidade)),1),e("button",{onClick:w=>G(i),class:"px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-primary hover:brightness-110 text-white transition-colors"}," Parametrizar ",8,io)])],2))),128))])),r(R).length>0?(c(),u("div",no,[e("span",lo,[e("span",co,n((r(f).pagina_atual-1)*12+1),1),a[25]||(a[25]=m(" a ",-1)),e("span",uo,n(Math.min(r(f).pagina_atual*12,r(f).qtd_total)),1),a[26]||(a[26]=m(" de ",-1)),e("span",po,n(r(f).qtd_total),1)]),e("div",mo,[e("button",{onClick:a[4]||(a[4]=i=>{r(f).pagina_atual--,H()}),disabled:r(f).pagina_atual===1,class:"px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"}," Anterior ",8,xo),e("button",{onClick:a[5]||(a[5]=i=>{r(f).pagina_atual++,H()}),disabled:r(f).pagina_atual>=r(f).qtd_paginas,class:"px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"}," Próxima ",8,bo)])])):v("",!0)])):(c(),u("div",go,[e("div",fo,[e("div",vo,[a[27]||(a[27]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Área",-1)),j(se,{modelValue:r(p).area,"onUpdate:modelValue":a[6]||(a[6]=i=>r(p).area=i),options:z,"label-key":"label","value-key":"value",placeholder:"Área"},null,8,["modelValue"])]),e("div",wo,[a[28]||(a[28]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Ano/Semestre",-1)),j(se,{modelValue:r(p).ano_semestre,"onUpdate:modelValue":a[7]||(a[7]=i=>r(p).ano_semestre=i),options:r(pe),"label-key":"nome","value-key":"id",placeholder:"Ano/Semestre"},null,8,["modelValue","options"])]),e("div",ho,[a[29]||(a[29]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Turma",-1)),j(se,{modelValue:r(p).id_turma,"onUpdate:modelValue":a[8]||(a[8]=i=>r(p).id_turma=i),options:r(K),"label-key":"nome","value-key":"id",placeholder:r(q)?"Carregando turmas...":"Selecione a turma"},null,8,["modelValue","options","placeholder"])]),e("div",_o,[a[30]||(a[30]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Elegibilidade",-1)),j(se,{modelValue:r(p).elegibilidade,"onUpdate:modelValue":a[9]||(a[9]=i=>r(p).elegibilidade=i),options:P,"label-key":"label","value-key":"value",placeholder:"Elegibilidade"},null,8,["modelValue"])]),e("div",yo,[a[31]||(a[31]=e("label",{class:"block text-xs text-secondary-600 mb-1.5 font-bold uppercase tracking-wider"},"Buscar Aluno",-1)),W(e("input",{"onUpdate:modelValue":a[10]||(a[10]=i=>r(p).busca=i),type:"text",placeholder:"Nome, RA ou e-mail...",class:"w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-secondary/30"},null,512),[[Z,r(p).busca]])])]),r(k)?(c(),u("div",ko,[...a[32]||(a[32]=[e("div",{class:"animate-spin rounded-full h-10 w-10 border-t-2 border-primary"},null,-1)])])):r(p).id_turma?r(B).length===0?(c(),u("div",$o," Nenhum aluno encontrado para os filtros selecionados. ")):(c(),u("div",Eo,[(c(!0),u(ie,null,ue(r(B),i=>(c(),u("div",{key:`${i.id_aluno}-${i.id_matricula_contexto}`,class:"rounded-xl border border-white/10 bg-[#12121A] p-4"},[e("div",Ao,[e("div",zo,[e("h3",Po,n(i.nome)+" "+n(i.sobrenome),1),e("p",So,[m(n(i.nome_curso)+" ",1),i.cod_turma_contexto?(c(),u("span",To,"• Turma "+n(i.cod_turma_contexto),1)):v("",!0),i.ra?(c(),u("span",Do,"• RA "+n(i.ra),1)):v("",!0)]),e("p",Mo," Período da turma: "+n(E(i.dt_ini_curso_contexto))+" a "+n(E(i.dt_fim_curso_contexto)),1)]),e("div",Ro,[e("span",{class:I(["px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider",i.elegivel_certificado?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-rose-500/10 text-rose-400 border-rose-500/20"])},n(i.elegivel_certificado?"Elegível":"Não elegível"),3),e("span",{class:I(["px-2 py-1 text-[10px] rounded border font-bold uppercase tracking-wider",i.status_aprovacao==="aprovado"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":i.status_aprovacao==="reprovado"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-white/10 text-secondary border-white/15"])},n(i.status_aprovacao),3),e("span",qo,n(i.total_matriculas_contexto)+"/"+n(i.minimo_requerido)+" matrículas ",1)])]),e("div",Lo,[e("button",{onClick:w=>s(i),class:"px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"}," Ver Diário ",8,Oo),$(i.area_curso)?(c(),u("button",{key:0,onClick:Y,class:"px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"}," Ver Avaliações ")):v("",!0),e("button",{onClick:w=>de(i),class:"px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider bg-primary hover:brightness-110 text-white transition-colors ring-2 ring-primary/40 shadow-lg shadow-primary/25"}," Preview Certificado ",8,No),e("button",{onClick:w=>l(i),disabled:!i.elegivel_certificado,class:"px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-500/90 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"}," Aprovar ",8,Vo),e("button",{onClick:w=>be(i.id_aluno),class:"px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"},n(r(F)[i.id_aluno]?"Ocultar Histórico":"Expandir Histórico"),9,jo)]),r(F)[i.id_aluno]?(c(),u("div",Io,[a[33]||(a[33]=e("p",{class:"text-xs font-bold uppercase tracking-wider text-secondary"},"Matrículas consideradas neste contexto",-1)),e("div",Uo,[(c(!0),u(ie,null,ue(i.historico_matriculas,w=>(c(),u("div",{key:w.id_matricula,class:I(["flex flex-col md:flex-row md:items-center md:justify-between rounded-md border px-3 py-2 text-xs",w.is_contexto?"border-primary/30 bg-primary/5 text-white":"border-white/10 bg-white/5 text-secondary"])},[e("span",null,[m(n(w.cod_turma||"Turma sem código")+" ",1),w.ano_semestre?(c(),u("span",Bo,"• "+n(w.ano_semestre),1)):v("",!0),w.turno?(c(),u("span",Fo,"• "+n(w.turno),1)):v("",!0)]),e("span",Ho,[m(n(E(w.dt_ini_curso))+" a "+n(E(w.dt_fim_curso))+" ",1),w.is_contexto?(c(),u("strong",Go,"(Contexto atual)")):v("",!0)])],2))),128))]),i.motivo_reprovacao?(c(),u("p",Wo," Motivo da reprovação: "+n(i.motivo_reprovacao),1)):v("",!0)])):v("",!0)]))),128)),e("div",Zo,[e("span",Jo,[a[34]||(a[34]=m("Total: ",-1)),e("strong",Qo,n(r(g).total),1),a[35]||(a[35]=m(" alunos",-1))]),e("div",Xo,[e("button",{onClick:a[11]||(a[11]=i=>{r(g).page--,C()}),disabled:r(g).page<=1,class:"px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"}," Anterior ",8,Yo),e("button",{onClick:a[12]||(a[12]=i=>{r(g).page++,C()}),disabled:r(g).page>=r(g).pages,class:"px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"}," Próxima ",8,Ko)])])])):(c(),u("div",Co," Selecione uma turma para listar alunos. "))]))])])])]),j(we,{show:r(O),curso:r(L),"id-certificado-emitido":r(Q),"preview-aluno":r(U),"preview-turma":r(J),"read-only":r(N),onClose:le,onSalvar:xe},null,8,["show","curso","id-certificado-emitido","preview-aluno","preview-turma","read-only"]),j(Ae,{isOpen:r(X),aluno:r(oe),onClose:t},null,8,["isOpen","aluno"])],64)}}});export{na as default};
