<script setup lang="ts">
const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);

const busca = ref('');
const categorias = ref<any[]>([]);
const loading = ref(false);

let searchTimer: any = null;

const fetchInventario = async (q = '') => {
    loading.value = true;
    try {
        const data: any = await $fetch('/api/producao/estoque/inventario', {
            params: q ? { busca: q } : {},
        });
        categorias.value = Array.isArray(data) ? data : [];
    } catch (e) {
        categorias.value = [];
    } finally {
        loading.value = false;
    }
};

watch(() => props.isOpen, (val) => {
    if (val) {
        busca.value = '';
        fetchInventario();
    }
});

const handleSearch = () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchInventario(busca.value), 300);
};

const totalProdutos = computed(() =>
    categorias.value.reduce((sum: number, c: any) => sum + (c.produtos?.length ?? 0), 0)
);

const totalUnidades = computed(() =>
    categorias.value.reduce((sum: number, c: any) =>
        sum + (c.produtos ?? []).reduce((s: number, p: any) => s + (Number(p.quantidade) || 0), 0), 0)
);

const print = () => {
    const now = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const styles = `
        * { box-sizing: border-box; font-family: Arial, sans-serif; color: #222; font-size: 12px; }
        @page { size: A4 portrait; margin: 12mm 14mm; }
        html, body { width: 210mm; background: white; margin: 0; padding: 0; }

        .doc-header { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #222; display: flex; justify-content: space-between; align-items: baseline; }
        .doc-header h1 { font-size: 15px; font-weight: 700; margin: 0; }
        .doc-header p  { font-size: 10px; color: #555; margin: 0; }

        .aviso {
            margin-bottom: 8px; padding: 5px 10px;
            border: 1px solid #d97706; border-radius: 4px;
            background: #fffbeb; font-size: 10px; color: #92400e; line-height: 1.4;
        }
        .aviso strong { color: #b45309; }

        .summary { display: flex; gap: 6px; margin-bottom: 10px; }
        .summary-card {
            flex: 1; border: 1px solid #ddd; border-radius: 4px;
            padding: 5px 8px; text-align: center;
        }
        .summary-card .label { font-size: 8px; text-transform: uppercase; letter-spacing: .05em; color: #666; font-weight: 700; }
        .summary-card .value { font-size: 16px; font-weight: 900; color: #111; }
        .summary-card.highlight .value { color: #e11d48; }

        .categoria { margin-bottom: 12px; }
        .categoria-header {
            display: flex; justify-content: space-between; align-items: center;
            background: #f4f4f5; padding: 5px 10px;
            border-top: 2px solid #222; margin-bottom: 0;
            page-break-after: avoid;
        }
        .categoria-header h2 { font-size: 12px; font-weight: 700; margin: 0; }
        .categoria-header .badge { font-size: 10px; color: #555; }

        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #e4e4e7; }
        th { padding: 5px 10px; text-align: left; font-size: 11px; font-weight: 700; border-bottom: 1px solid #ccc; }
        th.right { text-align: right; }
        td { padding: 5px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
        td.right { text-align: right; font-weight: 700; }
        tr.subtotal { background: #f9f9f9; font-weight: 700; }
        tr.subtotal td { border-top: 1px solid #ccc; border-bottom: 2px solid #222; }

        .footer { position: fixed; bottom: 6mm; left: 14mm; right: 14mm; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 4px; }
    `;

    const cats = categorias.value;
    const total = totalUnidades.value;
    const totalP = totalProdutos.value;

    const categoriasHTML = cats.map((c: any) => {
        const prods: any[] = c.produtos ?? [];
        const subtotal = prods.reduce((s: number, p: any) => s + (Number(p.quantidade) || 0), 0);
        const rows = prods.map((p: any) => `
            <tr>
                <td>${p.nome}</td>
                <td class="right">${Number(p.quantidade) || 0}</td>
            </tr>
        `).join('');
        return `
            <div class="categoria">
                <div class="categoria-header">
                    <h2>${c.nome}</h2>
                    <span class="badge">${prods.length} ${prods.length === 1 ? 'produto' : 'produtos'}</span>
                </div>
                <table>
                    <thead>
                        <tr><th>Produto</th><th class="right">Qtd. Total</th></tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr class="subtotal">
                            <td>Subtotal</td>
                            <td class="right">${subtotal}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Inventário de Equipamentos</title>
  <style>${styles}</style>
</head>
<body>
  <div class="doc-header">
    <h1>Inventário de Equipamentos</h1>
    <p>Emitido em ${now}</p>
  </div>

  <div class="aviso">
    <strong>Atenção:</strong> A quantidade exibida representa o total cadastrado no estoque e
    <strong>não reflete disponibilidade para reserva</strong>. A disponibilidade real depende
    da data e período desejados — consulte pelo botão <strong>Nova Reserva</strong>.
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Categorias</div>
      <div class="value">${cats.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Tipos de Produto</div>
      <div class="value">${totalP}</div>
    </div>
    <div class="summary-card highlight">
      <div class="label">Total de Unidades</div>
      <div class="value">${total}</div>
    </div>
  </div>

  ${categoriasHTML}

  <div class="footer">Inventário de Equipamentos — ${now}</div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    const printNow = () => {
        if ((iframe as any)._printed) return;
        (iframe as any)._printed = true;
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
        }, 300);
    };

    iframe.onload = printNow;
    setTimeout(printNow, 600);
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-[330] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="emit('close')"></div>

        <div class="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-white/10 bg-[#16161E] shadow-2xl print:max-h-none print:overflow-visible print:shadow-none print:border-0">

            <!-- Header -->
            <div class="border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4 print:border-b print:border-black/20">
                <div>
                    <h3 class="text-lg font-bold text-white print:text-black">Inventário de Equipamentos</h3>
                    <p class="text-sm text-secondary mt-0.5 print:text-gray-600">Visão geral do estoque por categoria</p>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        @click="print"
                        class="px-3 py-1.5 rounded border border-primary/40 bg-primary/10 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors print:hidden"
                    >
                        Imprimir PDF
                    </button>
                    <button class="text-secondary hover:text-white transition-colors print:hidden" @click="emit('close')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>

            <!-- Warning banner -->
            <div class="px-5 pt-4 print:px-0 print:pt-2">
                <div class="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <svg class="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    <p class="text-xs text-amber-200/90 leading-relaxed">
                        <span class="font-bold text-amber-300">Atenção:</span> A quantidade exibida representa o total cadastrado no estoque e
                        <span class="font-bold">não reflete disponibilidade para reserva</span>. A disponibilidade real depende da data e do período desejado —
                        consulte pelo botão <span class="font-bold">Nova Reserva</span>.
                    </p>
                </div>
            </div>

            <!-- Summary cards -->
            <div class="px-5 py-4 border-b border-white/10 bg-black/20 print:border-b print:border-black/10 print:bg-transparent">
                <div class="grid grid-cols-3 gap-3">
                    <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3 print:border print:border-gray-300 print:bg-white">
                        <p class="text-[10px] uppercase tracking-wider text-secondary font-bold print:text-gray-500">Categorias</p>
                        <p class="text-2xl font-black text-white mt-1 print:text-black">{{ categorias.length }}</p>
                    </div>
                    <div class="rounded-lg border border-white/10 bg-[#0f0f15] px-3 py-3 print:border print:border-gray-300 print:bg-white">
                        <p class="text-[10px] uppercase tracking-wider text-secondary font-bold print:text-gray-500">Tipos de Produto</p>
                        <p class="text-2xl font-black text-white mt-1 print:text-black">{{ totalProdutos }}</p>
                    </div>
                    <div class="rounded-lg border border-primary/20 bg-primary/10 px-3 py-3 print:border print:border-gray-300 print:bg-white">
                        <p class="text-[10px] uppercase tracking-wider text-primary/90 font-bold print:text-gray-500">Total de Unidades</p>
                        <p class="text-2xl font-black text-primary mt-1 print:text-black">{{ totalUnidades }}</p>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <div class="px-5 pt-4 print:hidden">
                <div class="relative">
                    <input
                        v-model="busca"
                        @input="handleSearch"
                        type="text"
                        placeholder="Buscar categoria ou produto..."
                        class="w-full bg-[#0f0f15] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                    />
                    <svg class="w-4 h-4 text-secondary absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
            </div>

            <!-- Content -->
            <div class="px-5 py-4 space-y-4 print:px-0">

                <div v-if="loading" class="flex items-center justify-center gap-3 py-16 text-sm text-secondary">
                    <svg class="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Carregando inventário...
                </div>

                <div v-else-if="categorias.length === 0" class="text-center py-16 text-secondary text-sm">
                    Nenhuma categoria com produtos encontrada.
                </div>

                <div
                    v-else
                    v-for="categoria in categorias"
                    :key="categoria.id"
                    class="rounded-xl border border-white/10 bg-[#0f0f15] overflow-hidden print:border print:border-gray-200 print:bg-white print:break-inside-avoid"
                >
                    <!-- Category header -->
                    <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between print:border-b print:border-gray-200">
                        <h4 class="text-sm font-bold text-white print:text-black">{{ categoria.nome }}</h4>
                        <span class="px-2 py-0.5 rounded bg-primary/15 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary print:border print:border-gray-400 print:text-gray-700 print:bg-gray-100">
                            {{ categoria.produtos?.length ?? 0 }} {{ (categoria.produtos?.length ?? 0) === 1 ? 'produto' : 'produtos' }}
                        </span>
                    </div>

                    <!-- Products table -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full text-xs">
                            <thead>
                                <tr class="bg-primary/10 border-b border-primary/20 text-primary print:bg-gray-100 print:text-gray-700 print:border-b print:border-gray-200">
                                    <th class="px-4 py-2 text-left font-bold">Produto</th>
                                    <th class="px-4 py-2 text-right font-bold w-32">Qtd. Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="produto in categoria.produtos"
                                    :key="produto.id"
                                    class="border-b border-white/5 last:border-0 hover:bg-white/[0.02] print:border-b print:border-gray-100"
                                >
                                    <td class="px-4 py-2.5 flex items-center gap-3">
                                        <img v-if="produto.imagem_produto" :src="produto.imagem_produto" class="w-7 h-7 rounded object-cover bg-white/5 shrink-0 print:hidden" />
                                        <div v-else class="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-[8px] font-bold text-secondary shrink-0 print:hidden">IMG</div>
                                        <span class="font-medium text-white print:text-black">{{ produto.nome }}</span>
                                    </td>
                                    <td class="px-4 py-2.5 text-right font-bold text-white print:text-black">
                                        {{ Number(produto.quantidade) || 0 }}
                                    </td>
                                </tr>
                                <!-- Category subtotal -->
                                <tr class="bg-primary/5 border-t border-primary/20 font-bold print:bg-gray-50 print:border-t print:border-gray-200">
                                    <td class="px-4 py-2 text-white print:text-black">Subtotal</td>
                                    <td class="px-4 py-2 text-right text-primary print:text-black">
                                        {{ (categoria.produtos ?? []).reduce((s: number, p: any) => s + (Number(p.quantidade) || 0), 0) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>
