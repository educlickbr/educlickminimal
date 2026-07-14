<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
    const scriptId = 'plumsail-widget-script';
    const formContainerSelector = '#plumsail-form-0akf';
    const formId = '96e53f28-cb8c-4c4e-99a9-8f904fa37d52';

    const initForm = () => {
        const Plumsail = (window as any).Plumsail;
        if (Plumsail?.Form) {
            new Plumsail.Form(formContainerSelector, formId);
        }
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
        if ((window as any).Plumsail) {
            initForm();
        } else {
            existingScript.addEventListener('load', initForm, { once: true });
        }
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = `https://forms.plumsail.com/api/widget/${formId}`;
    script.onload = initForm;
    document.body.appendChild(script);
});
</script>

<template>
    <div class="p-4 md:p-8">
        <div id="plumsail-form-0akf">
            <div class="fd-form-loading"></div>
        </div>
    </div>
</template>
