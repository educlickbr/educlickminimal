import{e as ae,r as d,C as K,E,c as b,x as W,o as p,a as t,B as me,p as i,b as q,q as X,d as re,g as pe,h as ge,s as ve,w as fe,H as he,F as be,G as xe,z as _e,t as M,l as Z}from"./DTLy1l_x.js";import{u as se}from"./f7y2Urgh.js";import{B as ee}from"./BZjZ4e7r.js";import{g as oe,a as we}from"./945uib3O.js";import{u as ye}from"./BIEcws3b.js";import{M as ke}from"./PoRcHrid.js";import{f as te}from"./DMJ7A_Uf.js";import"./DqEAkILt.js";import"./ClqSVliD.js";import"./D4-ptLa7.js";import"./DB5hEaP7.js";const $e={key:0,class:"relative z-50"},Se={class:"fixed inset-0 z-10 overflow-y-auto"},Ce={class:"flex min-h-full items-center justify-center p-4 text-center"},De={class:"relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#1A1B26] text-left align-middle shadow-xl transition-all border border-white/10"},Me={class:"p-6 border-b border-white/10 flex justify-between items-center bg-[#16161E]"},Ae={class:"p-6 space-y-6"},Ne={key:0,class:"flex justify-center py-8"},ze={key:1,class:"space-y-4"},Te={class:"space-y-1"},Ve={class:"space-y-1"},Pe={key:0,class:"text-xs text-yellow-500 mt-1"},Be={class:"p-4 border-t border-white/10 flex justify-end gap-3 bg-[#16161E]"},Oe=["disabled"],je={key:0,class:"animate-spin h-4 w-4",viewBox:"0 0 24 24"},Re=ae({__name:"ModalSolicitarDeclaracao",props:{isOpen:{type:Boolean},declaracoesAnteriores:{}},emits:["close","success"],setup(H,{emit:C}){const k=H,D=C,u=se(),{showToast:g}=ye(),$=d(!1),x=d(!1),_=d([]),c=d(oe()),l=d(null),A=K(()=>we(5)),w=K(()=>c.value?_.value.filter(o=>o.ano_semestre===c.value).map(o=>({id:o.id_turma,nome:`${o.cod_turma} - ${o.nome_curso} (${o.turno})`})):[]);E(()=>k.isOpen,o=>{o&&(_.value.length===0&&P(),c.value=oe(),l.value=null)}),E(c,o=>{l.value=null,o&&w.value.length>0&&(l.value=w.value[0]?.id)}),E(w,o=>{o.length>0&&!l.value&&(l.value=o[0]?.id)});const L=async()=>{if(!u.user_expandido_id)return{cpf:"000.000.000-00",ra:"RA não encontrado"};try{return await $fetch("/api/aluno/dados-declaracao",{params:{id_user_expandido:u.user_expandido_id}})||{cpf:"000.000.000-00",ra:"RA não encontrado"}}catch(o){return console.error("Erro ao buscar dados do aluno:",o),{cpf:"000.000.000-00",ra:"RA não encontrado"}}},N=async()=>{try{const o=await $fetch("/api/me");return o&&o.nome&&o.sobrenome?`${o.nome} ${o.sobrenome}`:u.user?.user_metadata?.full_name||"Nome Sobrenome"}catch(o){return console.error("Erro ao buscar dados do usuário (me):",o),u.user?.user_metadata?.full_name||"Nome Sobrenome"}},P=async()=>{if(u.user_expandido_id){$.value=!0;try{const o=await $fetch("/api/matriculas/minhas-turmas",{params:{id_user_expandido:u.user_expandido_id}});_.value=o||[],c.value&&w.value.length>0&&(l.value=w.value[0]?.id)}catch(o){console.error("Erro ao buscar turmas:",o),g("Erro ao carregar suas turmas.",{type:"error"})}finally{$.value=!1}}},F=async()=>{if(!l.value||!u.user_expandido_id){g("Selecione uma turma para continuar.",{type:"error"});return}try{x.value=!0;const o=_.value.find(S=>S.id_turma===l.value);if(!o)throw new Error("Turma não encontrada localmente");if(o.status_matricula!=="Ativa"){g(`Não é possível solicitar declaração para matrícula com status: ${o.status_matricula}`,{type:"error"});return}if(k.declaracoesAnteriores&&k.declaracoesAnteriores.length>0){const S=k.declaracoesAnteriores.find(v=>v.id_matricula===o.id_matricula&&v.aprovado!==!1);if(S){const v=S.aprovado===!0?"aprovada":"pendente";g(`Já existe uma declaração ${v} para esta matrícula. Verifique o histórico.`,{type:"error"});return}}const s=await L(),m=await N(),z={criado_em:new Date().toISOString(),matriculas:{aluno:{cpf:s?.cpf||"000.000.000-00",nome:m,ra:s?.ra||"RA não encontrado"},turmas:{curso:{nome_curso:o.nome_curso,carga_horaria_minutos:o.carga_horaria_minutos||0,qtd_semestres:o.qtd_semestres||0},turno:o.turno,dt_ini_curso:o.dt_ini_curso,dt_fim_curso:o.dt_fim_curso,dt_matricula:o.dt_matricula,num_semestre_atual:o.num_semestre_atual||0,total_semestres_cursados:o.total_semestres_cursados||0}}},j=O(z);await $fetch("/api/aluno/solicitar-declaracao",{method:"POST",body:{id_matricula:o.id_matricula,criado_por:u.user_expandido_id}}),g("Solicitação enviada para aprovação!",{type:"success"}),D("success"),D("close")}catch(o){console.error("Erro ao processar:",o),g(o.statusMessage||o.message||"Erro ao processar solicitação.",{type:"error"})}finally{x.value=!1}},I=()=>`
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    
    * { box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif; }
    body { margin: 0; padding: 0; }
    
    @page { size: A4; margin: 0; }
    
    .pagina { 
        width: 210mm; 
        height: 297mm; 
        background-image: url('https://spedppull.b-cdn.net/site/nova_declaracao.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
    }
    
    .conteudo {
        position: absolute;
        top: 35%; 
        left: 15%;
        right: 15%;
        text-align: justify;
        font-size: 14px;
        line-height: 1.6;
        color: #000;
        font-family: 'Roboto', sans-serif;
    }
    
    .data-local {
        text-align: right;
        margin-bottom: 30px;
    }
    
    strong { font-weight: 700; }
`,B=o=>{const s=o.matriculas?.aluno?.nome||"Nome Sobrenome",m=o.matriculas?.aluno?.cpf||"000.000.000-00",z=o.matriculas?.turmas?.curso?.nome_curso||"Nome do curso",j=o.matriculas?.turmas?.turno||"turno",S=new Date(o.criado_em||new Date).toLocaleDateString("pt-BR"),v=o.matriculas?.turmas?.curso?.qtd_semestres,R=v??"0",Q=o.matriculas?.turmas?.curso?.carga_horaria_minutos||0,e=Math.floor(Q/60),a=o.matriculas?.turmas?.num_semestre_atual||0;o.matriculas?.turmas?.total_semestres_cursados;const n=Number(R)===1?"semestre":"semestres",r=e===1?"hora":"horas",T=(o.matriculas?.turmas?.dt_matricula?new Date(o.matriculas?.turmas?.dt_matricula):new Date).toLocaleDateString("pt-BR");return`
        <div class="pagina">
            <!-- Hidden image to force load background -->
            <img src="https://spedppull.b-cdn.net/site/nova_declaracao.png" style="display:none;" />
            
            <div class="conteudo">
                <div class="data-local">
                    São Paulo, ${S}
                </div>
                
                <p>
                    Declaramos que o(a) estudante <strong>${s}</strong> portador(a) do CPF: <strong>${m}</strong>, 
                    está devidamente matriculado(a) no curso <strong>${z}</strong>, turno <strong>${j}</strong>, 
                    tendo o curso duração de <strong>${R}</strong> ${n} com um total de <strong>${e}</strong> ${r}. 
                    O(a) estudante foi matriculado(a) em <strong>${T}</strong> e está no <strong>${(y=>({1:"Primeiro Semestre",2:"Segundo Semestre",3:"Terceiro Semestre",4:"Quarto Semestre",5:"Quinto Semestre",6:"Sexto Semestre",7:"Sétimo Semestre",8:"Oitavo Semestre",9:"Nono Semestre",10:"Décimo Semestre"})[y]||`${y}º Semestre`)(a)}</strong>. 
                    Ficamos à disposição para quaisquer esclarecimentos.
                </p>
            </div>
        </div>
    `},O=o=>`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Declaração de Matrícula</title>
        <style>
          ${I()}
        </style>
      </head>
      <body>
        ${B(o)}
      </body>
    </html>
    `;return(o,s)=>H.isOpen?(p(),b("div",$e,[t("div",{class:"fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity",onClick:s[0]||(s[0]=m=>o.$emit("close"))}),t("div",Se,[t("div",Ce,[t("div",De,[t("div",Me,[s[6]||(s[6]=t("h3",{class:"text-lg font-bold text-white"},"Solicitar Declaração",-1)),t("button",{onClick:s[1]||(s[1]=m=>o.$emit("close")),class:"text-secondary hover:text-white transition-colors"},[...s[5]||(s[5]=[t("svg",{class:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M6 18L18 6M6 6l12 12"})],-1)])])]),t("div",Ae,[i($)?(p(),b("div",Ne,[...s[7]||(s[7]=[t("div",{class:"animate-spin rounded-full h-8 w-8 border-t-2 border-primary"},null,-1)])])):(p(),b("div",ze,[t("div",Te,[s[8]||(s[8]=t("label",{class:"text-xs text-secondary font-bold uppercase tracking-wider"},"Ano / Semestre",-1)),q(ee,{modelValue:i(c),"onUpdate:modelValue":s[2]||(s[2]=m=>X(c)?c.value=m:null),options:i(A),placeholder:"Selecione o período..."},null,8,["modelValue","options"])]),t("div",Ve,[s[9]||(s[9]=t("label",{class:"text-xs text-secondary font-bold uppercase tracking-wider"},"Turma / Curso",-1)),q(ee,{modelValue:i(l),"onUpdate:modelValue":s[3]||(s[3]=m=>X(l)?l.value=m:null),options:i(w),"label-key":"nome","value-key":"id",placeholder:"Selecione a turma...",disabled:!i(c)},null,8,["modelValue","options","disabled"]),i(c)&&i(w).length===0?(p(),b("p",Pe," Nenhuma turma encontrada neste semestre. ")):W("",!0)])])),s[10]||(s[10]=me('<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"><h4 class="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Informação </h4><p class="text-xs text-blue-200/80"> A declaração será gerada com base nos dados da matrícula selecionada. Você poderá visualizar e imprimir o documento após a solicitação. </p></div>',1))]),t("div",Be,[t("button",{onClick:s[4]||(s[4]=m=>o.$emit("close")),class:"px-4 py-2 text-sm font-bold text-secondary hover:text-white transition-colors"}," Cancelar "),t("button",{onClick:F,disabled:i(x)||!i(l),class:"px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"},[i(x)?(p(),b("svg",je,[...s[11]||(s[11]=[t("circle",{class:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor","stroke-width":"4"},null,-1),t("path",{class:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"},null,-1)])])):W("",!0),s[12]||(s[12]=re(" Confirmar Solicitação ",-1))],8,Oe)])])])])])):W("",!0)}}),Ee=Object.assign(Re,{__name:"ModalSolicitarDeclaracao"}),qe={class:"bg-transparent md:bg-div-15 rounded-none md:rounded-xl p-0 md:p-8 flex-1 w-full"},He={class:"flex flex-col md:flex-row items-center justify-end gap-4 mb-8"},Le=["disabled"],Fe={key:0,class:"flex justify-center py-20"},Ie={key:1,class:"bg-[#16161E] border border-white/5 rounded-xl p-12 text-center"},Qe={key:2,class:"space-y-4"},Ue={class:"flex flex-col md:flex-row justify-between md:items-center gap-4"},We={class:"space-y-1"},Ye={class:"flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2"},Ge={class:"text-xs text-secondary"},Je={class:"font-bold text-white text-lg"},Ke={class:"text-sm text-secondary"},Xe={class:"flex items-center gap-2"},Ze=["onClick","disabled","title"],eo=["onClick","disabled","title"],go=ae({__name:"declaracoes",setup(H){const C=se();pe();const k=d(!1),D=d([]),u=d(!1),g=d(!1),$=d(null),x=d([]),_=d(!1),c=d("print"),l=d({}),A=async()=>{if(C.user_expandido_id){k.value=!0;try{const e=await $fetch("/api/aluno/historico-declaracoes",{params:{id_aluno:C.user_expandido_id}});D.value=e||[]}catch(e){console.error("Erro ao buscar declarações:",e)}finally{k.value=!1}}},w=()=>{u.value=!0},L=e=>e?new Date(e).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-",N=()=>{g.value=!1,$.value=null,x.value=[],_.value=!1},P=async(e,a)=>{if(e.aprovado===!1){alert("Esta declaração foi reprovada. Entre em contato com a secretaria.");return}if(e.aprovado!==!0){alert("Esta declaração ainda está aguardando aprovação.");return}$.value=e,g.value=!0,_.value=!0,x.value=[],c.value=a;try{const n=await $fetch("/api/declaracoes/opcoes-nome-impressao",{params:{id_matricula:e.id_matricula}});x.value=n.opcoes||[]}catch(n){console.error(n),window.alert("Não foi possível carregar as opções de nome para impressão."),N()}finally{_.value=!1}},F=async e=>{if(!$.value||!e.disponivel||!e.valor)return;const a=$.value,n=c.value;if(N(),n==="public"){await z(a,e.tipo||"registro");return}await R(a,e.valor,e.tipo||"registro")},I=e=>l.value[e.id_declaracao]?.token||e.token_publico||null,B=e=>l.value[e.id_declaracao]?.tokenValidacao||e.token_validacao_publica||null,O=async e=>{const a=await $fetch("/api/declaracao/renovar-token",{method:"POST",body:{id_declaracao:e.id_declaracao}});return l.value[e.id_declaracao]={token:a.token_publico,expiraEm:a.token_publico_expira_em,tokenValidacao:a.token_validacao_publica},e.token_publico=a.token_publico,e.token_publico_expira_em=a.token_publico_expira_em,e.token_validacao_publica=a.token_validacao_publica,a},o=(e,a="registro")=>{const n=I(e);if(!n)return null;const r=a!=="registro"?`?nome=${encodeURIComponent(a)}`:"";return`/declaracao/publica/${n}${r}`},s=(e,a="registro")=>{const n=B(e);if(!n)return null;const r=a!=="registro"?`?nome=${encodeURIComponent(a)}`:"";return`${window.location.origin}/declaracao/validar/${n}${r}`},m=(e,a="registro",n=420)=>{const r=B(e);if(!r)return null;const f=new URLSearchParams;return a!=="registro"&&f.set("nome",a),f.set("size",String(n)),`/api/declaracao/validacao/${r}/qrcode?${f.toString()}`},z=async(e,a="registro")=>{try{await O(e)}catch(r){console.error(r),window.alert("Não foi possível renovar o link público desta declaração.");return}const n=o(e,a);if(!n){window.alert("Página pública ainda indisponível para esta declaração.");return}window.open(n,"_blank","noopener,noreferrer")},j=()=>`
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
    
    * { box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif; }
    body { margin: 0; padding: 0; }
    
    @page { size: A4; margin: 0; }
    
    .pagina { 
        width: 210mm; 
        height: 297mm; 
        background-image: url('https://spedppull.b-cdn.net/site/nova_declaracao.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
    }
    
    .conteudo {
        position: absolute;
        top: 32.9%; 
        left: 15%;
        right: 15%;
        text-align: justify;
        font-size: 14px;
        line-height: 1.6;
        color: #000;
        font-family: 'Roboto', sans-serif;
    }
    
    .data-local {
        text-align: right;
        margin-bottom: 0;
    }

    .top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 14px;
        margin-bottom: 8px;
    }

    .validacao-box {
        margin: 0;
        padding: 8px;
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        background: rgba(255,255,255,0.92);
        display: flex;
        align-items: center;
        gap: 8px;
        width: 62%;
        max-width: 300px;
        transform: translateY(-5px);
    }

    .validacao-qr {
        width: 72px;
        height: 72px;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        padding: 3px;
        background: #fff;
        object-fit: contain;
    }

    .validacao-texto h4 {
        margin: 0 0 4px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .validacao-texto p {
        margin: 0;
        font-size: 10px;
        line-height: 1.45;
    }

    .validacao-url {
        overflow-wrap: anywhere;
        word-break: break-word;
    }
    
    strong { font-weight: 700; }
`,S=(e,a,n,r)=>{const f=a||e.nome_aluno||"Nome Sobrenome",T=e.cpf_aluno||"000.000.000-00",h=e.nome_curso||"Nome do curso",y=e.turno||"turno",V=te(e.criado_em||new Date().toISOString())||"--",U=e.qtd_semestres,Y=U??"0",ne=e.carga_horaria_minutos||0,G=Math.floor(ne/60),ie=e.num_semestre_atual||0,le=Number(Y)===1?"semestre":"semestres",ce=G===1?"hora":"horas",de=te(e.dt_matricula)||"--",ue=J=>({1:"Primeiro Semestre",2:"Segundo Semestre",3:"Terceiro Semestre",4:"Quarto Semestre",5:"Quinto Semestre",6:"Sexto Semestre",7:"Sétimo Semestre",8:"Oitavo Semestre",9:"Nono Semestre",10:"Décimo Semestre"})[J]||`${J}º Semestre`;return`
        <div class="pagina">
            <!-- Hidden image to force load background -->
            <img src="https://spedppull.b-cdn.net/site/nova_declaracao.png" style="display:none;" />
            
            <div class="conteudo">
                ${n&&r?`
                <div class="top-row">
                    <div class="validacao-box">
                        <img class="validacao-qr" src="${r}" alt="QR de validação" />
                        <div class="validacao-texto">
                            <h4>Validação Institucional</h4>
                            <p>Valide pelo QR ou URL:</p>
                            <p class="validacao-url"><strong>${n}</strong></p>
                        </div>
                    </div>
                    <div class="data-local">
                        São Paulo, ${V}
                    </div>
                </div>
                `:""}

                ${!n||!r?`
                <div class="data-local">
                    São Paulo, ${V}
                </div>
                `:""}

                <p>
                    Declaramos que o(a) estudante <strong>${f}</strong> portador(a) do CPF: <strong>${T}</strong>, 
                    está devidamente matriculado(a) no curso <strong>${h}</strong>, turno <strong>${y}</strong>, 
                    tendo o curso duração de <strong>${Y}</strong> ${le} com um total de <strong>${G}</strong> ${ce}. 
                    O(a) estudante foi matriculado(a) em <strong>${de}</strong> e está no <strong>${ue(ie)}</strong>. 
                    Ficamos à disposição para quaisquer esclarecimentos.
                </p>
            </div>
        </div>
    `},v=(e,a,n,r)=>`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Declaração de Matrícula</title>
        <style>
          ${j()}
        </style>
      </head>
      <body>
                ${S(e,a,n,r)}
      </body>
    </html>
    `,R=async(e,a,n="registro")=>{try{await O(e)}catch(V){console.error(V),window.alert("Não foi possível renovar o link público da declaração para validação.");return}const r=s(e,n),f=m(e,n,900),T=v(e,a,r,f),h=document.createElement("iframe");Object.assign(h.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0"}),document.body.appendChild(h);const y=h.contentDocument||h.contentWindow&&h.contentWindow.document;y&&(y.open(),y.write(T),y.close(),h.onload=()=>{setTimeout(()=>{Q(h)},500)})},Q=e=>{e._hasPrinted||(e._hasPrinted=!0,e.contentWindow&&(e.contentWindow.focus(),e.contentWindow.print(),setTimeout(()=>{document.body.contains(e)&&document.body.removeChild(e)},5e3)))};return ge(()=>{if(C.initialized)A();else{const e=E(()=>C.initialized,a=>{a&&(A(),e())})}}),(e,a)=>{const n=he;return p(),ve(n,{name:"base"},{default:fe(()=>[t("div",qe,[t("div",He,[t("button",{onClick:w,disabled:!i(C).user_expandido_id,class:"px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"},[...a[1]||(a[1]=[t("svg",{class:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M12 4v16m8-8H4"})],-1),re(" Solicitar Declaração ",-1)])],8,Le)]),i(k)?(p(),b("div",Fe,[...a[2]||(a[2]=[t("div",{class:"text-center"},[t("svg",{class:"animate-spin h-8 w-8 text-primary mx-auto mb-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24"},[t("circle",{class:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor","stroke-width":"4"}),t("path",{class:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]),t("p",{class:"text-secondary text-sm"},"Carregando histórico...")],-1)])])):i(D).length===0?(p(),b("div",Ie,[...a[3]||(a[3]=[t("div",{class:"text-secondary mb-2"},[t("svg",{class:"w-16 h-16 mx-auto mb-4 opacity-50",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"2",d:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})])],-1),t("h3",{class:"text-lg font-bold text-white mb-2"},"Nenhuma declaração",-1),t("p",{class:"text-sm text-secondary"},"Você ainda não solicitou nenhuma declaração.",-1)])])):(p(),b("div",Qe,[(p(!0),b(be,null,xe(i(D),r=>(p(),b("div",{key:r.id,class:"bg-[#16161E] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"},[t("div",Ue,[t("div",We,[t("div",Ye,[t("span",{class:_e(["text-xs font-bold px-2 py-0.5 rounded",{"bg-green-500/20 text-green-400":r.aprovado===!0,"bg-red-500/20 text-red-400":r.aprovado===!1,"bg-yellow-500/20 text-yellow-400":r.aprovado===null||r.aprovado===void 0}])},M(r.aprovado===!0?"Aprovado":r.aprovado===!1?"Reprovado":"Aguardando Aprovação"),3),t("span",Ge," Solicitado em "+M(L(r.criado_em)),1)]),t("h4",Je,M(r.cod_turma)+" - "+M(r.nome_curso),1),t("p",Ke,M(r.ano_semestre)+" | "+M(r.turno),1)]),t("div",Xe,[t("button",{onClick:Z(f=>P(r,"public"),["prevent"]),disabled:r.aprovado!==!0,class:"w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",title:r.aprovado===!0?"Abrir Página Pública":"Disponível somente para declarações aprovadas"},[...a[4]||(a[4]=[t("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"1.8",d:"M4 4h5v5H4V4zm11 0h5v5h-5V4zM4 15h5v5H4v-5zm12 1h1m2 0h1m-5 2h5m-3-3v5"})],-1)])],8,Ze),t("button",{onClick:Z(f=>P(r,"print"),["prevent"]),disabled:r.aprovado!==!0,class:"w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-secondary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",title:r.aprovado===!0?"Imprimir Declaração":"Disponível somente para declarações aprovadas"},[...a[5]||(a[5]=[t("svg",{class:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24"},[t("path",{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"1.5",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z"})],-1)])],8,eo)])])]))),128))])),q(Ee,{"is-open":i(u),"declaracoes-anteriores":i(D),onClose:a[0]||(a[0]=r=>u.value=!1),onSuccess:A},null,8,["is-open","declaracoes-anteriores"])]),q(ke,{"is-open":i(g),loading:i(_),options:i(x),"context-label":i(c)==="public"?"na página pública da declaração":"na declaração impressa",onClose:N,onConfirm:F},null,8,["is-open","loading","options","context-label"])]),_:1})}}});export{go as default};
